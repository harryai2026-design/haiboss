// Backward-compatible preparation entry: do not create publishable placeholders.
import {editorialContext} from './editorial-context'
const {payload}=await editorialContext()
try{
 const id=Number(process.argv[2]);if(!Number.isSafeInteger(id)||id<1)throw new Error('Provide a candidate ID')
 const candidate=await payload.findByID({collection:'content-candidates',id,overrideAccess:true})
 console.log(JSON.stringify({candidate:{id:candidate.id,title:candidate.title,sourceUrl:candidate.sourceUrl,summary:candidate.summary,sourcePublishedAt:candidate.sourcePublishedAt},nextStep:'Read the official source, write complete original Chinese blocks, then use scripts/save-editorial-drafts.ts. No placeholder article was created.',automaticPublication:false}))
}finally{await payload.destroy()}
process.exit(0)
