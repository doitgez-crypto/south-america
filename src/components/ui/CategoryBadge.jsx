import React from 'react'
import { CATEGORY_COLORS, CATEGORY_LABELS_HE, CATEGORY_ICONS } from '../../lib/constants'

/**
 * Small category pill badge.
 * Props: { category }
 */
export default function CategoryBadge({ category }) {
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700'
  const label = CATEGORY_LABELS_HE[category] ?? category
  const icon = CATEGORY_ICONS[category] ?? '📍'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
