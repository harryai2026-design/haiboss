import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { zh } from '@payloadcms/translations/languages/zh'
import { buildConfig, type Endpoint } from 'payload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { site } from '@site/config'
import { resolveDomains } from '@site/config/domains'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles, Products, SiteProfile, ReleaseJobs } from './collections/Content'
import { Inquiries } from './collections/Inquiries'
import { inquiryEndpoint } from './endpoints/inquiry'
import { startPublicationWorker } from './lib/publication'
import { migrations } from './migrations'
import {Topics,Services,Cases,Candidates} from './collections/Editorial'
import {startEditorialWorker} from './lib/editorial-worker'
import {startInquiryNotifications} from './lib/inquiry-notifications'
const dirname = path.dirname(fileURLToPath(import.meta.url))
const urls = resolveDomains(process.env)
const allModules = process.env.SCHEMA_ALL_MODULES === '1'
const health: Endpoint = {path:'/health',method:'get',handler:async req => {
  try {await req.payload.count({collection:'users',overrideAccess:true});return Response.json({ok:true})}
  catch{return Response.json({ok:false},{status:503})}
}}
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.length < 32) throw new Error('Configure PAYLOAD_SECRET (32+ characters) using pnpm setup')
export default buildConfig({
  serverURL:urls.cms,cors:urls.allowedOrigins,csrf:urls.allowedOrigins,
  secret:process.env.PAYLOAD_SECRET,
  admin:{user:'users',importMap:{baseDir:dirname}},
  i18n:{supportedLanguages:{zh},fallbackLanguage:'zh'},
  localization:{locales:site.locales,defaultLocale:site.defaultLocale,fallback:site.locales.length===1},
  collections:[Users,Media,ReleaseJobs,Topics,Services,Cases,Candidates,...(site.features.articles || allModules ? [Articles] : []),...(site.features.products || allModules ? [Products] : []),...(site.features.inquiries || allModules ? [Inquiries] : [])],
  globals:[SiteProfile],endpoints:[health,...(site.features.inquiries ? [inquiryEndpoint] : [])],
  editor:lexicalEditor(),sharp,
  email:()=>({name:'disabled',defaultFromAddress:'noreply@example.invalid',defaultFromName:site.name,sendEmail:async()=>{throw new Error('Email delivery is not configured for this template')}}),
  onInit:async payload => {startPublicationWorker(payload);startEditorialWorker(payload);startInquiryNotifications(payload)},
  typescript:{outputFile:path.join(dirname,'payload-types.ts')},
  db:postgresAdapter({pool:{connectionString:process.env.DATABASE_URI || ''},push:process.env.PAYLOAD_PUSH === '1',migrationDir:path.join(dirname,'migrations'),prodMigrations:migrations}),
})
