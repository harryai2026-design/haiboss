import fs from 'node:fs'
import type {Payload} from 'payload'
let started=false
export function startInquiryNotifications(payload:Payload){
 if(started||process.env.DISABLE_WORKERS==='1')return
 started=true;let busy=false
 const timer=setInterval(async()=>{
  if(busy||!process.env.NOTIFICATION_API_KEY_FILE||!process.env.NOTIFICATION_FROM||!process.env.NOTIFICATION_TO)return
  busy=true
  try{
   const key=fs.readFileSync(process.env.NOTIFICATION_API_KEY_FILE,'utf8').trim()
   const {docs}=await payload.find({collection:'inquiries',limit:3,depth:0,overrideAccess:true,where:{and:[{'notification.state':{equals:'pending'}},{or:[{'notification.nextAttemptAt':{exists:false}},{'notification.nextAttemptAt':{less_than_equal:new Date().toISOString()}}]}]}})
   for(const doc of docs){
    const attempts=(doc.notification?.attempts||0)+1
    try{
     const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{authorization:'Bearer '+key,'content-type':'application/json','idempotency-key':'haiboss-inquiry-'+doc.reference},body:JSON.stringify({from:process.env.NOTIFICATION_FROM,to:[process.env.NOTIFICATION_TO],subject:'海老板新咨询 '+doc.reference,text:['接收编号：'+doc.reference,'收到一条新咨询，请登录海老板后台查看。','后台地址：'+process.env.CMS_URL].join('\n')})})
     if(!response.ok)throw new Error('Mail provider HTTP '+response.status)
     const body=await response.json();if(!body.id)throw new Error('Mail provider receipt missing')
     await payload.update({collection:'inquiries',id:doc.id,overrideAccess:true,data:{notification:{state:'sent',attempts,sentAt:new Date().toISOString(),lastError:'',nextAttemptAt:null}}})
    }catch(error){await payload.update({collection:'inquiries',id:doc.id,overrideAccess:true,data:{notification:{state:attempts>=3?'failed':'pending',attempts,nextAttemptAt:new Date(Date.now()+attempts*300000).toISOString(),lastError:error instanceof Error?error.message:'Notification unavailable'}}})}
   }
  }catch{payload.logger.warn('Inquiry notification queue unavailable; records retained')}
  finally{busy=false}
 },60000);timer.unref()
}
