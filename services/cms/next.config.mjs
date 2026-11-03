import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const dirname = path.dirname(fileURLToPath(import.meta.url))
export default withPayload({
  output:'standalone', outputFileTracingRoot:path.resolve(dirname,'../..'),
  experimental:{cpus:1},
  async redirects() { return [{ source:'/', destination:'/admin', permanent:false }] },
})
