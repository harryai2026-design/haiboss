import path from 'node:path'
import fs from 'node:fs'
import {randomBytes} from 'node:crypto'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1'
if(!process.env.OWNER_BOOTSTRAP_FILE||!process.env.OWNER_EMAIL)throw new Error('Set an owner email and a private credential file outside the repository')
const target=path.resolve(process.env.OWNER_BOOTSTRAP_FILE)
if(target===root||target.startsWith(root+path.sep))throw new Error('Owner credential file must be outside the source repository')
const req=createRequire(path.join(root,'services/cms/package.json'))
const {getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
const payload=await getPayload({config})
try{
 if((await payload.count({collection:'users'})).totalDocs){console.log('Existing CMS users preserved; bootstrap skipped.');process.exit(0)}
 fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700})
 if(fs.existsSync(target))throw new Error('Existing credential file preserved; review it before retrying')
 const password=randomBytes(24).toString('base64url')
 fs.writeFileSync(target,JSON.stringify({email:process.env.OWNER_EMAIL,password,createdAt:new Date().toISOString()},null,2),{flag:'wx',mode:0o600})
 await payload.create({collection:'users',overrideAccess:true,data:{email:process.env.OWNER_EMAIL,password,name:'海老板站点所有者',role:'owner'}})
 console.log(JSON.stringify({ownerCreated:true,credentialFile:target,secretsDisplayed:false}))
}finally{await payload.destroy()}
process.exit(0)
