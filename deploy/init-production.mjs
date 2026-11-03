import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {spawnSync} from 'node:child_process'
import {root} from '@site/config'
import {randomBytes} from 'node:crypto'
if(process.platform!=='linux')throw new Error('Linux production initializer only')
const app='/home/codexops/apps/haiboss',shared=app+'/shared',privateDir='/home/codexops/.config/haiboss',envFile=privateDir+'/runtime.env'
for(const p of [shared,privateDir,shared+'/postgres',shared+'/logs',shared+'/media',shared+'/inquiries'])fs.mkdirSync(p,{recursive:true,mode:0o700})
const linked=(from,to)=>{if(!fs.existsSync(to))fs.symlinkSync(from,to);else if(fs.realpathSync(to)!==fs.realpathSync(from))throw new Error('Different runtime path preserved: '+to)}
const metadata=path.join(root,'node_modules/embedded-postgres/package.json')
const req=createRequire(fs.realpathSync(metadata))
const native=path.join(path.dirname(path.dirname(req.resolve('@embedded-postgres/linux-x64'))),'native/bin')
for(const name of ['postgres','initdb','pg_ctl'])fs.chmodSync(path.join(native,name),0o750)
if(!fs.existsSync(envFile)){
 const pw=randomBytes(24).toString('hex')
 const env={SITE_URL:'https://haiboss.com',CMS_URL:'https://cms.haiboss.com',SITE_ENVIRONMENT:'production',PAYLOAD_URL:'http://127.0.0.1:45201',SITE_PORT:'45221',CMS_PORT:'45201',INTAKE_PORT:'45202',REBUILD_PORT:'45203',PG_PORT:'45232',DATABASE_URI:'postgresql://haiboss:'+pw+'@127.0.0.1:45232/haiboss',PG_PASSWORD:pw,PAYLOAD_SECRET:randomBytes(32).toString('hex'),INQUIRY_INGEST_SECRET:randomBytes(32).toString('hex'),REBUILD_SECRET:randomBytes(32).toString('hex'),STRICT_CONTENT_BUILD:'1',BUILD_HOOK_URL:'http://127.0.0.1:45203/rebuild',INTAKE_DIR:shared+'/inquiries',PAYLOAD_PUSH:'0',NODE_ENV:'production',OWNER_EMAIL:'harryai2026@gmail.com',OWNER_BOOTSTRAP_FILE:privateDir+'/owner-bootstrap.json',TRUST_PROXY:'1',TRUST_CLOUDFLARE_HEADERS:'1',SITE_REDIRECT_ORIGINS:'https://www.haiboss.com,https://haiboss.top,https://www.haiboss.top'}
 fs.writeFileSync(envFile,Object.entries(env).map(([k,v])=>k+'='+v).join('\n')+'\n',{flag:'wx',mode:0o600})
}
process.loadEnvFile(envFile)
linked(envFile,path.join(root,'.env'));linked(shared+'/media',path.join(root,'services/cms/media'));linked(shared,path.join(root,'.local'))
const pgdata=shared+'/postgres'
const adminFile=privateDir+'/postgres-admin.json'
if(!fs.existsSync(adminFile))fs.writeFileSync(adminFile,JSON.stringify({user:'haiboss_admin',password:randomBytes(32).toString('hex')}),{flag:'wx',mode:0o600})
const admin=JSON.parse(fs.readFileSync(adminFile,'utf8'))
if(!fs.existsSync(pgdata+'/PG_VERSION')){
 const passwordFile=privateDir+'/pg-init-password';fs.writeFileSync(passwordFile,admin.password,{flag:'wx',mode:0o600})
 try{const result=spawnSync(native+'/initdb',['-D',pgdata,'-U',admin.user,'--pwfile',passwordFile,'--auth=scram-sha-256','--locale=C','--encoding=UTF8'],{encoding:'utf8'});if(result.status!==0)throw new Error('PostgreSQL initialization failed: '+result.stderr)}finally{fs.unlinkSync(passwordFile)}
}
const unitDir='/home/codexops/.config/systemd/user';fs.mkdirSync(unitDir,{recursive:true})
const prefix='[Unit]\nDescription=Haiboss ',after='\nAfter=network.target haiboss-postgres.service\nRequires=haiboss-postgres.service\n\n[Service]\nType=simple\nWorkingDirectory='+root+'\nEnvironmentFile='+envFile+'\nEnvironment=NEXT_TELEMETRY_DISABLED=1\nEnvironment=ASTRO_TELEMETRY_DISABLED=1\nRestart=on-failure\nRestartSec=5\nUMask=0077\n',tail='\n[Install]\nWantedBy=default.target\n'
const units={
 'haiboss-postgres.service':'[Unit]\nDescription=Haiboss isolated PostgreSQL 16\nAfter=network.target\n[Service]\nType=simple\nExecStart='+native+'/postgres -D '+pgdata+' -h 127.0.0.1 -p 45232 -c shared_buffers=64MB -c max_connections=30\nRestart=on-failure\nRestartSec=5\nUMask=0077\nMemoryMax=256M\n'+tail,
 'haiboss-cms.service':prefix+'CMS'+after+'ExecStart=/usr/bin/node --max-old-space-size=512 '+path.join(root,'scripts/run.mjs')+' cms:start\nMemoryMax=800M\n'+tail,
 'haiboss-intake.service':prefix+'inquiry intake'+after+'ExecStart=/usr/bin/node '+path.join(root,'services/inquiry-intake/server.mjs')+'\nMemoryMax=128M\n'+tail,
 'haiboss-rebuild.service':prefix+'content publication'+after+'ExecStart=/usr/bin/node --max-old-space-size=1200 '+path.join(root,'services/rebuild/server.mjs')+'\nMemoryMax=1536M\n'+tail,
 'haiboss-site.service':prefix+'static site'+after+'ExecStart=/usr/bin/node '+path.join(root,'scripts/site-server.mjs')+'\nMemoryMax=128M\n'+tail,
 'haiboss-editorial.service':prefix+'weekday source collection'+after+'ExecStart=/usr/bin/node '+path.join(root,'scripts/editorial-scheduler.mjs')+'\nMemoryMax=512M\n'+tail
}
for(const [name,baseText]of Object.entries(units)){const text=baseText.replace('Requires=haiboss-postgres.service\n','');const target=path.join(unitDir,name);if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')!==text)throw new Error('Different existing service preserved: '+name);fs.writeFileSync(target,text,{mode:0o600})}
fs.writeFileSync(shared+'/production-runtime.json',JSON.stringify({release:root,native,envFile,postgres:pgdata,services:Object.keys(units)},null,2),{mode:0o600})
console.log(JSON.stringify({initialized:true,secretsDisplayed:false,servicesPrepared:Object.keys(units),publicRoutingConfigured:false}))
