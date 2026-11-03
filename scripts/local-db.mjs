import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {createHash,randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'
import {spawn} from 'node:child_process'
import { root } from '@site/config'
async function windowsDatabase({directory,port,database,password}) {
  // Native PostgreSQL on Windows can fail on a non-ASCII installation/data path.
  // Use project-scoped ASCII junctions, without moving the project or installing a service.
  const digest=createHash('sha256').update(root).digest('hex').slice(0,12)
  const base=path.join(process.env.LOCALAPPDATA || os.tmpdir(),'IndependentSiteStarter',digest)
  fs.mkdirSync(base,{recursive:true})
  const req=createRequire(fs.realpathSync(path.join(root,'node_modules/embedded-postgres/package.json')))
  const native=path.join(path.dirname(path.dirname(req.resolve('@embedded-postgres/windows-x64'))),'native')
  const alias=path.join(base,'pg16')
  if(!fs.existsSync(alias))fs.symlinkSync(native,alias,'junction')
  const dbAlias=path.join(base,createHash('sha256').update(directory).digest('hex').slice(0,10))
  fs.mkdirSync(directory,{recursive:true})
  if(!fs.existsSync(dbAlias))fs.symlinkSync(directory,dbAlias,'junction')
  const executable=name=>path.join(alias,'bin',`${name}.exe`)
  async function run(name,args){
    await new Promise((resolve,reject)=>{const p=spawn(executable(name),args,{windowsHide:true,env:{...process.env,LC_ALL:'C'}});let error='';p.stdout.on('data',()=>{});p.stderr.on('data',b=>{error+=b.toString()});p.once('error',reject);p.once('exit',c=>c===0?resolve():reject(new Error(`${name} failed (${c}): ${error.slice(-1500)}`)))})
  }
  if(!fs.existsSync(path.join(directory,'PG_VERSION'))){
    const pw=path.join(base,`password-${randomUUID()}`)
    fs.writeFileSync(pw,password,{mode:0o600,flag:'wx'})
    try{await run('initdb',['-D',dbAlias,'-U','site_local','--pwfile',pw,'--auth=scram-sha-256','--locale=C','--encoding=UTF8','--text-search-config=english'])}
    finally{fs.unlinkSync(pw)}
  }
  const log=path.join(base,`postgres-${port}.log`)
  await run('pg_ctl',['-D',dbAlias,'-l',log,'-o',`-h 127.0.0.1 -p ${port}`,'-w','start'])
  const {Client}=req('pg')
  const getPgClient=(name='postgres')=>new Client({host:'127.0.0.1',port,user:'site_local',password,database:name})
  const pg={getPgClient,stop:()=>run('pg_ctl',['-D',dbAlias,'-m','fast','-w','stop'])}
  const client=getPgClient()
  try{await client.connect();if(!(await client.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount)await client.query(`CREATE DATABASE "${database}"`)}finally{await client.end()}
  fs.mkdirSync(path.join(root,'.local'),{recursive:true})
  fs.writeFileSync(path.join(root,'.local/runtime-path.json'),JSON.stringify({windowsPostgresAlias:base,data:directory,port},null,2))
  return {pg,uri:`postgresql://site_local:${encodeURIComponent(password)}@127.0.0.1:${port}/${database}`}
}
export async function localDatabase({directory=path.join(root,'.local/postgres'),port=Number(process.env.PG_PORT || 44332),database='site_local',password=process.env.PG_PASSWORD}={}) {
  if (!password) throw new Error('Run pnpm setup before starting the local database')
  if(!/^[a-z][a-z0-9_]*$/.test(database))throw new Error('Invalid local database name')
  if(process.platform==='win32')return windowsDatabase({directory,port,database,password})
  const pg = new EmbeddedPostgres({databaseDir:directory,user:'site_local',password,port,persistent:true,
    initdbFlags:['--locale=C','--encoding=UTF8','--text-search-config=english'],
    postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{},createPostgresUser:false})
  if (!fs.existsSync(path.join(directory,'PG_VERSION'))) await pg.initialise()
  await pg.start()
  const client=pg.getPgClient('postgres','127.0.0.1')
  try {
    await client.connect()
    if (!(await client.query('SELECT 1 FROM pg_database WHERE datname=$1',[database])).rowCount) await pg.createDatabase(database)
  } finally {await client.end()}
  return {pg,uri:`postgresql://site_local:${encodeURIComponent(password)}@127.0.0.1:${port}/${database}`}
}
