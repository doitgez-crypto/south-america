import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'
import { useUploadQueue } from './useUploadQueue'

const QUERY_KEY = 'documents'
const BUCKET = 'trip-documents'

export function useDocuments(tripId) {
  const queryClient = useQueryClient()
  const { addToQueue } = useUploadQueue()

  // --- Fetch ---
  const { data: documents = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, tripId],
    queryFn: async () => {
      if (!tripId) return []
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!tripId,
  })

  // --- Upload ---
  const uploadMutation = useMutation({
    mutationFn: async ({ file, name, userId }) => {
      const ext = file.name.split('.').pop()
      const path = `${tripId}/${Date.now()}.${ext}`
      
      // Check online status
      if (!navigator.onLine) {
        await addToQueue({
          type: 'document',
          file,
          bucket: BUCKET,
          path,
          metadata: {
            trip_id: tripId,
            uploaded_by: userId,
            name: name || file.name,
            file_type: file.type.includes('pdf') ? 'pdf' : 'image',
          }
        })
        return { queued: true }
      }

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file)
      
      if (uploadError) {
        if (!navigator.onLine) {
           await addToQueue({ type: 'document', file, bucket: BUCKET, path, metadata: { trip_id: tripId, name, uploaded_by: userId, file_type: file.type.includes('pdf') ? 'pdf' : 'image' } })
           return { queued: true }
        }
        throw uploadError
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      // 3. Save to Database
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          trip_id: tripId,
          uploaded_by: userId,
          name: name || file.name,
          file_url: publicUrl,
          file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        })
        .select()
        .single()

      if (dbError) throw dbError
      return { ...data, queued: false }
    },
    onMutate: async ({ file, name }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, tripId] })
      const previous = queryClient.getQueryData([QUERY_KEY, tripId])
      
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        name: name || file.name,
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        created_at: new Date().toISOString(),
        status: 'uploading'
      }
      
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => [optimistic, ...old])
      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], (old = []) => 
        old.map(item => item.id === context.optimisticId 
          ? { ...data, status: data.queued ? 'offline' : 'synced' } 
          : item
        )
      )
      if (!data?.queued) toast.success('המסמך הועלה בהצלחה!')
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData([QUERY_KEY, tripId], context.previous)
      console.error('Upload error:', err)
      toast.error('העלאת המסמך נכשלה.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
    }
  })

  // --- Delete ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('documents')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('המסמך נמחק.')
    }
  })

  return {
    documents,
    isLoading,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
  }
}
