import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'

export default function LoginForm({ onSwitchToSignup }) {
  const { signIn } = useAppContext()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email: email.trim(), password })
    } catch (err) {
      setError('שם משתמש או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">דואר אלקטרוני</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-right"
          placeholder="you@example.com"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-right"
          placeholder="••••••••"
          dir="ltr"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
      >
        {loading ? 'מתחבר...' : 'כניסה'}
      </button>

      <p className="text-center text-sm text-gray-500">
        אין לך חשבון?{' '}
        <button type="button" onClick={onSwitchToSignup} className="text-primary-600 font-medium hover:underline">
          הירשם
        </button>
      </p>
    </form>
  )
}
