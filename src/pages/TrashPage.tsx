import { useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useDocumentStore } from '../stores/documentStore'
import { useAuthStore } from '../stores/authStore'
import { TrashIcon, ClockIcon, RotateCcwIcon } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function TrashPage() {
  const { user } = useAuthStore()
  const {
    trashedDocuments,
    loading,
    fetchTrashedDocuments,
    restoreDocument,
    permanentDeleteDocument,
  } = useDocumentStore()

  useEffect(() => {
    if (user) {
      fetchTrashedDocuments(user.id)
    }
  }, [user, fetchTrashedDocuments])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Returns a plain-text preview (first ~100 chars) from the document HTML content
  const getPreview = (content: string, maxLength: number = 100) => {
    if (!content) return ''
    // Strip HTML tags to get plain text
    const plainText = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}…` : plainText
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : trashedDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <TrashIcon className="w-16 h-16 text-gray-400" />
              <h2 className="text-2xl font-semibold text-gray-700">Trash is empty</h2>
              <p className="text-gray-600">Deleted documents can be found here for 30 days.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trashedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {doc.title}
                    </h3>
                    <div className="flex space-x-2 ml-4">
                      {/* Restore */}
                      <button
                        onClick={() => restoreDocument(doc.id)}
                        className="text-gray-400 hover:text-green-600"
                        title="Restore"
                      >
                        <RotateCcwIcon className="w-4 h-4" />
                      </button>
                      {/* Permanent delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Permanently delete "${doc.title}"? This cannot be undone.`)) {
                            permanentDeleteDocument(doc.id)
                          }
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete permanently"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content preview */}
                  {doc.content && (
                    <p className="text-sm text-gray-700 mb-4">
                      {getPreview(doc.content)}
                    </p>
                  )}

                  <div className="text-sm text-gray-600 space-y-1 mt-auto">
                    <p>
                      <ClockIcon className="inline w-3 h-3 mr-1" />
                      Deleted: {doc.deleted_at ? formatDateTime(doc.deleted_at) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 