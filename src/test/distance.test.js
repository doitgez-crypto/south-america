import { describe, it, expect } from 'vitest'
import { haversineKm, formatDistance } from '../lib/distance'

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(0, 0, 0, 0)).toBe(0)
    expect(haversineKm(-34.6, -58.4, -34.6, -58.4)).toBe(0)
  })

  it('Buenos Aires → Santiago is roughly 1130–1180 km', () => {
    const km = haversineKm(-34.6, -58.4, -33.45, -70.67)
    expect(km).toBeGreaterThan(1100)
    expect(km).toBeLessThan(1200)
  })

  it('is symmetric (A→B equals B→A)', () => {
    const ab = haversineKm(-34.6, -58.4, -33.45, -70.67)
    const ba = haversineKm(-33.45, -70.67, -34.6, -58.4)
    expect(ab).toBeCloseTo(ba, 6)
  })

  it('returns a positive finite number for valid coordinates', () => {
    const km = haversineKm(-15, -60, -20, -65)
    expect(isFinite(km)).toBe(true)
    expect(isNaN(km)).toBe(false)
    expect(km).toBeGreaterThan(0)
  })

  it('handles coordinates at the origin (0, 0)', () => {
    const km = haversineKm(0, 0, 1, 1)
    expect(km).toBeGreaterThan(0)
    expect(km).toBeLessThan(200)
  })

  it('handles short distances correctly (< 1 km)', () => {
    // ~111 m apart
    const km = haversineKm(0, 0, 0.001, 0)
    expect(km).toBeGreaterThan(0)
    expect(km).toBeLessThan(0.2)
  })
})

describe('formatDistance', () => {
  it('returns null for null', () => {
    expect(formatDistance(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(formatDistance(undefined)).toBeNull()
  })

  it('formats 0 km as metres', () => {
    expect(formatDistance(0)).toBe("0 מ'")
  })

  it('formats sub-km distances in metres (Hebrew unit)', () => {
    expect(formatDistance(0.5)).toBe("500 מ'")
    expect(formatDistance(0.123)).toBe("123 מ'")
  })

  it('formats distances ≥ 1 km with one decimal (Hebrew unit)', () => {
    expect(formatDistance(1)).toBe('1.0 ק"מ')
    expect(formatDistance(1.567)).toBe('1.6 ק"מ')
    expect(formatDistance(120)).toBe('120.0 ק"מ')
  })
})
