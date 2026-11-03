// Public origins are deployment settings, never CMS content. No dependencies so
// the same validation runs in Payload, Astro and the release preflight container.
import { pathToFileURL } from 'node:url'
const DEFAULTS = Object.freeze({
  SITE_URL: 'http://localhost:44321',
  CMS_URL: 'http://localhost:44301',
  SITE_ALIAS_URL: '',
})

function origin(value, name, httpsOnly = false) {
  const fail = () => { throw new Error(`${name} 必须是${httpsOnly ? ' HTTPS' : ' HTTP(S)'} 根地址，不能包含路径、账号、查询参数或空白`) }
  if (typeof value !== 'string' || /[\s\\{},$*]/.test(value)) fail()
  let url
  try { url = new URL(value) } catch { fail() }
  if (!['http:', 'https:'].includes(url.protocol) || (httpsOnly && url.protocol !== 'https:') ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      !/^https?:\/\//i.test(value)) fail()
  if (httpsOnly && value !== url.origin) throw new Error(`${name} 生产配置必须使用规范根地址 ${url.origin}，不加末尾斜杠`)
  return url.origin
}

function siteUrl(env = process.env) {
  const environment = siteEnvironment(env)
  if ((environment === 'production' || env.STRICT_CONTENT_BUILD === '1') && !env.SITE_URL) throw new Error('请明确配置 SITE_URL，部署不会回退到其他品牌域名')
  return origin(env.SITE_URL || DEFAULTS.SITE_URL, 'SITE_URL', environment === 'production')
}

function siteEnvironment(env = process.env) {
  const value = env.SITE_ENVIRONMENT || 'testing'
  if (!['testing', 'production'].includes(value)) throw new Error('SITE_ENVIRONMENT 必须为 testing 或 production')
  return value
}

function resolveDomains(env = process.env, { production = false } = {}) {
  const environment = siteEnvironment(env)
  if ((production || environment === 'production') && !env.SITE_URL) throw new Error('请明确配置 SITE_URL，部署不会回退到其他品牌域名')
  const secure = production || environment === 'production'
  const site = origin(env.SITE_URL || DEFAULTS.SITE_URL, 'SITE_URL', secure)
  const cms = origin(env.CMS_URL || env.PAYLOAD_PUBLIC_SERVER_URL || (env.SITE_URL ? site : DEFAULTS.CMS_URL), 'CMS_URL', secure)
  const alias = env.SITE_ALIAS_URL ? origin(env.SITE_ALIAS_URL, 'SITE_ALIAS_URL', secure) : ''
  const media = origin(env.MEDIA_URL || env.PAYLOAD_PUBLIC_URL || cms, 'MEDIA_URL', secure)
  if (alias && [site, cms].includes(alias)) throw new Error('跳转别名不能与主站或后台地址相同')
  const additional = (env.PAYLOAD_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => origin(s, 'PAYLOAD_ALLOWED_ORIGINS', secure))
  const local = production || env.NODE_ENV === 'production' ? [] : ['http://localhost:44321', 'http://127.0.0.1:44321']
  const allowedOrigins = [...new Set([site, cms, alias, ...additional, ...local].filter(Boolean))]
  return { site, cms, alias, media, allowedOrigins, environment }
}

export { DEFAULTS, origin, siteUrl, siteEnvironment, resolveDomains }
export default { DEFAULTS, origin, siteUrl, siteEnvironment, resolveDomains }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { site, cms, alias, media } = resolveDomains(process.env, { production: true })
    // Only public addresses; never print Compose's resolved environment/secrets.
    console.log(`域名配置校验通过：主站 ${site}；后台 ${cms}/admin；跳转 ${alias || '无'}；媒体 ${media}`)
  } catch (error) {
    console.error(`域名配置校验失败：${error.message}`)
    process.exitCode = 1
  }
}
