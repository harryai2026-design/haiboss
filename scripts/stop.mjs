import fs from 'node:fs'
import path from 'node:path'
import {spawn} from 'node:child_process'
import {root} from '@site/config'
const file=path.join(root,'.local/dev-state.json')
if(!fs.existsSync(file)){console.log('No local stack state found');process.exit(0)}
const state=JSON.parse(fs.readFileSync(file,'utf8'))
if(state.status==='stopped'){console.log('Local stack is stopped');process.exit(0)}
if(!Number.isSafeInteger(state.pid))throw new Error('Invalid local stack state')
fs.writeFileSync(path.join(root,'.local/stop-request.json'),JSON.stringify({pid:state.pid}))
if(state.status==='starting'){console.log('Stop requested; startup will stop at its next safe checkpoint');process.exit(0)}
if(process.platform!=='win32')process.kill(state.pid,'SIGINT')
else{
  const web=state.children?.at(-1)
  if(!Number.isSafeInteger(web))throw new Error('Invalid local web process state')
  // Stop only a process whose current command belongs to this exact workspace.
  // Its parent then shuts down the remaining children and PostgreSQL gracefully.
  const script=`$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${web}'; if($p -and $p.CommandLine.Contains($env:SITE_WORKSPACE)) { Stop-Process -Id ${web} } else { Write-Output 'Local stack is already stopped or process identity changed' }`
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command','-'],{stdio:['pipe','inherit','inherit'],windowsHide:true,env:{...process.env,SITE_WORKSPACE:root}})
  child.stdin.end(script)
  await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',c=>c===0?resolve():reject(new Error('Could not stop the local stack')))})
}
console.log('Local stack stop requested; project data is retained')
