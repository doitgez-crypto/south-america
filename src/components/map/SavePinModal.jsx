import React, { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import StarRating from '../ui/StarRating'
import { CATEGORIES, CATEGORY_LABELS_HE, COUNTRIES, COUNTRY_LABELS_HE, CURRENCY_SYMBOLS } from '../../lib/constants'
import { useAppContext } from '../../context/AppContext'
import { useCategories } from '../../hooks/useCategories'
import { useImageUpload } from '../../hooks/useImageUpload'

export default function SavePinModal({ pin, isOpen, onClose, onSave, isSaving, initialData }) {
  const { profile } = useAppContext()
  const { categories: dbCategories, createCategory } = useCategories(profile?.trip_id)
  const { uploadImages, uploading: uploadingImages } = useImageUpload()

  const [name, setName]           = useState('')
  const [category, setCategory]   = useState('Food')
  const [customCategory, setCustomCategory] = useState('')
  const [isCustom, setIsCustom]   = useState(false)
  const [country, setCountry]     = useState('')
  const [description, setDesc]    = useState('')
  const [rating, setRating]       = useState(0)
  const [priceLocal, setPriceLocal]   = useState('')
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [links, setLinks]         = useState('')
  const [images, setImages]       = useState([])

  // ── Reverse geocode from pin coordinates ────────────────
  useEffect(() => {
    if (!pin?.lat || !pin?.lng) return
    if (initialData?.country) return

    const controller = new AbortController()
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${pin.lat}&lon=${pin.lng}&format=json&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'SouthAmericaTravelPlanner/1.0' },
        signal: controller.signal,
      }
    )
      .then(r => r.json())
      .then(d => {
        const countryName = d.address?.country
        if (!countryName) return
        const matched = COUNTRIES.find(cn => cn.toLowerCase() === countryName.toLowerCase())
        if (matched) setCountry(matched)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [pin?.lat, pin?.lng, initialData?.country])

  // Pre-fill when editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '')
      setCountry(initialData.country ?? '')
      setDesc(initialData.description ?? '')
      setRating(initialData.rating ?? 0)
      setPriceLocal(initialData.price_local != null ? String(initialData.price_local) : '')
      setCurrencyCode(initialData.currency_code ?? 'USD')
      setLinks(Array.isArray(initialData.links) ? initialData.links.join('\n') : '')
      setImages(Array.isArray(initialData.image_urls) ? initialData.image_urls : [])

      if (initialData.category) {
        const isBuiltIn = CATEGORIES.includes(initialData.category)
        const isDbCat   = dbCategories.some(c => c.name === initialData.category)
        if (isBuiltIn || isDbCat) {
          setCategory(initialData.category)
          setIsCustom(false)
        } else {
          setCategory('Other')
          setCustomCategory(initialData.category)
          setIsCustom(true)
        }
      } else {
        setCategory('Food')
        setIsCustom(false)
      }
    } else {
      setName('')
      setCategory('Food')
      setCustomCategory('')
      setIsCustom(false)
      setCountry('')
      setDesc('')
      setRating(0)
      setPriceLocal('')
      setCurrencyCode('USD')
      setLinks('')
      setImages([])
    }
  }, [initialData, isOpen, dbCategories])

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    try {
      const uploadedUrls = await uploadImages(files, initialData?.id || 'temp-uploads')
      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls])
      }
    } catch (err) {
      console.error('handleImageChange failed:', err)
    }
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    let finalCategory = category
    if (isCustom && customCategory.trim()) {
      finalCategory = customCategory.trim()
      try {
        await createCategory(finalCategory)
      } catch (err) {
        console.warn('Category creation skipped or already exists', err)
      }
    }

    const linksList = links.split('\n').map(l => l.trim()).filter(Boolean)
    onSave({
      name: name.trim(),
      category: finalCategory || 'Other',
      country,
      description: description.trim(),
      rating,
      price_local: priceLocal !== '' ? Number(priceLocal) : null,
      currency_code: priceLocal !== '' ? currencyCode : null,
      external_links: linksList,
      image_urls: images,
    })
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
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <select
              value={isCustom ? 'Other' : category}
              onChange={(e) => {
                if (e.target.value === 'Other') {
                  setIsCustom(true)
                  setCategory('Other')
                } else {
                  setCategory(e.target.value)
                  setIsCustom(false)
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS_HE[c]}</option>
              ))}
              {dbCategories?.map(cat => (
                <option key={`db-${cat.id}`} value={cat.name}>📌 {cat.name}</option>
              ))}
              <option value="Other">➕ מותאם אישית (חדש)</option>
            </select>
          </div>

          {isCustom && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="הכנס שם לקטגוריה החדשה..."
                className="w-full px-4 py-3 border-2 border-primary-100 bg-primary-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
              <p className="text-xs text-primary-600 mt-1.5 font-medium px-1">
                הקטגוריה תישמר ותהיה זמינה גם למקומות הבאים!
              </p>
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מדינה</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            <option value="">בחר מדינה...</option>
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

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (אופציונלי)</label>
          <div className="flex gap-2">
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-28 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white text-sm flex-shrink-0"
            >
              {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                <option key={code} value={code}>{sym} {code}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceLocal}
              onChange={(e) => setPriceLocal(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">קישורים (אופציונלי)</label>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={2}
            placeholder={"https://maps.google.com/...\nhttps://www.tripadvisor.com/..."}
            dir="ltr"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">כל קישור בשורה נפרדת</p>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">תמונות (אופציונלי)</label>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-100 relative group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${uploadingImages ? 'border-primary-300 text-primary-400' : 'border-gray-200 text-gray-400 hover:border-primary-400 hover:text-primary-400'}`}>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={uploadingImages}
                onChange={handleImageChange}
              />
              {uploadingImages ? (
                <span className="text-[10px] text-center px-1">מעלה...</span>
              ) : (
                <>
                  <Plus size={22} />
                  <span className="text-[10px] mt-1">הוסף</span>
                </>
              )}
            </label>
          </div>
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
            disabled={isSaving || uploadingImages || !name.trim()}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {uploadingImages ? 'מעלה תמונות...' : isSaving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
