import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ScoreBadge } from '../components/ScoreBadge'
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
  ZapIcon
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
    restoreDocument,
    calculateDocumentScore
  } = useDocumentStore()
  const [calculatingScores, setCalculatingScores] = useState(false)
  
  // Determine if the current session is a demo / guest session
  const isDemoUser = user && (!user.email || user.email === 'demo@wordwise.ai')

  useEffect(() => {
    if (user) {
      fetchDocuments(user.id)
    }
  }, [user, fetchDocuments])

  // Automatically calculate scores for documents without scores
  useEffect(() => {
    const calculateMissingScores = async () => {
      const documentsWithoutScores = documents.filter(doc => !doc.writingScore && doc.content)
      if (documentsWithoutScores.length === 0) return

      setCalculatingScores(true)
      
      try {
        for (const doc of documentsWithoutScores) {
          // Extract plain text from HTML content
          const plainText = doc.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
          if (plainText.length >= 50) {
            await calculateDocumentScore(doc.id, plainText)
          }
        }
      } catch (error) {
        console.error('Error calculating scores:', error)
      } finally {
        setCalculatingScores(false)
      }
    }

    // Only run if we have documents and aren't already calculating
    if (documents.length > 0 && !calculatingScores) {
      calculateMissingScores()
    }
  }, [documents, calculatingScores, calculateDocumentScore])

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
  
  // Calculate total suggestions applied
  const totalSuggestionsApplied = documents.reduce((acc, doc) => {
    const count = doc.suggestions_applied || 0
    return acc + count
  }, 0)
  
  // Calculate average writing score (only from documents with scores)
  const documentsWithScores = documents.filter(doc => doc.writingScore?.overall !== undefined)
  const averageScore = documentsWithScores.length > 0 
    ? Math.round(
        documentsWithScores.reduce((acc, doc) => acc + (doc.writingScore!.overall), 0) / documentsWithScores.length
      )
    : 0
  
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
    { label: 'Suggestions Applied', value: totalSuggestionsApplied.toString(), icon: TargetIcon, color: 'text-purple-600' },
    { 
      label: 'Writing Score', 
      value: documentsWithScores.length > 0 ? `${averageScore}%` : '-', 
      icon: TrendingUpIcon, 
      color: 'text-orange-600',
      subtitle: calculatingScores
        ? 'Calculating scores...'
        : documentsWithScores.length === 0 && documents.length > 0 
          ? 'Calculating...' 
          : documentsWithScores.length < documents.length 
            ? `${documentsWithScores.length}/${documents.length} scored`
            : undefined
    },
  ]

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
                className="border border-gray-200/50 shadow-xl bg-white backdrop-blur-sm hover:shadow-2xl hover:border-gray-300/50 transition-all duration-300 rounded-lg"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.label === 'Writing Score' && calculatingScores ? (
                          <span className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span className="text-lg">Calculating...</span>
                          </span>
                        ) : (
                          stat.value
                        )}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                      )}
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
          <div className="border border-gray-200/50 shadow-xl bg-white backdrop-blur-sm rounded-lg">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => {
                    const wordCount = getWordCount(doc.content)
                    
                    return (
                      <div
                        key={doc.id}
                        className="border border-gray-200 bg-gray-50/50 rounded-lg p-6 hover:shadow-lg hover:bg-white hover:border-gray-300 transition-all duration-200 cursor-pointer group min-h-[200px] flex flex-col"
                        onClick={() => navigate(`/editor/${doc.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {doc.title}
                              </h3>
                              {doc.writingScore && (
                                <ScoreBadge 
                                  score={doc.writingScore.overall} 
                                  writingScore={doc.writingScore}
                                  size="sm"
                                  showLabel={true}
                                />
                              )}
                              {wordCount > 0 && doc.suggestions_applied > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0">
                                  <ZapIcon className="w-3 h-3 mr-1" />
                                  {doc.suggestions_applied} Suggestions Applied
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/editor/${doc.id}`)
                              }}
                              className="p-2 hover:bg-blue-100 rounded-md flex-shrink-0 transition-colors"
                              title="Edit document"
                            >
                              <EditIcon className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDocument(doc.id, doc.title)
                              }}
                              className="p-2 hover:bg-red-100 rounded-md flex-shrink-0 transition-colors"
                              title="Delete document"
                            >
                              <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-600 transition-colors" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 mb-4">
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {getPreview(doc.content, 150) || 'No content yet...'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                          <span className="flex items-center gap-1">
                            <Edit3Icon className="w-3 h-3" />
                            {wordCount} words
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            Updated {formatDate(doc.updated_at)}
                          </span>
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