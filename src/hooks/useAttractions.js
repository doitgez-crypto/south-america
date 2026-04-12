import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import { sanitizeAttractionPayload } from '../lib/sanitize'
import { geocodeLocation } from '../lib/geocoding'
import { haversineKm } from '../lib/distance'

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

      const { data, error } = await withTimeout(
        supabase
          .from('attractions')
          .insert({ ...clean, trip_id: tripId, created_by: userId, last_edited_by: userId })
          .select()
          .single()
      )
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      queryClient.refetchQueries({ queryKey: [QUERY_KEY, tripId], type: 'active' })
    },
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

      const { data, error } = await withTimeout(
        supabase
          .from('attractions')
          .update({ ...clean, last_edited_by: userId })
          .eq('id', id)
          .select()
          .single()
      )
      if (error) {
        console.error('[updateAttraction] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          payload: clean,
        })
        throw error
      }
      if (!data) throw new Error('העדכון נכשל – לא נמצאה שורה לעדכון')
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
      const { error } = await withTimeout(
        supabase
          .from('attractions')
          .update({ is_deleted: true, last_edited_by: userId })
          .eq('id', id)
      )
      if (error) {
        // Detect 403 / RLS permission errors
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
          throw new Error('שגיאת הרשאות: וודא שאתה מחובר לטיול הנכון')
        }
        throw error
      }
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
  const attractions = (query.data ?? [])
    .filter((a) => {
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
    .map((a) => {
      if (userCoords && a.coordinates?.lat != null && a.coordinates?.lng != null) {
        return { ...a, distance: haversineKm(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng) }
      }
      return a
    })
    .sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance
      return 0
    })

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
