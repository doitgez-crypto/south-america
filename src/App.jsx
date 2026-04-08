import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAppContext } from './context/AppContext'
import { LoadingSkeleton } from './components/ui/LoadingSkeleton'
import AuthScreen from './components/auth/AuthScreen'
import AppShell from './components/layout/AppShell'

function App() {
  const { user, profile, authLoading, signOut, error } = useAppContext()
  const [showLogout, setShowLogout] = React.useState(false)

  React.useEffect(() => {
    let timer
    if (authLoading || (user && !profile?.trip_id)) {
      timer = setTimeout(() => setShowLogout(true), 3000)
    } else {
      setShowLogout(false)
    }
    return () => clearTimeout(timer)
  }, [authLoading, user, profile])

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-earth-50 p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-earth-800 mb-2 font-display">שגיאה בהתחברות</h2>
        <p className="text-earth-600 mb-6 max-w-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  // Use Skeleton while waiting for initial auth (zero-delay skips this if user in cache)
  if (authLoading) {
    return <LoadingSkeleton />
  }

  // If no user is found after initial check, show auth screen
  if (!user) return <AuthScreen />

  // If we have a user but profile hasn't loaded yet, show Skeleton with a logout option
  if (!profile) {
    return (
      <div className="relative h-screen w-full">
        <LoadingSkeleton />
        {showLogout && (
          <div className="fixed inset-x-0 bottom-32 flex flex-col items-center gap-2 z-[100]">
            <button 
              onClick={() => signOut()}
              className="px-4 py-2 bg-white/80 backdrop-blur border border-earth-200 text-earth-600 font-semibold rounded-full shadow-lg hover:bg-white transition-all text-sm"
            >
              לוקח יותר מדי זמן? התנתק ונסה שוב
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="text-earth-400 hover:text-earth-600 text-xs underline"
            >
              ניקוי נתונים מלא (Hard reset)
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <AppShell />
      <ToastContainer position="bottom-left" theme="colored" rtl />
    </>
  )
}

export default App
