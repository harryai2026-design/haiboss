import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'
export const changed: CollectionAfterChangeHook = async ({doc,previousDoc,req,collection}) => {
  if (req.context.skipPublication) return doc
  if (doc._status === 'published' || previousDoc?._status === 'published' || !('_status' in doc)) {
    await req.payload.create({collection:'release-jobs',data:{reason:`${collection.slug}:${doc.id}`,state:'pending'},req,overrideAccess:true})
  }
  return doc
}
export const deleted: CollectionAfterDeleteHook = async ({doc,req,collection}) => {
  if (!req.context.skipPublication) await req.payload.create({collection:'release-jobs',data:{reason:`${collection.slug}:deleted:${doc.id}`,state:'pending'},req,overrideAccess:true})
}
let started = false
export function startPublicationWorker(payload: Payload) {
  if (started || process.env.DISABLE_WORKERS === '1') return
  started = true
  let busy = false
  const timer = setInterval(async () => {
    if (busy || !process.env.BUILD_HOOK_URL) return
    busy = true
    try {
      const {docs} = await payload.find({collection:'release-jobs',where:{state:{in:['pending','building']}},limit:50,sort:'createdAt',overrideAccess:true})
      for (const job of docs) {
        // The same persisted ID is reconciled after network failures or process restarts.
        const res = await fetch(process.env.BUILD_HOOK_URL!,{method:'POST',headers:{'content-type':'application/json','x-rebuild-token':process.env.REBUILD_SECRET || ''},body:JSON.stringify({requestId:`job-${job.id}`,retry:job.state==='pending'&&Boolean(job.error)}),signal:AbortSignal.timeout(8000)})
        if (!res.ok) throw new Error('Build hook unavailable')
        const result = await res.json()
        const state = result.status === 'published' ? 'published' : result.status === 'failed' ? 'failed' : 'building'
        await payload.update({collection:'release-jobs',id:job.id,data:{state,...(state === 'failed' ? {error:'Build failed. Review local build log, then set state to pending to retry.'} : {error:''})},overrideAccess:true})
      }
    } catch { payload.logger.warn('Publication pending; hook unavailable or reconciliation failed') }
    finally {busy=false}
  },5000)
  timer.unref()
}
