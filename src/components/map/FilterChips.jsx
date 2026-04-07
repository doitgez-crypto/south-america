import React from 'react'
import { useAppContext } from '../../context/AppContext'
import { FILTER_CHIPS } from '../../lib/constants'

export default function FilterChips() {
  const { activeCategory, setActiveCategory } = useAppContext()

  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
      {FILTER_CHIPS.map(({ value, label }) => {
        const active = activeCategory === value
        return (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              active
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white border border-earth-200 text-earth-700 hover:border-primary-300'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
