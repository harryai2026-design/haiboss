import http from 'node:http'
import path from 'node:path'
import { timingSafeEqual } from 'node:crypto'
import { createRequire } from 'node:module'
import {spawn} from 'node:child_process'
import { root } from '@site/config'
const require=createRequire(import.meta.url),{createBuildQueue}=require('./queue.cjs')
const secret=process.env.REBUILD_SECRET || ''
if(secret.length<32)throw new Error('REBUILD_SECRET must be configured')
const queue=createBuildQueue({stateFile:path.join(root,'.local/rebuild-state.json'),cwd:root,
  command:'site:release',debounceMs:1500,
  // Execute argv directly: Windows Node paths commonly contain spaces.
  spawnBuild:(_shell,_args,options)=>spawn(process.execPath,['--env-file-if-exists=.env',path.join(root,'scripts/run.mjs'),'site:release'],options)})
const server=http.createServer(async(req,res)=>{
  const json=(status,body)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body))}
  if(req.method==='GET'&&req.url==='/health')return json(200,{ok:true,...queue.health()})
  const given=String(req.headers['x-rebuild-token']||'')
  if(Buffer.byteLength(secret)!==Buffer.byteLength(given)||!timingSafeEqual(Buffer.from(secret),Buffer.from(given)))return json(403,{error:'Forbidden'})
  if(req.method!=='POST'||req.url!=='/rebuild')return json(404,{error:'Not found'})
  try{let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)return json(413,{error:'Too large'})}
    const {requestId,retry}=JSON.parse(body)
    if(!/^job-[0-9]+$/.test(requestId))return json(400,{error:'Invalid request id'})
    const existing=queue.get(requestId)
    // An explicit user retry changes failed jobs back to pending in the CMS.
    if(existing?.status==='failed'){return json(200,retry === true ? queue.retry(requestId) : existing)}
    return json(202,queue.accept(requestId))
  }catch{return json(400,{error:'Invalid request'})}
})
server.listen(Number(process.env.REBUILD_PORT||44303),process.env.BIND_HOST||'127.0.0.1')
process.on('SIGTERM',()=>{queue.close();server.close(()=>process.exit(0))})
