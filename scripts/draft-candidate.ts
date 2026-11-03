import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1'
const candidateId=Number(process.argv[2]);if(!Number.isSafeInteger(candidateId)||candidateId<1)throw new Error('Provide the candidate ID from the CMS')
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
const payload=await getPayload({config})
try{
 const candidate=await payload.findByID({collection:'content-candidates',id:candidateId,overrideAccess:true})
 const slug='source-review-'+candidate.id
 const prior=await payload.find({collection:'articles',where:{slug:{equals:slug}},limit:1,overrideAccess:true,draft:true})
 if(prior.docs.length){console.log(JSON.stringify({articleId:prior.docs[0].id,state:'draft-already-exists'}));process.exit(0)}
 const text='编辑待办：打开原始来源核对事件日期，确认与出海经营的关系，再撰写事实摘要、影响、适用条件和行动建议。此稿未经核验，不可直接发布。'
 const doc=await payload.create({collection:'articles',overrideAccess:true,draft:true,context:{skipPublication:true},data:{slug,title:candidate.title,description:'待核验选题：'+candidate.title,section:'ai',contentType:'news',_status:'draft',reviewApproved:false,sources:[{title:'原始来源（待核验）',url:candidate.sourceUrl}],reviewNotes:text,content:{root:{type:'root',version:1,direction:null,format:'',indent:0,children:[{type:'paragraph',version:1,direction:null,format:'',indent:0,children:[{type:'text',version:1,text,format:0,detail:0,mode:'normal',style:''}]}]}}}})
 await payload.update({collection:'content-candidates',id:candidateId,overrideAccess:true,data:{state:'reviewing',reviewNote:text+' 草稿编号：'+doc.id}})
 console.log(JSON.stringify({articleId:doc.id,state:'draft',paidRequests:0,automaticPublication:false}))
}finally{await payload.destroy()}
process.exit(0)
