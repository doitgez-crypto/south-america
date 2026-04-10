import DOMPurify from 'dompurify'
import { COUNTRIES } from './constants'

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
 * Only includes optional fields (country, external_links) when explicitly provided,
 * so partial PATCH calls don't overwrite unrelated columns.
 */
export function sanitizeAttractionPayload(payload) {
  const { country, external_links, ...rest } = payload

  const result = {
    ...rest,
    name: sanitizeText(payload.name),
    description: sanitizeText(payload.description),
  }

  // rating=0 means "no rating" — DB CHECK requires rating >= 1 so send null to clear it
  if (result.rating !== undefined) {
    result.rating = result.rating > 0 ? result.rating : null
  }

  // Only send country when it's a valid DB enum value
  if (country !== undefined) {
    if (COUNTRIES.includes(country)) {
      result.country = country
    }
    // Invalid/unknown country value — omit from PATCH to avoid enum violation
  }

  // Only send links when explicitly included in the payload
  if (external_links !== undefined) {
    result.links = sanitizeLinks(external_links)
  }

  return result
}
