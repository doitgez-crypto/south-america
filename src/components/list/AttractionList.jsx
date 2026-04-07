import React from 'react'
import AttractionCard from './AttractionCard'
import { EmptyState } from '../ui/EmptyState'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export default function AttractionList({ attractions, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!attractions.length) {
    return (
      <EmptyState
        title="אין מקומות עדיין"
        description="הוסף מקום ראשון מהמפה!"
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {attractions.map((attraction) => (
        <AttractionCard
          key={attraction.id}
          attraction={attraction}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
