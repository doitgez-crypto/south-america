import React from 'react'
import { useOffline } from '../../hooks/useOffline'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const isOffline = useOffline()
  if (!isOffline) return null

  return (
    <div className="bg-yellow-400 text-yellow-900 text-sm py-2 px-4 flex items-center justify-center gap-2 z-50">
      <WifiOff size={16} />
      <span>אתה במצב לא מקוון — שינויים יישמרו מקומית</span>
    </div>
  )
}
