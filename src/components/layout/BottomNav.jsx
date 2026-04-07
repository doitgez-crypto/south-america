import React from 'react'
import { Map, List, Wallet, FileText } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'

const TABS = [
  { key: 'map',       label: 'מפה',    Icon: Map      },
  { key: 'list',      label: 'רשימה',  Icon: List     },
  { key: 'expenses',  label: 'הוצאות', Icon: Wallet   },
  { key: 'documents', label: 'מסמכים', Icon: FileText },
]

export default function BottomNav() {
  const { activeTab, setActiveTab } = useAppContext()

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-earth-200 flex items-center z-30 safe-area-bottom">
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
