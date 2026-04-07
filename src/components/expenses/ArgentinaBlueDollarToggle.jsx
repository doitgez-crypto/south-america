import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

export default function ArgentinaBlueDollarToggle() {
  const { blueRate, setBlueRate, useBlueRate, setUseBlueRate } = useAppContext()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden mx-4 mb-3">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💵</span>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-800">שער הדולר הכחול</p>
            <p className="text-xs text-blue-500">ארגנטינה — {useBlueRate ? `${blueRate} ARS/USD` : 'לא פעיל'}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-blue-400" />
        ) : (
          <ChevronDown size={18} className="text-blue-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-100">
          {/* Toggle */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm text-blue-700">השתמש בשער הכחול</span>
            <button
              onClick={() => setUseBlueRate(!useBlueRate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useBlueRate ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  useBlueRate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Rate input */}
          <div>
            <label className="block text-xs text-blue-600 mb-1">שער ידני (ARS לדולר)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={blueRate}
                onChange={(e) => setBlueRate(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                dir="ltr"
              />
              <span className="text-xs text-blue-500">ARS/$</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
