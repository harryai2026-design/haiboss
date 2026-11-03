import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1'
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
const payload=await getPayload({config})
const sources=JSON.parse(fs.readFileSync(path.join(root,'config/content-sources.json'),'utf8'))
const report:any={at:new Date().toISOString(),created:0,duplicates:0,sources:[],paidRequests:0}
const text=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()
const tag=(block:string,name:string)=>{const m=block.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'));return m?text(m[1]):''}
try{
 for(const source of sources.filter(x=>x.enabled)){
  try{
   const response=await fetch(source.url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{'user-agent':'HaibossEditorial/1.0 (+https://haiboss.com/)'}})
   if(!response.ok)throw new Error('HTTP '+response.status)
   if(Number(response.headers.get('content-length')||0)>2_000_000)throw new Error('Feed too large')
   const xml=await response.text();if(xml.length>2_000_000)throw new Error('Feed too large')
   const entries=[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0,20)
   if(!entries.length)throw new Error('Feed has no recognizable entries')
   for(const match of entries){
    const entry=match[1],title=tag(entry,'title').slice(0,250),url=tag(entry,'link')||entry.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]
    if(!title||!url)continue
    const parsed=new URL(url);if(parsed.protocol!=='https:')continue;parsed.hash=''
    const existing=await payload.find({collection:'content-candidates',where:{sourceUrl:{equals:parsed.href}},limit:1,overrideAccess:true})
    if(existing.docs.length){report.duplicates++;continue}
    const date=tag(entry,'pubDate')||tag(entry,'published'),validDate=date&&!Number.isNaN(Date.parse(date))?new Date(date).toISOString():null
    await payload.create({collection:'content-candidates',overrideAccess:true,data:{title,sourceUrl:parsed.href,summary:(tag(entry,'description')||tag(entry,'summary')).slice(0,600),collectedAt:new Date().toISOString(),sourcePublishedAt:validDate,state:'pending',reviewNote:'来源：'+source.title+'。仅为候选摘要；需核验出海相关性、原文与事件日期后编辑，未发布。'}})
    report.created++
   }
   report.sources.push({id:source.id,ok:true,entries:entries.length})
  }catch(error){report.sources.push({id:source.id,ok:false,error:error instanceof Error?error.message:'Feed unavailable'})}
 }
 fs.mkdirSync(path.join(root,'.local/editorial'),{recursive:true})
 fs.writeFileSync(path.join(root,'.local/editorial/last-collection.json'),JSON.stringify(report,null,2))
 console.log(JSON.stringify(report));if(report.sources.some(x=>!x.ok))process.exitCode=1
}finally{await payload.destroy()}
process.exit(process.exitCode||0)
