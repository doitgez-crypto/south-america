import React, { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet'
import {
  CURRENCY_SYMBOLS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS_HE,
} from '../../lib/constants'

const TODAY = new Date().toISOString().slice(0, 10)

export default function AddExpenseModal({ expense, isOpen, onClose, onSave, isSaving }) {
  const [amount, setAmount]       = useState('')
  const [currency, setCurrency]   = useState('USD')
  const [description, setDesc]    = useState('')
  const [category, setCategory]   = useState('Other')
  const [date, setDate]           = useState(TODAY)

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount_local ?? ''))
      setCurrency(expense.currency_code ?? 'USD')
      setDesc(expense.description ?? '')
      setCategory(expense.category ?? 'Other')
      setDate(expense.date ?? TODAY)
    } else {
      setAmount('')
      setCurrency('USD')
      setDesc('')
      setCategory('Other')
      setDate(TODAY)
    }
  }, [expense, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    onSave({
      amount_local: val,
      currency_code: currency,
      description: description.trim(),
      category,
      date,
    })
  }

  const isEditing = !!expense

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'ערוך הוצאה' : 'הוסף הוצאה'}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Amount + Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סכום</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              dir="ltr"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white font-medium"
            >
              {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                <option key={code} value={code}>{code} {sym}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="לדוגמה: ארוחת ערב"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS_HE[c]}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            dir="ltr"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
