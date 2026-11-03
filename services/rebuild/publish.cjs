const fs=require('node:fs')
const path=require('node:path')
const {randomUUID}=require('node:crypto')
function validate(directory){for(const name of ['index.html','robots.txt','llms.txt'])if(!fs.statSync(path.join(directory,name)).isFile()||!fs.statSync(path.join(directory,name)).size)throw new Error(`Missing release artifact: ${name}`)}
function copy(source,target){
  fs.mkdirSync(target,{recursive:true})
  for(const entry of fs.readdirSync(source,{withFileTypes:true})){
    if(entry.isSymbolicLink())throw new Error('Release artifacts cannot contain symlinks')
    const src=path.join(source,entry.name),dest=path.join(target,entry.name)
    if(entry.isDirectory())copy(src,dest);else if(!fs.existsSync(dest))fs.copyFileSync(src,dest)
  }
}
function record(app){const file=path.join(app,'.site-releases/current.json');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{current:null,previous:null}}
function safe(app,directory){const root=path.resolve(app,'.site-releases')+path.sep;if(!path.resolve(directory).startsWith(root))throw new Error('Unexpected release path');return directory}
function write(app,state){const file=path.join(app,'.site-releases/current.json');fs.writeFileSync(`${file}.tmp`,JSON.stringify(state));fs.renameSync(`${file}.tmp`,file)}
function active(app){const value=record(app).current;return value?safe(app,value):path.resolve(app,'dist')}
function publish(app,candidate){
  app=path.resolve(app);candidate=path.resolve(candidate)
  if(candidate!==path.join(app,'.dist-next'))throw new Error('Unexpected candidate directory')
  validate(candidate)
  const root=path.join(app,'.site-releases');fs.mkdirSync(root,{recursive:true})
  const release=path.join(root,`${Date.now()}-${randomUUID()}`)
  copy(candidate,release);validate(release)
  const old=record(app).current
  if(old&&fs.existsSync(path.join(safe(app,old),'_astro')))copy(path.join(old,'_astro'),path.join(release,'_astro'))
  write(app,{current:release,previous:old})
  return release
}
function rollback(app){
  app=path.resolve(app);const state=record(app)
  if(!state.previous)throw new Error('No previous release')
  validate(safe(app,state.previous));write(app,{current:state.previous,previous:state.current})
}
module.exports={publish,rollback,active}
if(require.main===module){const app=process.argv[2]||path.resolve(__dirname,'../../apps/site');if(process.argv[3]==='--rollback')rollback(app);else publish(app,path.join(app,'.dist-next'))}
