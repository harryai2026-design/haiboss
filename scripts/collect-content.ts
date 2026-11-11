import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
import {parseFeed,feedText,eligibility} from '../services/editorial/policy.mjs'
process.env.DISABLE_WORKERS='1'
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
const payload=await getPayload({config})
const sources=JSON.parse(fs.readFileSync(path.join(root,'config/content-sources.json'),'utf8'))
const policy=JSON.parse(fs.readFileSync(path.join(root,'config/editorial-policy.json'),'utf8'))
const report:any={at:new Date().toISOString(),created:0,duplicates:0,skipped:{future:0,old:0},sources:[],paidRequests:0,automaticPublication:false}
try{
 for(const source of sources.filter(x=>x.enabled)){
  try{
   const response=await fetch(source.url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{'user-agent':'HaibossEditorial/1.0 (+https://haiboss.com/)'}})
   const entries=parseFeed(await feedText(response),source)
   for(const candidate of entries){
    const decision=eligibility(candidate,source,new Date(),policy.collection.maxSourceAgeDays)
    if(decision.reason==='future-source-date'){report.skipped.future++;continue}
    if(decision.reason==='old-source-date'){report.skipped.old++;continue}
    const existing=await payload.find({collection:'content-candidates',where:{sourceUrl:{equals:candidate.sourceUrl}},limit:1,overrideAccess:true})
    if(existing.docs.length){report.duplicates++;continue}
    await payload.create({collection:'content-candidates',overrideAccess:true,data:{...candidate,collectedAt:new Date().toISOString(),state:'pending',reviewNote:'自动采集资料；来源：'+source.title+'；建议栏目：'+source.section+'；选题判定：'+decision.reason+'。尚未形成中文成稿，未经所有者审核，不得发布。'}})
    report.created++
   }
   report.sources.push({id:source.id,ok:true,entries:entries.length})
  }catch(error){report.sources.push({id:source.id,ok:false,error:error instanceof Error?error.message:'Feed unavailable'})}
 }
 fs.mkdirSync(path.join(root,'.local/editorial'),{recursive:true})
 const reportFile=path.join(root,'.local/editorial/last-collection.json'),temp=reportFile+'.'+process.pid+'.tmp'
 fs.writeFileSync(temp,JSON.stringify(report,null,2),{mode:0o600});fs.renameSync(temp,reportFile)
 console.log(JSON.stringify(report));if(report.sources.some(x=>!x.ok))process.exitCode=1
}finally{await payload.destroy()}
process.exit(process.exitCode||0)
