import { site } from '@site/config'
const pending = new Map()
export async function documents(collection, locale = site.defaultLocale) {
  if (!['articles','products','topics','services','cases'].includes(collection)) throw new Error('Unsupported public content collection')
  if (['articles','products'].includes(collection)&&!site.features[collection]) return []
  const base = process.env.OFFLINE_PREVIEW === '1' ? '' : process.env.PAYLOAD_URL
  if (!base) {
    if (process.env.STRICT_CONTENT_BUILD === '1') throw new Error('Production content build requires PAYLOAD_URL')
    return [] // Offline shell; never silently seed or restore deleted business content.
  }
  const key = `${collection}:${locale}`
  if (!pending.has(key)) pending.set(key, (async () => {
    const docs = []
    for (let page = 1; page <= 1000; page++) {
      const url = new URL(`/api/${collection}`, base)
      url.search = new URLSearchParams({ 'where[_status][equals]':'published', locale, 'fallback-locale':'none', draft:'false', limit:'100', depth:'1', page:String(page), sort:'-updatedAt' }).toString()
      if(collection==='topics')url.searchParams.delete('where[_status][equals]')
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error(`CMS ${collection} request failed: HTTP ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data.docs) || typeof data.hasNextPage !== 'boolean') throw new Error('Invalid CMS response')
      docs.push(...data.docs.filter(doc => (collection==='topics'||doc._status === 'published') && doc.title && doc.description && doc.slug))
      if (!data.hasNextPage) return docs
    }
    throw new Error('CMS pagination exceeded limit')
  })())
  return pending.get(key)
}
export async function profile() {
  if (!process.env.PAYLOAD_URL || process.env.OFFLINE_PREVIEW === '1') return { heading:site.tagline, intro:site.description, email:site.contactEmail }
  const url = new URL('/api/globals/site-profile?depth=0', process.env.PAYLOAD_URL)
  const res = await fetch(url, { signal:AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`CMS profile request failed: HTTP ${res.status}`)
  const data = await res.json()
  return { heading:data.heading || site.tagline, intro:data.intro || site.description, email:data.email || site.contactEmail }
}
