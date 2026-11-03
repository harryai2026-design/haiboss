import {site} from '@site/config'
import {documents,profile} from '@site/content'
export const sections={insights:{title:'出海情报',intro:'从市场、渠道与采购变化里，看懂与你有关的机会。',eyebrow:'MARKET INTELLIGENCE'},ai:{title:'AI 动态',intro:'关注能进入真实业务的 AI 能力，讲清用途、条件和边界。',eyebrow:'AI IN PRACTICE'},guides:{title:'实战指南',intro:'把客户开发、内容与团队工作，拆成可以开始的一步。',eyebrow:'FIELD GUIDES'}}
export const types={analysis:'行业观察',tool:'工具解读',guide:'实战指南',news:'动态短评',tested:'实测记录'}
export async function buildPages(){
 const business=await profile(),articles=await documents('articles'),topics=await documents('topics'),services=await documents('services'),cases=await documents('cases')
 const common={locale:site.defaultLocale,business,articles,topics,services,cases,alternates:[]}
 const base=[['home','/','海老板｜出海情报、AI 应用与增长服务'],['articles','/articles/','全部内容'],...Object.entries(sections).map(([k,v])=>[k,'/'+k+'/',v.title]),['services','/services/','增长服务'],['cases','/cases/','案例与方案'],['about','/about/','关于海老板'],['contact','/contact/','聊聊你的出海问题'],['search','/search/','搜索内容'],['privacy','/privacy/','隐私说明']]
 return [...base.map(([kind,path,title])=>({...common,kind,path,title,key:kind,description:sections[kind]?.intro||site.description})),...articles.map(doc=>({...common,kind:'article',path:'/articles/'+doc.slug+'/',title:doc.title,description:doc.description,key:doc.slug,doc})),...topics.map(doc=>({...common,kind:'topic',path:'/topics/'+doc.slug+'/',title:doc.title,description:doc.description,key:'topic:'+doc.slug,doc}))]
}
