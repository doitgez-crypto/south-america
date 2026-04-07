import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useAttractions } from '../../hooks/useAttractions'
import FilterChips from '../map/FilterChips'
import SearchInput from './SearchInput'
import AttractionList from './AttractionList'
import AttractionDetailModal from '../map/AttractionDetailModal'

export default function ListTab() {
  const { user, profile, activeCategory } = useAppContext()
  const tripId = profile?.trip_id

  const [searchQuery, setSearchQuery]   = useState('')
  const [detailAttraction, setDetail]   = useState(null)

  const filters = {
    ...(activeCategory !== 'all' ? { category: activeCategory } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }

  const {
    attractions,
    isLoading,
    updateAttraction,
    deleteAttraction,
    isUpdating,
    isDeleting,
  } = useAttractions(tripId, filters)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Filter chips */}
      <FilterChips />

      {/* Search */}
      <div className="bg-white py-2 border-b border-gray-100">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Count badge */}
      {!isLoading && (
        <div className="px-4 py-2">
          <span className="text-xs text-gray-400">
            {attractions.length} מקומות
          </span>
        </div>
      )}

      {/* List */}
      <AttractionList
        attractions={attractions}
        isLoading={isLoading}
        onSelect={setDetail}
      />

      {/* Detail modal */}
      <AttractionDetailModal
        attraction={detailAttraction}
        isOpen={!!detailAttraction}
        onClose={() => setDetail(null)}
        updateAttraction={updateAttraction}
        deleteAttraction={deleteAttraction}
        userId={user?.id}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  )
}
