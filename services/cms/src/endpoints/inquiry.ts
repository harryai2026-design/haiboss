import { timingSafeEqual } from 'node:crypto'
import type { Endpoint } from 'payload'
import { KEY_PATTERN, REFERENCE_PATTERN, validateInquiry, InquiryError } from '../../../inquiry-intake/validation.mjs'
export const inquiryEndpoint: Endpoint = {path:'/inquiry-ingest',method:'post',handler:async req => {
  const secret = process.env.INQUIRY_INGEST_SECRET || '', given = req.headers.get('x-inquiry-ingest-token') || ''
  if (secret.length < 32 || Buffer.byteLength(secret) !== Buffer.byteLength(given) || !timingSafeEqual(Buffer.from(secret),Buffer.from(given))) return Response.json({error:'Unauthorized'},{status:401})
  try {
    const input = await req.json!()
    if (!KEY_PATTERN.test(input?.submissionKey || '') || !REFERENCE_PATTERN.test(input?.reference || '') || !Number.isSafeInteger(input.acceptedAt) || input.acceptedAt < 1 || input.acceptedAt > Date.now()+60000) return Response.json({error:'Invalid receipt'},{status:400})
    const data = validateInquiry(input.data,{checkTiming:false})
    const key = input.submissionKey.toLowerCase()
    const find = async () => (await req.payload.find({collection:'inquiries',where:{submissionKey:{equals:key}},limit:1,depth:0,overrideAccess:true})).docs[0]
    let doc = await find()
    if (!doc) {
      try {doc = await req.payload.create({collection:'inquiries',data:{...data,submissionKey:key,reference:input.reference,receivedAt:new Date(input.acceptedAt).toISOString()},overrideAccess:true})}
      catch (error) {doc = await find(); if (!doc) throw error}
    }
    if (doc.reference !== input.reference) return Response.json({error:'Receipt conflict'},{status:409})
    return Response.json({doc:{reference:doc.reference}},{status:201})
  } catch (error) {
    req.payload.logger.warn('Inquiry delivery failed; intake will retry')
    return Response.json({error:error instanceof InquiryError ? error.message : 'Temporarily unavailable'},{status:error instanceof InquiryError ? error.status : 503})
  }
}}
