// Run inside the intake container; redirect stdout to a private backup file. Never log this output.
import fs from 'node:fs'
import path from 'node:path'
import { once } from 'node:events'
import { KEY_PATTERN } from './validation.mjs'
const directory = process.env.INTAKE_DIR || '.local/inquiries'
for (const name of fs.readdirSync(directory)) {
  if (!name.endsWith('.json') || !KEY_PATTERN.test(name.slice(0, -5))) continue
  try {
    const line = `${JSON.stringify(JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')))}\n`
    if (!process.stdout.write(line)) await once(process.stdout, 'drain')
  }
  catch (error) { if (error.code !== 'ENOENT') throw error } // Retention can remove only old synced tombstones.
}
