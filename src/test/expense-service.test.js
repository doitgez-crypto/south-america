import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  computeTotalUsd,
  fetchExpenses,
  createExpenseRecord,
  updateExpenseRecord,
  softDeleteExpense,
} from '../services/expense-service'

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  function makeChain(result) {
    const c = {}
    ;['select', 'eq', 'order', 'insert', 'update'].forEach((m) => {
      c[m] = vi.fn(() => c)
    })
    c.single = vi.fn(() => Promise.resolve(result))
    c.then = (res, rej) => Promise.resolve(result).then(res, rej)
    c.catch = (fn) => Promise.resolve(result).catch(fn)
    c.finally = (fn) => Promise.resolve(result).finally(fn)
    return c
  }
  return { makeChain, mockFrom: vi.fn() }
})

vi.mock('../lib/supabase', () => ({
  supabase: { from: mocks.mockFrom },
}))

beforeEach(() => {
  mocks.mockFrom.mockReset()
})

// ── computeTotalUsd ───────────────────────────────────────────────────────────

describe('computeTotalUsd', () => {
  // Lightweight stub: 1 EUR = 1.10 USD, 1 ILS = 0.27 USD, else 0
  const convert = (amount, from, to) => {
    if (from === to) return amount
    if (from === 'EUR' && to === 'USD') return amount * 1.1
    if (from === 'ILS' && to === 'USD') return amount * 0.27
    return 0
  }

  it('returns 0 for an empty expense list', () => {
    expect(computeTotalUsd([], 1000, false, convert)).toBe(0)
  })

  it('sums plain USD expenses', () => {
    const expenses = [
      { currency: 'USD', amount: 10 },
      { currency: 'USD', amount: 20 },
    ]
    expect(computeTotalUsd(expenses, 1000, false, convert)).toBe(30)
  })

  it('applies ARS Blue Dollar formula (amount / blueRate) when useBlueRate=true', () => {
    const expenses = [{ currency: 'ARS', amount: 10_000 }]
    // 10 000 ARS / 1 000 = 10 USD
    expect(computeTotalUsd(expenses, 1000, true, convert)).toBe(10)
  })

  it('uses convertFn for ARS when useBlueRate=false', () => {
    const expenses = [{ currency: 'ARS', amount: 5_000 }]
    const spy = vi.fn().mockReturnValue(4)
    computeTotalUsd(expenses, 1000, false, spy)
    expect(spy).toHaveBeenCalledWith(5_000, 'ARS', 'USD')
  })

  it('falls back to convertFn for ARS when blueRate=0 (avoids division by zero)', () => {
    const expenses = [{ currency: 'ARS', amount: 5_000 }]
    const spy = vi.fn().mockReturnValue(3)
    computeTotalUsd(expenses, 0, true, spy)
    expect(spy).toHaveBeenCalledWith(5_000, 'ARS', 'USD')
  })

  it('treats null return from convertFn as 0 (currency not available)', () => {
    const expenses = [{ currency: 'XYZ', amount: 100 }]
    expect(computeTotalUsd(expenses, 1000, false, () => null)).toBe(0)
  })

  it('handles mixed currencies correctly', () => {
    const expenses = [
      { currency: 'USD', amount: 10 },
      { currency: 'EUR', amount: 10 },
    ]
    const total = computeTotalUsd(expenses, 1000, false, convert)
    expect(total).toBeCloseTo(10 + 11, 5) // 10 USD + (10 * 1.1) USD
  })

  it('mixes ARS blue-rate and other currencies in one pass', () => {
    const expenses = [
      { currency: 'ARS', amount: 10_000 },
      { currency: 'USD', amount: 5 },
    ]
    // 10 000 / 1 000 + 5 = 15
    expect(computeTotalUsd(expenses, 1000, true, convert)).toBe(15)
  })

  it('result is always a finite number (no NaN, no Infinity)', () => {
    const expenses = [{ currency: 'USD', amount: 100 }]
    const result = computeTotalUsd(expenses, 1000, false, convert)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('does not produce NaN when convertFn returns undefined', () => {
    const expenses = [{ currency: 'FOO', amount: 50 }]
    const result = computeTotalUsd(expenses, 1000, false, () => undefined)
    // undefined ?? 0 → 0
    expect(result).toBe(0)
    expect(Number.isNaN(result)).toBe(false)
  })
})

// ── fetchExpenses (mocked Supabase) ───────────────────────────────────────────

describe('fetchExpenses', () => {
  it('returns [] immediately for falsy tripId without calling Supabase', async () => {
    expect(await fetchExpenses(null)).toEqual([])
    expect(await fetchExpenses(undefined)).toEqual([])
    expect(await fetchExpenses('')).toEqual([])
    expect(mocks.mockFrom).not.toHaveBeenCalled()
  })

  it('returns the data array from Supabase on success', async () => {
    const rows = [{ id: '1', amount: 50, currency: 'USD' }]
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: rows, error: null }))
    const result = await fetchExpenses('trip-1')
    expect(result).toEqual(rows)
  })

  it('queries the expenses table with correct trip and deletion filters', async () => {
    const chain = mocks.makeChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await fetchExpenses('trip-abc')
    expect(mocks.mockFrom).toHaveBeenCalledWith('expenses')
    expect(chain.eq).toHaveBeenCalledWith('trip_id', 'trip-abc')
    expect(chain.eq).toHaveBeenCalledWith('is_deleted', false)
  })

  it('throws when Supabase returns an error', async () => {
    const err = new Error('network failure')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(fetchExpenses('trip-1')).rejects.toThrow('network failure')
  })
})

