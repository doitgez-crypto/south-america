import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  filterAttractions,
  annotateWithDistance,
  fetchAttractions,
  createAttractionRecord,
  updateAttractionRecord,
  softDeleteAttraction,
} from '../services/attraction-service'

// ── Supabase + geocoding mocks ────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  function makeChain(result) {
    const c = {}
    ;['select', 'eq', 'order', 'insert', 'update'].forEach((m) => {
      c[m] = vi.fn(() => c)
    })
    c.single = vi.fn(() => Promise.resolve(result))
    c.then = (res, rej) => Promise.resolve(result).then(res, rej)
    c.catch = (fn) => Promise.resolve(result).catch(fn)
    c.finally = (fn) => Promise.resolve(result).finally(fn)
    return c
  }
  return { makeChain, mockFrom: vi.fn(), mockGeocode: vi.fn() }
})

vi.mock('../lib/supabase', () => ({
  supabase: { from: mocks.mockFrom },
}))

vi.mock('../lib/geocoding', () => ({
  geocodeLocation: mocks.mockGeocode,
}))

beforeEach(() => {
  mocks.mockFrom.mockReset()
  mocks.mockGeocode.mockReset()
  mocks.mockGeocode.mockResolvedValue(null) // default: geocoding returns nothing
})

// ── filterAttractions ─────────────────────────────────────────────────────────

describe('filterAttractions', () => {
  const attractions = [
    { name: 'Machu Picchu', country: 'Peru',   category: 'Trek',   rating: 5, description: 'Inca citadel' },
    { name: 'Salar de Uyuni', country: 'Bolivia', category: 'Viewpoint', rating: 4, description: 'Salt flats' },
    { name: 'Buenos Aires steak', country: 'Argentina', category: 'Food', rating: 3, description: 'Parrilla' },
  ]

  it('returns all attractions when filters is empty', () => {
    expect(filterAttractions(attractions, {})).toHaveLength(3)
  })

  it('filters by country', () => {
    const result = filterAttractions(attractions, { country: 'Peru' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Machu Picchu')
  })

  it('filters by category', () => {
    const result = filterAttractions(attractions, { category: 'Food' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Buenos Aires steak')
  })

  it('filters by minimum rating (inclusive)', () => {
    const result = filterAttractions(attractions, { rating: 4 })
    expect(result).toHaveLength(2)
    expect(result.map((a) => a.name)).toContain('Machu Picchu')
    expect(result.map((a) => a.name)).toContain('Salar de Uyuni')
  })

  it('filters by search term in name (case-insensitive)', () => {
    const result = filterAttractions(attractions, { search: 'machu' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Machu Picchu')
  })

  it('filters by search term in description', () => {
    const result = filterAttractions(attractions, { search: 'salt' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Salar de Uyuni')
  })

  it('combines multiple filters (AND logic)', () => {
    const result = filterAttractions(attractions, { country: 'Peru', rating: 5 })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Machu Picchu')
  })

  it('returns empty array when no attractions match', () => {
    const result = filterAttractions(attractions, { country: 'Ecuador' })
    expect(result).toHaveLength(0)
  })

  it('returns all attractions for empty array input', () => {
    expect(filterAttractions([], { country: 'Peru' })).toHaveLength(0)
  })
})

// ── annotateWithDistance ──────────────────────────────────────────────────────

describe('annotateWithDistance', () => {
  const attrWithCoords = [
    { name: 'Far',   coordinates: { lat: -20, lng: -70 } },
    { name: 'Near',  coordinates: { lat: -15.1, lng: -60.1 } },
    { name: 'NoCoords' },
  ]

  it('returns attractions unchanged when userCoords is null', () => {
    const result = annotateWithDistance(attrWithCoords, null)
    expect(result.every((a) => a.distance == null)).toBe(true)
  })

  it('annotates distance when userCoords provided', () => {
    const userCoords = { lat: -15, lng: -60 }
    const result = annotateWithDistance(attrWithCoords, userCoords)
    const near = result.find((a) => a.name === 'Near')
    expect(near.distance).toBeDefined()
    expect(near.distance).toBeGreaterThan(0)
    expect(near.distance).toBeLessThan(50) // should be ~15 km
  })

  it('skips distance annotation for attractions without coordinates', () => {
    const userCoords = { lat: -15, lng: -60 }
    const result = annotateWithDistance(attrWithCoords, userCoords)
    const noCoords = result.find((a) => a.name === 'NoCoords')
    expect(noCoords.distance).toBeUndefined()
  })

  it('sorts by distance ascending (closest first)', () => {
    const userCoords = { lat: -15, lng: -60 }
    const result = annotateWithDistance(attrWithCoords, userCoords)
    const withDist = result.filter((a) => a.distance != null)
    for (let i = 1; i < withDist.length; i++) {
      expect(withDist[i].distance).toBeGreaterThanOrEqual(withDist[i - 1].distance)
    }
  })

  it('handles empty attractions array', () => {
    expect(annotateWithDistance([], { lat: 0, lng: 0 })).toEqual([])
  })
})

// ── fetchAttractions (mocked Supabase) ───────────────────────────────────────

describe('fetchAttractions', () => {
  it('returns [] for falsy tripId without calling Supabase', async () => {
    expect(await fetchAttractions(null)).toEqual([])
    expect(mocks.mockFrom).not.toHaveBeenCalled()
  })

  it('returns the data array on success', async () => {
    const rows = [{ id: '1', name: 'Machu Picchu' }]
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: rows, error: null }))
    const result = await fetchAttractions('trip-1')
    expect(result).toEqual(rows)
  })

  it('queries the attractions table with correct filters', async () => {
    const chain = mocks.makeChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await fetchAttractions('trip-abc')
    expect(mocks.mockFrom).toHaveBeenCalledWith('attractions')
    expect(chain.eq).toHaveBeenCalledWith('trip_id', 'trip-abc')
    expect(chain.eq).toHaveBeenCalledWith('is_deleted', false)
  })

  it('throws when Supabase returns an error', async () => {
    const err = new Error('db error')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(fetchAttractions('trip-1')).rejects.toThrow('db error')
  })
})

// ── createAttractionRecord (mocked Supabase + geocoding) ─────────────────────

describe('createAttractionRecord', () => {
  const payload = { name: 'Torres del Paine', country: 'Chile', category: 'Trek' }

  it('returns the created record on success', async () => {
    const saved = { id: 'attr-1', ...payload, trip_id: 'trip-1' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: saved, error: null }))
    const result = await createAttractionRecord('trip-1', 'user-1', payload)
    expect(result).toEqual(saved)
  })

  it('calls geocodeLocation when no coordinates in payload', async () => {
    mocks.mockGeocode.mockResolvedValue({ lat: -51.0, lng: -73.0 })
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: { id: 'x' }, error: null }))
    await createAttractionRecord('trip-1', 'user-1', payload)
    expect(mocks.mockGeocode).toHaveBeenCalledWith(
      expect.stringContaining('Torres del Paine')
    )
  })

  it('proceeds without coordinates when geocoding returns null', async () => {
    mocks.mockGeocode.mockResolvedValue(null)
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await expect(createAttractionRecord('trip-1', 'user-1', payload)).resolves.toBeDefined()
  })

  it('nullifies zero-coordinate result from geocoding', async () => {
    mocks.mockGeocode.mockResolvedValue({ lat: 0, lng: 0 })
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await createAttractionRecord('trip-1', 'user-1', payload)
    // The insert payload should have coordinates=null (zero coords are stripped)
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ coordinates: null })
    )
  })

  it('proceeds gracefully when geocoding throws (covers catch path)', async () => {
    mocks.mockGeocode.mockRejectedValue(new Error('network error'))
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await expect(createAttractionRecord('trip-1', 'user-1', payload)).resolves.toBeDefined()
  })

  it('throws when Supabase returns an error', async () => {
    const err = new Error('insert error')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(
      createAttractionRecord('trip-1', 'user-1', payload)
    ).rejects.toThrow('insert error')
  })
})

