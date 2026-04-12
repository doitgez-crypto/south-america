import React, { useState, useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useAttractions } from '../../hooks/useAttractions'
import { useUserLocation } from '../../hooks/useUserLocation'
import MapView from './MapView'
import SearchBar from './SearchBar'
import FilterChips from './FilterChips'
import SavePinModal from './SavePinModal'
import AttractionDetailModal from './AttractionDetailModal'

export default function MapTab() {
  const {
    user,
    profile,
    activeCategory,
    setIsAddModalOpen,
    setAddModalData
  } = useAppContext()
  const tripId = profile?.trip_id

  const { coords: userCoords } = useUserLocation()

  const filters = activeCategory !== 'all' ? { category: activeCategory } : {}
  const {
    attractions,
    isLoading,
    updateAttraction,
    deleteAttraction,
    isUpdating,
    isDeleting,
    deletingId,
  } = useAttractions(tripId, filters, userCoords)

  const [pendingPin, setPendingPin]           = useState(null)
  const [detailAttraction, setDetail]         = useState(null)
  const [flyToTarget, setFlyToTarget]         = useState(null)

  const handleMapClick = useCallback(({ lat, lng }) => {
    if (detailAttraction) return
    const data = { coordinates: { lat, lng } }
    setPendingPin({ lat, lng })
    setAddModalData(data)
    setIsAddModalOpen(true)
  }, [detailAttraction, setAddModalData, setIsAddModalOpen])

  const handleSearchSelect = useCallback(({ lat, lng, label, country }) => {
    setFlyToTarget({ lat, lng })
    const data = {
      name: label.split(',')[0],
      coordinates: { lat, lng },
      description: label,
      country: country || '',
    }
    setPendingPin({ lat, lng })
    setAddModalData(data)
    setIsAddModalOpen(true)
  }, [setAddModalData, setIsAddModalOpen])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <SearchBar onLocationSelect={handleSearchSelect} />

      {/* Filter chips */}
      <FilterChips />

      {/* Map fills remaining space */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <MapView
          attractions={attractions}
          pendingPin={pendingPin}
          flyToTarget={flyToTarget}
          onMapClick={handleMapClick}
          onAttractionClick={setDetail}
        />
      </div>

      {/* Detail modal (still local to MapTab for now as it's purely informational) */}
      <AttractionDetailModal
        attraction={detailAttraction}
        isOpen={!!detailAttraction}
        onClose={() => setDetail(null)}
        updateAttraction={updateAttraction}
        deleteAttraction={deleteAttraction}
        userId={user?.id}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        deletingId={deletingId}
      />
    </div>
  )
}
