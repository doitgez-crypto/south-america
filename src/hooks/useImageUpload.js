import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../lib/supabase'

const BUCKET = 'attraction-images'
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  onProgress: () => {},
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)

  const uploadImages = async (files, attractionId) => {
    if (!files?.length) return []
    setUploading(true)
    setProgress(0)
    const urls = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // Client-side compression before upload
        const compressed = await imageCompression(file, {
          ...COMPRESSION_OPTIONS,
          onProgress: (p) => setProgress(Math.round(((i + p / 100) / files.length) * 100)),
        })

        const ext      = file.name.split('.').pop()
        const path     = `${attractionId}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
          cacheControl: '3600',
          upsert: false,
        })
        if (error) throw error

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
        urls.push(publicUrl)
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }

    return urls
  }

  const deleteImage = async (url) => {
    // Extract path from public URL
    const path = url.split(`/${BUCKET}/`)[1]
    if (!path) return
    await supabase.storage.from(BUCKET).remove([path])
  }

  return { uploadImages, deleteImage, uploading, progress }
}
