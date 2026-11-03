import type { CollectionConfig } from 'payload'
import { owner } from '../lib/access'
export const Inquiries: CollectionConfig = {
  slug:'inquiries',labels:{singular:'询盘',plural:'询盘'},admin:{group:'销售',useAsTitle:'reference',defaultColumns:['reference','name','email','status','receivedAt']},
  access:{read:owner,create:() => false,update:owner,delete:owner},
  fields:[
    {name:'submissionKey',type:'text',required:true,unique:true,index:true,admin:{hidden:true}},
    {name:'reference',type:'text',required:true,unique:true,admin:{readOnly:true},access:{update:() => false}},
    ...['name','email','company','phone','country','locale','type','productHandle','productSku','productTitle','source'].map(name => ({name,type:'text' as const,admin:{readOnly:true}})),
    {name:'message',type:'textarea',admin:{readOnly:true}}, {name:'items',type:'json',admin:{readOnly:true}}, {name:'attribution',type:'json',admin:{readOnly:true}},
    {name:'receivedAt',type:'date',required:true,admin:{readOnly:true}},
    {name:'status',type:'select',defaultValue:'new',options:['new','following','quoted','won','lost','closed'],label:'跟进阶段'},
    {name:'notes',type:'textarea',label:'内部备注'}, {name:'nextFollowUpAt',type:'date',label:'下次跟进'},
    {name:'notification',type:'group',label:'邮件通知',admin:{readOnly:true},fields:[{name:'state',type:'select',defaultValue:'pending',options:[{label:'待配置或待发送',value:'pending'},{label:'供应商已受理（送达待核验）',value:'sent'},{label:'需要处理',value:'failed'}]},{name:'attempts',type:'number',defaultValue:0},{name:'sentAt',type:'date',label:'供应商受理时间'},{name:'lastError',type:'text'},{name:'nextAttemptAt',type:'date'}]},
  ],
}
