import { supabase } from '../lib/supabase'
import { sanitizeAttractionPayload } from '../lib/sanitize'
import { geocodeLocation } from '../lib/geocoding'
import { haversineKm } from '../lib/distance'

export async function fetchAttractions(tripId) {
  if (!tripId) return []
  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAttractionRecord(tripId, userId, payload) {
  const clean = sanitizeAttractionPayload(payload)

  if (!clean.coordinates && clean.name) {
    try {
      const coords = await geocodeLocation(`${clean.name}, ${clean.country}, South America`)
      if (coords) clean.coordinates = coords
    } catch {
      console.warn('Geocoding failed, proceeding without coordinates')
    }
  }

  if (clean.coordinates && clean.coordinates.lat === 0 && clean.coordinates.lng === 0) {
    clean.coordinates = null
  }

  const { data, error } = await supabase
    .from('attractions')
    .insert({ ...clean, trip_id: tripId, created_by: userId, last_edited_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAttractionRecord(id, userId, payload) {
  const clean = sanitizeAttractionPayload(payload)

  if (!clean.coordinates && clean.name) {
    try {
      const coords = await geocodeLocation(`${clean.name}, ${clean.country}`)
      if (coords) clean.coordinates = coords
    } catch {
      console.warn('Geocoding failed, preserving existing state')
    }
  }

  if (clean.coordinates && clean.coordinates.lat === 0 && clean.coordinates.lng === 0) {
    clean.coordinates = null
  }

  const { data, error } = await supabase
    .from('attractions')
    .update({ ...clean, last_edited_by: userId })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateAttractionRecord] Supabase error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      payload: clean,
    })
    throw error
  }
  if (!data) throw new Error('העדכון נכשל – לא נמצאה שורה לעדכון')
  return data
}

export async function softDeleteAttraction(id, userId) {
  const { error } = await supabase
    .from('attractions')
    .update({ is_deleted: true, last_edited_by: userId })
    .eq('id', id)
  if (error) {
    if (
      error.code === '42501' ||
      error.message?.includes('policy') ||
      error.message?.includes('permission')
    ) {
      throw new Error('שגיאת הרשאות: וודא שאתה מחובר לטיול הנכון')
    }
    throw error
  }
}

/**
 * Applies client-side filters to an attractions array.
 * @param {Array} attractions
 * @param {{ country?: string, category?: string, rating?: number|string, search?: string }} filters
 * @returns {Array}
 */
export function filterAttractions(attractions, filters = {}) {
  return attractions.filter((a) => {
    if (filters.country  && a.country  !== filters.country)       return false
    if (filters.category && a.category !== filters.category)      return false
    if (filters.rating   && a.rating   < Number(filters.rating))  return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!a.name.toLowerCase().includes(q) && !a.description?.toLowerCase().includes(q))
        return false
    }
    return true
  })
}

/**
 * Annotates each attraction with its distance from userCoords (km) and sorts by distance.
 * Returns attractions unchanged if userCoords is null.
 * @param {Array} attractions
 * @param {{ lat: number, lng: number }|null} userCoords
 * @returns {Array}
 */
export function annotateWithDistance(attractions, userCoords) {
  const annotated = attractions.map((a) => {
    if (userCoords && a.coordinates?.lat != null && a.coordinates?.lng != null) {
      return { ...a, distance: haversineKm(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng) }
    }
    return a
  })
  return annotated.sort((a, b) => {
    if (a.distance != null && b.distance != null) return a.distance - b.distance
    return 0
  })
}
