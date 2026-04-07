import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { Copy, Check, LogOut } from 'lucide-react'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function TripSetupScreen() {
  const { setTripId, signOut, user } = useAppContext()

  const [newTripId, setNewTripId]   = useState('')
  const [joinCode, setJoinCode]     = useState('')
  const [copied, setCopied]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [mode, setMode]             = useState(null) // 'new' | 'join' | null

  const handleCreateTrip = async () => {
    const id = generateUUID()
    setNewTripId(id)
    setLoading(true)
    try {
      await setTripId(id)
    } catch (err) {
      setError('נכשל ביצירת הטיול. נסה שוב.')
      setNewTripId('')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTrip = async (e) => {
    e.preventDefault()
    setError('')
    const code = joinCode.trim()
    if (!code) return
    setLoading(true)
    try {
      await setTripId(code)
    } catch (err) {
      setError('קוד הטיול לא נמצא. בדוק ונסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(newTripId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🗺️</div>
          <h1 className="text-2xl font-bold text-earth-800">ברוך הבא!</h1>
          <p className="text-earth-500 text-sm mt-1">
            {user?.email}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 text-center">הגדר את הטיול שלך</h2>

          {!mode && (
            <div className="space-y-3">
              <button
                onClick={() => { setMode('new'); handleCreateTrip() }}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>✈️</span> צור טיול חדש
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 bg-white border-2 border-primary-300 hover:border-primary-500 text-primary-600 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>🤝</span> הצטרף לטיול קיים
              </button>
            </div>
          )}

          {mode === 'new' && !newTripId && (
            <div className="text-center py-4">
              <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 mt-2">יוצר טיול...</p>
            </div>
          )}

          {mode === 'new' && newTripId && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">קוד הטיול שלך — שתף עם חבר הטיול:</p>
              <div className="flex items-center gap-2 bg-earth-50 border border-earth-200 rounded-xl p-3">
                <span className="flex-1 font-mono text-sm text-earth-800 break-all" dir="ltr">
                  {newTripId}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-primary-500 hover:text-primary-700 transition-colors flex-shrink-0"
                  title="העתק"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                {copied ? 'הועתק! ✓' : 'לחץ על הסמל להעתקה'}
              </p>
            </div>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoinTrip} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">הכנס קוד טיול</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono text-sm"
                dir="ltr"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? 'מצטרף...' : 'הצטרף'}
              </button>
              <button
                type="button"
                onClick={() => { setMode(null); setError('') }}
                className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm"
              >
                חזרה
              </button>
            </form>
          )}

          {error && mode !== 'join' && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <button
          onClick={signOut}
          className="mt-4 w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm py-2"
        >
          <LogOut size={16} /> יציאה
        </button>
      </div>
    </div>
  )
}
