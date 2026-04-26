import { supabase } from '../lib/supabase'

export async function fetchExpenses(tripId) {
  if (!tripId) return []
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_deleted', false)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createExpenseRecord(tripId, payload) {
  const { amount, currency, title, category, expense_date } = payload
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      trip_id: tripId,
      amount,
      currency,
      title: title ?? '',
      category: category ?? 'Other',
      expense_date: expense_date ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExpenseRecord(id, payload) {
  const { amount, currency, title, category, expense_date } = payload
  const { data, error } = await supabase
    .from('expenses')
    .update({ amount, currency, title, category, expense_date })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) {
    if (
      error.code === '42501' ||
      error.message?.includes('policy') ||
      error.message?.includes('permission')
    ) {
      throw new Error('שגיאת הרשאות: וודא שאתה מחובר לטיול הנכון')
    }
    throw error
  }
}

/**
 * Aggregates expenses to a USD total, applying ARS Blue Dollar override when active.
 * @param {Array} expenses
 * @param {number} blueRate - ARS/USD blue-market rate
 * @param {boolean} useBlueRate
 * @param {Function} convertFn - convert(amount, from, to) from useCurrency
 * @returns {number}
 */
export function computeTotalUsd(expenses, blueRate, useBlueRate, convertFn) {
  return expenses.reduce((sum, expense) => {
    let usd
    if (expense.currency === 'ARS' && useBlueRate && blueRate > 0) {
      usd = expense.amount / blueRate
    } else {
      usd = convertFn(expense.amount, expense.currency, 'USD') ?? 0
    }
    return sum + usd
  }, 0)
}
