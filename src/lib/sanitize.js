import DOMPurify from 'dompurify'

/**
 * Sanitize a plain-text string — strips all HTML tags.
 * Use for names, descriptions, usernames, etc.
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return ''
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

/**
 * Validate and sanitize a URL string.
 * Returns the URL if valid, or null.
 */
export function sanitizeUrl(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize an array of URL strings, filtering out invalid ones.
 */
export function sanitizeLinks(links) {
  if (!Array.isArray(links)) return []
  return links.map(sanitizeUrl).filter(Boolean)
}

/**
 * Sanitize an entire attraction form payload before saving.
 */
export function sanitizeAttractionPayload(payload) {
  return {
    ...payload,
    name: sanitizeText(payload.name),
    description: sanitizeText(payload.description),
    links: sanitizeLinks(payload.links),
    currency_code: sanitizeText(payload.currency_code).toUpperCase().slice(0, 3),
  }
}
