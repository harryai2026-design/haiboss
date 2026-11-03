import path from 'node:path'
import fs from 'node:fs'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1'
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
const payload=await getPayload({config})
try{
 const result=await payload.find({collection:'inquiries',where:{reference:{equals:'IQ-PWQE-C5Y9-R205'}},overrideAccess:true})
 if(result.totalDocs!==1)throw new Error('Expected exactly one persisted browser test receipt')
 const record=result.docs[0];if(record.email!=='qa-haiboss@example.test')throw new Error('Test receipt does not match browser input')
 const articles=await payload.find({collection:'articles',overrideAccess:false,limit:100})
 if(articles.totalDocs!==8||articles.docs.some(x=>x.slug.startsWith('source-review-')))throw new Error('Draft leaked into public content')
 const report={at:new Date().toISOString(),browserReceipt:record.reference,persistedCount:result.totalDocs,privateNotesPublic:false,publishedArticles:articles.totalDocs,notification:record.notification?.state,mailDeliveryVerified:false,paidRequests:0}
 fs.mkdirSync(path.join(root,'.local/evidence'),{recursive:true});fs.writeFileSync(path.join(root,'.local/evidence/receipt-and-content.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await payload.destroy()}
process.exit(0)
