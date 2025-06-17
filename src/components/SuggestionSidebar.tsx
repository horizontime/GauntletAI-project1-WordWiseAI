import { useState } from 'react'
import { Editor } from '@tiptap/react'
import { CheckCircle2Icon, InfoIcon, SparklesIcon, SendIcon, MoreVertical } from 'lucide-react'

// Colors for each category
const categoryConfig = {
  Correctness: { color: 'text-red-500', bgColor: 'bg-red-500', border: 'border-red-500', icon: CheckCircle2Icon },
  Clarity: { color: 'text-blue-500', bgColor: 'bg-blue-500', border: 'border-blue-500', icon: InfoIcon },
  Engagement: { color: 'text-green-500', bgColor: 'bg-green-500', border: 'border-green-500', icon: SparklesIcon },
  Delivery: { color: 'text-purple-500', bgColor: 'bg-purple-500', border: 'border-purple-500', icon: SendIcon },
} as const

type Category = keyof typeof categoryConfig

export interface Suggestion {
  id: string
  category: Category
  title: string // short action phrase
  excerpt: string // HTML string with <del> and <strong> etc.
}

interface Props {
  editor?: Editor | null
  suggestions: Suggestion[]
  onUpdateSuggestions: (updated: Suggestion[]) => void
}

export function SuggestionSidebar({ editor, suggestions, onUpdateSuggestions }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('Correctness')

  const filtered = suggestions.filter((s) => s.category === activeCategory)
  const counter = suggestions.length

  const handleAccept = (id: string) => {
    // TODO: implement real replacement logic. For now just remove suggestion.
    const remaining = suggestions.filter((s) => s.id !== id)
    onUpdateSuggestions(remaining)
  }

  const handleDismiss = (id: string) => {
    const remaining = suggestions.filter((s) => s.id !== id)
    onUpdateSuggestions(remaining)
  }

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 border-b border-gray-300" style={{ height: '56px' }}>
        <h2 className="text-sm font-semibold text-gray-900">Review suggestions</h2>
        <span className="text-xs font-bold text-gray-800 bg-gray-100 rounded-full px-2 py-0.5">
          {counter}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(Object.keys(categoryConfig) as Category[]).map((key) => {
          const config = categoryConfig[key]
          const Icon = config.icon
          const isActive = key === activeCategory
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={
                `flex-1 flex flex-col items-center py-2 hover:bg-gray-50 ` +
                (isActive ? `border-b-2 ${config.border}` : 'border-b-2 border-transparent')
              }
            >
              <Icon className={`w-4 h-4 mb-1 ${config.color}`} />
              <span className={`text-[11px] font-medium uppercase ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                {key}
              </span>
            </button>
          )
        })}
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filtered.map((s) => {
          const config = categoryConfig[s.category]
          return (
            <div
              key={s.id}
              className="cursor-pointer p-4 rounded hover:bg-gray-50" // wrapper
            >
              {/* Indicator & title */}
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 w-3.5 h-3.5 rounded-full ${config.bgColor} flex-shrink-0`}></span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-gray-900 mb-1">
                    {s.category} – {s.title}
                  </div>
                  <div className="text-sm font-mono text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: s.excerpt }}></div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAccept(s.id)
                      }}
                      className="h-6 px-3 rounded-md text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss(s.id)
                      }}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto text-gray-500 hover:text-gray-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-gray-500 mt-8">No suggestions</div>
        )}
      </div>
    </aside>
  )
} 