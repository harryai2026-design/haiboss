import test from 'node:test'
import assert from 'node:assert/strict'
import {organization,serializeJsonLd,product} from '../packages/seo/index.mjs'
import {renderRichText} from '../packages/content/richtext.mjs'
test('JSON-LD is safe in script tags and does not invent manufacturer, prices or reviews',()=>{
  const org=organization({name:'</script><script>alert(1)</script>',url:'https://example.com',description:'Example'})
  assert.equal(org['@type'],'Organization');assert.ok(!serializeJsonLd(org).includes('<'))
  const item=product({title:'Item',description:'Description',url:'https://example.com/item'})
  assert.equal(item.offers,undefined);assert.equal(item.aggregateRating,undefined)
})
test('rich text renders content while escaping HTML and rejecting unsafe links',()=>{
  const html=renderRichText({root:{type:'root',children:[{type:'paragraph',children:[{type:'text',text:'<img src=x onerror=alert(1)>',format:1}]},{type:'link',fields:{url:'javascript:alert(1)'},children:[{type:'text',text:'unsafe'}]}]}})
  assert.ok(html.includes('&lt;img'));assert.ok(html.includes('<strong>'));assert.ok(!html.includes('href='))
})
