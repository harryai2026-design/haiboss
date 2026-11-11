import test from 'node:test'
import assert from 'node:assert/strict'
import {parseFeed,sourceURL,eligibility,editorialSlug,feedText} from '../services/editorial/policy.mjs'
import {collectionDecision} from '../services/editorial/schedule.mjs'
import {editorialIssues,EDITORIAL_MARKER,reviewFingerprint} from '../services/editorial/review.mjs'
const source={id:'official',section:'ai',allowedHosts:['official.example'],maxEntries:20},now=new Date('2026-11-11T02:00:00Z'),policy={collection:{weekdaysOnly:true,hour:8,minute:30,retryMinutes:[15,60,180],staleRunMinutes:12}}
test('editorial sources normalize tracking but reject unrelated hosts, credentials and private URLs',()=>{
 assert.equal(sourceURL('https://official.example/news/?utm_source=rss&item=1#top',source),'https://official.example/news/?item=1')
 for(const value of ['http://official.example/a','https://official.example.evil.test/a','https://user:pass@official.example/a','https://127.0.0.1/a'])assert.throws(()=>sourceURL(value,source))
 assert.equal(editorialSlug('https://official.example/news?utm_source=one',source),editorialSlug('https://official.example/news?utm_source=two',source))
})
test('RSS and Atom parsing preserve dates, remove markup and reject unsafe XML',()=>{
 const rss='<rss><item><title><![CDATA[Business &amp; AI]]></title><link>https://official.example/a</link><pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate><description><![CDATA[<b>New</b> workflow]]></description></item><item><title>Bad</title><link>https://evil.example/a</link></item></rss>'
 const e=parseFeed(rss,source);assert.equal(e.length,1);assert.equal(e[0].title,'Business & AI');assert.equal(e[0].summary,'New workflow');assert.equal(e[0].sourcePublishedAt,'2026-11-10T10:00:00.000Z')
 assert.equal(parseFeed('<feed><entry><title>AI agent</title><link href="https://official.example/b"/><updated>2026-11-10T12:00:00Z</updated></entry></feed>',source)[0].sourceUrl,'https://official.example/b')
 assert.throws(()=>parseFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>',source))
})
test('future, old, missing-date and off-topic items never become automatic drafts',()=>{
 const item={title:'New business workflow',sourcePublishedAt:'2026-11-10T10:00:00Z'};assert.equal(eligibility(item,source,now).eligible,true)
 for(const sourcePublishedAt of ['2026-11-12T00:00:00Z','2025-11-10T00:00:00Z',null])assert.equal(eligibility({...item,sourcePublishedAt},source,now).eligible,false)
 assert.equal(eligibility({...item,title:'AI healthcare education workshop'},source,now).eligible,false)
})
test('streamed feed byte limit applies without content-length',async()=>{await assert.rejects(()=>feedText(new Response(new Uint8Array(2_000_001))),/too large/)})
test('editorial approval fingerprint changes with content but not operational notes',()=>{const d={title:'A fact',description:'Summary',content:{root:{children:[{text:'Checked content'}]}},sources:[{url:'https://official.example/a'}]};assert.equal(reviewFingerprint(d),reviewFingerprint({...d,reviewNotes:'Internal processing'}));assert.notEqual(reviewFingerprint(d),reviewFingerprint({...d,title:'A different fact'}))})
test('collection retries failures within budget and never repeats a successful day',()=>{
 assert.equal(collectionDecision({},policy,now).run,true);assert.equal(collectionDecision({successDay:'2026-11-11'},policy,now).run,false)
 const failed={attemptDay:'2026-11-11',attempts:1,state:'failed',finishedAt:'2026-11-11T01:50:00Z'}
 assert.equal(collectionDecision(failed,policy,now).reason,'retry-wait');assert.equal(collectionDecision({...failed,finishedAt:'2026-11-11T01:40:00Z'},policy,now).run,true)
 assert.equal(collectionDecision({...failed,attempts:4},policy,now).reason,'retry-budget-exhausted');assert.equal(collectionDecision({attemptDay:'2026-11-10',attempts:4,state:'failed'},policy,now).run,true)
})
test('stale interrupted collection recovers without overlapping live work',()=>{
 assert.equal(collectionDecision({state:'running',startedAt:'2026-11-11T01:58:00Z'},policy,now).run,false)
 assert.equal(collectionDecision({attemptDay:'2026-11-11',attempts:1,state:'running',startedAt:'2026-11-11T01:00:00Z'},policy,now).run,true)
 assert.equal(collectionDecision({},policy,new Date('2026-11-11T00:29:00Z')).run,false);assert.equal(collectionDecision({},policy,new Date('2026-11-14T02:00:00Z')).run,false)
})
test('automatic drafts need complete original text and checked sources before approval',()=>{
 const heading={type:'heading',children:[{text:'检查'}]},doc={title:'Business workflow',description:'A complete original draft',reviewNotes:EDITORIAL_MARKER+'\n整理状态：ready',content:{root:{children:[heading,heading,heading,{type:'paragraph',children:[{type:'text',text:'核对真实业务资料与原始来源，明确影响范围与下一步验证。'.repeat(18)}]}]}},sources:[{url:'https://official.example/a',checkedAt:'2026-11-11T01:00:00Z'}]}
 assert.deepEqual(editorialIssues(doc,now),[]);assert.ok(editorialIssues({...doc,reviewNotes:EDITORIAL_MARKER},now).length);assert.ok(editorialIssues({...doc,sources:[]},now).length);assert.ok(editorialIssues({...doc,title:'待核验选题'},now).length)
 assert.deepEqual(editorialIssues({title:'Manually maintained article'},now),[])
})
