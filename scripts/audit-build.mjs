import fs from 'node:fs'
import path from 'node:path'
import { root } from '@site/config'
export function audit(directory=path.join(root,'apps/site/dist')){
  const files=[]
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);entry.isDirectory()?walk(p):files.push(p)}}walk(directory)
  const errors=[]
  const manifestFile=path.join(directory,'llms.txt')
  const expected=new Set()
  if(fs.existsSync(manifestFile))for(const match of fs.readFileSync(manifestFile,'utf8').matchAll(/\]\((https?:\/\/[^)]+)\)/g)){
    const pathname=decodeURIComponent(new URL(match[1]).pathname)
    expected.add(pathname.replace(/^\//,'')+(pathname.endsWith('/')?'index.html':''))
  }
  for(const file of files.filter(x=>x.endsWith('.html'))){
    const html=fs.readFileSync(file,'utf8'),name=path.relative(directory,file)
    if(expected.size&&name!=='404.html'&&!expected.has(name.replaceAll('\\','/')))errors.push(`${name}: stale HTML absent from the current published page list`)
    for(const [label,pattern] of [['title',/<title>[^<]+<\/title>/],['description',/<meta[^>]+name="description"[^>]+content="[^"]+"/],['canonical',/<link[^>]+rel="canonical"/],['JSON-LD',/application\/ld\+json/],['language',/<html[^>]+lang="[^"]+"/]])if(!pattern.test(html))errors.push(`${name}: missing ${label}`)
    for(const match of html.matchAll(/href="(\/[^"?#]*)/g)){
      const value=match[1];if(value.startsWith('//')||value.startsWith('/api/'))continue
      const p=path.join(directory,decodeURIComponent(value),value.endsWith('/')?'index.html':'')
      if(!fs.existsSync(p))errors.push(`${name}: broken local link ${value}`)
    }
    for(const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))try{JSON.parse(match[1])}catch{errors.push(`${name}: invalid JSON-LD`)}
  }
  for(const name of ['index.html','robots.txt','llms.txt','sitemap-index.xml'])if(!fs.existsSync(path.join(directory,name)))errors.push(`Missing ${name}`)
  if(errors.length)throw new Error(errors.join('\n'))
  return{htmlPages:files.filter(x=>x.endsWith('.html')).length,errors:0}
}
if(process.argv[1]?.endsWith('audit-build.mjs'))console.log(JSON.stringify(audit()))
