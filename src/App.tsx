import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditorPage } from './pages/EditorPage'
import { LoadingSpinner } from './components/LoadingSpinner'
import { VersionHistoryPage } from './pages/VersionHistoryPage'
import { TrashPage } from './pages/TrashPage'
import { AccountPage } from './pages/AccountPage'

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <DashboardPage /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/version-history" 
          element={user ? <VersionHistoryPage /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/trash" 
          element={user ? <TrashPage /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/account" 
          element={user ? <AccountPage /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/editor/:documentId?" 
          element={user ? <EditorPage /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} 
        />
      </Routes>
    </div>
  )
}

export default App 