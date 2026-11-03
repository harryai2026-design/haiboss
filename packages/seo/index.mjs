export const serializeJsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c')
export function organization({ name, url, description, email, type = 'Organization' }) {
  return { '@context': 'https://schema.org', '@type': type, '@id': `${url}/#organization`, name, url, description, ...(email ? { email } : {}) }
}
export function article({ title, description, url, publishedAt, updatedAt, author, locale }) {
  return { '@context': 'https://schema.org', '@type': 'Article', headline: title, description, mainEntityOfPage: url,
    inLanguage: locale, ...(publishedAt ? { datePublished: publishedAt } : {}), ...(updatedAt ? { dateModified: updatedAt } : {}),
    author: { '@type': 'Organization', name: author } }
}
export function product({ title, description, url, sku, image, attributes }) {
  return { '@context': 'https://schema.org', '@type': 'Product', name: title, description, url,
    ...(sku ? { sku } : {}), ...(image ? { image } : {}),
    ...(attributes?.length ? { additionalProperty: attributes.map(({ name, value }) => ({ '@type':'PropertyValue', name, value })) } : {}) }
}
export function breadcrumbs(items) {
  return { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement: items.map((x,i) => ({'@type':'ListItem',position:i+1,name:x.name,item:x.url})) }
}
