import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {root} from '@site/config'
const req=createRequire(fs.realpathSync(path.join(root,'node_modules/embedded-postgres/package.json')))
const {Client}=req('pg'),admin=JSON.parse(fs.readFileSync('/home/codexops/.config/haiboss/postgres-admin.json','utf8'))
if(!/^[a-f0-9]{48}$/.test(process.env.PG_PASSWORD||''))throw new Error('Expected generated application password')
const client=new Client({host:'127.0.0.1',port:45232,user:admin.user,password:admin.password,database:'postgres'})
try{
 await client.connect()
 if(!(await client.query("SELECT 1 FROM pg_roles WHERE rolname='haiboss'")).rowCount)await client.query("CREATE ROLE haiboss LOGIN PASSWORD '"+process.env.PG_PASSWORD+"' NOSUPERUSER NOCREATEDB NOCREATEROLE")
 if(!(await client.query("SELECT 1 FROM pg_database WHERE datname='haiboss'")).rowCount)await client.query('CREATE DATABASE haiboss OWNER haiboss')
 console.log(JSON.stringify({database:'haiboss',applicationSuperuser:false,adminSecretOutsideApplicationEnvironment:true}))
}finally{await client.end()}
