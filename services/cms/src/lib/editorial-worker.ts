import type {Payload} from 'payload'
import {editorialIssues} from '../../../editorial/review.mjs'
let running=false
export async function publishScheduledArticles(payload:Payload,now=new Date()){
  const {docs}=await payload.find({collection:'articles',draft:true,overrideAccess:true,limit:20,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{equals:true}},{or:[{scheduledAt:{exists:false}},{scheduledAt:{less_than_equal:now.toISOString()}}]}]}})
  let published=0
  for(const doc of docs){
    try{
      const issues=editorialIssues(doc,now)
      if(issues.length){await payload.update({collection:'articles',id:doc.id,overrideAccess:true,draft:true,context:{skipPublication:true},data:{reviewApproved:false,reviewNotes:(doc.reviewNotes||'')+'\n发布检查未通过：'+issues.join('；')}});continue}
      await payload.update({collection:'articles',id:doc.id,overrideAccess:true,draft:false,data:{_status:'published',scheduledAt:null,reviewApproved:false,publishedAt:doc.publishedAt||now.toISOString()}})
      published++
    }catch{payload.logger.warn('One approved editorial article could not publish; other approved drafts continue.')}
  }
  return published
}
export function startEditorialWorker(payload:Payload){
  if(running||process.env.DISABLE_WORKERS==='1')return
  running=true;let busy=false
  const timer=setInterval(async()=>{
    if(busy)return;busy=true
    try{
      await publishScheduledArticles(payload)
    }catch{payload.logger.warn('Scheduled publication unavailable; pending articles retained')}
    finally{busy=false}
  },30000);timer.unref()
}
