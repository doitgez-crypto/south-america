import { useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import { useUploadQueue } from './useUploadQueue'

const BUCKET = 'attraction-images'
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  onProgress: () => {},
}
const UPLOAD_TIMEOUT_MS = 15_000 // 15 seconds per file

/** Race a promise against a timeout */
function withTimeout(promise, ms, label = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ])
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const { addToQueue } = useUploadQueue()

  const uploadImages = useCallback(async (files, attractionId) => {
    if (!files?.length) return []
    setUploading(true)
    setProgress(0)
    const urls = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Compression — wrapped in its own try/catch so one bad file doesn't abort all
        let compressed
        try {
          compressed = await withTimeout(
            imageCompression(file, {
              ...COMPRESSION_OPTIONS,
              onProgress: (p) => setProgress(Math.round(((i + p / 100) / files.length) * 100)),
            }),
            UPLOAD_TIMEOUT_MS,
            'Image compression'
          )
        } catch (compressErr) {
          console.error('Image compression failed:', compressErr)
          toast.error(`דחיסת תמונה נכשלה: ${file.name}`)
          continue // skip this file, try next
        }

        const ext  = file.name.split('.').pop()
        const path = `${attractionId}/${Date.now()}-${i}.${ext}`

        // Check online status before attempt
        if (!navigator.onLine) {
           await addToQueue({
             type: 'attraction-image',
             file: compressed,
             bucket: BUCKET,
             path,
             metadata: { attractionId }
           })
           continue
        }

        try {
          const { error } = await withTimeout(
            supabase.storage.from(BUCKET).upload(path, compressed),
            UPLOAD_TIMEOUT_MS,
            'Image upload'
          )
          if (error) throw error

          const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
          urls.push(publicUrl)
        } catch (err) {
          if (!navigator.onLine) {
            await addToQueue({ type: 'attraction-image', file: compressed, bucket: BUCKET, path, metadata: { attractionId } })
          } else {
            console.error('Image upload failed:', err)
            toast.error(`העלאת תמונה נכשלה: ${err.message || 'שגיאה לא ידועה'}`)
            throw err // propagate — don't silently return []
          }
        }
        
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
    } finally {
      // CRITICAL: always reset loading state
      setUploading(false)
      setProgress(0)
    }

    return urls
  }, [addToQueue])

  const deleteImage = useCallback(async (url) => {
    const path = url.split(`/${BUCKET}/`)[1]
    if (!path) return
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) {
      console.error('Image delete failed:', error)
      toast.error('מחיקת תמונה נכשלה')
    }
  }, [])

  return { uploadImages, deleteImage, uploading, progress }
}
