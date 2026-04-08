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
  
  if (error) throw error
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

  // Realtime subscription for categories
  useEffect(() => {
    if (!tripId) return
    const channel = supabase
      .channel(`categories:${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_categories', filter: `trip_id=eq.${tripId}` },
        () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tripId, queryClient])

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const cleanName = name.trim()
      const { data, error } = await supabase
        .from('trip_categories')
        .insert({ trip_id: tripId, name: cleanName })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') { // exact error code for unique constraint violation in Postgres
           throw new Error('קטגוריה זו כבר קיימת.')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    },
    onError: (err) => {
      toast.error(err.message || 'שגיאה ביצירת קטגוריה')
    }
  })

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    createCategory: createMutation.mutateAsync,
    isCreating: createMutation.isPending
  }
}
