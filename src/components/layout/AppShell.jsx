import React, { lazy, Suspense } from 'react'
import { useAppContext } from '../../context/AppContext'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const MapTab       = lazy(() => import('../map/MapTab'))
const ListTab      = lazy(() => import('../list/ListTab'))
const ExpensesTab  = lazy(() => import('../expenses/ExpensesTab'))
const DocumentsTab = lazy(() => import('../documents/DocumentsTab'))

import FAB from '../ui/FAB'
import AddAttractionModal from '../map/AddAttractionModal'
import { useAttractions } from '../../hooks/useAttractions'

export default function AppShell() {
  const { 
    user, 
    profile, 
    activeTab, 
    isAddModalOpen, 
    setIsAddModalOpen, 
    addModalData, 
    setAddModalData 
  } = useAppContext()

  const { createAttraction, isCreating } = useAttractions(profile?.trip_id)

  const handleFabClick = () => {
    setIsAddModalOpen(true)
    // Clear data if opening via FAB (unless already set by MapTab click)
    if (!addModalData) setAddModalData(null)
  }

  const handleSaveAttraction = (payload) => {
    setIsAddModalOpen(false)
    setAddModalData(null)
    createAttraction({ payload, userId: user.id })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      <OfflineBanner />

      {/* Tab content area */}
      <div className="flex-1 overflow-hidden pb-16">
        <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
          {activeTab === 'map'       && <MapTab />}
          {activeTab === 'list'      && <ListTab />}
          {activeTab === 'expenses'  && <ExpensesTab />}
          {activeTab === 'documents' && <DocumentsTab />}
        </Suspense>
      </div>

      <FAB onClick={handleFabClick} />

      <AddAttractionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveAttraction}
        isSaving={isCreating}
        initialData={addModalData}
      />

      <BottomNav />
    </div>
  )
}
