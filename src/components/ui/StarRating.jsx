import React from 'react'

/**
 * Star rating component.
 * Props: { value, onChange, readOnly, max }
 */
export default function StarRating({ value = 0, onChange, readOnly = false, max = 5 }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          className={`text-2xl leading-none transition-colors ${
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= value ? 'text-primary-500' : 'text-gray-300'}`}
          aria-label={`${star} כוכבים`}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
