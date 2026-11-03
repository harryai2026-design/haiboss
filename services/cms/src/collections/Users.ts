import type { CollectionConfig } from 'payload'
import { owner, ownerField } from '../lib/access'
export const Users: CollectionConfig = {
  slug:'users', auth:{cookies:{secure:process.env.SITE_ENVIRONMENT==='production',sameSite:'Lax'}},
  admin:{useAsTitle:'email',group:'系统'},
  access:{create:owner,delete:owner,read:({req}) => req.user?.role === 'owner' ? true : req.user ? {id:{equals:req.user.id}} : false,update:({req}) => req.user?.role === 'owner' ? true : req.user ? {id:{equals:req.user.id}} : false},
  hooks:{beforeChange:[async ({data,operation,req}) => {
    if (operation === 'create') {
      const {totalDocs} = await req.payload.count({collection:'users',overrideAccess:true,req})
      if (totalDocs === 0) data.role = 'owner'
    }
    return data
  }]},
  fields:[{name:'name',type:'text',label:'姓名'},{name:'role',type:'select',required:true,defaultValue:'editor',label:'权限',options:[{label:'站点所有者',value:'owner'},{label:'内容编辑',value:'editor'}],access:{update:ownerField}}],
}
