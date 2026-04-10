import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useCategories } from '../../hooks/useCategories'
import { FILTER_CHIPS } from '../../lib/constants'
import CategoryManagementModal from './CategoryManagementModal'

export default function FilterChips() {
  const { activeCategory, setActiveCategory, profile } = useAppContext()
  const { categories: dbCategories } = useCategories(profile?.trip_id)
  const [managementOpen, setManagementOpen] = useState(false)

  // Show only db categories that have not been explicitly hidden
  const visibleDbCategories = dbCategories.filter((c) => c.is_visible !== false)

  return (
    <>
      <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar bg-white border-b border-gray-100 items-center">
        {/* Static built-in chips */}
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

        {/* Dynamic db categories */}
        {visibleDbCategories.map((cat) => {
          const active = activeCategory === cat.name
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white border border-earth-200 text-earth-700 hover:border-primary-300'
              }`}
            >
              {cat.icon ? `${cat.icon} ` : '📌 '}{cat.name}
            </button>
          )
        })}

        {/* Category management button */}
        <button
          onClick={() => setManagementOpen(true)}
          aria-label="נהל קטגוריות"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 border border-primary-200 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>

      <CategoryManagementModal
        isOpen={managementOpen}
        onClose={() => setManagementOpen(false)}
        tripId={profile?.trip_id}
      />
    </>
  )
}
