import { spawn,spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
const root = fileURLToPath(new URL('../', import.meta.url))
export function binary(workspace, pkg, name) {
  // Read the linked workspace dependency directly; some packages do not export package.json.
  const manifest = fs.realpathSync(path.join(root,workspace,'node_modules',pkg,'package.json'))
  const data = JSON.parse(fs.readFileSync(manifest,'utf8'))
  const entry = typeof data.bin === 'string' ? data.bin : data.bin[name || pkg]
  return path.resolve(path.dirname(manifest), entry)
}
export function launch(task, extraEnv = {}, options = {}) {
  const cms = path.join(root,'services/cms'), web = path.join(root,'apps/site')
  const buildDir=extraEnv.SITE_BUILD_DIR || process.env.SITE_BUILD_DIR
  if(['site:release','site:offline'].includes(task)){
    const candidate=path.resolve(buildDir||path.join(web,'.dist-next'))
    const expected=path.join(web,'.dist-next'),matrixRoot=path.join(root,'.local/matrix')+path.sep
    if(candidate!==expected&&!candidate.startsWith(matrixRoot))throw new Error('Refusing to clear an unexpected build directory')
    if(fs.existsSync(candidate)&&fs.lstatSync(candidate).isSymbolicLink())throw new Error('Candidate directory cannot be a symlink')
    // Only the validated candidate is cleared; the active release is never modified.
    if(process.platform==='win32'){
      // Native PowerShell handles this workspace's non-ASCII Windows paths reliably.
      const script="$target=[IO.Path]::GetFullPath($env:SITE_CANDIDATE_PATH); $approved=[IO.Path]::GetFullPath($env:SITE_CANDIDATE_APPROVED); if($target -ne $approved){throw 'Unexpected candidate path'}; if(Test-Path -LiteralPath $target){$item=Get-Item -LiteralPath $target -Force; if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Refusing a candidate junction'}; Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop}"
      const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,encoding:'utf8',env:{...process.env,SITE_CANDIDATE_PATH:candidate,SITE_CANDIDATE_APPROVED:candidate}})
      if(result.status!==0)throw new Error('Could not clear the approved candidate directory')
    }else fs.rmSync(candidate,{recursive:true,force:true})
    if(fs.existsSync(candidate))throw new Error('Candidate directory could not be cleared')
  }
  const commands = {
    'site:build': [binary('apps/site','astro'), 'build'],
    'site:release': [binary('apps/site','astro'), 'build','--outDir','.dist-next'],
    'site:offline': [binary('apps/site','astro'), 'build','--outDir',buildDir||'.dist-next'],
    'site:design': [binary('apps/site','astro'), 'dev','--host','127.0.0.1','--port','44322'],
    'site:dev': [binary('apps/site','astro'), 'dev', '--host','127.0.0.1','--port', process.env.SITE_PORT || '44321'],
    'site:preview': [binary('apps/site','astro'), 'preview','--host','127.0.0.1','--port', process.env.SITE_PORT || '44321'],
    'cms:build': [binary('services/cms','next'), 'build','--webpack'],
    'cms:dev': [binary('services/cms','next'), 'dev','--webpack','--hostname','127.0.0.1','--port',process.env.CMS_PORT || '44301'],
    'cms:start': [binary('services/cms','next'), 'start','--hostname','127.0.0.1','--port',process.env.CMS_PORT || '44301'],
    'cms:types': [binary('services/cms','payload'), 'generate:types'],
    'cms:migrate': [binary('services/cms','payload'), 'migrate'],
    'cms:migrate:create': [binary('services/cms','payload'), 'migrate:create'],
    'cms:importmap': [binary('services/cms','payload'), 'generate:importmap'],
  }
  const args = commands[task]
  if (!args) throw new Error(`Unknown task ${task}`)
  return spawn(process.execPath, args, { cwd:task.startsWith('cms:') ? cms : web, stdio:'inherit', env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',ASTRO_TELEMETRY_DISABLED:'1',...(['site:offline','site:design'].includes(task) ? {OFFLINE_PREVIEW:'1',STRICT_CONTENT_BUILD:'0'} : {}),...extraEnv}, ...options })
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const child = launch(process.argv[2])
  child.on('exit', async code => {
    process.exitCode = code ?? 1
    if(code === 0 && ['site:build','site:offline','site:release'].includes(process.argv[2])) {
      try {
        const {audit}=await import('./audit-build.mjs')
        const release=['site:release','site:offline'].includes(process.argv[2])
        console.log('Build audit:',JSON.stringify(audit(path.join(root,'apps/site',release?'.dist-next':'dist'))))
        if(release){const req=createRequire(import.meta.url);req('../services/rebuild/publish.cjs').publish(path.join(root,'apps/site'),path.join(root,'apps/site/.dist-next'));console.log('Static release activated')}
      }
      catch(error){console.error(error.message);process.exitCode=1}
    }
  })
}
