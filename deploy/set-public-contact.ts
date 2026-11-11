// Public contact identity only. No credentials, mailbox settings or other globals.
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
try{
 const current=await payload.findGlobal({slug:'site-profile',depth:0,overrideAccess:true})
 if(current.email&&current.email!=='sales@haiboss.com')throw new Error('Existing public contact differs; preserve it and review before changing')
 const backup=process.env.CONTACT_BACKUP_FILE
 if(!backup||!path.resolve(backup).startsWith('/home/codexops/backups/haiboss-ui-'))throw new Error('Expected protected release backup directory')
 if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify({email:current.email||'',heading:current.heading||'',intro:current.intro||''},null,2),{mode:0o600})
 const saved=await payload.updateGlobal({slug:'site-profile',data:{email:'sales@haiboss.com'},overrideAccess:true,context:{skipPublication:true}})
 if(saved.email!=='sales@haiboss.com')throw new Error('Public contact was not saved')
 console.log(JSON.stringify({publicContact:saved.email,preservedOtherFields:true,websiteSmtpConfigured:false}))
}finally{await payload.destroy()}
process.exit(0)
