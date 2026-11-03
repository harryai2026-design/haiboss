import { randomBytes } from 'node:crypto'
const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export function createInquiryReference() {
  const code = [...randomBytes(12)].map(byte => alphabet[byte & 31]).join('')
  return `IQ-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`
}
