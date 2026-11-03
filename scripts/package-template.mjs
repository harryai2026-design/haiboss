import fs from 'node:fs'
import path from 'node:path'
import { zipSync } from 'fflate'
import { root } from '@site/config'
const ignored=new Set(['node_modules','.git','.next','.local','dist','.astro','media','artifacts','.dist-next','.site-releases','.deploy'])
const entries={}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(e.name)||e.name.endsWith('.log')||e.name.endsWith('.tsbuildinfo')||(e.name.startsWith('.env')&&e.name!=='.env.example'))continue;const file=path.join(dir,e.name);if(e.isSymbolicLink())throw new Error('Unexpected source symlink');if(e.isDirectory())walk(file);else entries[`independent-site-starter/${path.relative(root,file).replaceAll('\\','/')}`]=new Uint8Array(fs.readFileSync(file))}}walk(root)
const output=path.join(root,'artifacts/independent-site-starter.zip')
fs.mkdirSync(path.dirname(output),{recursive:true})
fs.writeFileSync(output,zipSync(entries,{level:6}))
console.log(`Packaged ${Object.keys(entries).length} source files; secrets, dependencies, media and local data excluded.\n${output}`)
