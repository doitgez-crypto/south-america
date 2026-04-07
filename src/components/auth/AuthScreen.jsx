import React, { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌎</div>
          <h1 className="text-2xl font-bold text-earth-800 leading-tight">
            מתכנן טיולי
          </h1>
          <h1 className="text-2xl font-bold text-primary-600 leading-tight">
            דרום אמריקה
          </h1>
          <p className="mt-2 text-earth-500 text-sm">
            תכנן את הרפתקת חייך יחד
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון'}
          </h2>

          {mode === 'login' ? (
            <LoginForm onSwitchToSignup={() => setMode('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
