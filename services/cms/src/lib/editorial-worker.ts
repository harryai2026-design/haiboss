import type {Payload} from 'payload'
let running=false
export async function publishScheduledArticles(payload:Payload,now=new Date()){
  const {docs}=await payload.find({collection:'articles',draft:true,overrideAccess:true,limit:20,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{equals:true}},{scheduledAt:{less_than_equal:now.toISOString()}}]}})
  for(const doc of docs)await payload.update({collection:'articles',id:doc.id,overrideAccess:true,draft:false,data:{_status:'published',scheduledAt:null,reviewApproved:false,publishedAt:doc.publishedAt||now.toISOString()}})
  return docs.length
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
