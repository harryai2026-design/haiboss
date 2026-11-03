const TTL = 24 * 60 * 60 * 1000
const fields = ['name', 'email', 'company', 'phone', 'country', 'message']
const referencePattern = /^IQ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/

/** Tab-local drafts expire after 24 hours. Ambiguous responses keep the same submission key. */
export function installInquiryTransport(browser: Window & typeof globalThis = window): void {
  const win = browser as any
  if (win.siteInquiry) return
  const memory = new Map<string, any>()
  function load(key: string): any {
    try {
      const value = JSON.parse(browser.sessionStorage.getItem(key) || 'null')
      if (value && Date.now() - value.at < TTL) { memory.set(key, value); return value }
      browser.sessionStorage.removeItem(key)
    } catch { /* Storage blocking must not prevent submission. */ }
    const fallback = memory.get(key)
    return fallback && Date.now() - fallback.at < TTL ? fallback : null
  }
  function save(key: string, value: any) {
    memory.set(key, value)
    try { browser.sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* keep in memory */ }
  }
  function remove(key: string) { memory.delete(key); try { browser.sessionStorage.removeItem(key) } catch { /* ignore */ } }
  const storageKey = (form: HTMLFormElement) => `site_inquiry_v1:${form.id}:${form.dataset.locale || ''}`
  function draft(form: HTMLFormElement) {
    const data: Record<string, string> = {}
    for (const name of fields) {
      const field = form.elements.namedItem(name) as HTMLInputElement | null
      if (field) data[name] = field.value
    }
    save(`${storageKey(form)}:draft`, { at: Date.now(), data })
  }
  win.siteInquiry = {
    send: async (form: HTMLFormElement, url: string, options: RequestInit): Promise<Response> => {
      draft(form)
      const body = JSON.parse(String(options.body))
      const stable = { ...body }; delete stable.formStartedAt; delete stable.hp; delete stable.attribution
      const signature = JSON.stringify(stable)
      const key = `${storageKey(form)}:attempt`
      let attempt = load(key)
      if (!attempt || attempt.signature !== signature) {
        attempt = { at: Date.now(), signature, submissionKey: browser.crypto.randomUUID(), attribution: body.attribution }
        save(key, attempt)
      }
      // Attribution can change after refresh; retries must replay the original receipt contents.
      body.attribution = attempt.attribution
      body.submissionKey = attempt.submissionKey
      const controller = new AbortController()
      const timer = browser.setTimeout(() => controller.abort(), 12000)
      try {
        const response = await browser.fetch(url, { ...options, body: JSON.stringify(body), signal: controller.signal })
        // Cover response-body stalls as well as connection/header timeouts.
        await response.clone().arrayBuffer()
        return response
      }
      finally { browser.clearTimeout(timer) }
    },
    complete: (form: HTMLFormElement, result: any) => {
      if (!referencePattern.test(result?.doc?.reference || '')) return
      remove(`${storageKey(form)}:draft`); remove(`${storageKey(form)}:attempt`)
    },
  }
  browser.document.querySelectorAll<HTMLFormElement>('form[data-api]').forEach(form => {
    const saved = load(`${storageKey(form)}:draft`)
    if (saved) for (const name of fields) {
      const field = form.elements.namedItem(name) as HTMLInputElement | null
      if (field && typeof saved.data?.[name] === 'string') field.value = saved.data[name]
    }
    form.addEventListener('input', () => draft(form))
    form.addEventListener('change', () => draft(form))
  })
}
