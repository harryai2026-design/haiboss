const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

/** Acknowledged requests survive restart; duplicate IDs never start duplicate builds. */
function createBuildQueue({ stateFile, cwd, command, debounceMs = 10000, onPublished = () => {}, log = () => {}, spawnBuild = spawn }) {
  let state = { requests: {}, lastExitCode: null, lastFinishedAt: null }
  if (fs.existsSync(stateFile)) state = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  for (const request of Object.values(state.requests)) if (request.status === 'building') request.status = 'queued'
  let timer = null, building = false, closing = false
  function persist() {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true })
    const temp = `${stateFile}.tmp`
    const fd = fs.openSync(temp, 'w', 0o600)
    try { fs.writeFileSync(fd, JSON.stringify(state)); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    fs.renameSync(temp, stateFile)
  }
  function queued() { return Object.entries(state.requests).filter(([, request]) => request.status === 'queued').map(([id]) => id) }
  function schedule() {
    if (closing || timer || building || !queued().length) return
    timer = setTimeout(() => { timer = null; run() }, debounceMs)
  }
  function run() {
    const ids = queued()
    if (closing || building || !ids.length) return
    building = true; state.lastExitCode = null
    ids.forEach(id => { state.requests[id].status = 'building' })
    persist()
    let finished = false
    function finish(code) {
      if (finished) return
      finished = true; building = false
      state.lastExitCode = code; state.lastFinishedAt = new Date().toISOString()
      ids.forEach(id => { state.requests[id] = { ...state.requests[id], status: code === 0 ? 'published' : 'failed', exitCode: code, finishedAt: state.lastFinishedAt } })
      // Keep all active IDs and a generous terminal history for delayed reconciliation.
      const terminal = Object.entries(state.requests).filter(([, r]) => ['published', 'failed'].includes(r.status))
      terminal.slice(0, Math.max(0, terminal.length - 2000)).forEach(([id]) => { delete state.requests[id] })
      persist(); log(`[build] 结束 exit=${code}`)
      if (code === 0) onPublished()
      schedule()
    }
    log('[build] 开始')
    try {
      const child = process.platform === 'win32'
        ? spawnBuild('cmd.exe', ['/c', command], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
        : spawnBuild('sh', ['-c', command], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
      child.stdout?.on('data', data => process.stdout.write(data))
      child.stderr?.on('data', data => process.stderr.write(data))
      child.on('error', () => finish(127)); child.on('close', code => finish(typeof code === 'number' ? code : 1))
    } catch { finish(127) }
  }
  persist(); schedule()
  return {
    retry(id) {
      if (state.requests[id]?.status === 'failed') {state.requests[id] = {status:'queued',acceptedAt:new Date().toISOString()};persist();schedule()}
      return state.requests[id]
    },
    accept(id) {
      if (!Object.hasOwn(state.requests, id)) { state.requests[id] = { status: 'queued', acceptedAt: new Date().toISOString() }; persist(); schedule() }
      return state.requests[id]
    },
    get(id) { return Object.hasOwn(state.requests, id) ? state.requests[id] : undefined },
    health() { return { lastExitCode: state.lastExitCode, lastFinishedAt: state.lastFinishedAt, scheduled: Boolean(timer), building, pending: queued().length > 0 } },
    close() { closing = true; if (timer) clearTimeout(timer) },
  }
}
module.exports = { createBuildQueue }
