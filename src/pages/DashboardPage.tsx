import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { 
  PlusIcon, 
  FileTextIcon, 
  TrashIcon, 
  EditIcon,
  Sparkles,
  Edit3Icon,
  CalendarIcon,
  ClockIcon,
  TrendingUpIcon,
  TargetIcon,
  ZapIcon,
  MoreHorizontalIcon
} from 'lucide-react'
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
  
  // Determine if the current session is a demo / guest session
  const isDemoUser = user && (!user.email || user.email === 'demo@wordwise.ai')

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
            className="text-blue-600 underline hover:no-underline"
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

  // Calculate total words written
  const totalWords = documents.reduce((acc, doc) => acc + getWordCount(doc.content), 0)
  
  // Format word count for display
  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  // Stats data
  const stats = [
    { label: 'Documents', value: documents.length.toString(), icon: FileTextIcon, color: 'text-blue-600' },
    { label: 'Words Written', value: formatWordCount(totalWords), icon: Edit3Icon, color: 'text-green-600' },
    { label: 'Suggestions Applied', value: '189', icon: TargetIcon, color: 'text-purple-600' },
    { label: 'Writing Score', value: '94%', icon: TrendingUpIcon, color: 'text-orange-600' },
  ]

  // Returns a plain-text preview (first ~100 chars) from the document HTML content
  const getPreview = (content: string, maxLength: number = 100) => {
    if (!content) return ''
    // Strip HTML tags to get plain text
    const plainText = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}…` : plainText
  }

  // Get status badge for document (mock data for now)
  const getDocumentStatus = (doc: any) => {
    const wordCount = getWordCount(doc.content)
    if (wordCount === 0) return { status: 'Draft', className: 'bg-gray-100 text-gray-700' }
    if (wordCount < 500) return { status: 'In Progress', className: 'bg-blue-100 text-blue-700' }
    return { status: 'Complete', className: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex">
      <Sidebar />

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/20 backdrop-blur-sm bg-white/80 sticky top-0 z-40">
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {isDemoUser ? 'Guest' : user?.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreateDocument}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Document
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-8 flex-1">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-lg"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${
                        stat.color === 'text-blue-600'
                          ? 'from-blue-100 to-blue-200'
                          : stat.color === 'text-green-600'
                            ? 'from-green-100 to-green-200'
                            : stat.color === 'text-purple-600'
                              ? 'from-purple-100 to-purple-200'
                              : 'from-orange-100 to-orange-200'
                      }`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Documents Section */}
          <div className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
              </div>
            </div>
            <div className="p-6 pt-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-500 mb-6">Create your first document to get started with WordWise AI</p>
                  <button
                    onClick={handleCreateDocument}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Document
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => {
                    const { status, className } = getDocumentStatus(doc)
                    const wordCount = getWordCount(doc.content)
                    
                    return (
                      <div
                        key={doc.id}
                        className="border border-gray-100 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => navigate(`/editor/${doc.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {doc.title}
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                                {status}
                              </span>
                              {wordCount > 0 && Math.random() > 0.5 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  <ZapIcon className="w-3 h-3 mr-1" />
                                  {Math.floor(Math.random() * 10) + 1} suggestions
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Edit3Icon className="w-4 h-4" />
                                {wordCount} words
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                Created {formatDate(doc.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                Updated {formatDate(doc.updated_at)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDocument(doc.id, doc.title)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-md"
                          >
                            <MoreHorizontalIcon className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 