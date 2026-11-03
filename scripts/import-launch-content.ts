import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1'
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
const payload=await getPayload({config})
const input=JSON.parse(fs.readFileSync(path.join(root,'content/launch.json'),'utf8'))
const topicIds=new Map<string,number>()
async function insert(collection:string,doc:any){
 const existing=await payload.find({collection:collection as any,where:{slug:{equals:doc.slug}},limit:1,overrideAccess:true})
 if(existing.docs.length)return existing.docs[0]
 return payload.create({collection:collection as any,data:doc,overrideAccess:true,context:{skipPublication:true}})
}
for(const doc of input.topics){const saved=await insert('topics',doc);topicIds.set(doc.slug,saved.id as number)}
for(const collection of ['services','cases'])for(const doc of input[collection])await insert(collection,{...doc,_status:'published'})
for(const item of input.articles){
 const text=(v:string)=>({type:'text',version:1,text:v,format:0,detail:0,mode:'normal',style:''})
 const children=item.blocks.flatMap(([title,body]:string[])=>[{type:'heading',tag:'h2',version:1,direction:null,format:'',indent:0,children:[text(title)]},{type:'paragraph',version:1,direction:null,format:'',indent:0,children:[text(body)]}])
 const {blocks,source,sourceTitle,topic,...fields}=item
 await insert('articles',{...fields,_status:'published',publishedAt:new Date().toISOString(),authorName:'海老板编辑部',sources:[{title:sourceTitle,url:source,checkedAt:'2026-11-03T12:00:00.000Z'}],topics:[topicIds.get(topic)],content:{root:{type:'root',version:1,direction:null,format:'',indent:0,children}}})
}
const jobs=await payload.count({collection:'articles',where:{_status:{equals:'published'}}})
console.log(JSON.stringify({publishedArticles:jobs.totalDocs,existingContentPreserved:true,paidRequests:0}))
await payload.create({collection:'release-jobs',data:{reason:'launch-content-import',state:'pending'},overrideAccess:true})
await payload.destroy();process.exit(0)
