import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
export async function editorialContext(){
 process.env.DISABLE_WORKERS='1'
 const req=createRequire(path.join(root,'services/cms/package.json')),{getPayload}=await import(pathToFileURL(req.resolve('payload')).href)
 const config=(await import('../services/cms/src/payload.config.ts')).default,payload=await getPayload({config})
 const sources=JSON.parse(fs.readFileSync(path.join(root,'config/content-sources.json'),'utf8'))
 const policy=JSON.parse(fs.readFileSync(path.join(root,'config/editorial-policy.json'),'utf8'))
 return{root,payload,sources,policy}
}
