import React, { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet'
import StarRating from '../ui/StarRating'
import { CATEGORIES, CATEGORY_LABELS_HE, COUNTRIES, COUNTRY_LABELS_HE } from '../../lib/constants'

export default function SavePinModal({ pin, isOpen, onClose, onSave, isSaving, initialData }) {
  const [name, setName]           = useState('')
  const [category, setCategory]   = useState('Food')
  const [country, setCountry]     = useState('Argentina')
  const [description, setDesc]    = useState('')
  const [rating, setRating]       = useState(0)

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '')
      setCategory(initialData.category ?? 'Food')
      setCountry(initialData.country ?? 'Argentina')
      setDesc(initialData.description ?? '')
      setRating(initialData.rating ?? 0)
    } else {
      setName('')
      setCategory('Food')
      setCountry('Argentina')
      setDesc('')
      setRating(0)
    }
  }, [initialData, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), category, country, description: description.trim(), rating })
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'ערוך מיקום' : 'שמור מיקום'}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם המקום *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: מסעדת הפמפה"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS_HE[c]}</option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מדינה</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{COUNTRY_LABELS_HE[c]}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (אופציונלי)</label>
          <textarea
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            placeholder="הערות, שעות פתיחה, המלצות..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">דירוג</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {pin && (
          <p className="text-xs text-gray-400" dir="ltr">
            📍 {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
