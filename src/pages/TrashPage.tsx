import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { useDocumentStore } from '../stores/documentStore'
import { useAuthStore } from '../stores/authStore'
import { TrashIcon, ClockIcon, RotateCcwIcon } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export function TrashPage() {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50/40 flex">
      <Sidebar />

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200/50 backdrop-blur-sm bg-white/70 sticky top-0 z-40 shadow-sm">
          <div className="flex h-[73px] items-center gap-4 px-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : trashedDocuments.length === 0 ? (
            <div className="border border-gray-200/50 shadow-xl bg-white backdrop-blur-sm rounded-lg p-12">
              <div className="text-center">
                <TrashIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is empty</h3>
                <p className="text-gray-500">Deleted documents can be found here for 30 days.</p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200/50 shadow-xl bg-white backdrop-blur-sm rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trashedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 bg-gray-50/50 rounded-lg p-6 hover:shadow-lg hover:bg-white hover:border-gray-300 transition-all duration-200 flex flex-col min-h-[200px]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {doc.title}
                    </h3>
                    <div className="flex space-x-2 ml-4">
                      {/* Restore */}
                      <button
                        onClick={() => {
                          restoreDocument(doc.id)
                          toast(
                            (t: any) => (
                              <span className="flex items-center space-x-2">
                                <span>This document has been restored.</span>
                                <button
                                  onClick={() => {
                                    navigate(`/editor/${doc.id}`)
                                    toast.dismiss(t.id)
                                  }}
                                  className="text-primary-600 underline hover:no-underline"
                                >
                                  Open
                                </button>
                              </span>
                            ),
                            {
                              id: `restore-${doc.id}`,
                              duration: 5000,
                              position: 'bottom-right',
                            }
                          )
                        }}
                        className="text-gray-400 hover:text-green-600"
                        title="Restore"
                      >
                        <RotateCcwIcon className="w-4 h-4" />
                      </button>
                      {/* Permanent delete */}
                      <button
                        onClick={() => {
                          toast(
                            (t: any) => (
                              <span className="flex items-center space-x-2">
                                <span>This document can't be restored later.</span>
                                <button
                                  onClick={() => toast.dismiss(t.id)}
                                  className="text-gray-500 hover:text-gray-700 px-2 py-1 text-sm font-medium border border-gray-300 rounded-md"
                                >
                                  ✕
                                </button>
                                <button
                                  onClick={() => {
                                    permanentDeleteDocument(doc.id)
                                    toast.dismiss(t.id)
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm font-medium rounded-md"
                                >
                                  Delete
                                </button>
                              </span>
                            ),
                            {
                              id: `permanent-delete-${doc.id}`,
                              duration: Infinity,
                              position: 'bottom-right',
                            }
                          )
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
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 