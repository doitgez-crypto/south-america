import React, { useRef } from 'react'
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Download, 
  Loader2, 
  Camera, 
  Eye,
  FileBadge
} from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useDocuments } from '../../hooks/useDocuments'
import { useUploadQueue } from '../../hooks/useUploadQueue'

export default function DocumentsTab() {
  const { profile, user } = useAppContext()
  const tripId = profile?.trip_id
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const { 
    documents, 
    isLoading,
    isError,
    error,
    refetch,
    uploadDocument, 
    isUploading, 
    deleteDocument 
  } = useDocuments(tripId)

  const { pendingCount, isSyncing } = useUploadQueue()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Auto-prompt for a name or use filename
    const name = prompt('שם המסמך?', file.name.split('.')[0])
    if (name === null) return // user cancelled

    uploadDocument({ file, name, userId: user?.id })
    e.target.value = '' // clear
  }

  const getDocIcon = (type) => {
    if (type === 'pdf') return <FileBadge size={24} className="text-red-500" />
    return <Camera size={24} className="text-blue-500" />
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-red-50">
          <Globe className="text-red-500 w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">שגיאת התחברות</h3>
        <p className="text-gray-500 mb-6 max-w-sm">
          {error?.message === 'Connection Timed Out. Please check your internet.' 
            ? 'זמן הבקשה עבר. נראה שיש בעיה בחיבור לאינטרנט או שהשרת עמוס מעט.' 
            : 'לא הצלחנו לטעון את המסמכים בשלב זה.'}
        </p>
        <button 
          onClick={() => refetch()}
          className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 active:scale-95 transition-all"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">מסמכים</h2>
          <p className="text-sm text-gray-400 mt-1">נהלו את כל מסמכי הנסיעה במקום אחד</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => cameraInputRef.current?.click()}
             disabled={isUploading}
             className="p-3 bg-primary-100 text-primary-600 rounded-2xl hover:bg-primary-200 transition-all active:scale-95"
           >
             <Camera size={20} />
           </button>
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
             className="p-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-95 flex items-center gap-2"
           >
             {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
             <span className="font-bold text-sm">הוסף</span>
           </button>
        </div>
      </div>

      {/* Hidden inputs */}
      <input 
        ref={fileInputRef} 
        type="file" 
        className="hidden" 
        onChange={handleFileChange} 
        accept="application/pdf,image/*" 
      />
      <input 
        ref={cameraInputRef} 
        type="file" 
        className="hidden" 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
      />

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(pendingCount > 0 || isSyncing) && (
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                 {isSyncing ? <Loader2 size={16} className="text-amber-600 animate-spin" /> : <Upload size={16} className="text-amber-600" />}
               </div>
               <div>
                  <p className="text-xs font-bold text-amber-800">
                    {isSyncing ? 'מסנכרן קבצים...' : 'ממתין לחיבור (אופליין)'}
                  </p>
                  <p className="text-[10px] text-amber-600">
                    {pendingCount} קבצים ממתינים למשלוח
                  </p>
               </div>
             </div>
          </div>
        )}

        {documents.length === 0 && pendingCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText size={48} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">אין עדיין מסמכים.</p>
            <p className="text-sm">העלה כרטיסי טיסה, ביטוחים או צילומי דרכון.</p>
          </div>
        ) : (
          documents.map(doc => {
            const isPending = doc.status === 'uploading' || doc.status === 'offline'
            
            return (
              <div 
                key={doc.id}
                className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group transition-opacity ${isPending ? 'opacity-60' : ''}`}
              >
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 relative">
                  {getDocIcon(doc.file_type)}
                  {isPending && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      {doc.status === 'uploading' ? (
                        <Loader2 size={12} className="text-primary-500 animate-spin" />
                      ) : (
                        <Upload size={12} className="text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{doc.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase">
                    {doc.status === 'offline' ? 'ממתין לחיבור' : doc.status === 'uploading' ? 'מעלה...' : new Date(doc.created_at).toLocaleDateString('he-IL')}
                  </p>
                </div>

                {!isPending && (
                  <div className="flex gap-1">
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Eye size={18} />
                    </a>
                    <button 
                      onClick={() => { if(confirm('למחוק מסמך זה?')) deleteDocument(doc.id) }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {isUploading && (
        <div className="fixed bottom-24 left-6 right-6 bg-primary-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="font-bold">מעלה מסמך חדש...</p>
        </div>
      )}
    </div>
  )
}
