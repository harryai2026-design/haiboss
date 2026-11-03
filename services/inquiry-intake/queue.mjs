import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { validateInquiry, createRateLimiter, InquiryError, KEY_PATTERN, REFERENCE_PATTERN } from './validation.mjs'
import { createInquiryReference } from './reference.mjs'

// A transport spool, not a second CRM. Never acknowledge before fsync; never delete pending leads.
export function createIntakeQueue({ directory, deliver, now = Date.now, maxPending = 10000, minFreeBytes = 16777216, log = () => {} }) {
  const createdDirectory = fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  if (createdDirectory && process.platform !== 'win32') {
    const parent = fs.openSync(path.dirname(createdDirectory), 'r')
    try { fs.fsyncSync(parent) } finally { fs.closeSync(parent) }
  }
  const limit = createRateLimiter({ now })
  const active = new Map()
  let lastDelivery = null
  const filename = key => path.join(directory, `${key}.json`)
  function read(key) { return fs.existsSync(filename(key)) ? JSON.parse(fs.readFileSync(filename(key), 'utf8')) : null }
  function syncDirectory() {
    // Directory fsync is required on Linux; Windows does not support opening directory handles this way.
    if (process.platform === 'win32') return
    const fd = fs.openSync(directory, 'r')
    try { fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
  }
  function write(record) {
    const temp = path.join(directory, `.${record.key}-${randomUUID()}.tmp`)
    const fd = fs.openSync(temp, 'wx', 0o600)
    try { fs.writeFileSync(fd, JSON.stringify(record)); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    try { fs.renameSync(temp, filename(record.key)); syncDirectory() }
    finally { if (fs.existsSync(temp)) fs.unlinkSync(temp) }
  }
  function records() {
    return fs.readdirSync(directory).filter(name => KEY_PATTERN.test(name.replace(/\.json$/, '')) && name.endsWith('.json')).map(name => {
      try {
        const record = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))
        if (record.key !== name.slice(0, -5) || !['pending', 'synced'].includes(record.status)) throw new Error('Invalid intake record')
        // Do not retain thousands of contact documents while counting/scanning an outage backlog.
        return { key: record.key, status: record.status, acceptedAt: record.acceptedAt, retryAt: record.retryAt, syncedAt: record.syncedAt }
      }
      catch { throw new Error('Unreadable intake record; restore or repair the spool before continuing') }
    })
  }
  function fingerprint(data) { return createHash('sha256').update(JSON.stringify(data)).digest('hex') }
  function accept(input, ip = 'unknown') {
    const rawKey = input?.submissionKey || randomUUID() // Existing cached pages remain compatible.
    const key = typeof rawKey === 'string' ? rawKey.toLowerCase() : rawKey
    if (typeof key !== 'string' || !KEY_PATTERN.test(key)) throw new InquiryError('Invalid submission key')
    const previous = read(key)
    const body = validateInquiry(input, { checkTiming: !previous, now: now() })
    const hash = fingerprint(body)
    if (previous) {
      if (previous.hash !== hash) throw new InquiryError('Submission key already used', 409)
      syncDirectory()
      return previous
    }
    limit(ip)
    if (records().filter(record => record.status === 'pending').length >= maxPending) throw new InquiryError('Intake capacity reached', 503)
    const stat = fs.statfsSync(directory)
    if (stat.bavail * stat.bsize < minFreeBytes) throw new InquiryError('Intake storage unavailable', 503)
    const record = { key, hash, reference: createInquiryReference(), body, status: 'pending', acceptedAt: now(), attempts: 0, retryAt: 0 }
    write(record)
    return record
  }
  function forward(key) {
    if (active.has(key)) return active.get(key)
    const task = (async () => {
      const record = read(key)
      if (!record || record.status !== 'pending') return record
      try {
        const result = await deliver(record)
        if (!result || result.reference !== record.reference || !REFERENCE_PATTERN.test(result.reference)) throw new Error('CRM acknowledgment missing')
        // Keep only an idempotency tombstone after CRM commits; remove contact data from the spool.
        const saved = { key, hash: record.hash, reference: record.reference, status: 'synced', acceptedAt: record.acceptedAt, syncedAt: now(),
          ...(typeof result.catalogDownload === 'string' ? { catalogDownload: result.catalogDownload } : {}) }
        write(saved); lastDelivery = { ok: true, at: now() }
        return saved
      } catch {
        record.attempts++
        record.retryAt = now() + Math.min(300000, 5000 * 2 ** Math.min(record.attempts - 1, 6))
        write(record); lastDelivery = { ok: false, at: now() }
        log('CRM delivery failed; durable inquiry retained for retry')
        return record
      }
    })().finally(() => active.delete(key))
    active.set(key, task)
    return task
  }
  async function tick() {
    // Bounded batches; one unavailable backend must not block accepting new requests.
    for (const record of records().filter(r => r.status === 'pending' && r.retryAt <= now()).sort((a, b) => a.acceptedAt - b.acceptedAt).slice(0, 20)) {
      const result = await forward(record.key)
      if (result?.status === 'pending') break
    }
  }
  function health() {
    fs.accessSync(directory, fs.constants.W_OK)
    const pending = records().filter(r => r.status === 'pending')
    const stat = fs.statfsSync(directory)
    return { ok: pending.length < maxPending && stat.bavail * stat.bsize >= minFreeBytes, pending: pending.length,
      oldestPendingSeconds: pending.length ? Math.floor((now() - Math.min(...pending.map(r => r.acceptedAt))) / 1000) : 0, lastDelivery }
  }
  function prune() {
    for (const record of records()) if (record.status === 'synced' && now() - record.syncedAt > 30 * 86400000) fs.unlinkSync(filename(record.key))
    // Temp files were never acknowledged. Keep recent ones while accepting writes.
    for (const name of fs.readdirSync(directory)) if (/^\.[0-9a-f-]+\.tmp$/i.test(name) && now() - fs.statSync(path.join(directory, name)).mtimeMs > 86400000) fs.unlinkSync(path.join(directory, name))
    syncDirectory()
  }
  function response(record) {
    return { doc: { reference: record.reference,
      ...(record.status === 'synced' && record.catalogDownload && now() - record.syncedAt < 23 * 3600000 ? { catalogDownload: record.catalogDownload } : {}) },
      receiptStatus: record.status === 'synced' ? 'saved' : 'queued' }
  }
  return { accept, forward, tick, health, prune, response }
}
