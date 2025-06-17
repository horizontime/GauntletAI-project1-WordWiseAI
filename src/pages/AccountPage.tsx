import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Modal } from '../components/Modal'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { toast } from 'react-hot-toast'

export function AccountPage() {
  const { user, updateEmail, updatePassword, deleteAccount } = useAuthStore()

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // Email modal state
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  // Password modal state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const handleEmailUpdate = async () => {
    if (!currentPasswordForEmail || !newEmail) {
      toast.error('Please provide all fields')
      return
    }
    setEmailSubmitting(true)
    const { error, success } = await updateEmail(currentPasswordForEmail, newEmail)
    setEmailSubmitting(false)

    if (error) toast.error(error)
    if (success) toast.success(success)
    if (!error) {
      setEmailModalOpen(false)
      setCurrentPasswordForEmail('')
      setNewEmail('')
    }
  }

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please provide all fields')
      return
    }
    setPasswordSubmitting(true)
    const { error, success } = await updatePassword(currentPassword, newPassword)
    setPasswordSubmitting(false)

    if (error) toast.error(error)
    if (success) toast.success(success)
    if (!error) {
      setPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
    }
  }

  const handleDeleteAccount = async () => {
    // Simple confirm prompt
    const confirm = window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (!confirm) return
    await deleteAccount()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-10 flex items-center">Profile</h1>

        <div className="space-y-8">

          {/* Email row */}
          <div className="flex items-center gap-4">
            <span className="w-32 text-gray-600">Email</span>
            <span className="flex-1 truncate text-gray-900">{user?.email}</span>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="text-sm text-primary-600 hover:underline"
            >
              Update
            </button>
          </div>

          {/* Password row */}
          <div className="flex items-center gap-4">
            <span className="w-32 text-gray-600">Password</span>
            <span className="flex-1 text-gray-900">••••••••</span>
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="text-sm text-primary-600 hover:underline"
            >
              Update
            </button>
          </div>

          {/* Delete account row */}
          <div className="flex items-start gap-4 pt-6 border-t">
            <button
              onClick={handleDeleteAccount}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Delete Account
            </button>
            <p className="text-sm text-gray-500 max-w-sm">
              This account will no longer be available, and all your saved data will be permanently deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Update Email Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Update Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEmailModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={emailSubmitting}
              onClick={handleEmailUpdate}
              className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {emailSubmitting ? <LoadingSpinner size="sm" /> : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Update Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={passwordSubmitting}
              onClick={handlePasswordUpdate}
              className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {passwordSubmitting ? <LoadingSpinner size="sm" /> : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 