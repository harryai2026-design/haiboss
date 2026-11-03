import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {spawn} from 'node:child_process'
import {root} from '@site/config'
const directory=path.resolve(root,'.local/verification-db')
if(!directory.startsWith(path.resolve(root,'.local')+path.sep))throw new Error('Unexpected local database path')
if(process.platform!=='win32')throw new Error('This recovery helper is only needed on Windows')
const digest=createHash('sha256').update(root).digest('hex').slice(0,12)
const record=JSON.parse(fs.readFileSync(path.join(root,'.local/runtime-path.json'),'utf8'))
const expectedParent=path.join(process.env.LOCALAPPDATA,'IndependentSiteStarter')+path.sep
if(path.resolve(record.data)!==directory || !path.resolve(record.windowsPostgresAlias).startsWith(expectedParent))throw new Error('Unexpected verification runtime record')
const base=record.windowsPostgresAlias
const alias=path.join(base,createHash('sha256').update(directory).digest('hex').slice(0,10))
if(fs.existsSync(path.join(directory,'postmaster.pid'))){
  const child=spawn(path.join(base,'pg16/bin/pg_ctl.exe'),['-D',alias,'-m','fast','-w','stop'],{stdio:'inherit',windowsHide:true})
  child.once('exit',code=>{process.exitCode=code})
  child.once('error',()=>{console.error('Verification database control binary is unavailable');process.exitCode=1})
}else console.log('No verification database is running')
