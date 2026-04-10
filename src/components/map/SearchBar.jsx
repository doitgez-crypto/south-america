import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

export default function SearchBar({ onLocationSelect }) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [showDropdown, setDropdown] = useState(false)
  const debounceRef                 = useRef(null)
  const containerRef                = useRef(null)

  useEffect(() => {
    // Close dropdown on outside click
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim() || query.length < 2) {
      setResults([])
      setDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '5',
          countrycodes: 'ar,br,cl,pe,bo,co,ec',
          addressdetails: '1',
        })
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'SouthAmericaTravelPlanner/1.0' } }
        )
        const data = await res.json()
        setResults(data)
        setDropdown(data.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [query])

  const handleSelect = (item) => {
    onLocationSelect({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name,
      country: item.address?.country || '',
    })
    setQuery(item.display_name.split(',')[0])
    setDropdown(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setDropdown(false)
  }

  return (
    <div ref={containerRef} className="relative bg-white border-b border-gray-100 px-3 py-2">
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
        {loading ? (
          <Loader2 size={18} className="text-gray-400 animate-spin flex-shrink-0" />
        ) : (
          <Search size={18} className="text-gray-400 flex-shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפש מיקום..."
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
          onFocus={() => results.length > 0 && setDropdown(true)}
        />
        {query && (
          <button onClick={handleClear} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full right-3 left-3 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden mt-1">
          {results.map((item) => (
            <button
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-primary-50 border-b border-gray-50 last:border-0 truncate"
            >
              <span className="font-medium">{item.display_name.split(',')[0]}</span>
              <span className="text-gray-400 text-xs block truncate">
                {item.display_name.split(',').slice(1, 3).join(',')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
