import React from 'react'
import { useAppContext } from '../../context/AppContext'

export default function FAB({ onClick }) {
  const { activeTab } = useAppContext()
  
  // Only show on Map and List tabs
  if (activeTab !== 'map' && activeTab !== 'list') return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-700 transition-all active:scale-90 z-40 group"
      aria-label="Add new attraction"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
