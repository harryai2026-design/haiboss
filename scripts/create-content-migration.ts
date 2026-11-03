// Use the project-wide TS loader. Payload CLI's scoped TS loader conflicts with
// drizzle-kit's CommonJS built-in resolution on Windows (node:crypto namespace).
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {root} from '@site/config'
process.env.DISABLE_WORKERS='1'
process.env.PAYLOAD_MIGRATING='true'
process.env.SCHEMA_ALL_MODULES='1'
const req=createRequire(path.join(root,'services/cms/package.json'))
const {default:payload}=await import(pathToFileURL(req.resolve('payload')).href)
const config=(await import('../services/cms/src/payload.config.ts')).default
await payload.init({config,disableDBConnect:true,disableOnInit:true})
await payload.db.createMigration({payload,migrationName:'haiboss_editorial',forceAcceptWarning:true})
console.log('Editorial migration generated from schema; no database connected.')
process.exit(0)
