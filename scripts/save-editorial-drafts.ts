// This authoring command can only create new, unapproved drafts. It never
// publishes, schedules or overwrites an existing article, including human edits.
import fs from 'node:fs'
import path from 'node:path'
import {editorialContext} from './editorial-context'
import {sourceURL,editorialSlug,eligibility} from '../services/editorial/policy.mjs'
import {EDITORIAL_MARKER,editorialIssues} from '../services/editorial/review.mjs'
const {root,payload,sources,policy}=await editorialContext()
try{
 const file=path.resolve(process.argv[2]||'')
 if(!file.startsWith(path.join(root,'.local/editorial')+path.sep)||fs.statSync(file).size>200000)throw new Error('Use a bounded JSON file under this project .local/editorial directory')
 const items=JSON.parse(fs.readFileSync(file,'utf8'))
 if(!Array.isArray(items)||items.length>policy.drafting.maxDraftsPerRun)throw new Error('Draft batch exceeds policy')
 const pending=await payload.count({collection:'articles',draft:true,overrideAccess:true,where:{and:[{_status:{equals:'draft'}},{reviewApproved:{not_equals:true}}]}})
 if(pending.totalDocs+items.length>policy.drafting.maxAwaitingOwnerReview)throw new Error('Owner review backlog limit reached')
 const report=[]
 for(const item of items){
  if(['_status','reviewApproved','scheduledAt','publishedAt'].some(k=>k in item))throw new Error('Publication and approval fields are not authoring input')
  const candidate=await payload.findByID({collection:'content-candidates',id:Number(item.candidateId),overrideAccess:true})
  const source=sources.find(s=>{try{sourceURL(candidate.sourceUrl,s);return s.enabled}catch{return false}})
  if(!source||!eligibility(candidate,source,new Date(),policy.collection.maxSourceAgeDays).eligible)throw new Error('Candidate needs manual topic/date review')
  const slug=editorialSlug(candidate.sourceUrl,source),existing=await payload.find({collection:'articles',overrideAccess:true,draft:true,where:{slug:{equals:slug}},limit:1})
  if(existing.docs.length){report.push({articleId:existing.docs[0].id,state:'existing-preserved'});continue}
  if(candidate.state!=='pending')throw new Error('Candidate is already being handled; preserve its existing draft')
  if(!Array.isArray(item.blocks)||item.blocks.length<3||item.blocks.length>8||!item.blocks.every(b=>Array.isArray(b)&&b.length===2&&b.every(x=>typeof x==='string')))throw new Error('Expected complete original heading/paragraph blocks')
  const text=(value:string)=>({type:'text',version:1,text:value,format:0,detail:0,mode:'normal',style:''})
  const data:any={slug,title:String(item.title||'').slice(0,180),description:String(item.description||'').slice(0,350),section:source.section,contentType:'news',authorName:'海老板编辑部',_status:'draft',reviewApproved:false,scheduledAt:null,sources:[{title:source.title+' · '+candidate.title,url:sourceURL(candidate.sourceUrl,source),checkedAt:item.checkedAt}],eventDate:candidate.sourcePublishedAt,reviewNotes:EDITORIAL_MARKER+'\n整理状态：ready\n审核状态：等待独立审核\n候选编号：'+candidate.id+'\n已核对原始来源；以下仅为编辑整理，尚未完成独立审核批准发布。\n'+String(item.reviewNotes||'').slice(0,2500),content:{root:{type:'root',version:1,direction:null,format:'',indent:0,children:item.blocks.flatMap(([title,body])=>[{type:'heading',tag:'h2',version:1,direction:null,format:'',indent:0,children:[text(title)]},{type:'paragraph',version:1,direction:null,format:'',indent:0,children:[text(body)]}])}}}
  const issues=editorialIssues(data);if(issues.length)throw new Error(issues.join('；'))
  const saved=await payload.create({collection:'articles',overrideAccess:true,draft:true,context:{skipPublication:true},data})
  await payload.update({collection:'content-candidates',id:candidate.id,overrideAccess:true,data:{state:'reviewing',reviewNote:'中文稿已整理，等待独立审核审核。文章编号：'+saved.id+'；审核入口：https://cms.haiboss.com/admin/collections/articles/'+saved.id+'。整理状态ready不等于批准发布。'}})
  report.push({candidateId:candidate.id,articleId:saved.id,title:saved.title,state:'draft-awaiting-owner',reviewUrl:'https://cms.haiboss.com/admin/collections/articles/'+saved.id})
 }
 console.log(JSON.stringify({drafts:report,automaticPublication:false,approvalGranted:false,paidModelCalls:0}))
}finally{await payload.destroy()}
process.exit(0)
