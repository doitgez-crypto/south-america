import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateDocumentPath,
  detectFileType,
  fetchDocuments,
  uploadDocumentFile,
  softDeleteDocument,
} from '../services/document-service'

// ── Supabase mock (DB chain + storage) ───────────────────────────────────────

const mocks = vi.hoisted(() => {
  function makeChain(result) {
    const c = {}
    ;['select', 'eq', 'order', 'insert', 'update', 'abortSignal'].forEach((m) => {
      c[m] = vi.fn(() => c)
    })
    c.single = vi.fn(() => Promise.resolve(result))
    c.then = (res, rej) => Promise.resolve(result).then(res, rej)
    c.catch = (fn) => Promise.resolve(result).catch(fn)
    c.finally = (fn) => Promise.resolve(result).finally(fn)
    return c
  }

  const mockUpload = vi.fn()
  const mockGetPublicUrl = vi.fn()
  const mockRemove = vi.fn()
  const mockStorageFrom = vi.fn(() => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
    remove: mockRemove,
  }))
  const mockFrom = vi.fn()

  return { makeChain, mockFrom, mockStorageFrom, mockUpload, mockGetPublicUrl, mockRemove }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mocks.mockFrom,
    storage: { from: mocks.mockStorageFrom },
  },
}))

beforeEach(() => {
  mocks.mockFrom.mockReset()
  mocks.mockStorageFrom.mockReset()
  // Re-wire storage methods after reset
  mocks.mockUpload.mockReset()
  mocks.mockGetPublicUrl.mockReset()
  mocks.mockRemove.mockReset()
  mocks.mockStorageFrom.mockReturnValue({
    upload: mocks.mockUpload,
    getPublicUrl: mocks.mockGetPublicUrl,
    remove: mocks.mockRemove,
  })
})

// ── generateDocumentPath ──────────────────────────────────────────────────────

describe('generateDocumentPath', () => {
  it('returns path in the form tripId/timestamp.ext', () => {
    const file = { name: 'passport.pdf' }
    const path = generateDocumentPath('trip-1', file)
    expect(path).toMatch(/^trip-1\/\d+\.pdf$/)
  })

  it('preserves the original file extension', () => {
    expect(generateDocumentPath('t', { name: 'photo.JPG' })).toMatch(/\.JPG$/)
    expect(generateDocumentPath('t', { name: 'ticket.png' })).toMatch(/\.png$/)
  })

  it('uses current timestamp as the filename (unique per call)', () => {
    const file = { name: 'a.pdf' }
    const path1 = generateDocumentPath('trip-1', file)
    const path2 = generateDocumentPath('trip-1', file)
    // Timestamps may collide in the same ms, but paths must be structurally correct
    expect(path1).toMatch(/^trip-1\/\d+\.pdf$/)
    expect(path2).toMatch(/^trip-1\/\d+\.pdf$/)
  })

  it('takes only the last extension for multi-dot filenames', () => {
    expect(generateDocumentPath('t', { name: 'my.backup.file.pdf' })).toMatch(/\.pdf$/)
  })
})

// ── detectFileType ────────────────────────────────────────────────────────────

describe('detectFileType', () => {
  it('returns "pdf" for PDF MIME type', () => {
    expect(detectFileType({ type: 'application/pdf' })).toBe('pdf')
  })

  it('returns "image" for JPEG', () => {
    expect(detectFileType({ type: 'image/jpeg' })).toBe('image')
  })

  it('returns "image" for PNG', () => {
    expect(detectFileType({ type: 'image/png' })).toBe('image')
  })

  it('returns "image" for unknown type (safe default)', () => {
    expect(detectFileType({ type: 'application/octet-stream' })).toBe('image')
  })
})

// ── fetchDocuments (mocked Supabase) ─────────────────────────────────────────

describe('fetchDocuments', () => {
  it('returns [] for falsy tripId without calling Supabase', async () => {
    expect(await fetchDocuments(null)).toEqual([])
    expect(await fetchDocuments('')).toEqual([])
    expect(await fetchDocuments(undefined)).toEqual([])
    expect(mocks.mockFrom).not.toHaveBeenCalled()
  })

  it('returns the data array on success', async () => {
    const rows = [{ id: 'doc-1', name: 'Visa' }]
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: rows, error: null }))
    const result = await fetchDocuments('trip-1')
    expect(result).toEqual(rows)
  })

  it('queries the documents table with correct trip and deletion filters', async () => {
    const chain = mocks.makeChain({ data: [], error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await fetchDocuments('trip-xyz')
    expect(mocks.mockFrom).toHaveBeenCalledWith('documents')
    expect(chain.eq).toHaveBeenCalledWith('trip_id', 'trip-xyz')
    expect(chain.eq).toHaveBeenCalledWith('is_deleted', false)
  })

  it('throws a "Connection Timed Out" error when Supabase returns an AbortError', async () => {
    const abortErr = new Error('The user aborted a request.')
    abortErr.name = 'AbortError'
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: abortErr }))
    await expect(fetchDocuments('trip-1')).rejects.toThrow('Connection Timed Out')
  })

  it('throws a "Connection Timed Out" error when error message contains "AbortError"', async () => {
    const abortErr = new Error('AbortError: fetch aborted')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: abortErr }))
    await expect(fetchDocuments('trip-1')).rejects.toThrow('Connection Timed Out')
  })

  it('re-throws non-abort errors as-is', async () => {
    const err = new Error('network failure')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: err }))
    await expect(fetchDocuments('trip-1')).rejects.toThrow('network failure')
  })
})

