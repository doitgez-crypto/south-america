import React from 'react'
import ExpenseItem from './ExpenseItem'
import { EmptyState } from '../ui/EmptyState'
import { CURRENCY_SYMBOLS } from '../../lib/constants'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses.length) {
    return (
      <EmptyState
        title="אין הוצאות עדיין"
        description="הוסף הוצאה ראשונה בלחיצה על +"
      />
    )
  }

  // Group by date (descending)
  const groups = {}
  expenses.forEach((e) => {
    const key = e.date ?? e.created_at?.slice(0, 10) ?? 'unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      {sortedDates.map((date) => {
        const dayExpenses = groups[date]
        const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount ?? 0), 0)

        return (
          <div key={date}>
            {/* Date group header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <span className="text-sm font-semibold text-gray-600">{formatDate(date)}</span>
              {dayTotal > 0 && (
                <span className="text-xs text-gray-400">${dayTotal.toFixed(2)}</span>
              )}
            </div>

            {dayExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
