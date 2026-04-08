import React, { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet'
import {
  CURRENCY_SYMBOLS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS_HE,
} from '../../lib/constants'
import { Info, DollarSign } from 'lucide-react'

const TODAY = new Date().toISOString().slice(0, 10)
const POPULAR_CURRENCIES = ['USD', 'ILS', 'ARS', 'PEN', 'CLP', 'BRL', 'COP']

export default function AddExpenseModal({ expense, isOpen, onClose, onSave, isSaving }) {
  const [amount, setAmount]       = useState('')
  const [currency, setCurrency]   = useState('USD')
  const [title, setTitle]         = useState('')
  const [category, setCategory]   = useState('Other')
  const [expense_date, setDate]   = useState(TODAY)

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount ?? ''))
      setCurrency(expense.currency ?? 'USD')
      setTitle(expense.title ?? '')
      setCategory(expense.category ?? 'Other')
      setDate(expense.expense_date?.slice(0, 10) ?? TODAY)
    } else {
      setAmount('')
      setCurrency('USD')
      setTitle('')
      setCategory('Other')
      setDate(TODAY)
    }
  }, [expense, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    onSave({
      amount: val,
      currency,
      title: title.trim(),
      category,
      expense_date,
    })
  }

  const isEditing = !!expense
  const isARS = currency === 'ARS'

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'עריכת הוצאה' : 'הוספת הוצאה'}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-5 pb-10">
        {/* Amount + Currency */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">סכום ומטבע</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                {CURRENCY_SYMBOLS[currency] || ''}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-semibold"
                dir="ltr"
              />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-32 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold text-center"
            >
              {POPULAR_CURRENCIES.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
              <option disabled>──────</option>
              {Object.keys(CURRENCY_SYMBOLS)
                .filter(c => !POPULAR_CURRENCIES.includes(c))
                .map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
            </select>
          </div>
          
          {isARS && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-start gap-2 border border-blue-100 animate-in fade-in slide-in-from-top-1">
              <Info size={14} className="text-blue-500 mt-0.5" />
              <p className="text-[10px] text-blue-700 leading-tight">
                <strong>שים לב:</strong> עבור ארגנטינה החישוב מתבצע לפי שער ה"דולר כחול" שהגדרת בתפריט הראשי (אם מופעל).
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">תיאור</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="מה קנינו?"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Category & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS_HE[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">תאריך</label>
            <input
              type="date"
              value={expense_date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl active:scale-95 transition-all"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? 'שומר...' : 'שמור הוצאה'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
