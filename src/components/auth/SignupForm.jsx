import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'

export default function SignupForm({ onSwitchToLogin }) {
  const { signUp } = useAppContext()
  const [email, setEmail]               = useState('')
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }
    setLoading(true)
    try {
      const data = await signUp({ email: email.trim(), password, username: username.trim() })
      
      // If we got here, signup didn't throw an error.
      // If session is null, Supabase requires email verification.
      if (data?.session === null) {
        alert('ההרשמה הצליחה! אך חובה לאשר את האימייל. בדוק את תיבת הדואר שלך (כולל ספאם) לחץ על הקישור וחזור להתחבר כאן.')
        onSwitchToLogin()
      } else {
        // If there's a session, App.jsx will automatically redirect because useAuth will detect it.
        alert('ההרשמה בוצעה בהצלחה!')
      }
    } catch (err) {
      const msg = err.message
      if (msg.includes('already registered')) {
        setError('משתמש זה כבר רשום במערכת. לחץ על "התחבר" למטה.')
      } else {
        setError(msg ?? 'ההרשמה נכשלה. נסה שוב.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          placeholder="שם המשתמש שלך"
        />
      </div>
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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          placeholder="••••••••"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">אמת סיסמה</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
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
        {loading ? 'נרשם...' : 'הרשמה'}
      </button>

      <p className="text-center text-sm text-gray-500">
        כבר יש לך חשבון?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-primary-600 font-medium hover:underline">
          התחבר
        </button>
      </p>
    </form>
  )
}
