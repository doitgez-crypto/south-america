import React, { useState, useRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { EXPENSE_CATEGORY_ICONS, EXPENSE_CATEGORY_LABELS_HE, CURRENCY_SYMBOLS } from '../../lib/constants'

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const { description, category, amount_local, currency_code, amount_usd } = expense
  const [swiped, setSwiped] = useState(false)
  const touchStartX = useRef(null)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (dx > 60) setSwiped(true)
    else if (dx < -30) setSwiped(false)
    touchStartX.current = null
  }

  const sym = CURRENCY_SYMBOLS[currency_code] ?? ''

  return (
    <div
      className="relative overflow-hidden bg-white border-b border-gray-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Action buttons (revealed on swipe) */}
      <div
        className={`absolute inset-y-0 left-0 flex items-center gap-0 transition-all duration-200 ${
          swiped ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <button
          onClick={() => { setSwiped(false); onEdit(expense) }}
          className="h-full px-4 bg-blue-500 text-white flex items-center"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => { setSwiped(false); onDelete(expense.id) }}
          className="h-full px-4 bg-red-500 text-white flex items-center"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main row */}
      <div
        className={`flex items-center gap-3 px-4 py-3 transition-transform duration-200 ${
          swiped ? 'translate-x-24' : 'translate-x-0'
        }`}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
          {EXPENSE_CATEGORY_ICONS[category] ?? '📋'}
        </div>

        {/* Description + category */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate">
            {description || EXPENSE_CATEGORY_LABELS_HE[category]}
          </p>
          <p className="text-xs text-gray-400">{EXPENSE_CATEGORY_LABELS_HE[category]}</p>
        </div>

        {/* Amounts */}
        <div className="text-left flex-shrink-0" dir="ltr">
          <p className="font-semibold text-gray-800">
            {sym}{amount_local?.toLocaleString()}
          </p>
          {amount_usd != null && (
            <p className="text-xs text-gray-400">${amount_usd.toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
