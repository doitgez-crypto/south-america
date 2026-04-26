import { supabase } from '../lib/supabase'

const BUCKET = 'trip-documents'

export async function fetchDocuments(tripId) {
  if (!tripId) return []
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), 10_000)
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('trip_id', tripId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .abortSignal(abortController.signal)
    if (error) throw error
    return data
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.includes('AbortError') || abortController.signal.aborted) {
      throw new Error('Connection Timed Out. Please check your internet.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Generates a storage path for a document file.
 * @param {string} tripId
 * @param {File} file
 * @returns {string}
 */
export function generateDocumentPath(tripId, file) {
  const ext = file.name.split('.').pop()
  return `${tripId}/${Date.now()}.${ext}`
}

/**
 * Detects file type as 'pdf' or 'image'.
 * @param {File} file
 * @returns {'pdf'|'image'}
 */
export function detectFileType(file) {
  return file.type.includes('pdf') ? 'pdf' : 'image'
}

/**
 * Uploads a document file to storage and saves the record to the database.
 * Does not handle offline state — caller is responsible for checking navigator.onLine.
 * @param {string} tripId
 * @param {string} userId
 * @param {File} file
 * @param {string} displayName - display name for the document
 * @param {string} path - storage path (from generateDocumentPath)
 * @param {'pdf'|'image'} fileType
 * @returns {Promise<Object>} saved document record
 */
export async function uploadDocumentFile(tripId, userId, file, displayName, path, fileType) {
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      trip_id: tripId,
      uploaded_by: userId,
      name: displayName,
      file_url: publicUrl,
      file_type: fileType,
    })
    .select()
    .single()

  if (dbError) throw dbError
  return data
}

/**
 * Removes a document from storage (best-effort) and soft-deletes the DB row.
 * Storage failure is logged but does not prevent the DB soft-delete.
 * @param {string} id - document row id
 * @param {string|null} fileUrl - public URL of the file in storage
 */
/**
 * @returns {Promise<{ storageDeleted: boolean }>}
 */
export async function softDeleteDocument(id, fileUrl) {
  let storageDeleted = true
  if (fileUrl) {
    const path = fileUrl.split(`/${BUCKET}/`)[1]
    if (path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([path])
      if (storageError) {
        console.error('[softDeleteDocument] Storage delete failed:', storageError)
        storageDeleted = false
      }
    }
  }
  const { error } = await supabase.from('documents').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
  return { storageDeleted }
}
