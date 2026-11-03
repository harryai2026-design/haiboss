// Shared public-input contract. No CMS or database dependency: intake works during outages.
export class InquiryError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}
export const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const REFERENCE_PATTERN = /^IQ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/
const locales = new Set(['zh', 'en', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'ru', 'pl', 'ar'])

export function cleanAttribution(value) {
  if (value == null) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InquiryError('Invalid attribution')
  const result = {}
  for (const key of ['firstTouch', 'lastTouch']) {
    const input = value[key]
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InquiryError('Invalid attribution touch')
    const touch = {}
    for (const field of ['landingPage', 'referrer', 'source', 'medium', 'campaign', 'term', 'content', 'capturedAt']) {
      const v = input[field]
      if (typeof v !== 'string' || v.length > (field === 'landingPage' ? 500 : 120)) throw new InquiryError('Invalid attribution field')
      touch[field] = v.trim()
    }
    if (!touch.landingPage.startsWith('/') || touch.landingPage.startsWith('//') || /[?#]/.test(touch.landingPage)) throw new InquiryError('Invalid landing page')
    if (touch.referrer && !/^[a-z0-9.-]+$/i.test(touch.referrer)) throw new InquiryError('Invalid referring host')
    if (!Number.isFinite(Date.parse(touch.capturedAt))) throw new InquiryError('Invalid attribution date')
    result[key] = touch
  }
  return result
}

/** @returns {Record<string, any> & {name: string, email: string}} */
export function validateInquiry(input, { checkTiming = true, now = Date.now() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InquiryError('Invalid inquiry')
  if (typeof input.hp === 'string' && input.hp.trim()) throw new InquiryError('Invalid submission')
  if (checkTiming) {
    const elapsed = now - Number(input.formStartedAt)
    if (!Number.isFinite(elapsed) || elapsed < 2500 || elapsed > 86400000) throw new InquiryError('Please try again')
  }
  /** @type {Record<string, any>} */
  const data = {}
  for (const [key, max] of Object.entries({ type: 20, name: 120, email: 254, company: 200, phone: 80, country: 120,
    message: 8000, productHandle: 120, productSku: 100, productTitle: 200, source: 500, locale: 10 })) {
    const value = typeof input[key] === 'string' ? input[key].trim() : ''
    if (value.length > max) throw new InquiryError(`${key} is too long`)
    if (value) data[key] = value
  }
  if (!data.name || !data.email) throw new InquiryError('Missing contact details')
  data.email = data.email.toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new InquiryError('Invalid email')
  data.type ||= 'quote'
  if (!['quote', 'contact', 'catalog'].includes(data.type)) throw new InquiryError('Invalid inquiry type')
  if (data.locale && !locales.has(data.locale)) throw new InquiryError('Invalid locale')
  if (input.attribution != null) data.attribution = cleanAttribution(input.attribution)
  if (input.items != null) {
    if (!Array.isArray(input.items) || input.items.length > 20) throw new InquiryError('Invalid RFQ items')
    data.items = input.items.map(item => {
      if (!item || typeof item !== 'object') throw new InquiryError('Invalid RFQ item')
      const handle = typeof item.handle === 'string' ? item.handle.trim() : ''
      const sku = typeof item.sku === 'string' ? item.sku.trim() : ''
      const title = typeof item.title === 'string' ? item.title.trim() : ''
      const qty = item.qty == null ? null : Math.floor(Number(item.qty))
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle) || handle.length > 120 || !title || title.length > 200 || sku.length > 100
        || (qty != null && (!Number.isSafeInteger(qty) || qty < 1 || qty > 10000000))) throw new InquiryError('Invalid RFQ item')
      return { handle, ...(sku && { sku }), title, qty }
    })
  }
  return data
}

export function createRateLimiter({ max = 5, windowMs = 600000, now = Date.now } = {}) {
  const hits = new Map()
  let checks = 0
  return ip => {
    const time = now()
    if (++checks % 100 === 0) for (const [key, values] of hits) {
      const active = values.filter(t => time - t < windowMs)
      if (active.length) hits.set(key, active); else hits.delete(key)
    }
    const active = (hits.get(ip) || []).filter(t => time - t < windowMs)
    if (active.length >= max) throw new InquiryError('Too many submissions', 429)
    active.push(time); hits.set(ip, active)
  }
}
