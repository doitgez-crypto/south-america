import { useState, useEffect } from 'react'

const LS_KEY = 'lastUserLocation'

/**
 * Tracks the user's GPS position via watchPosition.
 * Falls back to the last known position stored in localStorage so the
 * distance values are available immediately on page load even before
 * the device obtains a fresh fix.
 *
 * Returns: { coords: { lat, lng } | null, error: string | null, loading: boolean }
 */
export function useUserLocation() {
  const stored = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
  const [coords, setCoords]   = useState(stored)  // { lat, lng } or null
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS לא נתמך בדפדפן זה')
      setLoading(false)
      return
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        setError(null)
        setLoading(false)
        try { localStorage.setItem(LS_KEY, JSON.stringify(c)) } catch {}
      },
      (err) => {
        // Don't clear existing coords on error — stale is better than nothing
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 }
    )

    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { coords, error, loading }
}
