import React, { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { useAuthStore } from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { useVersionStore } from '../stores/versionStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ChevronRightIcon, ChevronDownIcon, Download } from 'lucide-react'

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

  // Returns a plain-text preview (first ~80 chars by default) from the document HTML content
  const getPreview = (content: string, maxLength: number = 80) => {
    if (!content) return ''
    // Strip HTML tags to get plain text
    const plainText = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}…` : plainText
  }

  // Helper to download a specific version as a plain-text file
  const downloadVersion = (
    version: { title: string; content: string; created_at?: string }
  ) => {
    const timestampSource = version.created_at || new Date().toISOString()
    const dateObj = new Date(timestampSource)
    // Format as YYYY-MM-DD_Time_H_MMPM (e.g., 2025-06-17_Time_7_53PM)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    let hours = dateObj.getHours()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    if (hours === 0) hours = 12 // convert 0 to 12 for 12AM/12PM
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const safeTimestamp = `${year}-${month}-${day}_Time_${hours}_${minutes}${ampm}`
    const filename = `${version.title || 'document'}_${safeTimestamp}.txt`

    // Convert HTML content to plain text before downloading
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = version.content || ''
    const plainTextContent = tempDiv.innerText || tempDiv.textContent || ''

    const blob = new Blob([plainTextContent], {
      type: 'text/plain;charset=utf-8',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-xs">
                    Text preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Download
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
                      <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
                        {getPreview(doc.content)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700" />
                    </tr>

                    {expanded.has(doc.id) && (
                      <>
                        {versionsLoading && !versionsByDocument[doc.id] ? (
                          <tr key={`${doc.id}-loading`} className="bg-gray-50">
                            <td colSpan={5} className="px-4 py-3 text-center">
                              <LoadingSpinner />
                            </td>
                          </tr>
                        ) : (
                          <>
                            {(versionsByDocument[doc.id] || []).map((v) => (
                              <tr key={v.id} className="hover:bg-gray-100">
                                {/* Empty cell to align with the expand/collapse column */}
                                <td className="px-2 py-2" />
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                  {formatDate(v.created_at)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                  {v.title}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
                                  {getPreview(v.content)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                  <button
                                    onClick={() => downloadVersion(v)}
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {versionsByDocument[doc.id] && versionsByDocument[doc.id].length === 0 && (
                              <tr key={`${doc.id}-no-versions`} className="bg-gray-50">
                                <td colSpan={5} className="px-4 py-3 text-sm text-gray-500 text-center">
                                  No versions yet
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </>
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