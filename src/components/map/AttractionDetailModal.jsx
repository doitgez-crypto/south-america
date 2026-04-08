import React, { useState } from 'react'
import { Pencil, Trash2, ExternalLink, X } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import StarRating from '../ui/StarRating'
import CategoryBadge from '../ui/CategoryBadge'
import SavePinModal from './SavePinModal'
import { CURRENCY_SYMBOLS } from '../../lib/constants'

export default function AttractionDetailModal({ attraction, isOpen, onClose, updateAttraction, deleteAttraction, userId, isUpdating, isDeleting }) {
  const [editOpen, setEditOpen] = useState(false)

  if (!attraction) return null

  const { name, country, category, description, rating, price_local, currency_code } = attraction
  const external_links = attraction.external_links || []
  const image_urls = attraction.image_urls || []

  const handleDelete = () => {
    if (!window.confirm('למחוק את המיקום הזה?')) return
    deleteAttraction(attraction.id, {
      onSuccess: () => onClose(),
    })
  }

  const handleSaveEdit = (payload) => {
    updateAttraction(
      { id: attraction.id, payload, userId },
      { onSuccess: () => setEditOpen(false) }
    )
  }

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="85vh">
        {/* Image */}
        {image_urls.length > 0 && (
          <div className="h-48 w-full overflow-hidden">
            <img
              src={image_urls[0]}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{country}</p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setEditOpen(true)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="עריכה"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="מחיקה"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Category + Rating */}
          <div className="flex items-center gap-3 flex-wrap">
            <CategoryBadge category={category} />
            {rating > 0 && <StarRating value={rating} readOnly />}
          </div>

          {/* Description */}
          {description && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">תיאור</p>
              <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
            </div>
          )}

          {/* Price */}
          {price_local && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">מחיר</p>
              <p className="text-gray-700 font-medium">
                {CURRENCY_SYMBOLS[currency_code] ?? ''}{price_local} {currency_code}
              </p>
            </div>
          )}

          {/* Links */}
          {external_links.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">קישורים</p>
              <div className="space-y-1">
                {external_links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-600 text-sm hover:underline"
                  >
                    <ExternalLink size={14} />
                    <span className="truncate" dir="ltr">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Edit form */}
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
