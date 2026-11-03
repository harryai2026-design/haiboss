import fs from 'node:fs'
import path from 'node:path'
import {spawn,spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {root} from '@site/config'
const backup=process.argv[2]
const inquiryReference=process.argv[3]
if(inquiryReference&&!/^IQ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/.test(inquiryReference))throw new Error('Invalid test inquiry reference')
if(!/^\/home\/codexops\/backups\/haiboss-candidate-\d{8}T\d{6}Z$/.test(backup||''))throw new Error('Expected a specific Haiboss candidate backup')
const target=backup+'/restore-check';fs.mkdirSync(target,{mode:0o700});fs.mkdirSync(target+'/socket',{mode:0o700})
const unpack=spawnSync('tar',['-xzf',backup+'/postgres-media.tar.gz','-C',target,'postgres'],{stdio:'ignore'});if(unpack.status!==0)throw new Error('Backup extraction failed')
const runtime=JSON.parse(fs.readFileSync(path.join(root,'.local/production-runtime.json'),'utf8'))
const req=createRequire(fs.realpathSync(path.join(root,'node_modules/embedded-postgres/package.json'))),{Client}=req('pg')
const log=fs.openSync(target+'/postgres.log','a',0o600)
const server=spawn(runtime.native+'/postgres',['-D',target+'/postgres','-h','127.0.0.1','-p','45233','-k',target+'/socket','-c','shared_buffers=32MB','-c','max_connections=10'],{stdio:['ignore',log,log]})
const done=new Promise(resolve=>server.once('exit',resolve))
let client
try{
 for(let i=0;i<20;i++){
  const url=new URL(process.env.DATABASE_URI);url.port='45233'
  client=new Client({connectionString:url.href,connectionTimeoutMillis:1000})
  try{await client.connect();break}catch{await client.end();client=null;await new Promise(resolve=>setTimeout(resolve,500))}
 }
 if(!client)throw new Error('Restored PostgreSQL did not become ready')
 const articles=await client.query("SELECT count(*)::int AS count FROM articles WHERE _status='published'")
 const users=await client.query('SELECT count(*)::int AS count FROM users')
 if(articles.rows[0].count!==8||users.rows[0].count!==1)throw new Error('Restored content or owner count does not match candidate backup')
 if(inquiryReference){const inquiry=await client.query('SELECT count(*)::int AS count FROM inquiries WHERE reference=$1',[inquiryReference]);if(inquiry.rows[0].count!==1)throw new Error('Live inquiry not present exactly once in restored backup')}
 const report={at:new Date().toISOString(),backup,isolatedRestorePort:45233,publicArticles:8,ownerCount:1,...(inquiryReference?{inquiryReference,inquiryRestoredCount:1}:{}),restoreQueryPassed:true,productionDatabaseTouched:false}
 fs.writeFileSync(backup+'/restore-verification.json',JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report))
}finally{
 if(client)await client.end()
 server.kill('SIGTERM');await done;fs.closeSync(log)
}
