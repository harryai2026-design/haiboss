import { site } from '@site/config'
import { buildPages } from '../lib/pages'
import { resolveDomains } from '@site/config/domains'
export async function GET(){const base=resolveDomains(process.env).site;const pages=await buildPages();return new Response(`# ${site.name}\n\n${site.description}\n\n${pages.map(p=>`- [${p.title.replace(/[\[\]\n]/g,' ')}](${base}${p.path})`).join('\n')}\n`,{headers:{'content-type':'text/plain; charset=utf-8'}})}
