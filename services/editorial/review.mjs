import {createHash} from 'node:crypto'
export const EDITORIAL_MARKER='[HAIBOSS_EDITORIAL_V2]'
export function reviewFingerprint(doc){return createHash('sha256').update(JSON.stringify({slug:doc.slug,title:doc.title,description:doc.description,section:doc.section,contentType:doc.contentType,authorName:doc.authorName,cover:doc.cover||null,content:doc.content,sources:doc.sources,eventDate:doc.eventDate})).digest('hex')}
export function plainContent(node){return node?.text||node?.children?.map(plainContent).join('')||''}
export function editorialIssues(doc,now=new Date()){
 if(!doc.reviewNotes?.includes(EDITORIAL_MARKER))return[]
 const issues=[],text=plainContent(doc.content?.root)
 if(!doc.reviewNotes.includes('整理状态：ready'))issues.push('中文成稿尚未完成')
 if(!doc.title||!doc.description||text.length<300)issues.push('正文或摘要不完整')
 if(/编辑待办|待核验选题|TODO|TBD|LOREM|此稿未经核验/.test(text+' '+doc.title+' '+doc.description))issues.push('正文仍含编辑占位内容')
 if((doc.content?.root?.children||[]).filter(n=>n.type==='heading').length<3)issues.push('缺少事实、影响或行动建议等内容层次')
 if(!doc.sources?.length||doc.sources.some(s=>{try{return new URL(s.url).protocol!=='https:'||!Number.isFinite(Date.parse(s.checkedAt||''))||Date.parse(s.checkedAt)>now.getTime()+300000}catch{return true}}))issues.push('缺少已核查的 HTTPS 原始来源')
 if(doc.eventDate&&Date.parse(doc.eventDate)>now.getTime()+300000)issues.push('事件日期在未来')
 return issues
}
