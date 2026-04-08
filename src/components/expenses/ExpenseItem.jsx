import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { EXPENSE_CATEGORY_ICONS, EXPENSE_CATEGORY_LABELS_HE, CURRENCY_SYMBOLS } from '../../lib/constants'

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const { title, category, amount, currency } = expense
  const sym = CURRENCY_SYMBOLS[currency] ?? ''

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
        {EXPENSE_CATEGORY_ICONS[category] ?? '📋'}
      </div>

      {/* Description + category */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">
          {title || EXPENSE_CATEGORY_LABELS_HE[category]}
        </p>
        <p className="text-xs text-gray-400">{EXPENSE_CATEGORY_LABELS_HE[category]}</p>
      </div>

      {/* Amount */}
      <div className="text-left flex-shrink-0" dir="ltr">
        <p className="font-semibold text-gray-800">
          {sym}{amount?.toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 mr-1">
        <button
          onClick={() => onEdit(expense)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => { if (confirm('למחוק הוצאה זו?')) onDelete(expense.id) }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
