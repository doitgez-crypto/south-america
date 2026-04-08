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
    .eq('is_deleted', false)
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
      const clean = sanitizeAttractionPayload(payload)

      // Auto-geocode if name provided but no coords (fallback)
      if (!clean.coordinates && clean.name) {
        const q = `${clean.name}, ${clean.country}, South America`
        // We catch errors from geocode so it doesn't fail the whole creation if offline
        try {
          const coords = await geocodeLocation(q)
          if (coords) clean.coordinates = coords
        } catch (e) {
          console.warn('Geocoding failed, proceeding without coordinates')
        }
      }

      // If coordinates are explicitly 0,0, remove them to keep them as null
      if (clean.coordinates && clean.coordinates.lat === 0 && clean.coordinates.lng === 0) {
        clean.coordinates = null
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
      // Final sync to ensure everything is correct
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    }
  })

  // ── Update ─────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload, userId }) => {
      const clean = sanitizeAttractionPayload(payload)
      if (!clean.coordinates && clean.name) {
        try {
          const coords = await geocodeLocation(`${clean.name}, ${clean.country}`)
          if (coords) clean.coordinates = coords
        } catch (e) {
          console.warn('Geocoding failed, preserving existing state')
        }
      }

      if (clean.coordinates && clean.coordinates.lat === 0 && clean.coordinates.lng === 0) {
        clean.coordinates = null
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
      toast.error('עדכון נכשל. השינויים בוטלו.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('המיקום עודכן!')
    },
  })

  // ── Delete (soft) ──────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('attractions')
        .update({ is_deleted: true })
        .eq('id', id)
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
      toast.error('מחיקה נכשלה.')
    },
    onSuccess: () => toast.success('המיקום נמחק.'),
  })

  // ── Client-side filtering ──────────────────────────────
  const attractions = (query.data ?? []).filter((a) => {
    if (filters.country  && a.country  !== filters.country)       return false
    if (filters.category && a.category !== filters.category)      return false
    if (filters.rating   && a.rating   < Number(filters.rating))  return false
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
