import React from 'react'

export function LoadingSkeleton() {
  return (
    <div className="h-screen w-full bg-earth-50 animate-pulse p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-40 bg-earth-200 rounded-lg" />
        <div className="h-10 w-10 bg-earth-200 rounded-full" />
      </div>

      {/* Map/List Tabs Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-earth-200 rounded-lg" />
        <div className="h-10 flex-1 bg-earth-200 rounded-lg" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 w-full bg-earth-200 rounded-xl" />

      {/* Main Content Area Skeleton */}
      <div className="flex-1 h-[60vh] bg-earth-100 rounded-2xl border-2 border-earth-200/50" />

      {/* Navigation Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-earth-50 border-t border-earth-200 flex justify-around items-center px-4">
        <div className="h-8 w-8 bg-earth-200 rounded-full" />
        <div className="h-8 w-8 bg-earth-200 rounded-full" />
        <div className="h-8 w-8 bg-earth-200 rounded-full" />
        <div className="h-8 w-8 bg-earth-200 rounded-full" />
      </div>
    </div>
  )
}
