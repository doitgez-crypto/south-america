import React from 'react'
import { FileText } from 'lucide-react'

export default function DocumentsTab() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileText size={36} className="text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">מסמכים</h2>
      <p className="text-gray-400 max-w-xs leading-relaxed">
        העלאת כרטיסי טיסה, ביטוח ומסמכי נסיעה — בקרוב!
      </p>
    </div>
  )
}
