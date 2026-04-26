import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import {
  fetchAttractions,
  createAttractionRecord,
  updateAttractionRecord,
  softDeleteAttraction,
  filterAttractions,
  annotateWithDistance,
} from '../services/attraction-service'

const QUERY_KEY = 'attractions'
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

export function useAttractions(tripId, filters = {}, userCoords = null) {
  const queryClient = useQueryClient()

  // ── Fetch ──────────────────────────────────────────────
  const query = useQuery({
    queryKey: [QUERY_KEY, tripId],
    queryFn: () => fetchAttractions(tripId),
    enabled: !!tripId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })

  // ── Realtime subscription ──────────────────────────────
  useEffect(() => {
    if (!tripId) return
    // Use a unique channel name for this specific instance to avoid collisions
    const instanceId = Math.random().toString(36).substring(7)
    const channel = supabase
      .channel(`attractions-changes-${tripId}-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attractions', filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId, queryClient])

  // ── Create ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({ payload, userId }) => {
      return withTimeout(createAttractionRecord(tripId, userId, payload))
    },
    onMutate: async ({ payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      
      const optimistic = { 
        id: `optimistic-${Date.now()}`, 
        ...payload, 
        trip_id: tripId, 
        is_deleted: false,
        status: 'pending' // Indicate that this is being saved
      }
      
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => [optimistic, ...old])
      return { previous, optimisticId: optimistic.id }
    },
    onError: (err, variables, context) => {
      // Instead of rolling back completely, we mark the item as 'offline' 
      // so the user can see it failed and potentially retry.
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => 
        old.map(item => item.id === context.optimisticId 
          ? { ...item, status: 'offline', error: err.message } 
          : item
        )
      )
      toast.error('נכשל בשמירת המיקום. הוא נשמר במצב לא מקוון.')
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic item with the real one
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => 
        old.map(item => item.id === context.optimisticId ? data : item)
      )
      toast.success('המקום נשמר!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      queryClient.refetchQueries({ queryKey: [QUERY_KEY, tripId], type: 'active' })
    },
  })

  // ── Update ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload, userId }) => {
      return withTimeout(updateAttractionRecord(id, userId, payload))
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) =>
        old.map((a) => (a.id === id ? { ...a, ...payload } : a))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('עדכון נכשל. השינויים בוטלו.')
    },
    onSuccess: () => {
      toast.success('המיקום עודכן!')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      queryClient.refetchQueries({ queryKey: [QUERY_KEY, tripId], type: 'active' })
    },
  })

  // ── Delete (soft) ──────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null)

  const deleteMutation = useMutation({
    mutationFn: async ({ id, userId }) => {
      return withTimeout(softDeleteAttraction(id, userId))
    },
    onMutate: async ({ id }) => {
      setDeletingId(id)
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => old.filter((a) => a.id !== id))
      return { previous }
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error(err.message || 'מחיקה נכשלה.')
    },
    onSuccess: () => toast.success('המיקום נמחק.'),
    onSettled: () => {
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      queryClient.refetchQueries({ queryKey: [QUERY_KEY, tripId], type: 'active' })
    },
  })

  // Wrapped deleteAttraction that accepts per-call callbacks
  const deleteAttraction = useCallback((vars, callbacks = {}) => {
    deleteMutation.mutate(vars, {
      ...callbacks,
      onSettled: (...args) => {
        setDeletingId(null)
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
        queryClient.refetchQueries({ queryKey: [QUERY_KEY, tripId], type: 'active' })
        callbacks.onSettled?.(...args)
      },
    })
  }, [deleteMutation, queryClient, tripId])

  // ── Client-side filtering + distance annotation ───────
  const attractions = annotateWithDistance(
    filterAttractions(query.data ?? [], filters),
    userCoords
  )

  return {
    attractions,
    allAttractions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createAttraction: createMutation.mutate,
    updateAttraction: updateMutation.mutate,
    deleteAttraction,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    deletingId,
  }
}
