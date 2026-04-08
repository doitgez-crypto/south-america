import React, { useState, useEffect } from 'react'
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS_HE } from '../../lib/constants'
import { useImageUpload } from '../../hooks/useImageUpload'
import { Loader2, Plus, X, Globe, DollarSign, Image as ImageIcon } from 'lucide-react'
import SearchBar from './SearchBar'
import { useAppContext } from '../../context/AppContext'
import { useCategories } from '../../hooks/useCategories'

export default function AddAttractionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  initialData 
}) {
  const { profile } = useAppContext()
  const { categories: dbCategories, createCategory } = useCategories(profile?.trip_id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Must-See')
  const [customCategory, setCustomCategory] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [price, setPrice] = useState('')
  const [links, setLinks] = useState([''])
  const [images, setImages] = useState([])
  
  // Location state
  const [coords, setCoords] = useState(null)
  const [coordsLabel, setCoordsLabel] = useState('')
  
  const { uploadImages, uploading } = useImageUpload()

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setPrice(initialData.price ? String(initialData.price) : '')
      setLinks(initialData.external_links?.length ? initialData.external_links : [''])
      setImages(initialData.image_urls || [])
      
      setCoords(initialData.coordinates || null)
      setCoordsLabel(initialData.description || initialData.name || '')
      
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
      setPrice('')
      setLinks([''])
      setImages([])
      setCategory('Must-See')
      setIsCustom(false)
      setCoords(null)
      setCoordsLabel('')
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleAddLink = () => setLinks([...links, ''])
  const handleLinkChange = (index, val) => {
    const newLinks = [...links]
    newLinks[index] = val
    setLinks(newLinks)
  }
  const handleRemoveLink = (index) => setLinks(links.filter((_, i) => i !== index))

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const uploadedUrls = await uploadImages(files, 'temp-uploads')
    setImages([...images, ...uploadedUrls])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let finalCategory = category
    if (isCustom && customCategory.trim()) {
      finalCategory = customCategory.trim()
      try {
        await createCategory(finalCategory)
      } catch (err) {
        console.warn('Category creation skipped or already exists', err)
      }
    }
    
    const finalLinks = links.filter(l => l.trim().length > 0)
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      category: finalCategory || 'Other',
      price_local: price ? parseFloat(price) : null,
      external_links: finalLinks,
      image_urls: images,
      country: initialData?.country || 'Argentina',
      coordinates: coords,
    })
  }

  const handleLocationSelect = (item) => {
    setCoords({ lat: item.lat, lng: item.lng })
    setCoordsLabel(item.label)
    if (!name) setName(item.label.split(',')[0])
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-earth-100 bg-earth-50/50">
        <button onClick={onClose} className="p-2 text-earth-500 hover:bg-earth-100 rounded-full">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold text-earth-800">פרטי המקום</h2>
        <button 
          onClick={handleSubmit}
          disabled={!name.trim() || isSaving || uploading}
          className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          {(isSaving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'שומר...' : uploading ? 'מעלה...' : 'שמור'}
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
      
        {/* Location Selection block (Always at the top for context) */}
        <div className="bg-earth-100/50 rounded-xl p-4 space-y-3 border border-earth-200">
          <label className="block text-sm font-bold text-earth-800 flex items-center gap-2">
            <span className="text-xl">📍</span> מיקום גיאוגרפי במפה
          </label>
          
          {coords ? (
             <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-earth-200 shadow-sm">
               <p className="text-sm font-semibold text-earth-700 truncate ml-4">
                 {coordsLabel || 'המיקום נבחר (נעץ במפה)'}
               </p>
               <button 
                 type="button" 
                 onClick={() => { setCoords(null); setCoordsLabel(''); }} 
                 className="text-red-500 text-xs font-bold hover:bg-red-50 p-2 rounded-lg transition-colors whitespace-nowrap"
               >
                 שנה מיקום
               </button>
             </div>
          ) : (
             <div className="animate-in fade-in">
               <p className="text-xs text-earth-600 mb-2 font-medium">חובה לבחור מיקום כדי לשמור. חפש מקום עכשיו:</p>
               <SearchBar onLocationSelect={handleLocationSelect} />
             </div>
          )}
        </div>

        {/* Name & Description */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-earth-600 mb-2">שם המקום</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="איפה תרצו לבקר?"
              className="w-full px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-earth-600 mb-2">תיאור / הערות</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מה מעניין כאן?"
              className="w-full px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Price & Category Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-earth-600 mb-2 flex items-center gap-1">
              <DollarSign size={14} /> מחיר (משוער)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
             <label className="block text-sm font-semibold text-earth-600 mb-2">קטגוריה</label>
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
               className="w-full px-4 py-3 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
             >
               {CATEGORIES.map(cat => (
                 <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {CATEGORY_LABELS_HE[cat]}</option>
               ))}
               {dbCategories.map(cat => (
                 <option key={`db-${cat.id}`} value={cat.name}>📌 {cat.name}</option>
               ))}
               <option value="Other">➕ מותאם אישית (חדש)</option>
             </select>
          </div>
        </div>

        {isCustom && (
          <input
            type="text"
            required
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="שם לקטגוריה שלך"
            className="w-full px-4 py-3 bg-earth-50 border border-primary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none animate-in fade-in"
          />
        )}

        {/* External Links */}
        <div>
          <label className="block text-sm font-semibold text-earth-600 mb-2 flex items-center gap-1">
            <Globe size={14} /> קישורים (אתר, בוקינג, גוגל מאפס)
          </label>
          <div className="space-y-2">
            {links.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => handleLinkChange(idx, e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 bg-earth-50 border border-earth-200 rounded-xl text-xs"
                />
                {links.length > 1 && (
                  <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-400 p-2">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddLink}
              className="text-primary-600 text-xs font-bold flex items-center gap-1 mt-1"
            >
              <Plus size={14} /> הוסף קישור נוסף
            </button>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-earth-600 mb-2 flex items-center gap-1">
            <ImageIcon size={14} /> תמונות
          </label>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-earth-200 relative group">
                <img src={url} className="w-full h-full object-cover" alt="" />
                <button 
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-earth-200 flex flex-col items-center justify-center text-earth-400 cursor-pointer hover:border-primary-400 hover:text-primary-400 transition-all">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              <Plus size={24} />
              <span className="text-[10px] mt-1">הוסף</span>
            </label>
          </div>
        </div>
      </form>
    </div>
  )
}
