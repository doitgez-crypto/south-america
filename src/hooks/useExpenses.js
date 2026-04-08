import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'

const QUERY_KEY = 'expenses'

async function fetchExpenses(tripId) {
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

/**
 * @param {string} tripId
 * @param {{ blueRate: number, useBlueRate: boolean }} options
 */
export function useExpenses(tripId, { blueRate = 1000, useBlueRate = false } = {}) {
  const queryClient = useQueryClient()
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
      const { amount, currency, title, category, expense_date } = payload
      const updateData = { amount, currency, title, category, expense_date }

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
