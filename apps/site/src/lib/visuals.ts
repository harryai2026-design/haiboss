// Editorial scene art is a presentation fallback; CMS covers remain authoritative.
export const sceneArt = {
 insights: {src:'/assets/editorial/global-trade.webp',alt:'海港、货轮与信息连接的 AI 场景示意',label:'全球贸易 · AI 场景示意'},
 ai: {src:'/assets/editorial/ai-network.webp',alt:'玻璃神经球与信息节点的 AI 概念图',label:'AI 应用 · AI 概念图'},
 guides: {src:'/assets/editorial/research-desk.webp',alt:'研究笔记、电脑与资料的 AI 工作场景示意',label:'实战方法 · AI 场景示意'},
}
export function coverFor(item:any) {
 const cover=item?.cover
 if(cover&&typeof cover==='object'&&cover.url){
  try {
   const url=new URL(cover.url,'https://cms.haiboss.com')
   if(url.protocol==='https:'&&url.hostname==='cms.haiboss.com')return {src:url.href,alt:cover.alt||item.title,label:'文章配图'}
  }catch{}
 }
 return sceneArt[item?.section as keyof typeof sceneArt]||sceneArt.guides
}
export const topicRoutes:Record<string,{section:string;steps:string[]}>={
 'market-to-customer':{section:'insights',steps:['确认产品与市场条件','建立买家画像与样本','保留依据，准备下一次沟通']},
 'ai-workflows':{section:'ai',steps:['了解工具能力与限制','准备可使用的业务资料','试跑、核对、再决定扩展']},
 'content-to-inquiry':{section:'guides',steps:['整理买家真正关心的问题','建立有依据的内容资产','连接搜索、咨询与持续更新']},
}
