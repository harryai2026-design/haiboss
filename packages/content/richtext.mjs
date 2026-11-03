const escape = text => String(text ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
function safeLink(value) {
  if (typeof value !== 'string') return null
  if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return value
  try {const url = new URL(value); return ['http:','https:','mailto:'].includes(url.protocol) ? url.href : null} catch {return null}
}
export function renderRichText(content) {
  function render(node,depth=0) {
    if (!node || depth>40) return ''
    if (node.type === 'text') {
      let value = escape(node.text)
      if (node.format & 1) value = `<strong>${value}</strong>`
      if (node.format & 2) value = `<em>${value}</em>`
      if (node.format & 16) value = `<code>${value}</code>`
      return value
    }
    const body = Array.isArray(node.children) ? node.children.map(x => render(x,depth+1)).join('') : ''
    if (node.type === 'root') return body
    if (node.type === 'paragraph') return `<p>${body}</p>`
    if (node.type === 'heading') return `<${/^h[2-6]$/.test(node.tag) ? node.tag : 'h2'}>${body}</${/^h[2-6]$/.test(node.tag) ? node.tag : 'h2'}>`
    if (node.type === 'quote') return `<blockquote>${body}</blockquote>`
    if (node.type === 'list') {const tag = node.listType === 'number' ? 'ol' : 'ul'; return `<${tag}>${body}</${tag}>`}
    if (node.type === 'listitem') return `<li>${body}</li>`
    if (node.type === 'linebreak') return '<br>'
    if (['link','autolink'].includes(node.type)) {const href=safeLink(node.fields?.url); return href ? `<a href="${escape(href)}" rel="noopener noreferrer">${body}</a>` : body}
    return body
  }
  return render(content?.root)
}