// ── updateAttractionRecord ────────────────────────────────────────────────────

describe('updateAttractionRecord', () => {
  const payload = { name: 'Updated Name', country: 'Chile', category: 'Trek' }

  it('returns the updated record on success', async () => {
    mocks.mockGeocode.mockResolvedValue(null)
    const updated = { id: 'attr-1', name: 'Updated Name' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: updated, error: null }))
    const result = await updateAttractionRecord('attr-1', 'user-1', payload)
    expect(result).toEqual(updated)
  })

  it('sets last_edited_by on the updated row', async () => {
    mocks.mockGeocode.mockResolvedValue(null)
    const chain = mocks.makeChain({ data: { id: 'attr-1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await updateAttractionRecord('attr-1', 'user-1', payload)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_edited_by: 'user-1' })
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'attr-1')
  })

  it('nullifies zero-coordinate geocoding result', async () => {
    mocks.mockGeocode.mockResolvedValue({ lat: 0, lng: 0 })
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await updateAttractionRecord('attr-1', 'user-1', payload)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ coordinates: null })
    )
  })

  it('proceeds gracefully when geocoding throws (covers catch path)', async () => {
    mocks.mockGeocode.mockRejectedValue(new Error('geocode failure'))
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await expect(updateAttractionRecord('attr-1', 'user-1', payload)).resolves.toBeDefined()
  })

  it('throws when Supabase returns an error', async () => {
    mocks.mockGeocode.mockResolvedValue(null)
    const err = new Error('update failed')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(
      updateAttractionRecord('attr-1', 'user-1', payload)
    ).rejects.toThrow('update failed')
  })

  it('throws a Hebrew "no row found" error when Supabase returns no data and no error', async () => {
    mocks.mockGeocode.mockResolvedValue(null)
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: null }))
    await expect(
      updateAttractionRecord('attr-1', 'user-1', payload)
    ).rejects.toThrow('העדכון נכשל')
  })
})

// ── softDeleteAttraction ──────────────────────────────────────────────────────

describe('softDeleteAttraction', () => {
  it('resolves without error on success', async () => {
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: null }))
    await expect(softDeleteAttraction('attr-1', 'user-1')).resolves.toBeUndefined()
  })

  it('sets is_deleted=true and last_edited_by on the correct row', async () => {
    const chain = mocks.makeChain({ error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await softDeleteAttraction('attr-1', 'user-1')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_deleted: true, last_edited_by: 'user-1' })
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'attr-1')
  })

  it('throws a Hebrew permissions error for RLS code 42501', async () => {
    const rlsErr = { code: '42501', message: 'permission denied' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: rlsErr }))
    await expect(softDeleteAttraction('attr-1', 'user-1')).rejects.toThrow('שגיאת הרשאות')
  })

  it('throws a Hebrew permissions error when message contains "policy"', async () => {
    const policyErr = { code: '500', message: 'violates row-level security policy' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: policyErr }))
    await expect(softDeleteAttraction('attr-1', 'user-1')).rejects.toThrow('שגיאת הרשאות')
  })

  it('re-throws generic errors as-is', async () => {
    const err = new Error('connection reset')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: err }))
    await expect(softDeleteAttraction('attr-1', 'user-1')).rejects.toThrow('connection reset')
  })
})
