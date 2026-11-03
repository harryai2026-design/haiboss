import path from 'node:path'
import { fileURLToPath } from 'node:url'
import definition from '../../config/site.json' with { type:'json' }
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
export function loadSite() {
  // Static JSON import survives Astro/Next bundling; filesystem-relative reads do not.
  const site = structuredClone(definition)
  if (!/^[a-z][a-z0-9-]{1,39}$/.test(site.id)) throw new Error('site.id must be a short lowercase project identifier')
  if (!site.name || !site.description) throw new Error('Site name and description are required')
  const supported = ['en', 'zh', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'ru', 'pl', 'ar']
  if (!site.locales?.length || !site.locales.includes(site.defaultLocale) || site.locales.some(x => !supported.includes(x)) || new Set(site.locales).size !== site.locales.length) throw new Error('Invalid site locales')
  for (const value of Object.values(site.theme)) if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error('Theme values must be hex colors')
  if (!['Organization','Corporation','LocalBusiness','ProfessionalService','Manufacturer'].includes(site.organizationType)) throw new Error('Invalid organization type')
  for (const key of ['articles','inquiries','products','analytics']) if (typeof site.features[key] !== 'boolean') throw new Error(`Invalid feature: ${key}`)
  if (site.features.analytics && !/^G-[A-Z0-9]+$/.test(site.analytics?.ga4MeasurementId || '')) throw new Error('Enabled analytics requires a GA4 measurement id')
  return site
}
export const site = loadSite()
export function pagePath(locale, suffix = '') {
  const prefix = locale === site.defaultLocale ? '' : `${locale}/`
  return `/${prefix}${suffix.replace(/^\//, '')}`
}
