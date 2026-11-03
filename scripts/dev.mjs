import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import { spawn } from 'node:child_process'
import { root,site } from '@site/config'
import { localDatabase } from './local-db.mjs'
import { launch } from './run.mjs'
const children=[]
let database,stopping=false
const logDir=path.join(root,'.local/logs')
fs.mkdirSync(logDir,{recursive:true})
fs.writeFileSync(path.join(root,'.local/dev-state.json'),JSON.stringify({pid:process.pid,status:'starting',startedAt:new Date().toISOString(),children:[]},null,2))
function checkStop(){try{if(JSON.parse(fs.readFileSync(path.join(root,'.local/stop-request.json'),'utf8')).pid===process.pid)throw new Error('Local startup cancelled')}catch(error){if(error.message==='Local startup cancelled')throw error}}
async function freePort(port) {
  await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(new Error(`Local port ${port} is in use; change the project .env ports before starting`)));server.listen(port,'127.0.0.1',()=>server.close(resolve))})
}
function watch(child,name){children.push(child);child.once('exit',code=>{if(!stopping){
  const request=path.join(root,'.local/stop-request.json')
  let requested=false;try{requested=JSON.parse(fs.readFileSync(request,'utf8')).pid===process.pid}catch{}
  if(!requested)console.error(`${name} exited (${code}); shutting down local stack`)
  void stop(requested?0:code || 1)
}});return child}
function stream(name){return fs.openSync(path.join(logDir,`${name}.log`),'a',0o600)}
async function ready(url,timeout=180000){const end=Date.now()+timeout;while(Date.now()<end){try{const res=await fetch(url,{signal:AbortSignal.timeout(2000)});if(res.ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error(`Local service did not become ready: ${new URL(url).origin}`)}
async function stop(code=0){
  if(stopping)return;stopping=true
  for(const child of children){
    if(child.exitCode!==null || child.signalCode!==null)continue
    if(process.platform==='win32' && child.pid)await new Promise(resolve=>{const kill=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});kill.once('exit',resolve);kill.once('error',resolve)})
    else child.kill('SIGTERM')
  }
  await new Promise(r=>setTimeout(r,1200))
  if(database)await database.pg.stop().catch(()=>{})
  const stateFile=path.join(root,'.local/dev-state.json')
  if(fs.existsSync(stateFile)){const state=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(state.pid===process.pid)fs.writeFileSync(stateFile,JSON.stringify({...state,status:'stopped',stoppedAt:new Date().toISOString()},null,2))}
  process.exit(code)
}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop())
try{
  for(const port of [process.env.SITE_PORT||44321,process.env.CMS_PORT||44301,...(site.features.inquiries?[process.env.INTAKE_PORT||44302]:[]),process.env.REBUILD_PORT||44303,process.env.PG_PORT||44332])await freePort(Number(port))
  database=await localDatabase()
  checkStop()
  process.env.DATABASE_URI=database.uri
  process.env.PAYLOAD_PUSH='0'
  const migrate=launch('cms:migrate',{}, {stdio:['ignore',stream('migrate'),stream('migrate')]})
  await new Promise((resolve,reject)=>{migrate.once('exit',c=>c===0?resolve():reject(new Error('Database migration failed. See .local/logs/migrate.log')));migrate.once('error',reject)})
  checkStop()
  await new Promise((resolve,reject)=>{const map=launch('cms:importmap',{}, {stdio:['ignore',stream('importmap'),stream('importmap')]});map.once('exit',c=>c===0?resolve():reject(new Error('Import map generation failed')));map.once('error',reject)})
  watch(launch('cms:dev',{}, {stdio:['ignore',stream('cms'),stream('cms')]}),'CMS')
  await ready(`${process.env.CMS_URL}/api/health`)
  checkStop()
  if(site.features.inquiries)watch(spawn(process.execPath,[path.join(root,'services/inquiry-intake/server.mjs')],{cwd:root,env:{...process.env},stdio:['ignore',stream('intake'),stream('intake')]}),'Inquiry intake')
  watch(spawn(process.execPath,[path.join(root,'services/rebuild/server.mjs')],{cwd:root,env:{...process.env},stdio:['ignore',stream('rebuild'),stream('rebuild')]}),'Rebuild')
  const build=spawn(process.execPath,[path.join(root,'scripts/run.mjs'),'site:release'],{cwd:root,env:{...process.env},stdio:['ignore',stream('initial-build'),stream('initial-build')]})
  children.push(build)
  await new Promise((resolve,reject)=>{build.once('exit',c=>c===0?resolve():reject(new Error('Initial static build failed; see .local/logs/initial-build.log')));build.once('error',reject)})
  watch(spawn(process.execPath,[path.join(root,'scripts/site-server.mjs')],{cwd:root,env:{...process.env},stdio:'inherit'}),'Site')
  fs.writeFileSync(path.join(root,'.local/dev-state.json'),JSON.stringify({pid:process.pid,status:'running',startedAt:new Date().toISOString(),site:process.env.SITE_URL,cms:`${process.env.CMS_URL}/admin`,children:children.map(c=>c.pid)},null,2))
  console.log(`\nLocal site: ${process.env.SITE_URL}\nCMS: ${process.env.CMS_URL}/admin\nCreate your first owner account in the CMS. No default password is supplied.\nCtrl+C stops this project; data is retained.\n`)
}catch(error){console.error(error.message);await stop(1)}
