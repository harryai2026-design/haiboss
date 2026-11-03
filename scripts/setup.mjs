import fs from 'node:fs'
import { randomBytes } from 'node:crypto'
const file = new URL('../.env', import.meta.url)
if (fs.existsSync(file)) { console.log('Existing .env preserved.'); process.exit(0) }
const password = randomBytes(24).toString('hex')
const values = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
  .replace(/^DATABASE_URI=$/m, `DATABASE_URI=postgresql://site_local:${password}@127.0.0.1:44332/site_local`)
  .replace(/^PG_PASSWORD=$/m, `PG_PASSWORD=${password}`)
  .replace(/^PAYLOAD_SECRET=$/m, `PAYLOAD_SECRET=${randomBytes(32).toString('hex')}`)
  .replace(/^INQUIRY_INGEST_SECRET=$/m, `INQUIRY_INGEST_SECRET=${randomBytes(32).toString('hex')}`)
  .replace(/^REBUILD_SECRET=$/m, `REBUILD_SECRET=${randomBytes(32).toString('hex')}`)
fs.writeFileSync(file, values, { mode:0o600, flag:'wx' })
console.log('Local .env created with separate generated secrets. Values are not printed.')
