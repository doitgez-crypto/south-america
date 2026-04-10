import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'

const QUERY_KEY = 'categories'

async function fetchCategories(tripId) {
  if (!tripId) return []
  const { data, error } = await supabase
    .from('trip_categories')
    .select('*')
    .eq('trip_id', tripId)
    .order('name', { ascending: true })

  if (error) {
    console.error('fetchCategories error:', error)
    throw error
  }
  console.log('fetchCategories:', data?.length, 'categories for trip', tripId)
  return data
}

export function useCategories(tripId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [QUERY_KEY, tripId],
    queryFn: () => fetchCategories(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60_000,
  })

  // Realtime subscription — unique channel name per hook instance to avoid
  // "cannot add callbacks after subscribe()" when multiple components use this hook
  useEffect(() => {
    if (!tripId) return
    const instanceId = Math.random().toString(36).substring(7)
    const channel = supabase
      .channel(`categories-${tripId}-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_categories', filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tripId, queryClient])

  // ── Create (upsert — find or create) ────────────────────
  const createMutation = useMutation({
    mutationFn: async (nameOrObj) => {
      const { name, icon = null } = typeof nameOrObj === 'string'
        ? { name: nameOrObj }
        : nameOrObj
      const cleanName = name.trim()

      // Upsert: inserts if new, returns existing if duplicate (trip_id, name).
      // ignoreDuplicates ensures we don't overwrite icon on existing rows.
      const payload = { trip_id: tripId, name: cleanName, ...(icon ? { icon } : {}) }

      let result = await supabase
        .from('trip_categories')
        .upsert(payload, { onConflict: 'trip_id,name', ignoreDuplicates: true })
        .select()
        .single()

      // If icon column doesn't exist, retry without it
      if (result.error?.code === '42703' && icon) {
        console.warn('useCategories: icon column missing, retrying without it')
        result = await supabase
          .from('trip_categories')
          .upsert(
            { trip_id: tripId, name: cleanName },
            { onConflict: 'trip_id,name', ignoreDuplicates: true }
          )
          .select()
          .single()
      }

      // ignoreDuplicates with .single() may return null data if row existed
      // and nothing was updated — in that case, fetch the existing row
      if (!result.data && !result.error) {
        const { data: existing, error: fetchErr } = await supabase
          .from('trip_categories')
          .select('*')
          .eq('trip_id', tripId)
          .eq('name', cleanName)
          .single()
        if (fetchErr) throw fetchErr
        return existing
      }

      if (result.error) {
        console.error('useCategories createCategory error:', result.error)
        throw result.error
      }
      return result.data
    },
    onSuccess: (data) => {
      console.log('useCategories: category upserted', data)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
    onError: (err) => {
      console.error('useCategories onError:', err)
      toast.error(err.message || 'שגיאה ביצירת קטגוריה')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
  })

  // ── Delete ─────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('trip_categories')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => old.filter(c => c.id !== id))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('שגיאה במחיקת קטגוריה')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
  })

  // ── Update visibility ──────────────────────────────────
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }) => {
      const { error } = await supabase
        .from('trip_categories')
        .update({ is_visible })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, is_visible }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) =>
        old.map(c => c.id === id ? { ...c, is_visible } : c)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      toast.error('שגיאה בעדכון הקטגוריה')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
  })

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    updateCategoryVisibility: updateVisibilityMutation.mutate,
  }
}
