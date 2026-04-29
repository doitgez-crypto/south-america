import React, { useState } from 'react'
import CategoryBadge from '../ui/CategoryBadge'
import StarRating from '../ui/StarRating'
import { CURRENCY_SYMBOLS } from '../../lib/constants'
import { Pencil, Trash2 } from 'lucide-react'
import { formatDistance } from '../../lib/distance'

const COUNTRY_FLAGS = {
  Argentina: '🇦🇷', Brazil: '🇧🇷', Chile: '🇨🇱',
  Peru: '🇵🇪', Bolivia: '🇧🇴', Colombia: '🇨🇴', Ecuador: '🇪🇨',
}

export default function AttractionCard({ attraction, onSelect, onEdit, onDelete }) {
  const { name, country, category, rating, price_local, currency_code } = attraction
  const image_urls = attraction.image_urls || []
  const thumb = image_urls[0]
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white border-b border-gray-100" data-cy="attraction-item">
      {/* Main row — tap opens detail */}
      <div
        onClick={() => onSelect(attraction)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(attraction)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-right cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-100 to-earth-100">
          {thumb ? (
            <img src={thumb} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              📍
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-between">
            <p className="font-semibold text-gray-900 truncate pr-2">{name}</p>
            <div className="flex items-center gap-1">
              {attraction.status === 'pending' && (
                <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-md border border-sky-200 animate-pulse">שומר...</span>
              )}
              {attraction.status === 'offline' && (
                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md border border-red-200">לא נשמר</span>
              )}
              {!attraction.status && onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(attraction) }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
              {!attraction.status && onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-sm">{COUNTRY_FLAGS[country] ?? '🌍'}</span>
            <span className="text-xs text-gray-500">{country || 'מיקום לא ידוע'}</span>
            <CategoryBadge category={category} />
            {attraction.distance != null && (
              <span className="text-xs text-primary-500">📍 {formatDistance(attraction.distance)}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            {rating > 0 && <StarRating value={rating} readOnly max={5} />}
            {price_local > 0 && (
              <span className="text-xs text-gray-500 mr-auto">
                {CURRENCY_SYMBOLS[currency_code] ?? ''}{price_local}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inline delete confirmation bar */}
      {confirmDelete && (
        <div className="flex items-center justify-between bg-red-50 border-t border-red-100 px-4 py-2.5">
          <p className="text-sm font-semibold text-red-700">למחוק מקום זה?</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
              className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg"
            >
              ביטול
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(attraction); setConfirmDelete(false) }}
              className="px-3 py-1.5 text-sm font-bold text-white bg-red-500 rounded-lg"
            >
              מחק
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
