import React, { createContext, useContext, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ARGENTINA_BLUE_DOLLAR_DEFAULT } from '../lib/constants'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const auth = useAuth()

  // ── Navigation ─────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('map')

  // ── Shared filter (Map + List stay in sync) ────────────
  const [activeCategory, setActiveCategory] = useState('all')

  // ── Add Attraction Modal State ─────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addModalData, setAddModalData]     = useState(null)

  // ── Argentina Blue Dollar ──────────────────────────────
  const [blueRate, _setBlueRate] = useState(() => {
    const stored = Number(localStorage.getItem('ars_blue_rate'))
    return stored > 0 ? stored : ARGENTINA_BLUE_DOLLAR_DEFAULT
  })

  const [useBlueRate, _setUseBlueRate] = useState(() => {
    return localStorage.getItem('ars_use_blue') === 'true'
  })

  const setBlueRate = (val) => {
    _setBlueRate(val)
    localStorage.setItem('ars_blue_rate', String(val))
  }

  const setUseBlueRate = (val) => {
    _setUseBlueRate(val)
    localStorage.setItem('ars_use_blue', String(val))
  }

  return (
    <AppContext.Provider
      value={{
        // Auth
        ...auth,
        authLoading: auth.loading,

        // Navigation
        activeTab,
        setActiveTab,

        // Filter
        activeCategory,
        setActiveCategory,

        // Add Modal
        isAddModalOpen,
        setIsAddModalOpen,
        addModalData,
        setAddModalData,

        // Blue Dollar
        blueRate,
        setBlueRate,
        useBlueRate,
        setUseBlueRate,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
