import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import {root} from '@site/config'
import {collectionDecision} from '../services/editorial/schedule.mjs'
const directory=path.join(root,'.local/editorial'),stateFile=path.join(directory,'scheduler.json')
fs.mkdirSync(directory,{recursive:true})
const policy=JSON.parse(fs.readFileSync(path.join(root,'config/editorial-policy.json'),'utf8'))
let busy=false,activeChild
function read(){try{return JSON.parse(fs.readFileSync(stateFile,'utf8'))}catch{return{}}}
function write(state){const temp=stateFile+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify(state),{mode:0o600});fs.renameSync(temp,stateFile)}
async function tick(){
 if(busy)return;const decision=collectionDecision(read(),policy)
 if(!decision.run)return
 busy=true;write({...read(),attemptDay:decision.day,attempts:decision.attempts,startedAt:new Date().toISOString(),state:'running'})
 const logfile=path.join(directory,'collection.log')
 if(fs.existsSync(logfile)&&fs.statSync(logfile).size>2_000_000)fs.renameSync(logfile,logfile+'.'+Date.now())
 const log=fs.openSync(logfile,'a',0o600)
 const child=spawn(process.execPath,['--env-file-if-exists=.env','--import','tsx',path.join(root,'scripts/collect-content.ts')],{cwd:root,stdio:['ignore',log,log],windowsHide:true,env:process.env})
 activeChild=child;let finished=false
 const timeout=setTimeout(()=>child.kill('SIGTERM'),policy.collection.maxRunMinutes*60000)
 const finish=code=>{if(finished)return;finished=true;clearTimeout(timeout);fs.closeSync(log);write({...read(),state:code===0?'completed':'failed',...(code===0?{successDay:decision.day}:{}),finishedAt:new Date().toISOString(),lastExitCode:code});busy=false;activeChild=null;if(code)console.error('Editorial collection failed; bounded retries and persisted status are available.')}
 child.once('error',()=>finish(1));child.once('exit',code=>finish(code??1))
}
const timer=setInterval(()=>void tick(),60000);void tick()
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{clearInterval(timer);activeChild?.kill('SIGTERM');process.exit(0)})
