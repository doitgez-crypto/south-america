import React from 'react'
import { useCurrency } from '../../hooks/useCurrency'
import { useAppContext } from '../../context/AppContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export default function ExpenseSummary({ expenses }) {
  const { convert, rates, loading } = useCurrency()
  const { blueRate, useBlueRate }   = useAppContext()

  const computeUsd = (expense) => {
    if (expense.currency_code === 'ARS' && useBlueRate && blueRate > 0) {
      return expense.amount / blueRate
    }
    return convert(expense.amount, expense.currency_code, 'USD') ?? 0
  }

  const totalUsd = expenses.reduce((sum, e) => sum + computeUsd(e), 0)
  const totalIls = rates ? (convert(totalUsd, 'USD', 'ILS') ?? 0) : null

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl mx-4 mb-4 p-5">
      <p className="text-sm text-primary-100 mb-3 text-center">סה&quot;כ הוצאות</p>
      {loading ? (
        <div className="flex justify-center"><LoadingSpinner size="sm" /></div>
      ) : (
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold">${totalUsd.toFixed(2)}</p>
            <p className="text-xs text-primary-200 mt-0.5">דולר</p>
          </div>
          <div className="w-px bg-primary-400" />
          <div className="text-center">
            <p className="text-3xl font-bold">
              {totalIls != null ? `₪${totalIls.toFixed(0)}` : '—'}
            </p>
            <p className="text-xs text-primary-200 mt-0.5">שקל</p>
          </div>
        </div>
      )}
      <p className="text-xs text-primary-200 text-center mt-3">
        {expenses.length} הוצאות
      </p>
    </div>
  )
}
