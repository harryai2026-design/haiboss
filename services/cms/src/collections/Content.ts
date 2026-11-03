import type { CollectionConfig, GlobalConfig } from 'payload'
import { editor, publicContent, owner } from '../lib/access'
import { changed, deleted } from '../lib/publication'
const slugField = {name:'slug',type:'text' as const,required:true,unique:true,index:true,label:'链接标识',validate:(value:any) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || '') && value.length < 120 || '使用小写英文、数字和短横线'}
export const Articles: CollectionConfig = {
  slug:'articles',labels:{singular:'文章',plural:'文章'},admin:{useAsTitle:'title',group:'内容'},
  access:{read:publicContent,create:editor,update:editor,delete:editor},versions:{drafts:true},
  hooks:{beforeChange:[({data,req})=>{
    if(req.user&&req.user.role!=='owner'&&(data?._status==='published'||data?.reviewApproved===true))throw new Error('Publishing requires the site owner; save a draft for review')
    return data
  }],afterChange:[changed],afterDelete:[deleted]},
  fields:[slugField,{name:'title',type:'text',localized:true,required:true,label:'标题'},{name:'description',type:'textarea',localized:true,required:true,label:'摘要 / SEO 描述'},
    {name:'content',type:'richText',localized:true,label:'正文'}, {name:'cover',type:'relationship',relationTo:'media',label:'封面'}, {name:'publishedAt',type:'date',label:'首次发布日期'},
    {name:'section',type:'select',defaultValue:'guides',label:'栏目',options:[{label:'出海情报',value:'insights'},{label:'AI 动态',value:'ai'},{label:'实战指南',value:'guides'}]},
    {name:'contentType',type:'select',defaultValue:'guide',label:'内容类型',options:[{label:'行业观察',value:'analysis'},{label:'工具解读',value:'tool'},{label:'实战指南',value:'guide'},{label:'动态短评',value:'news'},{label:'实测记录',value:'tested'}]},
    {name:'authorName',type:'text',defaultValue:'海老板编辑部',label:'作者'},
    {name:'featured',type:'checkbox',defaultValue:false,label:'首页精选'},
    {name:'topics',type:'relationship',relationTo:'topics',hasMany:true,label:'关联专题'},
    {name:'sources',type:'array',label:'原始来源',fields:[{name:'title',type:'text',required:true},{name:'url',type:'text',required:true,validate:(v:any)=>{try{return new URL(v).protocol==='https:'||'来源须为 HTTPS'}catch{return '来源网址无效'}}},{name:'checkedAt',type:'date',label:'核查日期'}]},
    {name:'eventDate',type:'date',label:'事件日期（仅有明确事件时填写）'},
    {name:'scheduledAt',type:'date',label:'预约发布时间',access:{create:({req})=>req.user?.role==='owner',update:({req})=>req.user?.role==='owner'}},
    {name:'reviewApproved',type:'checkbox',defaultValue:false,label:'已审核，可按排期发布',access:{create:({req})=>req.user?.role==='owner',update:({req})=>req.user?.role==='owner'}},
    {name:'reviewNotes',type:'textarea',label:'内部核验记录',access:{read:({req})=>Boolean(req.user)}},
  ],
}
export const Products: CollectionConfig = {
  slug:'products',labels:{singular:'产品',plural:'产品'},admin:{useAsTitle:'title',group:'产品'},
  access:{read:publicContent,create:editor,update:editor,delete:editor},versions:{drafts:true},hooks:{afterChange:[changed],afterDelete:[deleted]},
  fields:[slugField,{name:'title',type:'text',localized:true,required:true,label:'名称'},{name:'description',type:'textarea',localized:true,required:true,label:'简介'},
    {name:'sku',type:'text',label:'SKU'},{name:'image',type:'relationship',relationTo:'media',label:'产品图片'},
    {name:'details',type:'textarea',localized:true,label:'详细说明'},
    {name:'attributes',type:'array',label:'规格',fields:[{name:'name',type:'text',required:true,localized:true,label:'属性'},{name:'value',type:'text',required:true,localized:true,label:'值'}]}],
}
export const ReleaseJobs: CollectionConfig = {
  slug:'release-jobs',labels:{singular:'发布任务',plural:'发布任务'},admin:{useAsTitle:'reason',group:'网站设置',defaultColumns:['reason','state','updatedAt']},
  access:{read:editor,create:() => false,update:owner,delete:owner},
  fields:[{name:'reason',type:'text',required:true,admin:{readOnly:true}},{name:'state',type:'select',required:true,defaultValue:'pending',options:['pending','building','published','failed']},{name:'error',type:'textarea',admin:{readOnly:true}}],
}
export const SiteProfile: GlobalConfig = {
  slug:'site-profile',label:'网站内容',admin:{group:'网站设置'},access:{read:() => true,update:editor},
  hooks:{afterChange:[async ({doc,req}) => {
    if (!req.context.skipPublication) await req.payload.create({collection:'release-jobs',data:{reason:'site-profile',state:'pending'},overrideAccess:true,req})
    return doc
  }]},
  fields:[{name:'heading',type:'text',label:'首页标题'},{name:'intro',type:'textarea',label:'首页介绍'},{name:'email',type:'email',label:'公开联系邮箱'}],
}
