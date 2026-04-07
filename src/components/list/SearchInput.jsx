import React from 'react'
import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mx-3 mb-2">
      <Search size={18} className="text-gray-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חפש מקום..."
        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
      />
    </div>
  )
}
