import fs from 'node:fs'
import path from 'node:path'
import { root,loadSite } from '@site/config'
const skip=new Set(['node_modules','.git','.next','.local','dist','.dist-next','.astro','media','artifacts','.site-releases','.deploy'])
const errors=[],files=[]
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name)||e.name.startsWith('.env')||e.name.endsWith('.log')||e.name.endsWith('.tsbuildinfo'))continue;const p=path.join(dir,e.name);e.isDirectory()?walk(p):files.push(p)}}walk(root)
for(const file of files){
  const text=fs.readFileSync(file,'utf8'),name=path.relative(root,file)
  if(name.replaceAll('\\','/')==='scripts/check-template.mjs')continue
  if(/koorpet|cat.scratcher|corrugated|sisal|readdy\.ai|5491168139526|cs@koorpet/i.test(text))errors.push(`${name}: old business content`)
  if(/-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----|\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/.test(text))errors.push(`${name}: possible secret`)
}
loadSite()
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(JSON.stringify({valid:true,sourceFiles:files.length,oldBusinessContent:0,secretMarkers:0}))
