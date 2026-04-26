import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import {
  fetchExpenses,
  createExpenseRecord,
  updateExpenseRecord,
  softDeleteExpense,
} from '../services/expense-service'

const QUERY_KEY = 'expenses'
const MUTATION_TIMEOUT_MS = 15_000

/** Race a promise against a timeout */
function withTimeout(promise, ms = MUTATION_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('הפעולה נכשלה – חריגה מזמן ההמתנה (15 שניות)')), ms)
    ),
  ])
}

/**
 * @param {string} tripId
 * @param {{ blueRate: number, useBlueRate: boolean }} options
 */
export function useExpenses(tripId, _options = {}) {
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
    mutationFn: async ({ payload }) => {
      return withTimeout(createExpenseRecord(tripId, payload))
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
      toast.success('ההוצאה נשמרה!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      queryClient.refetchQueries({ queryKey: [QUERY_KEY, tripId], type: 'active' })
    },
  })

  // ── Update ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return withTimeout(updateExpenseRecord(id, payload))
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
      toast.success('ההוצאה עודכנה!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
  })

  // ── Delete (soft) ──────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return withTimeout(softDeleteExpense(id))
    },
    onMutate: async (id) => {
      setDeletingId(id)
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => old.filter((e) => e.id !== id))
      return { previous }
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error(err.message || 'מחיקה נכשלה.')
    },
    onSuccess: () => toast.success('ההוצאה נמחקה.'),
    onSettled: () => {
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
  })

  const deleteExpense = useCallback((id, callbacks = {}) => {
    deleteMutation.mutate(id, {
      ...callbacks,
      onSettled: (...args) => {
        setDeletingId(null)
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
        callbacks.onSettled?.(...args)
      },
    })
  }, [deleteMutation, queryClient, tripId])

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createExpense: createMutation.mutate,
    updateExpense: updateMutation.mutate,
    deleteExpense,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    deletingId,
  }
}
