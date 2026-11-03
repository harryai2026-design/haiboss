import { resolveDomains } from '@site/config/domains'
export function GET(){const {site,environment}=resolveDomains(process.env);return new Response(environment==='production'?`User-agent: *\nAllow: /\nSitemap: ${site}/sitemap-index.xml\n`:'User-agent: *\nDisallow: /\n',{headers:{'content-type':'text/plain; charset=utf-8'}})}
