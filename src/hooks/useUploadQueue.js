import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-toastify'

const DB_NAME = 'TravelPlannerSync'
const STORE_NAME = 'pendingUploads'

// Helper for IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useUploadQueue() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Add to queue
  const addToQueue = useCallback(async (uploadData) => {
    const db = await openDB()
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const tx = db.transaction(STORE_NAME, 'readwrite')
    await tx.objectStore(STORE_NAME).add({ id, ...uploadData, createdAt: new Date().toISOString() })
    
    // Update count
    const countRequest = db.transaction(STORE_NAME).objectStore(STORE_NAME).count()
    countRequest.onsuccess = () => setPendingCount(countRequest.result)
    
    toast.info('החיבור אבד. הקובץ נשמר בתור למשלוח אוטומטי.', { autoClose: 3000 })
  }, [])

  // Sync logic
  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return
    
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = async () => {
      const items = request.result
      if (items.length === 0) {
        setPendingCount(0)
        return
      }

      setIsSyncing(true)
      console.log(`DEBUG Syncing ${items.length} pending uploads...`)

      for (const item of items) {
        try {
          const { file, bucket, path, metadata } = item
          
          // Re-upload to Supabase Storage
          const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file)
          if (uploadError && uploadError.message !== 'The resource already exists') throw uploadError

          const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

          // Run the custom callback based on type (Attraction or Document)
          if (item.type === 'document') {
             await supabase.from('documents').insert({
               ...metadata,
               file_url: publicUrl
             })
          } else if (item.type === 'attraction-image') {
             // Add image URL to existing attraction record
             const { data: current } = await supabase
              .from('attractions')
              .select('image_urls')
              .eq('id', metadata.attractionId)
              .single()
             
             await supabase.from('attractions').update({
               image_urls: [...(current?.image_urls || []), publicUrl]
             }).eq('id', metadata.attractionId)
          }

          // Remove from DB after success
          const deleteTx = db.transaction(STORE_NAME, 'readwrite')
          deleteTx.objectStore(STORE_NAME).delete(item.id)
          console.log(`DEBUG Sync success for ${item.id}`)
        } catch (err) {
          console.error(`Sync failed for item ${item.id}:`, err)
        }
      }

      const finalCountRequest = db.transaction(STORE_NAME).objectStore(STORE_NAME).count()
      finalCountRequest.onsuccess = () => {
        const remaining = finalCountRequest.result
        setPendingCount(remaining)
        setIsSyncing(false)
        if (remaining === 0) toast.success('כל הקבצים סונכרנו בהצלחה!')
      }
    }
  }, [isSyncing])

  // Monitor online status
  useEffect(() => {
    processQueue()
    window.addEventListener('online', processQueue)
    return () => window.removeEventListener('online', processQueue)
  }, [processQueue])

  return { addToQueue, isSyncing, pendingCount }
}
