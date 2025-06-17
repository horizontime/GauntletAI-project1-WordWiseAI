import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
} 