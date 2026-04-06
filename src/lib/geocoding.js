/**
 * Geocoding via Nominatim (OpenStreetMap) — free, no API key required.
 * Returns { lat, lng } or null.
 */
export async function geocodeLocation(locationName) {
  const encoded = encodeURIComponent(locationName)
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`

  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'SouthAmericaTravelPlanner/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
