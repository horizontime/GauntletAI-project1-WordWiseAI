import React, { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useAuthStore } from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { useVersionStore } from '../stores/versionStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ChevronRightIcon, ChevronDownIcon } from 'lucide-react'

export function VersionHistoryPage() {
  const { user } = useAuthStore()
  const {
    documents,
    loading: docsLoading,
    fetchDocuments,
  } = useDocumentStore()

  const {
    versionsByDocument,
    loading: versionsLoading,
    fetchVersions,
  } = useVersionStore()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchDocuments(user.id)
    }
  }, [user, fetchDocuments])

  const toggleExpand = async (docId: string) => {
    const newSet = new Set(expanded)
    if (newSet.has(docId)) {
      newSet.delete(docId)
    } else {
      newSet.add(docId)
      // Lazy load versions if not already present
      if (!versionsByDocument[docId]) {
        await fetchVersions(docId)
      }
    }
    setExpanded(newSet)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getWordCount = (content: string) => {
    if (!content) return 0
    return content.trim().split(/\s+/).filter((w) => w.length > 0).length
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col p-8 overflow-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Version History</h1>

        {docsLoading ? (
          <div className="flex justify-center pt-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Words
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <React.Fragment key={doc.id}>
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-2 py-2" onClick={() => toggleExpand(doc.id)}>
                        {expanded.has(doc.id) ? (
                          <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doc.title}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {getWordCount(doc.content)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(doc.updated_at)}
                      </td>
                    </tr>

                    {expanded.has(doc.id) && (
                      <tr key={`${doc.id}-versions`}>
                        <td colSpan={5} className="bg-gray-50">
                          {versionsLoading && !versionsByDocument[doc.id] ? (
                            <div className="flex justify-center py-4">
                              <LoadingSpinner />
                            </div>
                          ) : (
                            <table className="min-w-full divide-y divide-gray-200 ml-6 my-2">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Saved At
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Words
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(versionsByDocument[doc.id] || []).map((v) => (
                                  <tr key={v.id} className="hover:bg-gray-100">
                                    <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                      {formatDate(v.created_at)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                      {v.title}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                      {getWordCount(v.content)}
                                    </td>
                                  </tr>
                                ))}
                                {versionsByDocument[doc.id] && versionsByDocument[doc.id].length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">
                                      No versions yet
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 