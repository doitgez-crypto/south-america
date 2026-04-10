import React, { useState, useEffect } from 'react'
import { Pencil, Trash2, ExternalLink, X } from 'lucide-react'
import CategoryBadge from '../ui/CategoryBadge'
import StarRating from '../ui/StarRating'
import SavePinModal from './SavePinModal'
import { CURRENCY_SYMBOLS } from '../../lib/constants'

export default function AttractionDetailModal({
  attraction,
  isOpen,
  onClose,
  updateAttraction,
  deleteAttraction,
  userId,
  isUpdating,
  isDeleting,
  deletingId,
}) {
  const [editOpen, setEditOpen]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Always clear the confirm bar when the modal closes (e.g. navigating away mid-delete)
  useEffect(() => {
    if (!isOpen) setConfirmDelete(false)
  }, [isOpen])

  // Debug: log full attraction data when modal opens
  useEffect(() => {
    if (isOpen && attraction) console.log('Location Data:', attraction)
  }, [isOpen, attraction])

  if (!isOpen || !attraction) return null

  const { name, country, category, description, rating, price_local, currency_code } = attraction
  const external_links = attraction.links || []
  const image_urls     = attraction.image_urls     || []

  const handleDelete = () => {
    deleteAttraction({ id: attraction.id, userId }, {
      onSuccess: () => {
        console.log('Delete successful, closing modal')
      },
      onSettled: () => {
        // Always close the modal and clear confirm bar regardless of outcome
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  const handleSaveEdit = (payload) => {
    updateAttraction(
      { id: attraction.id, payload, userId },
      { onSettled: () => setEditOpen(false) }
    )
  }

  return (
    <>
      {/* Full-screen container */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col bg-white animate-in slide-in-from-bottom duration-300"
        style={{ zIndex: 9999 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="סגור"
          >
            <X size={22} />
          </button>

          <h2 className="text-base font-bold text-gray-900 truncate mx-3 flex-1 text-center">
            {name}
          </h2>

          <div className="flex gap-1">
            <button
              onClick={() => setEditOpen(true)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="ערוך"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deletingId === attraction.id}
              className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
              aria-label="מחק"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero image */}
          {image_urls.length > 0 && (
            <div className="h-52 w-full overflow-hidden flex-shrink-0">
              <img
                src={image_urls[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Country + Category + Rating row */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                {country || 'מיקום לא ידוע'}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <CategoryBadge category={category} />
                {rating > 0 && <StarRating value={rating} readOnly />}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  תיאור
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
              </div>
            )}

            {/* Price */}
            {price_local > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  מחיר
                </p>
                <p className="text-gray-700 font-medium">
                  {CURRENCY_SYMBOLS[currency_code] ?? ''}{price_local}
                  {currency_code && (
                    <span className="text-sm text-gray-400 mr-1">{currency_code}</span>
                  )}
                </p>
              </div>
            )}

            {/* External links */}
            {external_links.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  קישורים
                </p>
                <div className="space-y-2">
                  {external_links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 text-sm hover:underline"
                    >
                      <ExternalLink size={14} className="flex-shrink-0" />
                      <span className="truncate" dir="ltr">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Image gallery (remaining images) */}
            {image_urls.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  תמונות
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {image_urls.slice(1).map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden border border-gray-100"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Delete confirmation bar (fixed to bottom of full-screen) ── */}
        {confirmDelete && (
          <div className="flex-shrink-0 flex items-center justify-between bg-red-50 border-t border-red-200 px-5 py-3">
            <p className="text-sm font-semibold text-red-700">למחוק את המקום הזה?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === attraction.id}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl disabled:opacity-50 flex items-center gap-1.5"
              >
                {deletingId === attraction.id ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מוחק...
                  </span>
                ) : 'מחק'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit sheet layers on top */}
      <SavePinModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveEdit}
        isSaving={isUpdating}
        initialData={attraction}
      />
    </>
  )
}
