import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { registerSW } from 'virtual:pwa-register'
import { AppProvider } from './context/AppContext'

// Register Service Worker for PWA Offline Mode
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('תוכן חדש זמין. לטעון מחדש?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('האפליקציה מוכנה לעבודה במצב לא מקוון.')
  },
})

// Configure React Query Client for Offline-First Capability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <App />
      </AppProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)
