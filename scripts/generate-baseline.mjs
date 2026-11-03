// Maintainer-only helper. Refuses to overwrite an existing baseline.
import fs from 'node:fs'
import path from 'node:path'
import {root} from '@site/config'
import {localDatabase} from './local-db.mjs'
import {launch} from './run.mjs'
if(fs.readdirSync(path.join(root,'services/cms/src/migrations')).some(x=>x.endsWith('.json')))throw new Error('Baseline exists. Use db:migrate:create for subsequent model changes.')
const database=await localDatabase({directory:path.join(root,'.local/baseline-db'),port:44333,database:'baseline'})
try{
  const child=launch('cms:migrate:create',{DATABASE_URI:database.uri,SCHEMA_ALL_MODULES:'1',PAYLOAD_PUSH:'0',DISABLE_WORKERS:'1'})
  await new Promise((resolve,reject)=>{child.once('exit',c=>c===0?resolve():reject(new Error('Baseline generation failed')));child.once('error',reject)})
}finally{await database.pg.stop()}
