import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createIntakeQueue } from '../services/inquiry-intake/queue.mjs'
import { createIntakeServer } from '../services/inquiry-intake/server.mjs'

const input = () => ({ submissionKey: randomUUID(), type: 'quote', name: 'Synthetic buyer', email: 'buyer@example.test',
  formStartedAt: Date.now() - 3000, items: [{ handle: 'example-item', title: 'Example item', qty: null }] })
function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'site-intake-test-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return { directory, queue: createIntakeQueue({ directory, ...options }) }
}
test('offline receipts survive restart; retries preserve identity and recovery removes contact data', async t => {
  let available = false, time = Date.now(), deliveries = 0
  const deliver = async record => { deliveries++; if (!available) throw new Error('backend offline'); return { reference: record.reference } }
  const { directory, queue } = fixture(t, { deliver, now: () => time })
  const data = input(), record = queue.accept(data, 'buyer')
  assert.equal(queue.response(record).receiptStatus, 'queued')
  await queue.tick(); assert.equal(queue.health().pending, 1)
  const restarted = createIntakeQueue({ directory, deliver, now: () => time })
  assert.equal(restarted.accept({ ...data, formStartedAt: 0 }, 'buyer').reference, record.reference)
  assert.throws(() => restarted.accept({ ...data, message: 'different content' }), /already used/)
  available = true; time += 6000; await restarted.tick()
  assert.equal(restarted.health().pending, 0); assert.equal(deliveries, 2)
  const stored = fs.readFileSync(path.join(directory, `${data.submissionKey}.json`), 'utf8')
  assert.ok(!stored.includes('buyer@example.test')); assert.ok(!stored.includes('Synthetic buyer'))
  assert.equal(restarted.accept(data).reference, record.reference)
})
test('lost CRM response is retried with the same key/reference; concurrent forwarding shares one delivery', async t => {
  const committed = new Map(); let requests = 0, time = Date.now()
  const { queue } = fixture(t, { now: () => time, deliver: async record => {
    requests++; committed.set(record.key, record.reference)
    if (requests === 1) throw new Error('response lost after commit')
    return { reference: committed.get(record.key) }
  } })
  const record = queue.accept(input()); await queue.forward(record.key)
  time += 6000
  await Promise.all([queue.forward(record.key), queue.forward(record.key)])
  assert.equal(committed.size, 1); assert.equal(requests, 2); assert.equal(queue.health().pending, 0)
})
test('storage/capacity failure is never acknowledged; pending records are never pruned', t => {
  let time = Date.now()
  const { directory, queue } = fixture(t, { now: () => time, maxPending: 1 })
  const record = queue.accept(input())
  assert.throws(() => queue.accept(input()), /capacity/)
  time += 90 * 86400000; queue.prune()
  assert.equal(queue.health().pending, 1)
  assert.ok(fs.existsSync(path.join(directory, `${record.key}.json`)))
  const fullDisk = createIntakeQueue({ directory, minFreeBytes: Number.MAX_SAFE_INTEGER })
  assert.throws(() => fullDisk.accept(input()), /storage/)
  // Make the spool path unusable after startup, without touching any workspace or production directory.
  const missing = path.join(directory, 'missing')
  const broken = createIntakeQueue({ directory: missing }); fs.rmdirSync(missing)
  assert.throws(() => broken.accept(input()), /ENOENT/)
})
test('public validation removes privileged fields and limits abusive submissions', t => {
  const { queue } = fixture(t)
  assert.throws(() => queue.accept({ ...input(), hp: 'spam' }), /Invalid submission/)
  assert.throws(() => queue.accept({ ...input(), email: 'invalid' }), /email/)
  assert.throws(() => queue.accept({ ...input(), submissionKey: '../../escape' }), /key/)
  const record = queue.accept({ ...input(), reference: 'spoof', status: 'won', notificationQueued: false, notification: { status: 'sent' } }, 'limited')
  assert.equal(record.body.status, undefined); assert.equal(record.body.notification, undefined)
  for (let i = 0; i < 4; i++) queue.accept(input(), 'limited')
  assert.throws(() => queue.accept(input(), 'limited'), /Too many/)
})
test('HTTP intake remains available during backend outage and exposes no receipt lookup or contact data', async t => {
  const { queue } = fixture(t, { deliver: async () => { throw new Error('database offline') } })
  const server = createIntakeServer({ queue, allowedOrigins: ['https://site.example.test'] })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  const body = input()
  const send = (data, origin = 'https://site.example.test') => fetch(`${base}/api/inquiries`, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(data) })
  const response = await send(body), receipt = await response.json()
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://site.example.test')
  assert.equal(response.status, 202); assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(Object.keys(receipt.doc), ['reference'])
  const again = await send(body); assert.equal((await again.json()).doc.reference, receipt.doc.reference)
  const slash = await fetch(`${base}/api/inquiries/`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://site.example.test' }, body: JSON.stringify(body) })
  assert.equal(slash.status, 202); assert.equal((await slash.json()).doc.reference, receipt.doc.reference)
  assert.equal((await send(body, 'https://other.example.test')).status, 403)
  assert.equal((await fetch(`${base}/api/inquiries`, { method: 'OPTIONS', headers: { origin: 'https://site.example.test', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } })).status, 200)
  assert.equal((await fetch(`${base}/api/inquiries`, { method: 'OPTIONS', headers: { origin: 'https://other.example.test', 'access-control-request-method': 'POST' } })).status, 403)
  assert.equal((await send({ ...body, message: 'changed' })).status, 409)
  assert.equal((await fetch(`${base}/api/inquiries`)).status, 404)
  assert.equal((await send({ ...input(), message: 'x'.repeat(70000) })).status, 413)
  await queue.tick()
  const health = await (await fetch(`${base}/health`)).json()
  assert.equal(health.pending, 1); assert.equal(health.lastDelivery.ok, false)
  assert.ok(!JSON.stringify(health).includes('buyer'))
})
