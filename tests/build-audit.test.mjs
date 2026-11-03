import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {audit} from '../scripts/audit-build.mjs'
test('a deleted content page left in candidate output blocks publication',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'site-audit-'))
  t.after(()=>{const resolved=fs.realpathSync(dir);assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir())+path.sep));fs.rmSync(resolved,{recursive:true,force:true})})
  const html='<html lang="en"><head><title>Example</title><meta name="description" content="Example"><link rel="canonical" href="https://example.test/"><script type="application/ld+json">{"@type":"WebPage"}</script></head><body>Example</body></html>'
  fs.writeFileSync(path.join(dir,'index.html'),html)
  fs.writeFileSync(path.join(dir,'robots.txt'),'User-agent: *')
  fs.writeFileSync(path.join(dir,'llms.txt'),'- [Home](https://example.test/)')
  fs.writeFileSync(path.join(dir,'sitemap-index.xml'),'<sitemapindex/>')
  assert.equal(audit(dir).htmlPages,1)
  fs.writeFileSync(path.join(dir,'deleted.html'),html)
  assert.throws(()=>audit(dir),/stale HTML/)
})
