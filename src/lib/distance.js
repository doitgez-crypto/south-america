const R = 6371 // Earth radius in km

/**
 * Haversine great-circle distance between two lat/lng points (in km).
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

/**
 * Human-readable distance string (Hebrew units).
 * Returns null when km is null/undefined.
 */
export function formatDistance(km) {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} מ'`
  return `${km.toFixed(1)} ק"מ`
}
