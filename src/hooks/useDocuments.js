import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useUploadQueue } from './useUploadQueue'
import {
  fetchDocuments,
  uploadDocumentFile,
  softDeleteDocument,
  generateDocumentPath,
  detectFileType,
} from '../services/document-service'

const QUERY_KEY = 'documents'
const BUCKET = 'trip-documents'
const UPLOAD_TIMEOUT_MS = 30_000

function withUploadTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('העלאה נכשלה – חריגה מזמן ההמתנה (30 שניות)')), UPLOAD_TIMEOUT_MS)
    ),
  ])
}

export function useDocuments(tripId) {
  const queryClient = useQueryClient()
  const { addToQueue } = useUploadQueue()

  // --- Fetch ---
  const query = useQuery({
    queryKey: [QUERY_KEY, tripId],
    queryFn: () => fetchDocuments(tripId),
    enabled: !!tripId,
  })

  const documents = query.data || []
  const isLoading = query.isLoading
  const isError = query.isError
  const error = query.error
  const refetch = query.refetch

  // --- Upload ---
  const uploadMutation = useMutation({
    mutationFn: async ({ file, name, userId }) => {
      const path = generateDocumentPath(tripId, file)
      const fileType = detectFileType(file)
      const displayName = name || file.name

      if (!navigator.onLine) {
        await addToQueue({
          type: 'document',
          file,
          bucket: BUCKET,
          path,
          metadata: { trip_id: tripId, uploaded_by: userId, name: displayName, file_type: fileType },
        })
        return { queued: true }
      }

      try {
        const data = await withUploadTimeout(
          uploadDocumentFile(tripId, userId, file, displayName, path, fileType)
        )
        return { ...data, queued: false }
      } catch (err) {
        if (!navigator.onLine) {
          await addToQueue({
            type: 'document',
            file,
            bucket: BUCKET,
            path,
            metadata: { trip_id: tripId, uploaded_by: userId, name: displayName, file_type: fileType },
          })
          return { queued: true }
        }
        throw err
      }
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
    mutationFn: async ({ id, fileUrl }) => {
      const { storageDeleted } = await softDeleteDocument(id, fileUrl)
      if (!storageDeleted) {
        toast.error('מחיקת הקובץ מהאחסון נכשלה — המסמך יוסר מהרשימה בכל זאת.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, tripId] })
      toast.success('המסמך נמחק.')
    },
    onError: (err) => {
      console.error('[deleteDocument] DB delete failed:', err)
      toast.error('מחיקת המסמך נכשלה.')
    },
  })

  return {
    documents,
    isLoading,
    isError,
    error,
    refetch,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
  }
}
