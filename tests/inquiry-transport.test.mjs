import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installInquiryTransport } from '../apps/site/src/lib/inquiryTransport.ts'

const reference = 'IQ-7MXR-4T9C-W2HP'
function setup(storage = new Map()) {
  const fields = { name: { value: 'Buyer' }, email: { value: 'buyer@example.test' }, message: { value: 'Sample requirements' } }
  const form = { id: 'test-form', dataset: { locale: 'en' }, elements: { namedItem: name => fields[name] }, addEventListener() {} }
  const requests = [], timers = new Map()
  const browser = { sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    document: { querySelectorAll: () => [form] }, crypto: { randomUUID }, setTimeout: (fn, ms) => { timers.set(1, { fn, ms }); return 1 }, clearTimeout: key => timers.delete(key),
    fetch: async (url, options) => { requests.push(JSON.parse(options.body)); return Response.json({ doc: { reference } }) } }
  installInquiryTransport(browser)
  const body = () => ({ name: fields.name.value, email: fields.email.value, message: fields.message.value, formStartedAt: Date.now() - 3000 })
  const send = () => browser.siteInquiry.send(form, '/api/inquiries', { method: 'POST', body: JSON.stringify(body()) })
  return { browser, form, fields, storage, requests, timers, send }
}
test('failed requests and refresh reuse the submission key and restore contact drafts', async () => {
  const page = setup()
  page.browser.fetch = async (url, options) => { page.requests.push(JSON.parse(options.body)); throw new Error('offline') }
  await assert.rejects(page.send(), /offline/)
  const refreshed = setup(page.storage)
  assert.equal(refreshed.fields.message.value, 'Sample requirements')
  await refreshed.send()
  assert.equal(refreshed.requests[0].submissionKey, page.requests[0].submissionKey)
  refreshed.fields.message.value = 'Changed requirements'; await refreshed.send()
  assert.notEqual(refreshed.requests[0].submissionKey, refreshed.requests[1].submissionKey)
  refreshed.browser.siteInquiry.complete(refreshed.form, {})
  assert.ok(refreshed.storage.size)
  refreshed.browser.siteInquiry.complete(refreshed.form, { doc: { reference } })
  assert.equal(refreshed.storage.size, 0)
})
test('timeouts release the request without clearing the draft; blocked storage still permits retries', async () => {
  const page = setup()
  page.browser.sessionStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
  page.browser.fetch = (url, options) => new Promise((resolve, reject) => {
    page.requests.push(JSON.parse(options.body)); options.signal.addEventListener('abort', () => reject(new Error('timeout')))
  })
  const pending = page.send()
  assert.equal(page.timers.get(1).ms, 12000)
  page.timers.get(1).fn(); await assert.rejects(pending, /timeout/)
  assert.equal(page.timers.size, 0)
  page.browser.fetch = async (url, options) => { page.requests.push(JSON.parse(options.body)); return Response.json({ doc: { reference } }) }
  await page.send(); assert.equal(page.requests[0].submissionKey, page.requests[1].submissionKey)
})
test('expired tab drafts and attempts are discarded', () => {
  const storage = new Map([['site_inquiry_v1:test-form:en:draft', JSON.stringify({ at: Date.now() - 25 * 3600000, data: { email: 'old@example.test' } })]])
  const page = setup(storage); assert.equal(page.fields.email.value, 'buyer@example.test'); assert.equal(storage.size, 0)
})
