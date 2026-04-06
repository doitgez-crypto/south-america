import { MapPin } from 'lucide-react'

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-4 rounded-full bg-earth-100 p-5">
        <MapPin className="h-10 w-10 text-earth-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  )
}
