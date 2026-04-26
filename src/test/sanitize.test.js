import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeUrl,
  sanitizeLinks,
  sanitizeAttractionPayload,
} from '../lib/sanitize'

// DOMPurify runs in the jsdom environment configured by vite.config.js

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('<b>hello</b>')).toBe('hello')
  })

  it('strips script tags', () => {
    expect(sanitizeText('<script>alert(1)</script>text')).toBe('text')
  })

  it('returns empty string for null', () => {
    expect(sanitizeText(null)).toBe('')
  })

  it('returns empty string for number', () => {
    expect(sanitizeText(123)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(sanitizeText(undefined)).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('preserves plain text', () => {
    expect(sanitizeText('Machu Picchu')).toBe('Machu Picchu')
  })
})

describe('sanitizeUrl', () => {
  it('accepts https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
  })

  it('accepts http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('returns null for invalid URLs', () => {
    expect(sanitizeUrl('not-a-url')).toBeNull()
    expect(sanitizeUrl('')).toBeNull()
  })

  it('returns null for ftp protocol', () => {
    expect(sanitizeUrl('ftp://example.com')).toBeNull()
  })

  it('returns null for javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
  })

  it('returns null for non-string input', () => {
    expect(sanitizeUrl(null)).toBeNull()
    expect(sanitizeUrl(123)).toBeNull()
    expect(sanitizeUrl(undefined)).toBeNull()
  })
})

describe('sanitizeLinks', () => {
  it('filters invalid URLs and keeps valid ones', () => {
    const result = sanitizeLinks(['https://example.com', 'bad-url', 'https://good.com'])
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('https://example.com/')
    expect(result[1]).toBe('https://good.com/')
  })

  it('returns empty array for null', () => {
    expect(sanitizeLinks(null)).toEqual([])
  })

  it('returns empty array for a non-array string', () => {
    expect(sanitizeLinks('https://example.com')).toEqual([])
  })

  it('returns empty array for empty array', () => {
    expect(sanitizeLinks([])).toEqual([])
  })

  it('returns empty array when all URLs are invalid', () => {
    expect(sanitizeLinks(['bad', 'also-bad'])).toEqual([])
  })
})

describe('sanitizeAttractionPayload', () => {
  const base = {
    name: 'Machu Picchu',
    description: 'An ancient Inca city',
    country: 'Peru',
    category: 'Trek',
    rating: 5,
  }

  it('strips system fields (id, trip_id, created_at, updated_at, created_by, is_deleted)', () => {
    const payload = {
      ...base,
      id: 'row-id',
      trip_id: 'trip-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      created_by: 'user-1',
      is_deleted: false,
    }
    const result = sanitizeAttractionPayload(payload)
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('trip_id')
    expect(result).not.toHaveProperty('created_at')
    expect(result).not.toHaveProperty('updated_at')
    expect(result).not.toHaveProperty('created_by')
    expect(result).not.toHaveProperty('is_deleted')
  })

  it('strips client-only computed fields (distance, status)', () => {
    const payload = { ...base, distance: 3.7, status: 'pending' }
    const result = sanitizeAttractionPayload(payload)
    expect(result).not.toHaveProperty('distance')
    expect(result).not.toHaveProperty('status')
  })

  it('preserves user-editable fields', () => {
    const result = sanitizeAttractionPayload(base)
    expect(result.name).toBe('Machu Picchu')
    expect(result.category).toBe('Trek')
    expect(result.rating).toBe(5)
  })

  it('converts rating=0 to null', () => {
    const result = sanitizeAttractionPayload({ ...base, rating: 0 })
    expect(result.rating).toBeNull()
  })

  it('preserves rating > 0', () => {
    const result = sanitizeAttractionPayload({ ...base, rating: 3 })
    expect(result.rating).toBe(3)
  })

  it('includes valid country from COUNTRIES enum', () => {
    const result = sanitizeAttractionPayload({ ...base, country: 'Peru' })
    expect(result.country).toBe('Peru')
  })

  it('omits country that is not in the COUNTRIES enum (prevents DB enum violation)', () => {
    const result = sanitizeAttractionPayload({ ...base, country: 'Narnia' })
    expect(result).not.toHaveProperty('country')
  })

  it('omits country key entirely when country is not in payload', () => {
    const { country: _unused, ...withoutCountry } = base
    const result = sanitizeAttractionPayload(withoutCountry)
    expect(result).not.toHaveProperty('country')
  })

  it('does not mutate the original object', () => {
    const original = { ...base, id: 'should-stay' }
    sanitizeAttractionPayload(original)
    expect(original.id).toBe('should-stay')
    expect(original.name).toBe('Machu Picchu')
  })

  it('sanitizes HTML in name', () => {
    const result = sanitizeAttractionPayload({ ...base, name: '<b>Inca</b>' })
    expect(result.name).toBe('Inca')
  })

  it('sanitizes HTML in description', () => {
    const result = sanitizeAttractionPayload({
      ...base,
      description: '<script>alert(1)</script>ruins',
    })
    expect(result.description).toBe('ruins')
  })

  it('deduplicates extra_categories', () => {
    const result = sanitizeAttractionPayload({
      ...base,
      extra_categories: ['Trek', 'Trek', 'Food'],
    })
    expect(result.extra_categories).toEqual(['Trek', 'Food'])
  })

  it('filters blank strings from extra_categories', () => {
    const result = sanitizeAttractionPayload({
      ...base,
      extra_categories: ['Trek', '', '   '],
    })
    expect(result.extra_categories).toEqual(['Trek'])
  })

  it('converts non-array extra_categories to empty array', () => {
    const result = sanitizeAttractionPayload({ ...base, extra_categories: 'Trek' })
    expect(result.extra_categories).toEqual([])
  })

  it('omits extra_categories key when not present in payload', () => {
    const result = sanitizeAttractionPayload(base)
    expect(result).not.toHaveProperty('extra_categories')
  })

  it('includes external_links as links after sanitization', () => {
    const result = sanitizeAttractionPayload({
      ...base,
      external_links: ['https://example.com', 'bad-url'],
    })
    expect(result.links).toEqual(['https://example.com/'])
    expect(result).not.toHaveProperty('external_links')
  })
})
