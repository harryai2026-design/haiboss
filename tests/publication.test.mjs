import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {createRequire} from 'node:module'
import {EventEmitter} from 'node:events'
const require=createRequire(import.meta.url),{publish,rollback,active}=require('../services/rebuild/publish.cjs'),{createBuildQueue}=require('../services/rebuild/queue.cjs')
test('candidate validation preserves the previous release and valid versions can roll back',t=>{
  const app=fs.mkdtempSync(path.join(os.tmpdir(),'site-release-'))
  t.after(()=>fs.rmSync(app,{recursive:true,force:true}))
  function candidate(text,valid=true){const dir=path.join(app,'.dist-next');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),text);for(const name of ['robots.txt','llms.txt']){const file=path.join(dir,name);if(valid)fs.writeFileSync(file,text);else if(fs.existsSync(file))fs.unlinkSync(file)}return dir}
  publish(app,candidate('first'))
  assert.throws(()=>publish(app,candidate('broken',false)))
  assert.equal(fs.readFileSync(path.join(active(app),'index.html'),'utf8'),'first')
  publish(app,candidate('second'))
  assert.equal(fs.readFileSync(path.join(active(app),'index.html'),'utf8'),'second')
  rollback(app)
  assert.equal(fs.readFileSync(path.join(active(app),'index.html'),'utf8'),'first')
})
test('queued publication survives restart, failed jobs retry only explicitly',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'site-queue-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
  const stateFile=path.join(dir,'state.json')
  let started=0
  const spawnBuild=()=>{started++;const child=new EventEmitter();setTimeout(()=>child.emit('close',started===1?1:0),10);return child}
  const first=createBuildQueue({stateFile,cwd:dir,command:'fixture',debounceMs:10000,spawnBuild});first.accept('job-1');first.close()
  const queue=createBuildQueue({stateFile,cwd:dir,command:'fixture',debounceMs:5,spawnBuild});t.after(()=>queue.close())
  const until=async state=>{for(let i=0;i<100;i++){if(queue.get('job-1')?.status===state)return;await new Promise(r=>setTimeout(r,10))}throw new Error(`Timeout: ${state}`)}
  await until('failed');queue.accept('job-1');assert.equal(started,1)
  queue.retry('job-1');await until('published');assert.equal(started,2)
})
