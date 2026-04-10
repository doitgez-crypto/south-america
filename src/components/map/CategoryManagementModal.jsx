import React, { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import { useCategories } from '../../hooks/useCategories'
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS_HE } from '../../lib/constants'

export default function CategoryManagementModal({ isOpen, onClose, tripId }) {
  const {
    categories,
    createCategory,
    isCreating,
    deleteCategory,
    updateCategoryVisibility,
  } = useCategories(tripId)

  const [newName, setNewName]           = useState('')
  const [newIcon, setNewIcon]           = useState('')
  const [confirmDeleteId, setConfirmId] = useState(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createCategory({ name: newName.trim(), icon: newIcon.trim() || null })
      setNewName('')
      setNewIcon('')
    } catch {
      // error already shown via toast in the hook
    }
  }

  const handleDelete = (id) => {
    deleteCategory(id, {
      onSuccess: () => setConfirmId(null),
    })
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="90vh" title="ניהול קטגוריות">
      <div className="p-4 space-y-5 pb-8">

        {/* ── Add new category ── */}
        <form onSubmit={handleAdd} className="flex gap-2 items-center">
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="😀"
            maxLength={2}
            className="w-11 h-11 text-center text-xl border border-earth-200 rounded-xl bg-earth-50 focus:outline-none focus:ring-2 focus:ring-primary-400 flex-shrink-0"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם קטגוריה חדשה..."
            className="flex-1 px-4 py-2.5 border border-earth-200 rounded-xl text-sm bg-earth-50 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button
            type="submit"
            disabled={!newName.trim() || isCreating}
            className="h-11 px-4 bg-primary-500 text-white rounded-xl disabled:opacity-50 flex items-center gap-1.5 text-sm font-bold flex-shrink-0 transition-opacity"
          >
            {isCreating
              ? <Loader2 size={14} className="animate-spin" />
              : <Plus size={14} />
            }
            הוסף
          </button>
        </form>

        {/* ── Custom categories ── */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            קטגוריות מותאמות אישית
          </p>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              אין קטגוריות מותאמות עדיין. הוסף אחת למעלה.
            </p>
          ) : (
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-earth-100 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {cat.icon || '📌'}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                      {cat.name}
                    </span>

                    {/* Toggle visibility */}
                    <button
                      onClick={() =>
                        updateCategoryVisibility({ id: cat.id, is_visible: cat.is_visible === false })
                      }
                      title={cat.is_visible === false ? 'הצג בסרגל' : 'הסתר מסרגל'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        cat.is_visible === false
                          ? 'text-gray-300 hover:text-gray-500'
                          : 'text-primary-500 hover:bg-primary-50'
                      }`}
                    >
                      {cat.is_visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    {/* Delete trigger */}
                    <button
                      onClick={() => setConfirmId(cat.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Inline delete confirmation */}
                  {confirmDeleteId === cat.id && (
                    <div className="flex items-center justify-between bg-red-50 border-t border-red-100 px-3 py-2">
                      <p className="text-xs text-red-700 font-medium">
                        המקומות המשויכים לא יימחקו
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600"
                        >
                          ביטול
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-bold"
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Built-in categories (read-only reference) ── */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            קטגוריות מובנות (לא ניתן לערוך)
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100"
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span className="text-xs text-gray-600 truncate">
                  {CATEGORY_LABELS_HE[cat] || cat}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </BottomSheet>
  )
}
