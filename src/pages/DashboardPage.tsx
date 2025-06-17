import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PlusIcon, FileTextIcon, TrashIcon, EditIcon } from 'lucide-react'
import { Sidebar } from '../components/Sidebar'
import toast from 'react-hot-toast'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    documents, 
    loading, 
    fetchDocuments, 
    createDocument, 
    deleteDocument,
    restoreDocument
  } = useDocumentStore()
  
  useEffect(() => {
    if (user) {
      fetchDocuments(user.id)
    }
  }, [user, fetchDocuments])

  const handleCreateDocument = async () => {
    if (!user) return
    
    const newDoc = await createDocument(user.id)
    if (newDoc) {
      navigate(`/editor/${newDoc.id}`)
    }
  }

  const handleDeleteDocument = async (docId: string, title: string) => {
    await deleteDocument(docId)
    toast(
      (t: any) => (
        <span className="flex items-center space-x-2">
          <span>Deleted "{title}"</span>
          <button
            onClick={() => {
              restoreDocument(docId)
              toast.dismiss(t.id)
            }}
            className="text-primary-600 underline hover:no-underline"
          >
            Undo
          </button>
        </span>
      ),
      {
        id: `delete-${docId}`,
        duration: 5000,
        position: 'bottom-right',
      }
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWordCount = (content: string) => {
    if (!content) return 0
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WordWise AI</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Your Documents</h2>
            <button
              onClick={handleCreateDocument}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Document
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first document.</p>
              <button
                onClick={handleCreateDocument}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                  onClick={() => navigate(`/editor/${doc.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {doc.title}
                    </h3>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/editor/${doc.id}`)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDocument(doc.id, doc.title)
                        }}
                        className="text-gray-400 hover:text-red-600"
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
                    <p>Words: {getWordCount(doc.content)}</p>
                    <p>Created: {formatDate(doc.created_at)}</p>
                    <p>Updated: {formatDate(doc.updated_at)}</p>
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