import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { APIError, type CollectionConfig } from 'payload'
import { editor } from '../lib/access'
import { changed } from '../lib/publication'
import { site } from '@site/config'
export const Media: CollectionConfig = {
  slug:'media',labels:{singular:'媒体',plural:'公开媒体'},admin:{group:'内容',useAsTitle:'filename',description:'这里只保存可公开的图片；客户私有附件不要上传到此集合。'},
  access:{read:() => true,create:editor,update:editor,delete:editor},
  upload:{staticDir:process.env.MEDIA_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../media'),mimeTypes:['image/jpeg','image/png','image/webp','image/avif'],imageSizes:[{name:'card',width:900}],adminThumbnail:'card'},
  hooks:{afterChange:[changed],beforeDelete:[async ({id,req}) => {
    const relations = [...(site.features.articles ? [['articles','cover']] : []),...(site.features.products ? [['products','image']] : [])]
    for (const [collection,field] of relations) {
      for (const draft of [false,true]) {
        const result = await req.payload.find({collection:collection as 'articles',where:{[field]:{equals:id}},draft,limit:1,depth:0,overrideAccess:true,req})
        if (result.docs.length) throw new APIError('图片仍被内容引用，请先替换后删除',400)
      }
    }
  }]},
  fields:[{name:'alt',type:'text',required:true,label:'替代文本'}],
}
