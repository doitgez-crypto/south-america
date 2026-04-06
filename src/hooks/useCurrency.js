import { useState, useEffect, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCached() {
  try {
    const raw = localStorage.getItem('fx_rates')
    if (!raw) return null
    const { ts, rates } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return rates
  } catch {
    return null
  }
}

function setCached(rates) {
  localStorage.setItem('fx_rates', JSON.stringify({ ts: Date.now(), rates }))
}

export function useCurrency() {
  const [rates, setRates]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const fetchRates = useCallback(async () => {
    const cached = getCached()
    if (cached) { setRates(cached); return }

    setLoading(true)
    setError(null)
    try {
      // Free tier endpoint (no key) falls back to open.er-api.com
      const url = API_KEY
        ? `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`
        : 'https://open.er-api.com/v6/latest/USD'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch exchange rates')
      const data = await res.json()
      const r = data.conversion_rates ?? data.rates
      setCached(r)
      setRates(r)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  /**
   * Convert amount from fromCurrency to toCurrency.
   * All rates are relative to USD as base.
   */
  const convert = useCallback((amount, fromCurrency, toCurrency) => {
    if (!rates || amount == null) return null
    const from = rates[fromCurrency?.toUpperCase()]
    const to   = rates[toCurrency?.toUpperCase()]
    if (!from || !to) return null
    // amount (fromCurrency) -> USD -> toCurrency
    return (amount / from) * to
  }, [rates])

  return { rates, loading, error, convert, refetch: fetchRates }
}