// ── uploadDocumentFile (mocked Supabase storage + DB) ────────────────────────

describe('uploadDocumentFile', () => {
  const file = new File(['content'], 'visa.pdf', { type: 'application/pdf' })

  it('returns the saved DB record on success', async () => {
    mocks.mockUpload.mockResolvedValue({ error: null })
    mocks.mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/trip-1/visa.pdf' },
    })
    const saved = { id: 'doc-1', name: 'Visa', file_url: 'https://storage.example.com/trip-1/visa.pdf' }
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: saved, error: null }))

    const result = await uploadDocumentFile(
      'trip-1', 'user-1', file, 'Visa', 'trip-1/visa.pdf', 'pdf'
    )
    expect(result).toEqual(saved)
  })

  it('throws when storage upload fails', async () => {
    mocks.mockUpload.mockResolvedValue({ error: new Error('upload failed') })
    await expect(
      uploadDocumentFile('trip-1', 'user-1', file, 'Visa', 'trip-1/visa.pdf', 'pdf')
    ).rejects.toThrow('upload failed')
  })

  it('throws when DB insert fails', async () => {
    mocks.mockUpload.mockResolvedValue({ error: null })
    mocks.mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://url' } })
    const dbErr = new Error('insert failed')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ data: null, error: dbErr }))
    await expect(
      uploadDocumentFile('trip-1', 'user-1', file, 'Visa', 'trip-1/visa.pdf', 'pdf')
    ).rejects.toThrow('insert failed')
  })

  it('inserts correct fields into the documents table', async () => {
    mocks.mockUpload.mockResolvedValue({ error: null })
    mocks.mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://url/file.pdf' } })
    const chain = mocks.makeChain({ data: { id: 'x' }, error: null })
    mocks.mockFrom.mockReturnValue(chain)

    await uploadDocumentFile('trip-1', 'user-1', file, 'Visa', 'path/file.pdf', 'pdf')
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        trip_id: 'trip-1',
        uploaded_by: 'user-1',
        name: 'Visa',
        file_type: 'pdf',
        file_url: 'https://url/file.pdf',
      })
    )
  })
})

// ── softDeleteDocument (mocked storage + DB) ──────────────────────────────────

describe('softDeleteDocument', () => {
  const fileUrl = 'https://storage.example.com/trip-documents/trip-1/doc.pdf'

  it('returns { storageDeleted: true } when both storage and DB succeed', async () => {
    mocks.mockRemove.mockResolvedValue({ error: null })
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: null }))
    const result = await softDeleteDocument('doc-1', fileUrl)
    expect(result).toEqual({ storageDeleted: true })
  })

  it('returns { storageDeleted: false } when storage deletion fails (non-fatal)', async () => {
    mocks.mockRemove.mockResolvedValue({ error: new Error('storage error') })
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: null }))
    const result = await softDeleteDocument('doc-1', fileUrl)
    expect(result).toEqual({ storageDeleted: false })
  })

  it('still soft-deletes DB row even when storage deletion fails', async () => {
    mocks.mockRemove.mockResolvedValue({ error: new Error('storage error') })
    const chain = mocks.makeChain({ error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await softDeleteDocument('doc-1', fileUrl)
    expect(chain.update).toHaveBeenCalledWith({ is_deleted: true })
  })

  it('skips storage deletion when fileUrl is null', async () => {
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: null }))
    const result = await softDeleteDocument('doc-1', null)
    expect(mocks.mockRemove).not.toHaveBeenCalled()
    expect(result).toEqual({ storageDeleted: true })
  })

  it('throws when DB soft-delete fails', async () => {
    mocks.mockRemove.mockResolvedValue({ error: null })
    const dbErr = new Error('db delete failed')
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: dbErr }))
    await expect(softDeleteDocument('doc-1', fileUrl)).rejects.toThrow('db delete failed')
  })

  it('sets is_deleted=true on the correct document row', async () => {
    mocks.mockRemove.mockResolvedValue({ error: null })
    const chain = mocks.makeChain({ error: null })
    mocks.mockFrom.mockReturnValue(chain)
    await softDeleteDocument('doc-1', fileUrl)
    expect(chain.update).toHaveBeenCalledWith({ is_deleted: true })
    expect(chain.eq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('skips storage deletion when fileUrl does not contain the bucket path separator', async () => {
    // URL without /trip-documents/ → path split returns undefined → storage skipped
    const urlWithoutBucket = 'https://storage.example.com/other-bucket/doc.pdf'
    mocks.mockFrom.mockReturnValue(mocks.makeChain({ error: null }))
    const result = await softDeleteDocument('doc-1', urlWithoutBucket)
    expect(mocks.mockRemove).not.toHaveBeenCalled()
    expect(result).toEqual({ storageDeleted: true })
  })
})
