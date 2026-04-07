import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import { useCurrency } from './useCurrency'

const QUERY_KEY = 'expenses'

async function fetchExpenses(tripId) {
  if (!tripId) return []
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * @param {string} tripId
 * @param {{ blueRate: number, useBlueRate: boolean }} options
 */
export function useExpenses(tripId, { blueRate = 1000, useBlueRate = false } = {}) {
  const queryClient = useQueryClient()
  const { convert, rates } = useCurrency()

  // ── Fetch ──────────────────────────────────────────────
  const query = useQuery({
    queryKey: [QUERY_KEY, tripId],
    queryFn: () => fetchExpenses(tripId),
    enabled: !!tripId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  // ── Realtime subscription ──────────────────────────────
  useEffect(() => {
    if (!tripId) return
    const channel = supabase
      .channel(`expenses:${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tripId, queryClient])

  // ── Create ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({ payload, userId }) => {
      const { amount_local, currency_code, description, category, date } = payload

      // Compute USD and ILS at write time (preserves historical rate)
      let amount_usd = null
      let amount_ils = null

      if (currency_code === 'ARS' && useBlueRate && blueRate > 0) {
        amount_usd = amount_local / blueRate
      } else if (rates) {
        amount_usd = convert(amount_local, currency_code, 'USD')
      }
      if (rates && amount_usd != null) {
        amount_ils = convert(amount_usd, 'USD', 'ILS')
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          trip_id: tripId,
          created_by: userId,
          amount_local,
          currency_code,
          amount_usd,
          amount_ils,
          description: description ?? '',
          category: category ?? 'Other',
          date: date ?? new Date().toISOString().slice(0, 10),
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        ...payload,
        trip_id: tripId,
        is_deleted: false,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => [optimistic, ...old])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('נכשל בשמירת ההוצאה. השינויים בוטלו.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('ההוצאה נשמרה!')
    },
  })

  // ── Update ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { amount_local, currency_code } = payload

      let amount_usd = null
      let amount_ils = null

      if (amount_local != null && currency_code) {
        if (currency_code === 'ARS' && useBlueRate && blueRate > 0) {
          amount_usd = amount_local / blueRate
        } else if (rates) {
          amount_usd = convert(amount_local, currency_code, 'USD')
        }
        if (rates && amount_usd != null) {
          amount_ils = convert(amount_usd, 'USD', 'ILS')
        }
      }

      const updateData = { ...payload }
      if (amount_usd != null) updateData.amount_usd = amount_usd
      if (amount_ils != null) updateData.amount_ils = amount_ils

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) =>
        old.map((e) => (e.id === id ? { ...e, ...payload } : e))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('עדכון נכשל. השינויים בוטלו.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('ההוצאה עודכנה!')
    },
  })

  // ── Delete (soft) ──────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('expenses')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => old.filter((e) => e.id !== id))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('מחיקה נכשלה.')
    },
    onSuccess: () => toast.success('ההוצאה נמחקה.'),
  })

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createExpense: createMutation.mutate,
    updateExpense: updateMutation.mutate,
    deleteExpense: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
