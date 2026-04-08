import React from 'react'
import CategoryBadge from '../ui/CategoryBadge'
import StarRating from '../ui/StarRating'
import { CURRENCY_SYMBOLS } from '../../lib/constants'

const COUNTRY_FLAGS = {
  Argentina: '🇦🇷', Brazil: '🇧🇷', Chile: '🇨🇱',
  Peru: '🇵🇪', Bolivia: '🇧🇴', Colombia: '🇨🇴', Ecuador: '🇪🇨',
}

export default function AttractionCard({ attraction, onSelect }) {
  const { name, country, category, rating, price_local, currency_code } = attraction
  const image_urls = attraction.image_urls || []
  const thumb = image_urls[0]

  return (
    <button
      onClick={() => onSelect(attraction)}
      className="w-full flex items-center gap-3 p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors text-right"
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
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          {attraction.status === 'pending' && (
            <span className="text-[10px] bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded-md border border-sky-200 animate-pulse">שומר...</span>
          )}
          {attraction.status === 'offline' && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md border border-red-200">לא נשמר (מצב לא מקוון)</span>
              <button 
                onClick={(e) => { e.stopPropagation(); /* parent handles retry if we export it */ }} 
                className="text-[10px] text-primary-600 font-bold hover:underline"
              >
                לחץ לנסות שנית
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-sm">{COUNTRY_FLAGS[country] ?? '🌍'}</span>
          <span className="text-xs text-gray-500">{country}</span>
          <CategoryBadge category={category} />
        </div>
        <div className="flex items-center justify-between mt-1">
          {rating > 0 && <StarRating value={rating} readOnly max={5} />}
          {price_local && (price_local > 0) && (
            <span className="text-xs text-gray-500 mr-auto">
              {CURRENCY_SYMBOLS[currency_code] ?? ''}{price_local}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
