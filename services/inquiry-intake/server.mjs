import http from 'node:http'
import { pathToFileURL } from 'node:url'
import { createIntakeQueue } from './queue.mjs'
import { InquiryError } from './validation.mjs'
import domains from '../../packages/config/domains.mjs'

export function createIntakeServer({ queue, allowedOrigins = [] }) {
  const server = http.createServer(async (req, res) => {
    const route = req.url === '/api/inquiries/' ? '/api/inquiries' : req.url
    if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
      res.setHeader('access-control-allow-origin', req.headers.origin)
      res.setHeader('vary', 'Origin')
    }
    function json(status, value) {
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' })
      res.end(JSON.stringify(value))
    }
    try {
      if (req.method === 'OPTIONS' && route === '/api/inquiries') {
        if (!allowedOrigins.includes(req.headers.origin) || req.headers['access-control-request-method'] !== 'POST'
          || String(req.headers['access-control-request-headers'] || '').split(',').some(header => header.trim() && !['content-type', 'accept'].includes(header.trim().toLowerCase()))) {
          return json(403, { error: 'Origin or method not allowed' })
        }
        res.setHeader('access-control-allow-methods', 'POST')
        res.setHeader('access-control-allow-headers', 'content-type, accept')
        return json(200, {})
      }
      if (req.method === 'GET' && route === '/health') {
        const health = queue.health(); return json(health.ok ? 200 : 503, health)
      }
      if (req.method !== 'POST' || route !== '/api/inquiries') return json(404, { error: 'Not found' })
      if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) return json(403, { error: 'Origin not allowed' })
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(415, { error: 'JSON required' })
      const chunks = []; let bytes = 0
      for await (const chunk of req) {
        bytes += chunk.length
        if (bytes > 65536) return json(413, { error: 'Request too large' })
        chunks.push(chunk)
      }
      let input
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return json(400, { error: 'Invalid JSON' }) }
      const remote = req.socket.remoteAddress || 'unknown'
      const trustedProxy = process.env.TRUST_PROXY === '1' && ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)
      const ip = trustedProxy ? String(req.headers['x-forwarded-for'] || remote).split(',')[0].trim() : remote
      const record = queue.accept(input, ip)
      // For catalogue requests allow a short healthy-backend fast path. Receipt is already durable.
      if (record.body?.type === 'catalog' && record.status === 'pending') {
        const delivery = await Promise.race([queue.forward(record.key), new Promise(resolve => { const timer = setTimeout(() => resolve(null), 1000); timer.unref() })])
        if (delivery?.status === 'synced') return json(201, queue.response(delivery))
      }
      json(record.status === 'synced' ? 201 : 202, queue.response(record))
    } catch (error) {
      json(error instanceof InquiryError ? error.status : 503, { error: error instanceof InquiryError ? error.message : 'Intake temporarily unavailable' })
    }
  })
  server.requestTimeout = 10000
  server.headersTimeout = 5000
  server.maxConnections = 256
  return server
}

export async function start() {
  const secret = process.env.INQUIRY_INGEST_SECRET || ''
  if (secret.length < 32) throw new Error('INQUIRY_INGEST_SECRET must contain at least 32 characters')
  const publicUrls = domains.resolveDomains(process.env)
  const base = new URL(process.env.PAYLOAD_URL || 'http://127.0.0.1:44301')
  const queue = createIntakeQueue({ directory: process.env.INTAKE_DIR || '.local/inquiries', log: message => console.error(message), deliver: async record => {
    const response = await fetch(new URL('/api/inquiry-ingest', base), { method: 'POST', headers: { 'content-type': 'application/json', 'x-inquiry-ingest-token': secret },
      body: JSON.stringify({ submissionKey: record.key, reference: record.reference, acceptedAt: record.acceptedAt, data: record.body }), signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('CRM unavailable')
    return (await response.json()).doc
  } })
  const server = createIntakeServer({ queue, allowedOrigins: publicUrls.allowedOrigins })
  let busy = false
  async function run() { if (busy) return; busy = true; try { await queue.tick() } catch { console.error('Intake worker/storage check failed') } finally { busy = false } }
  const timer = setInterval(() => { void run() }, 5000)
  const cleanup = setInterval(() => { try { queue.prune() } catch { console.error('Intake retention cleanup failed') } }, 3600000)
  await new Promise(resolve => server.listen(Number(process.env.INTAKE_PORT || process.env.PORT || 44302), process.env.BIND_HOST || '127.0.0.1', resolve))
  void run()
  process.on('SIGTERM', () => { clearInterval(timer); clearInterval(cleanup); server.close(() => process.exit(0)) })
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) start().catch(() => { console.error('Inquiry intake startup failed; check configuration and storage'); process.exitCode = 1 })
