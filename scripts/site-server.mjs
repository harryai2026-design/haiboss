import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {root,site} from '@site/config'
const require=createRequire(import.meta.url),{active}=require('../services/rebuild/publish.cjs')
const app=path.join(root,'apps/site')
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'}
const server=http.createServer(async(req,res)=>{
  const fail=status=>{res.writeHead(status,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});res.end(status===404?'Not found':'Temporarily unavailable')}
  if(site.features.inquiries&&['/api/inquiries','/api/inquiries/'].includes(req.url)){
    const upstream=http.request({hostname:'127.0.0.1',port:Number(process.env.INTAKE_PORT||44302),path:'/api/inquiries',method:req.method,headers:{...req.headers,host:`127.0.0.1:${process.env.INTAKE_PORT||44302}`}},response=>{res.writeHead(response.statusCode||503,response.headers);response.pipe(res)})
    upstream.once('error',()=>{if(!res.headersSent)fail(503);else res.destroy()})
    req.pipe(upstream);return
  }
  if(!['GET','HEAD'].includes(req.method))return fail(404)
  try{
    const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname)
    const redirects={'/index.html':'/','/about.html':'/about/','/contact.html':'/contact/','/cases.html':'/cases/','/solutions.html':'/services/','/pain-points.html':'/services/#pain-points','/ai-growth.html':'/services/#ai-growth','/growth-loop.html':'/services/#growth-loop'}
    if(redirects[pathname]){res.writeHead(301,{location:redirects[pathname]});res.end();return}
    if(pathname.includes('\\')||pathname.split('/').some(x=>x.startsWith('.')))return fail(404)
    const directory=path.resolve(active(app))
    let file=path.resolve(directory,`.${pathname}`)
    if(file!==directory&&!file.startsWith(directory+path.sep))return fail(404)
    const stat=await fs.promises.stat(file)
    if(stat.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(301,{location:pathname+'/'+url.search});res.end();return}
      file=path.join(file,'index.html')
    }
    const real=await fs.promises.realpath(file),realRoot=await fs.promises.realpath(directory)
    if(!real.startsWith(realRoot+path.sep))return fail(404)
    const size=(await fs.promises.stat(real)).size
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','content-length':size,'x-content-type-options':'nosniff','cache-control':pathname.startsWith('/_astro/')?'public,max-age=31536000,immutable':'no-cache'})
    if(req.method==='HEAD')res.end();else fs.createReadStream(real).pipe(res)
  }catch{fail(404)}
})
server.listen(Number(process.env.SITE_PORT||44321),'127.0.0.1',()=>console.log(`Static site: ${process.env.SITE_URL||'http://localhost:44321'}`))
process.on('SIGTERM',()=>server.close(()=>process.exit(0)))
