import test from 'node:test'
import assert from 'node:assert/strict'
import {byteRange} from '../services/static/byte-range.mjs'
test('video byte ranges support seeking, suffix reads and boundaries',()=>{
 assert.deepEqual(byteRange('bytes=0-31',100),{start:0,end:31})
 assert.deepEqual(byteRange('bytes=40-',100),{start:40,end:99})
 assert.deepEqual(byteRange('bytes=-20',100),{start:80,end:99})
 assert.deepEqual(byteRange('bytes=-200',100),{start:0,end:99})
 assert.deepEqual(byteRange('bytes=99-999',100),{start:99,end:99})
 assert.equal(byteRange(undefined,100),undefined)
 assert.equal(byteRange('items=1-2',100),undefined)
})
test('unsatisfiable and malformed video ranges cannot read beyond the file',()=>{
 for(const range of ['bytes=100-','bytes=5-2','bytes=-0','bytes=-','bytes=0-2,5-6','bytes=9007199254740992-','bytes=1.5-2'])assert.equal(byteRange(range,100),null,range)
 assert.equal(byteRange('bytes=0-0',0),null)
})
