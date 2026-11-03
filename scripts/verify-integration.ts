import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes,randomUUID } from 'node:crypto'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root,site} from '@site/config'
import {localDatabase} from './local-db.mjs'
import {createIntakeQueue} from '../services/inquiry-intake/queue.mjs'
process.env.NODE_ENV='production'
process.env.DISABLE_WORKERS='1'
process.env.PAYLOAD_PUSH='0'
const databaseName=`verify_${Date.now()}`
const database=await localDatabase({directory:path.join(root,'.local/verification-db'),port:44333,database:databaseName})
process.env.DATABASE_URI=database.uri
const req=createRequire(fs.realpathSync(path.join(root,'services/cms/package.json')))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const results:string[]=[]
let payload:any
async function closePayload(instance:any){
  const pool=instance.db.pool
  await instance.destroy()
  // Payload's adapter keeps one monitoring client checked out after destroy().
  // Release that client before ending this isolated test pool.
  for(const client of pool?._clients || []) {
    if(!pool._idle.some((entry:any)=>entry.client===client))try{client.release()}catch{}
  }
  if(pool && !pool.ending)await pool.end()
}
const configURL=pathToFileURL(path.join(root,'services/cms/src/payload.config.ts')).href
try{
  const config=(await import(configURL)).default
  payload=await getPayload({config,key:'verify-default'})
  await payload.db.migrate()
  for(const collection of ['users','articles','inquiries'])assert.equal((await payload.count({collection})).totalDocs,0)
  assert.ok(!payload.config.collections.some((x:any)=>x.slug==='products'))
  results.push('fresh migrations contain no users, articles, inquiries or business seeds; default product collection is disabled')
  await payload.db.migrate()
  results.push('repeated migrations are idempotent')
  const owner=await payload.create({collection:'users',data:{email:'owner@example.test',password:randomBytes(24).toString('hex'),name:'Verification owner'}})
  assert.equal(owner.role,'owner')
  const editor=await payload.create({collection:'users',user:owner,overrideAccess:false,data:{email:'editor@example.test',password:randomBytes(24).toString('hex'),role:'editor'}})
  assert.equal(editor.role,'editor')
  const updated=await payload.update({collection:'users',id:editor.id,user:editor,overrideAccess:false,data:{role:'owner',name:'Edited'}})
  assert.equal(updated.role,'editor')
  await assert.rejects(()=>payload.create({collection:'users',user:editor,overrideAccess:false,data:{email:'intruder@example.test',password:randomBytes(24).toString('hex')}}))
  results.push('first account is owner; editor cannot escalate role or create accounts')
  const live=await payload.create({collection:'articles',data:{slug:'verification-article',title:'Verification article',description:'A fixture for the template integration test.',_status:'published',content:{root:{type:'root',version:1,direction:null,format:'',indent:0,children:[{type:'paragraph',version:1,direction:null,format:'',indent:0,children:[{type:'text',version:1,text:'Published fixture content.',format:0,detail:0,mode:'normal',style:''}]}]}}}})
  await payload.create({collection:'articles',data:{slug:'private-draft',title:'Private draft',description:'Must never appear publicly.',_status:'draft'}})
  const publicArticles=await payload.find({collection:'articles',overrideAccess:false})
  assert.equal(publicArticles.docs.length,1);assert.equal(publicArticles.docs[0].id,live.id)
  assert.ok((await payload.count({collection:'release-jobs'})).totalDocs>=1)
  results.push('anonymous content access excludes drafts; published content creates a durable release job')
  await assert.rejects(()=>payload.create({collection:'articles',user:editor,overrideAccess:false,data:{slug:'editor-cannot-publish',title:'Editor publication denied',description:'Permission fixture',_status:'published'}}))
  const due=await payload.create({collection:'articles',overrideAccess:true,data:{slug:'scheduled-ready',title:'Scheduled fixture',description:'Owner approved scheduled publication',_status:'draft',reviewApproved:true,scheduledAt:new Date(Date.now()-60000).toISOString(),reviewNotes:'PRIVATE_REVIEW_MARKER'}})
  await payload.create({collection:'articles',overrideAccess:true,data:{slug:'scheduled-not-reviewed',title:'Pending review',description:'Must remain draft',_status:'draft',reviewApproved:false,scheduledAt:new Date(Date.now()-60000).toISOString()}})
  const {publishScheduledArticles}=await import('../services/cms/src/lib/editorial-worker.ts')
  assert.equal(await publishScheduledArticles(payload),1)
  assert.equal(await publishScheduledArticles(payload),0)
  const publicDue=await payload.findByID({collection:'articles',id:due.id,overrideAccess:false})
  assert.equal(publicDue._status,'published');assert.equal(publicDue.reviewNotes,undefined)
  await payload.update({collection:'articles',id:due.id,overrideAccess:true,data:{_status:'draft'}})
  const withdrawn=await payload.find({collection:'articles',overrideAccess:false,where:{slug:{equals:'scheduled-ready'}}})
  assert.equal(withdrawn.totalDocs,0)
  results.push('editor cannot publish; only approved due drafts publish once; private notes and withdrawn articles are hidden')
  const {inquiryEndpoint}=await import('../services/cms/src/endpoints/inquiry.ts')
  const secret=process.env.INQUIRY_INGEST_SECRET!
  const call=(body:any,token=secret)=>inquiryEndpoint.handler({payload,headers:new Headers({'x-inquiry-ingest-token':token}),json:async()=>body} as any)
  assert.equal((await call({},'invalid')).status,401)
  let available=false
  const spool=path.join(root,'.local',`verification-spool-${databaseName}`)
  const queue=createIntakeQueue({directory:spool,deliver:async(record:any)=>{
    if(!available)throw new Error('Simulated backend outage')
    const response=await call({submissionKey:record.key,reference:record.reference,acceptedAt:record.acceptedAt,data:record.body})
    assert.equal(response.status,201)
    return (await response.json()).doc
  }})
  const input={submissionKey:randomUUID(),name:'Fixture buyer',email:'buyer@example.test',message:'Verify the inquiry pipeline.',type:'contact',locale:'en',formStartedAt:Date.now()-3000,status:'won'}
  const record=queue.accept(input)
  assert.equal(queue.response(record).receiptStatus,'queued')
  await queue.forward(record.key);assert.equal(queue.health().pending,1)
  available=true;await queue.forward(record.key)
  assert.equal(queue.health().pending,0)
  assert.equal((await payload.count({collection:'inquiries'})).totalDocs,1)
  const inquiry=(await payload.find({collection:'inquiries'})).docs[0]
  assert.equal(inquiry.status,'new');assert.equal(inquiry.reference,record.reference)
  assert.equal((await call({submissionKey:record.key,reference:record.reference,acceptedAt:record.acceptedAt,data:record.body})).status,201)
  assert.equal((await payload.count({collection:'inquiries'})).totalDocs,1)
  await assert.rejects(()=>payload.find({collection:'inquiries',user:editor,overrideAccess:false}))
  await assert.rejects(()=>payload.create({collection:'inquiries',overrideAccess:false,data:{}}))
  assert.ok(!fs.readFileSync(path.join(spool,`${record.key}.json`),'utf8').includes('buyer@example.test'))
  results.push('real PostgreSQL inquiry ingest survives outage, deduplicates retries, strips privileged fields and removes contact data from spool')
  results.push('anonymous CRM writes and editor inquiry reads are denied')
  await closePayload(payload);payload=null
  site.features.products=true
  const enabledConfig=(await import(`${configURL}?products-enabled`)).default
  payload=await getPayload({config:enabledConfig,key:'verify-products'})
  assert.ok(payload.config.collections.some((x:any)=>x.slug==='products'))
  const item=await payload.create({collection:'products',context:{skipPublication:true},data:{slug:'example-item',title:'Example item',description:'Generic, industry independent item.',_status:'published',attributes:[{name:'Material',value:'Example material'}]}})
  assert.equal((await payload.find({collection:'products',overrideAccess:false})).docs[0].id,item.id)
  results.push('enabling the optional product module exposes a generic publishable catalog on the same clean baseline')
  const output={verifiedAt:new Date().toISOString(),database:'PostgreSQL 16.14 (local isolated verification database)',checks:results,passed:results.length}
  fs.writeFileSync(path.join(root,'.local/integration-results.json'),JSON.stringify(output,null,2))
  console.log(JSON.stringify(output,null,2))
}finally{
  if(payload)await closePayload(payload)
  const client=database.pg.getPgClient()
  try{await client.connect();await client.query(`DROP DATABASE "${databaseName}"`)}finally{await client.end();await database.pg.stop()}
}
// All pools and the isolated PostgreSQL process are closed above. Explicitly
// finish this CLI before the Windows TS-loader worker's late native teardown.
process.exit(0)
