// Run inside the isolated Haiboss release with its private environment loaded.
// Only this project's clearly marked test inquiry is written. No email/API keys
// or owner login credentials are printed, and notifications stay unconfigured.
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {randomUUID} from 'node:crypto'
import {root} from '@site/config'
const req=createRequire(fs.realpathSync(path.join(root,'node_modules/embedded-postgres/package.json')))
const {Client}=req('pg')
const client=new Client({connectionString:process.env.DATABASE_URI})
const cms='http://127.0.0.1:'+process.env.CMS_PORT
const intake='http://127.0.0.1:'+process.env.INTAKE_PORT
const assert=(v,message)=>{if(!v)throw new Error(message)}
const get=async(url,options)=>{const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});return{status:r.status,body:await r.json()}}
await client.connect()
try{
 assert(!process.env.NOTIFICATION_API_KEY_FILE,'Real mail configuration present: use a separately reviewed notification test')
 const health=await get(cms+'/api/health');assert(health.status===200&&health.body.ok,'CMS database health failed')
 const articles=await get(cms+'/api/articles?limit=100&depth=0');assert(articles.status===200&&articles.body.totalDocs===8,'Expected eight public launch articles')
 assert(articles.body.docs.every(x=>x._status==='published'),'Public drafts must be hidden')
 assert(articles.body.docs.every(x=>typeof x.title==='string'&&x.title&&typeof x.description==='string'&&x.description),'Default locale content missing')
 const privateInquiries=await get(cms+'/api/inquiries?limit=1');assert(privateInquiries.status===403||privateInquiries.status===401,'Anonymous inquiry read was not rejected')
 const privateCandidates=await get(cms+'/api/content-candidates?limit=1');assert(privateCandidates.status===403||privateCandidates.status===401,'Anonymous candidate read was not rejected')
 const directWrite=await get(cms+'/api/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Blocked anonymous QA',email:'qa-rejected@example.test'})});assert([401,403].includes(directWrite.status),'Anonymous CRM write was not rejected')
 const oldQA=await client.query('SELECT submission_key FROM inquiries WHERE email=$1 AND name=$2 ORDER BY id DESC LIMIT 1',['qa-production-haiboss@example.test','海老板生产候选接口验收'])
 const data={submissionKey:oldQA.rows[0]?.submission_key||randomUUID(),type:'contact',name:'海老板生产候选接口验收',email:'qa-production-haiboss@example.test',message:'明确标记的生产候选链路测试记录，不是真实客户询盘。',locale:'zh',source:'/contact/',formStartedAt:Date.now()-5000,hp:''}
 const post=()=>get(intake+'/api/inquiries',{method:'POST',headers:{'content-type':'application/json',origin:'https://haiboss.com'},body:JSON.stringify(data)})
 const receipt=await post();const reference=receipt.body.doc?.reference
 assert([201,202].includes(receipt.status)&&reference,'Intake did not accept test inquiry')
 const again=await post();assert(again.body.doc?.reference===reference,'Duplicate submission changed receipt')
 let count=0
 for(let i=0;i<12;i++){
  const result=await client.query('SELECT reference, notification_state FROM inquiries WHERE reference=$1',[reference])
  count=result.rowCount
  if(count===1)break
  await new Promise(resolve=>setTimeout(resolve,1000))
 }
 assert(count===1,'Accepted inquiry was not persisted exactly once')
 const report={at:new Date().toISOString(),cmsHealth:true,publicArticles:8,anonymousInquiryReadDenied:true,anonymousCandidateReadDenied:true,anonymousCRMWriteDenied:true,receipt:reference,persistedCount:count,duplicateReceiptStable:true,emailDeliveryVerified:false,paidAPICalls:0}
 fs.mkdirSync(path.join(root,'.local/evidence'),{recursive:true});fs.writeFileSync(path.join(root,'.local/evidence/production-loopback.json'),JSON.stringify(report,null,2),{mode:0o600})
 console.log(JSON.stringify(report))
}finally{await client.end()}