// ── createExpenseRecord ───────────────────────────────────────────────────────

describe('createExpenseRecord', () => {
  it('returns the saved record on success', async () => {
    const saved = { id: 'exp-1', trip_id: 'trip-1', amount: 20, currency: 'USD' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: saved, error: null }))
    const result = await createExpenseRecord('trip-1', {
      amount: 20,
      currency: 'USD',
      title: 'Lunch',
      category: 'Food',
      expense_date: '2024-06-01',
    })
    expect(result).toEqual(saved)
  })

  it('applies default category "Other" when none provided', async () => {
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await createExpenseRecord('trip-1', { amount: 10, currency: 'USD' })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Other' })
    )
  })

  it('applies default empty string for title when none provided', async () => {
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await createExpenseRecord('trip-1', { amount: 10, currency: 'USD' })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: '' })
    )
  })

  it('throws when Supabase returns an error', async () => {
    const err = new Error('insert failed')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(
      createExpenseRecord('trip-1', { amount: 10, currency: 'USD' })
    ).rejects.toThrow('insert failed')
  })

  it('preserves explicit expense_date when provided', async () => {
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await createExpenseRecord('trip-1', { amount: 10, currency: 'USD', expense_date: '2024-01-15' })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ expense_date: '2024-01-15' })
    )
  })
})

// ── updateExpenseRecord ───────────────────────────────────────────────────────

describe('updateExpenseRecord', () => {
  it('returns the updated record on success', async () => {
    const updated = { id: 'exp-1', amount: 30 }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: updated, error: null }))
    const result = await updateExpenseRecord('exp-1', { amount: 30, currency: 'USD' })
    expect(result).toEqual(updated)
  })

  it('throws when Supabase returns an error', async () => {
    const err = new Error('update failed')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(
      updateExpenseRecord('exp-1', { amount: 30 })
    ).rejects.toThrow('update failed')
  })

  it('sends correct fields to Supabase and targets the correct row', async () => {
    const chain = mocks.makeChain({ data: { id: 'exp-1' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await updateExpenseRecord('exp-1', { amount: 99, currency: 'EUR', title: 'Hotel', category: 'Accommodation', expense_date: '2024-07-04' })
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 99, currency: 'EUR', title: 'Hotel', category: 'Accommodation', expense_date: '2024-07-04' })
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'exp-1')
  })
})

// ── softDeleteExpense ─────────────────────────────────────────────────────────

describe('softDeleteExpense', () => {
  it('resolves without error on success', async () => {
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: null }))
    await expect(softDeleteExpense('exp-1')).resolves.toBeUndefined()
  })

  it('sets is_deleted=true on the correct row', async () => {
    const chain = mocks.makeChain({ error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await softDeleteExpense('exp-1')
    expect(chain.update).toHaveBeenCalledWith({ is_deleted: true })
    expect(chain.eq).toHaveBeenCalledWith('id', 'exp-1')
  })

  it('throws a Hebrew RLS error for Supabase error code 42501', async () => {
    const rlsErr = { code: '42501', message: 'permission denied for table expenses' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: rlsErr }))
    await expect(softDeleteExpense('exp-1')).rejects.toThrow('שגיאת הרשאות')
  })

  it('throws a Hebrew RLS error when error message contains "policy"', async () => {
    const policyErr = { code: '500', message: 'new row violates row-level security policy' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: policyErr }))
    await expect(softDeleteExpense('exp-1')).rejects.toThrow('שגיאת הרשאות')
  })

  it('re-throws generic errors as-is', async () => {
    const genericErr = new Error('generic DB error')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: genericErr }))
    await expect(softDeleteExpense('exp-1')).rejects.toThrow('generic DB error')
  })

  it('throws a Hebrew RLS error when error message contains "permission"', async () => {
    const permErr = { code: '403', message: 'permission denied' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: permErr }))
    await expect(softDeleteExpense('exp-1')).rejects.toThrow('שגיאת הרשאות')
  })
})
