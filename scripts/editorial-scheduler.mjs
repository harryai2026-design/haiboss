import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import {root} from '@site/config'
const directory=path.join(root,'.local/editorial'),stateFile=path.join(directory,'scheduler.json')
fs.mkdirSync(directory,{recursive:true})
let busy=false
function shanghai(){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return{day:parts.year+'-'+parts.month+'-'+parts.day,hour:Number(parts.hour),minute:Number(parts.minute),weekday:parts.weekday}}
function read(){try{return JSON.parse(fs.readFileSync(stateFile,'utf8'))}catch{return{}}}
async function tick(){
 if(busy)return;const now=shanghai(),state=read()
 if(['Sat','Sun'].includes(now.weekday)||now.hour<8||(now.hour===8&&now.minute<30)||state.successDay===now.day||state.attemptDay===now.day)return
 busy=true;fs.writeFileSync(stateFile,JSON.stringify({...state,attemptDay:now.day,startedAt:new Date().toISOString(),state:'running'}))
 const log=fs.openSync(path.join(directory,'collection.log'),'a',0o600)
 const child=spawn(process.execPath,['--env-file-if-exists=.env','--import','tsx',path.join(root,'scripts/collect-content.ts')],{cwd:root,stdio:['ignore',log,log],windowsHide:true,env:process.env})
 child.once('error',()=>{fs.closeSync(log);fs.writeFileSync(stateFile,JSON.stringify({...read(),state:'failed'}));busy=false})
 child.once('exit',code=>{fs.closeSync(log);fs.writeFileSync(stateFile,JSON.stringify({...read(),state:code===0?'completed':'failed',...(code===0?{successDay:now.day}:{}),finishedAt:new Date().toISOString()}));busy=false;if(code)console.error('Editorial collection needs attention; see persisted status.')})
}
const timer=setInterval(()=>void tick(),60000);void tick()
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{clearInterval(timer);process.exit(0)})
