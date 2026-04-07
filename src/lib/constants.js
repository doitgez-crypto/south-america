export const COUNTRIES = [
  'Argentina',
  'Brazil',
  'Chile',
  'Peru',
  'Bolivia',
  'Colombia',
  'Ecuador',
]

export const COUNTRY_LABELS_HE = {
  Argentina: 'ארגנטינה',
  Brazil:    'ברזיל',
  Chile:     'צ\'ילה',
  Peru:      'פרו',
  Bolivia:   'בוליביה',
  Colombia:  'קולומביה',
  Ecuador:   'אקוודור',
}

export const CATEGORIES = [
  'Trek',
  'Food',
  'Lodging',
  'Nightlife',
  'Culture',
  'Logistics',
  'Must-See',
  'Transport',
  'Viewpoint',
  'Border',
]

export const CATEGORY_LABELS_HE = {
  Trek:       'טיול רגלי',
  Food:       'אוכל',
  Lodging:    'לינה',
  Nightlife:  'בילויי לילה',
  Culture:    'תרבות',
  Logistics:  'לוגיסטיקה',
  'Must-See': 'חובה לראות',
  Transport:  'תחבורה',
  Viewpoint:  'תצפית',
  Border:     'מעבר גבול',
}

/** Filter chips shown in Map + List tabs */
export const FILTER_CHIPS = [
  { value: 'all',      label: 'הכל' },
  { value: 'Food',     label: 'אוכל' },
  { value: 'Lodging',  label: 'לינה' },
  { value: 'Trek',     label: 'טיול רגלי' },
  { value: 'Transport',label: 'תחבורה' },
  { value: 'Viewpoint',label: 'תצפית' },
  { value: 'Border',   label: 'מעבר גבול' },
]

export const CATEGORY_COLORS = {
  Trek:       'bg-green-100 text-green-800',
  Food:       'bg-orange-100 text-orange-800',
  Lodging:    'bg-sky-100 text-sky-800',
  Nightlife:  'bg-purple-100 text-purple-800',
  Culture:    'bg-blue-100 text-blue-800',
  Logistics:  'bg-gray-100 text-gray-700',
  'Must-See': 'bg-red-100 text-red-800',
  Transport:  'bg-yellow-100 text-yellow-800',
  Viewpoint:  'bg-teal-100 text-teal-800',
  Border:     'bg-pink-100 text-pink-800',
}

/** Hex colors used for Leaflet divIcon markers */
export const CATEGORY_MARKER_COLORS = {
  Trek:       '#16a34a',
  Food:       '#ea580c',
  Lodging:    '#0284c7',
  Nightlife:  '#9333ea',
  Culture:    '#2563eb',
  Logistics:  '#6b7280',
  'Must-See': '#dc2626',
  Transport:  '#ca8a04',
  Viewpoint:  '#0d9488',
  Border:     '#db2777',
}

export const CATEGORY_ICONS = {
  Trek:       '🥾',
  Food:       '🍽️',
  Lodging:    '🏨',
  Nightlife:  '🎶',
  Culture:    '🏛️',
  Logistics:  '🧳',
  'Must-See': '⭐',
  Transport:  '🚌',
  Viewpoint:  '🔭',
  Border:     '🛂',
}

/** South America bounding box center for default map view */
export const SA_MAP_CENTER = [-15, -60]
export const SA_MAP_ZOOM   = 4

export const CURRENCY_SYMBOLS = {
  USD: '$',
  ILS: '₪',
  ARS: '$',
  BRL: 'R$',
  CLP: '$',
  PEN: 'S/',
  BOB: 'Bs',
  COP: '$',
  EUR: '€',
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Lodging',
  'Activities',
  'Shopping',
  'Health',
  'Other',
]

export const EXPENSE_CATEGORY_LABELS_HE = {
  Food:       'אוכל',
  Transport:  'תחבורה',
  Lodging:    'לינה',
  Activities: 'פעילויות',
  Shopping:   'קניות',
  Health:     'בריאות',
  Other:      'אחר',
}

export const EXPENSE_CATEGORY_ICONS = {
  Food:       '🍽️',
  Transport:  '🚌',
  Lodging:    '🏨',
  Activities: '🎯',
  Shopping:   '🛍️',
  Health:     '💊',
  Other:      '📋',
}

/** Default ARS per USD fallback when no manual rate is set */
export const ARGENTINA_BLUE_DOLLAR_DEFAULT = 1000
