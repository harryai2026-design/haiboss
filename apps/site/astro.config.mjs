import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { site } from '@site/config'
import { resolveDomains } from '@site/config/domains'
const urls = resolveDomains(process.env)
export default defineConfig({
  site:urls.site,trailingSlash:'always',
  server:{host:'127.0.0.1',port:Number(process.env.SITE_PORT || 44321)},
  vite:{
    server:{watch:{ignored:['**/.dist-next/**','**/.site-releases/**','**/dist/**']},proxy:site.features.inquiries?{'/api/inquiries':{target:`http://127.0.0.1:${process.env.INTAKE_PORT || 44302}`,changeOrigin:false,rewrite:value=>value.replace(/\/$/,'')}}:{}},
  },
  integrations:[sitemap({filter:url=>!url.endsWith('/404/')&&!url.endsWith('/404.html')})],
})
