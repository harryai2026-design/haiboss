// Used only for local UI acceptance. It never creates an administrator account.
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1';process.env.PAYLOAD_PUSH='0'
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const payload=await getPayload({config:(await import('../services/cms/src/payload.config.ts')).default,key:'local-ui-fixture'})
try{
  if(process.argv[2]==='create'){
    await payload.create({collection:'articles',data:{slug:'template-verification',title:'Template verification',description:'Temporary local acceptance article. Removed after verification.',_status:'published',content:{root:{type:'root',version:1,direction:null,format:'',indent:0,children:[{type:'paragraph',version:1,direction:null,format:'',indent:0,children:[{type:'text',version:1,text:'This temporary article verifies CMS publication into the Astro website.',format:0,detail:0,mode:'normal',style:''}]}]}}}})
    console.log('Local acceptance article created; no user account created')
  }else if(process.argv[2]==='cleanup'){
    const articles=await payload.find({collection:'articles',where:{slug:{equals:'template-verification'}},limit:10})
    fs.writeFileSync(path.join(root,'.local/acceptance-article-ids.json'),JSON.stringify(articles.docs.map(x=>x.id)))
    for(const doc of articles.docs)await payload.delete({collection:'articles',id:doc.id})
    const inquiries=await payload.find({collection:'inquiries',where:{and:[{email:{equals:'template-qa@example.test'}},{name:{equals:'Template QA'}}]},limit:10})
    for(const doc of inquiries.docs)await payload.delete({collection:'inquiries',id:doc.id})
    // Remove only synchronized QA tombstones, never pending records.
    const spool=path.join(root,'.local/inquiries')
    const references=new Set(inquiries.docs.map(x=>x.reference))
    if(fs.existsSync(spool))for(const name of fs.readdirSync(spool)){
      if(!name.endsWith('.json'))continue
      const p=path.join(spool,name),record=JSON.parse(fs.readFileSync(p,'utf8'))
      if(record.status==='synced'&&references.has(record.reference))fs.unlinkSync(p)
    }
    console.log(JSON.stringify({removedAcceptanceArticles:articles.docs.length,removedAcceptanceInquiries:inquiries.docs.length,remainingUsers:(await payload.count({collection:'users'})).totalDocs,remainingArticles:(await payload.count({collection:'articles'})).totalDocs,remainingInquiries:(await payload.count({collection:'inquiries'})).totalDocs}))
  }else if(process.argv[2]==='finalize'){
    const ids=JSON.parse(fs.readFileSync(path.join(root,'.local/acceptance-article-ids.json'),'utf8'))
    const reasons=ids.flatMap(id=>[`articles:${id}`,`articles:deleted:${id}`])
    const jobs=await payload.find({collection:'release-jobs',where:{and:[{reason:{in:reasons}},{state:{in:['published','failed']}}]},limit:50})
    for(const job of jobs.docs)await payload.delete({collection:'release-jobs',id:job.id})
    console.log(JSON.stringify({removedAcceptanceJobs:jobs.docs.length,users:(await payload.count({collection:'users'})).totalDocs,articles:(await payload.count({collection:'articles'})).totalDocs,inquiries:(await payload.count({collection:'inquiries'})).totalDocs}))
  }else if(process.argv[2]==='retry'){
    const jobs=await payload.find({collection:'release-jobs',where:{state:{equals:'failed'}},limit:10})
    for(const job of jobs.docs)await payload.update({collection:'release-jobs',id:job.id,data:{state:'pending'}})
    console.log(`Queued ${jobs.docs.length} failed local publication jobs for explicit retry`)
  }else if(process.argv[2]==='inspect'){
    const inquiries=await payload.find({collection:'inquiries',where:{email:{equals:'template-qa@example.test'}},limit:10})
    console.log(JSON.stringify({qaInquiries:inquiries.docs.length,references:inquiries.docs.map(x=>x.reference),users:(await payload.count({collection:'users'})).totalDocs}))
  }else throw new Error('Use create, inspect, retry or cleanup')
}finally{
  const pool=payload.db.pool;await payload.destroy()
  for(const client of pool?._clients||[])if(!pool._idle.some(x=>x.client===client))try{client.release()}catch{}
  if(pool&&!pool.ending)await pool.end()
}
