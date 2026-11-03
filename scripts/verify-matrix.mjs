import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {root} from '@site/config'
import {launch} from './run.mjs'
import {audit} from './audit-build.mjs'
const config=path.join(root,'config/site.json'),original=fs.readFileSync(config)
const state=path.join(root,'.local/dev-state.json')
if(fs.existsSync(state)){
  const {pid}=JSON.parse(fs.readFileSync(state,'utf8'))
  let active=false;try{process.kill(pid,0);active=true}catch{}
  if(active)throw new Error('Stop pnpm dev before running the temporary configuration matrix')
}
const base=JSON.parse(original),results=[]
const variants=[
  {name:'content-only',features:{articles:true,inquiries:false,products:false,analytics:false},locales:['en']},
  {name:'catalog-bilingual',features:{articles:true,inquiries:true,products:true,analytics:false},locales:['en','zh']},
]
try{
  for(const variant of variants){
    fs.writeFileSync(config,JSON.stringify({...base,features:variant.features,locales:variant.locales},null,2)+'\n')
    const directory=path.join(root,'.local/matrix',variant.name)
    const child=launch('site:offline',{SITE_BUILD_DIR:directory})
    await new Promise((resolve,reject)=>{child.once('exit',c=>c===0?resolve():reject(new Error('Variant build failed')));child.once('error',reject)})
    const report=audit(directory)
    assert.equal(fs.existsSync(path.join(directory,'products/index.html')),variant.features.products)
    assert.equal(fs.existsSync(path.join(directory,'contact/index.html')),variant.features.inquiries)
    if(variant.locales.includes('zh')){
      assert.ok(fs.existsSync(path.join(directory,'zh/products/index.html')))
      const html=fs.readFileSync(path.join(directory,'zh/index.html'),'utf8')
      assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="zh"/);assert.match(html,/hreflang="x-default"/)
    }
    results.push({variant:variant.name,...report})
  }
}finally{fs.writeFileSync(config,original)}
assert.ok(fs.readFileSync(config).equals(original))
fs.writeFileSync(path.join(root,'.local/matrix-results.json'),JSON.stringify({passed:true,variants:results,defaultConfigurationRestored:true},null,2))
console.log(JSON.stringify(results,null,2))
