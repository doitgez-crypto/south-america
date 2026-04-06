import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import { sanitizeAttractionPayload } from '../lib/sanitize'
import { geocodeLocation } from '../lib/geocoding'

const QUERY_KEY = 'attractions'

async function fetchAttractions(tripId) {
  if (!tripId) return []
  const { data, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useAttractions(tripId, filters = {}) {
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
    const channel = supabase
      .channel(`attractions:${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attractions', filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tripId, queryClient])

  // ── Create ─────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async ({ payload, userId }) => {
      const clean = sanitizeAttractionPayload(payload)

      // Auto-geocode if name provided but no coords
      if (!clean.coordinates && clean.name) {
        const query = `${clean.name}, ${clean.country}, South America`
        const coords = await geocodeLocation(query)
        if (coords) clean.coordinates = coords
      }

      const { data, error } = await supabase
        .from('attractions')
        .insert({ ...clean, trip_id: tripId, created_by: userId, last_edited_by: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ payload }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      const optimistic = { id: `optimistic-${Date.now()}`, ...payload, trip_id: tripId }
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => [optimistic, ...old])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('Failed to save attraction. Changes rolled back.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('Attraction saved!')
    },
  })

  // ── Update ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload, userId }) => {
      const clean = sanitizeAttractionPayload(payload)
      if (!clean.coordinates && clean.name) {
        const coords = await geocodeLocation(`${clean.name}, ${clean.country}`)
        if (coords) clean.coordinates = coords
      }
      const { data, error } = await supabase
        .from('attractions')
        .update({ ...clean, last_edited_by: userId })
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
        old.map((a) => (a.id === id ? { ...a, ...payload } : a))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('Update failed. Changes rolled back.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('Attraction updated!')
    },
  })

  // ── Delete ─────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('attractions').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => old.filter((a) => a.id !== id))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('Delete failed.')
    },
    onSuccess: () => toast.success('Attraction deleted.'),
  })

  // ── Client-side filtering ──────────────────────────────
  const attractions = (query.data ?? []).filter((a) => {
    if (filters.country  && a.country  !== filters.country)         return false
    if (filters.category && a.category !== filters.category)        return false
    if (filters.rating   && a.rating   < Number(filters.rating))   return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!a.name.toLowerCase().includes(q) && !a.description?.toLowerCase().includes(q))
        return false
    }
    return true
  })

  return {
    attractions,
    allAttractions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createAttraction: createMutation.mutate,
    updateAttraction: updateMutation.mutate,
    deleteAttraction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
