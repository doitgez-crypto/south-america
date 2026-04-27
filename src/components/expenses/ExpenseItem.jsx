import React, { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { EXPENSE_CATEGORY_ICONS, EXPENSE_CATEGORY_LABELS_HE, CURRENCY_SYMBOLS } from '../../lib/constants'

export default function ExpenseItem({ expense, onEdit, onDelete }) {
  const { title, category, amount, currency } = expense
  const sym = CURRENCY_SYMBOLS[currency] ?? ''
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white border-b border-gray-100" data-cy="expense-item">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
          {EXPENSE_CATEGORY_ICONS[category] ?? '📋'}
        </div>

        {/* Description + category */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate" data-cy="expense-title">
            {title || EXPENSE_CATEGORY_LABELS_HE[category]}
          </p>
          <p className="text-xs text-gray-400">{EXPENSE_CATEGORY_LABELS_HE[category]}</p>
        </div>

        {/* Amount */}
        <div className="text-left flex-shrink-0" dir="ltr">
          <p className="font-semibold text-gray-800">
            {sym}{amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 mr-1">
          <button
            data-cy="expense-edit-btn"
            onClick={() => onEdit(expense)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            data-cy="expense-delete-btn"
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Inline delete confirmation */}
      {confirmDelete && (
        <div className="flex items-center justify-between bg-red-50 border-t border-red-100 px-4 py-2.5">
          <p className="text-sm font-semibold text-red-700">למחוק הוצאה זו?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg"
            >
              ביטול
            </button>
            <button
              data-cy="expense-confirm-delete"
              onClick={() => { onDelete(expense.id); setConfirmDelete(false) }}
              className="px-3 py-1.5 text-sm font-bold text-white bg-red-500 rounded-lg"
            >
              מחק
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
