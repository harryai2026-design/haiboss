import fs from 'node:fs'
import path from 'node:path'
import {editorialContext} from './editorial-context'
import {eligibility,sourceURL,cleanText} from '../services/editorial/policy.mjs'
const {root,payload,sources,policy}=await editorialContext()
try{
 const [pending,awaiting,approved,published]=await Promise.all([
  payload.find({collection:'content-candidates',overrideAccess:true,limit:150,sort:'-sourcePublishedAt',where:{state:{equals:'pending'}}}),
  payload.find({collection:'articles',draft:true,overrideAccess:true,limit:30,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{not_equals:true}}]}}),
  payload.count({collection:'articles',draft:true,overrideAccess:true,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{equals:true}}]}}),
  payload.count({collection:'articles',overrideAccess:true,where:{_status:{equals:'published'}}}),
 ])
 const candidates=pending.docs.flatMap(doc=>{const source=sources.find(s=>{try{sourceURL(doc.sourceUrl,s);return s.enabled}catch{return false}});if(!source)return[];const decision=eligibility(doc,source,new Date(),policy.collection.maxSourceAgeDays);return decision.eligible?[{id:doc.id,title:doc.title,sourceUrl:doc.sourceUrl,summary:doc.summary,sourcePublishedAt:doc.sourcePublishedAt,section:source.section,sourceId:source.id,sourceName:source.title,score:decision.score}]:[]}).sort((a,b)=>b.score-a.score)
 const read=(name:string)=>{try{return JSON.parse(fs.readFileSync(path.join(root,'.local/editorial',name),'utf8'))}catch{return null}}
 console.log(JSON.stringify({at:new Date().toISOString(),collectionSchedule:policy.collection,lastCollection:read('last-collection.json'),scheduler:read('scheduler.json'),publishedArticles:published.totalDocs,awaitingReview:awaiting.totalDocs,approvedDrafts:approved.totalDocs,draftingCapacity:Math.max(0,policy.drafting.maxAwaitingOwnerReview-awaiting.totalDocs),awaiting:awaiting.docs.map(x=>({id:x.id,title:x.title,section:x.section,reviewUrl:'https://cms.haiboss.com/admin/collections/articles/'+x.id})),candidates:candidates.slice(0,12).map(x=>({...x,summary:cleanText(x.summary)})),sourceCandidates:pending.totalDocs,ownerApprovalRequired:policy.drafting.ownerApprovalRequired,reviewMode:policy.review?.mode,externalPaidModelCalls:0}))
}finally{await payload.destroy()}
process.exit(0)
