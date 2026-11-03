import fs from 'node:fs'
import path from 'node:path'
import {root} from '@site/config'
const base='https://cms.haiboss.com'
const assert=(v,message)=>{if(!v)throw new Error(message)}
const health=await fetch(base+'/api/health',{signal:AbortSignal.timeout(20000)});assert(health.status===200&&(await health.json()).ok,'Public CMS database health failed')
const articles=await fetch(base+'/api/articles?limit=100&depth=0',{signal:AbortSignal.timeout(20000)});const listing=await articles.json();assert(articles.status===200&&listing.totalDocs===8,'Public CMS content check failed')
assert(listing.docs.every(doc=>typeof doc.title==='string'&&doc.title.length>0&&typeof doc.description==='string'&&doc.description.length>0),'Default-locale article fields missing')
const identity=JSON.parse(fs.readFileSync(process.env.OWNER_BOOTSTRAP_FILE,'utf8'))
const login=await fetch(base+'/api/users/login',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({email:identity.email,password:identity.password}),signal:AbortSignal.timeout(20000)})
assert(login.status===200,'Public owner login failed')
const result=await login.json();assert(result.user?.role==='owner','Unexpected CMS owner identity')
const cookies=login.headers.getSetCookie(),session=cookies.find(x=>x.startsWith('payload-token='));assert(session&&/;\s*HttpOnly/i.test(session)&&/;\s*Secure/i.test(session),'Public session cookie flags incorrect')
const cookie=session.split(';')[0]
const me=await fetch(base+'/api/users/me',{headers:{cookie,origin:base},signal:AbortSignal.timeout(20000)});const account=await me.json();assert(me.status===200&&account.user?.role==='owner','Public authenticated identity check failed')
const logout=await fetch(base+'/api/users/logout',{method:'POST',headers:{cookie,origin:base},signal:AbortSignal.timeout(20000)});assert(logout.status===200,'Public owner logout failed')
const report={at:new Date().toISOString(),publicCMSHealth:true,publicArticles:8,defaultLocaleFieldsVerified:true,ownerLogin:true,ownerIdentity:true,secureHttpOnlyCookie:true,logout:true,secretsDisplayed:false,paidRequests:0}
fs.writeFileSync(path.join(root,'.local/evidence/public-cms.json'),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report))
