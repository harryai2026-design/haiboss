// User delegated editorial approval on 2026-11-11. This second phase requires
// an independent review record matching the stored draft fingerprint.
import fs from 'node:fs'
import path from 'node:path'
import {editorialContext} from './editorial-context'
import {editorialIssues,EDITORIAL_MARKER,reviewFingerprint,plainContent} from '../services/editorial/review.mjs'
const {root,payload,policy}=await editorialContext(),directory=path.join(root,'.local/editorial'),lock=path.join(directory,'review.lock');let locked=false
try{
 if(process.argv[2]==='snapshot'){
  const {docs}=await payload.find({collection:'articles',draft:true,overrideAccess:true,limit:12,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{not_equals:true}}]}})
  console.log(JSON.stringify({drafts:docs.filter(d=>d.reviewNotes?.includes(EDITORIAL_MARKER)).map(d=>({id:d.id,slug:d.slug,section:d.section,title:d.title,description:d.description,body:plainContent(d.content?.root),sources:d.sources,eventDate:d.eventDate,fingerprint:reviewFingerprint(d)}))}))
 }else{
  if(policy.review?.mode!=='delegated-agent')throw new Error('Agent review has not been delegated')
  const file=path.resolve(process.argv[2]||'');if(!file.startsWith(directory+path.sep)||fs.statSync(file).size>100000)throw new Error('Review JSON must be under project editorial directory')
  const reviews=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(reviews)||reviews.length>policy.drafting.maxDraftsPerRun)throw new Error('Review batch exceeds policy')
  if(fs.existsSync(lock)){const prior=JSON.parse(fs.readFileSync(lock,'utf8'));let alive=true;try{process.kill(prior.pid,0)}catch{alive=false}if(alive)throw new Error('Another review is running');fs.unlinkSync(lock)}
  fs.writeFileSync(lock,JSON.stringify({pid:process.pid,at:new Date().toISOString()}),{flag:'wx',mode:0o600});locked=true
  const day=new Date(Date.now()+8*3600000).toISOString().slice(0,10),since=new Date(day+'T00:00:00+08:00').toISOString()
  const {totalDocs}=await payload.count({collection:'articles',overrideAccess:true,where:{and:[{_status:{equals:'published'}},{publishedAt:{greater_than_equal:since}}]}})
  const approved=await payload.count({collection:'articles',overrideAccess:true,draft:true,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{equals:true}}]}})
  let slots=Math.max(0,policy.publication.maxPerDay-totalDocs-approved.totalDocs);const result=[]
  for(const review of reviews){
   const doc=await payload.findByID({collection:'articles',id:Number(review.articleId),draft:true,overrideAccess:true})
   if(doc._status==='published'||doc.reviewApproved){result.push({id:doc.id,state:'already-published-or-approved'});continue}
   if(!doc.reviewNotes?.includes(EDITORIAL_MARKER)||reviewFingerprint(doc)!==review.fingerprint)throw new Error('Draft changed since review; take a fresh snapshot')
   if(!['approve','hold'].includes(review.decision)||typeof review.notes!=='string'||review.notes.length<80)throw new Error('A substantive review decision is required')
   if(!Number.isFinite(Date.parse(review.reviewedAt))||Math.abs(Date.now()-Date.parse(review.reviewedAt))>86400000)throw new Error('Review must be current')
   const checks=policy.review.requiredChecks.every(k=>review.checks?.[k]===true),issues=editorialIssues(doc)
   const permitted=review.decision==='approve'&&checks&&!issues.length&&slots>0
   const state=permitted?'approved':review.decision==='hold'?'held':slots===0?'held-daily-budget':'held-quality-check'
   const record={application:'pending',articleId:doc.id,fingerprint:review.fingerprint,reviewedAt:review.reviewedAt,reviewer:'Codex / owner-delegated editorial review',checks:review.checks,decision:state,notes:review.notes,issues,sourceUrls:doc.sources?.map(s=>s.url),authorizedByUserOn:policy.review.authorizedByUserOn}
   const recordDir=path.join(directory,'reviews');fs.mkdirSync(recordDir,{recursive:true,mode:0o700});const recordPath=path.join(recordDir,doc.id+'-'+Date.now()+'.json');fs.writeFileSync(recordPath,JSON.stringify(record,null,2),{mode:0o600})
   const saved=await payload.update({collection:'articles',overrideAccess:true,draft:true,context:{skipPublication:true},where:{and:[{id:{equals:doc.id}},{updatedAt:{equals:doc.updatedAt}}]},data:{reviewApproved:permitted,reviewNotes:(doc.reviewNotes||'')+'\n[独立审核 '+state+' '+review.reviewedAt+'] '+review.notes}})
   if(saved.docs.length!==1)throw new Error('Concurrent edit detected; review must be repeated')
   record.application='applied';fs.writeFileSync(recordPath,JSON.stringify(record,null,2),{mode:0o600})
   if(permitted)slots--;result.push({id:doc.id,state,approvalGranted:permitted,sourceReviewed:true})
  }
  console.log(JSON.stringify({reviews:result,remainingDailySlots:slots,publicationThroughExistingWorker:true}))
 }
}finally{if(locked)fs.unlinkSync(lock);await payload.destroy()}
process.exit(0)
