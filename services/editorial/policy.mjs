import {createHash} from 'node:crypto'
export function cleanText(value=''){
 return String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi,m=>{const known={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};if(known[m.toLowerCase()])return known[m.toLowerCase()];const hex=m.startsWith('&#x'),n=parseInt(m.slice(hex?3:2,-1),hex?16:10);return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()
}
export function sourceURL(value,source){
 const url=new URL(value)
 if(url.protocol!=='https:'||url.username||url.password||url.port||!source.allowedHosts?.includes(url.hostname))throw new Error('Untrusted source URL')
 url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key)
 url.searchParams.sort();return url.href.replace(/\/$/,'')
}
export function parseFeed(xml,source){
 if(Buffer.byteLength(xml)>2_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('Unsafe or oversized feed')
 const tag=(block,name)=>{const m=block.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'));return m?cleanText(m[1]):''}
 const entries=[...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0,source.maxEntries||30)
 if(!entries.length)throw new Error('Feed has no recognizable entries')
 return entries.flatMap(match=>{const entry=match[1],title=tag(entry,'title').slice(0,250),raw=tag(entry,'link')||entry.match(/<link\b(?=[^>]*(?:rel=["']alternate["']|href=))[^>]*href=["']([^"']+)["']/i)?.[1];try{if(!title||!raw)return[];const date=tag(entry,'pubDate')||tag(entry,'published')||tag(entry,'updated');return[{title,sourceUrl:sourceURL(raw,source),summary:(tag(entry,'description')||tag(entry,'summary')).slice(0,600),sourcePublishedAt:date&&Number.isFinite(Date.parse(date))?new Date(date).toISOString():null}]}catch{return[]}})
}
export function eligibility(candidate,source,now=new Date(),maxAgeDays=45){
 const time=Date.parse(candidate.sourcePublishedAt||'')
 if(!Number.isFinite(time))return{eligible:false,reason:'missing-source-date',score:0}
 if(time>now.getTime()+300000)return{eligible:false,reason:'future-source-date',score:0}
 if(now.getTime()-time>maxAgeDays*86400000)return{eligible:false,reason:'old-source-date',score:0}
 const text=(candidate.title+' '+(candidate.summary||'')).toLowerCase()
 if(/caregiv|healthcare|wet.lab|universit|education|investment research|fundrais|donat|military|vulnerabilit|red.team/.test(text))return{eligible:false,reason:'not-current-editorial-focus',score:0}
 const relevant=/business|enterprise|commerce|product|agent|search|content|video|creativ|workflow|industr|manufactur|trade|market|export|import|supply|customs|tariff|policy review|seo|网站|客户|出海|人工智能/.test(text)
 return{eligible:relevant,reason:relevant?'relevant':'manual-topic-review',score:relevant?(source.section==='insights'?12:10)+Math.max(0,15-Math.floor((now.getTime()-time)/86400000)):0}
}
export function editorialSlug(url,source){return 'editorial-'+source.id+'-'+createHash('sha256').update(sourceURL(url,source)).digest('hex').slice(0,12)}
export async function feedText(response){
 if(!response.ok)throw new Error('HTTP '+response.status)
 const reader=response.body.getReader(),chunks=[];let size=0
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();throw new Error('Feed too large')}chunks.push(value)}}finally{reader.releaseLock()}
 return Buffer.concat(chunks).toString('utf8')
}
