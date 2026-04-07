import React, { useState, useEffect } from 'react'
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS_HE } from '../../lib/constants'

export default function AddAttractionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  initialData 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Must-See')
  const [customCategory, setCustomCategory] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  // Pre-fill if initialData (from search/pin) is provided
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      if (initialData.category) {
        if (CATEGORIES.includes(initialData.category)) {
          setCategory(initialData.category)
          setIsCustom(false)
        } else {
          setCategory('Other')
          setCustomCategory(initialData.category)
          setIsCustom(true)
        }
      }
    } else {
      setName('')
      setDescription('')
      setCategory('Must-See')
      setIsCustom(false)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalCategory = isCustom ? customCategory.trim() : category
    onSave({
      name: name.trim(),
      description: description.trim(),
      category: finalCategory || 'Other',
      country: initialData?.country || 'Argentina', // Default or from geocoding
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-earth-100 bg-earth-50/50">
        <button onClick={onClose} className="p-2 text-earth-500 hover:bg-earth-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-earth-800">הוספת מיקום חדש</h2>
        <button 
          onClick={handleSubmit}
          disabled={!name.trim() || isSaving}
          className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-md"
        >
          {isSaving ? 'שומר...' : 'שמור'}
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-earth-600 mb-2">שם המקום</label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="איפה תרצו לבקר?"
            className="w-full px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-lg"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-earth-600 mb-2">תיאור / הערות</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="מה מעניין כאן? משהו שחשוב לזכור?"
            className="w-full px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-semibold text-earth-600 mb-2">קטגוריה</label>
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat)
                  setIsCustom(false)
                }}
                className={`flex-none px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                  !isCustom && category === cat 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-earth-100 bg-white text-earth-600'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span className="whitespace-nowrap">{CATEGORY_LABELS_HE[cat] || cat}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`flex-none px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                isCustom 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-earth-100 bg-white text-earth-600'
              }`}
            >
              <span>➕</span>
              <span className="whitespace-nowrap">אחר / מותאם אישית</span>
            </button>
          </div>

          {isCustom && (
            <input
              type="text"
              required
              autoFocus
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="הזן שם לקטגוריה שלך"
              className="mt-3 w-full px-4 py-3 bg-earth-50 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none animate-in fade-in duration-300"
            />
          )}
        </div>

        {/* Location Preview (Static for now) */}
        {initialData?.coordinates && (
          <div className="bg-earth-100 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-sm font-bold text-earth-800">מיקום נבחר</p>
              <p className="text-xs text-earth-500">
                {initialData.coordinates.lat.toFixed(4)}, {initialData.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
