"use client"

import { useState } from "react"
import type { Editor } from "@tiptap/react"
import {
  CheckCircle2Icon,
  InfoIcon,
  SparklesIcon,
  SendIcon,
  MoreVertical,
  ChevronsRight,
} from "lucide-react"
import { LoadingSpinner } from "./LoadingSpinner"

// Colors for each category
const categoryConfig = {
  Correctness: { color: "text-red-500", bgColor: "bg-red-500", border: "border-red-500", icon: CheckCircle2Icon },
  Clarity: { color: "text-blue-500", bgColor: "bg-blue-500", border: "border-blue-500", icon: InfoIcon },
  Engagement: { color: "text-green-500", bgColor: "bg-green-500", border: "border-green-500", icon: SparklesIcon },
  Delivery: { color: "text-purple-500", bgColor: "bg-purple-500", border: "border-purple-500", icon: SendIcon },
} as const

type Category = keyof typeof categoryConfig

export interface Suggestion {
  id: string
  category: Category
  title: string // short action phrase
  excerpt: string // HTML string with <del> and <strong> etc.
  candidates?: string[]
  /** Optional 0-based character index for underline mapping */
  index?: number
  /** Optional length of the segment to underline */
  length?: number
}

// Helper to produce a stable key for tracking highlights
const getHighlightKey = (s: Suggestion) => {
  // For spell check suggestions, use index and title as a stable identifier
  if (s.category === "Correctness" && s.index !== undefined) {
    return `${s.category}-${s.index}-${s.title}`
  }
  // For AI suggestions, use the excerpt as it's unique
  return `${s.category}-${s.excerpt}`
}

// Tooltip texts for each category
const tooltipText: Record<Category, string> = {
  Correctness: "Checking for basic spelling.",
  Clarity: "Writing for Conciseness and Clarity.",
  Engagement: "Vivid Rewriting that Paints a Stronger Mental Image.",
  Delivery: "Writing to improve tone, flow, and readability so ideas land effectively.",
}

interface Props {
  editor?: Editor | null
  suggestions: Suggestion[]
  /** Set of suggestion keys that are currently highlighted in the editor */
  highlightedSuggestionIds?: Set<string>
  /** Triggered when the user simply clicks on a card (outside action buttons). */
  onSelect?: (suggestion: Suggestion) => void
  /** Triggered when the user accepts a suggestion. Optionally with chosen replacement word. */
  onAccept?: (suggestion: Suggestion, replacement?: string) => void
  /** Triggered when the user dismisses a suggestion. */
  onDismiss?: (suggestion: Suggestion) => void
  /** Collapse request from inside the sidebar */
  onCollapse?: () => void
  /** Notify parent when user switches between category tabs */
  onCategoryChange?: (category: Category) => void
  /** Whether suggestions for the active category are currently loading */
  loading?: boolean
}

export function SuggestionSidebar({
  editor: _editor,
  suggestions,
  highlightedSuggestionIds = new Set(),
  onSelect,
  onAccept,
  onDismiss,
  onCollapse,
  onCategoryChange,
  loading = false,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("Correctness")

  const filtered = suggestions.filter((s) => s.category === activeCategory)
  const counter = suggestions.length

  // Delegate operations to parent callbacks.
  const handleAccept = (s: Suggestion, replacement?: string) => {
    onAccept?.(s, replacement)
  }

  const handleDismiss = (s: Suggestion) => {
    onDismiss?.(s)
  }

  // Bulk actions – only used for the Spellcheck (Correctness) tab
  const handleAcceptAll = () => {
    // Apply only to the currently filtered (Correctness) suggestions
    filtered.forEach((s) => {
      const replacement = s.candidates && s.candidates.length > 0 ? s.candidates[0] : undefined
      handleAccept(s, replacement)
    })
  }

  const handleDismissAll = () => {
    filtered.forEach((s) => handleDismiss(s))
  }

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl flex flex-col z-50">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-4 py-4 border-gray-200 bg-white">
        <button
          onClick={onCollapse}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
          aria-label="Collapse suggestion panel"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
        <h2 className="flex-1 text-base font-semibold text-gray-900 text-center">Review suggestions</h2>
        <span className="text-sm font-bold text-gray-700 bg-gray-200 rounded-full px-3 py-1">{counter}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {(Object.keys(categoryConfig) as Category[]).map((key) => {
          const config = categoryConfig[key]
          const Icon = config.icon
          const isActive = key === activeCategory
          return (
            <div key={key} className="relative flex-1 group">
              <button
                onClick={() => {
                  setActiveCategory(key)
                  onCategoryChange?.(key)
                }}
                className={`w-full flex flex-col items-center py-3 px-2 hover:bg-gray-50 transition-colors duration-150 ${
                  isActive ? `border-b-2 ${config.border} bg-gray-50` : "border-b-2 border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${config.color}`} />
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    isActive ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {key === "Correctness" ? "SPELLCHECK" : key}
                </span>
              </button>
              {/* Tooltip */}
              <span className={`${key === 'Delivery' ? 'ml-[-60px]' : ''} absolute left-1/2 -translate-x-1/2 -top-12 bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-[1000ms] w-48 text-center whitespace-normal break-words pointer-events-none z-[60]`}>
                {tooltipText[key]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Bulk action buttons for Spellcheck suggestions */}
          {activeCategory === "Correctness" && filtered.length > 0 && (
            <div className="flex justify-between gap-2 mb-2 mr-8 ml-8">
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
              >
                Accept All
              </button>
              <button
                onClick={handleDismissAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 transition-colors duration-150 bg-gray-100"
              >
                Dismiss All
              </button>
            </div>
          )}
          {filtered.map((s) => {
            const config = categoryConfig[s.category]
            const isHighlighted = highlightedSuggestionIds.has(getHighlightKey(s))
            return (
              <div
                key={s.id}
                className={`cursor-pointer p-4 rounded-lg border transition-all duration-150 ${
                  isHighlighted 
                    ? 'border-blue-400 bg-blue-50 shadow-md' 
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
                }`}
                onClick={() => onSelect?.(s)}
              >
                {/* Indicator & title */}
                <div className="flex items-start gap-3">
                  <span className={`mt-1 w-3 h-3 rounded-full ${config.bgColor} flex-shrink-0`}></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-2 leading-tight">
                      {s.title}
                    </div>
                    <div
                      className="text-sm text-gray-700 mb-3 leading-relaxed font-mono bg-gray-50 p-3 rounded border"
                      dangerouslySetInnerHTML={{ __html: s.excerpt }}
                    />
                    {/* Candidate replacements for spelling errors */}
                    {s.candidates && s.candidates.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {s.candidates.map((cand) => (
                          <button
                            key={cand}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAccept(s, cand)
                            }}
                            className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700"
                          >
                            {cand}
                          </button>
                        ))}
                      </div>
                    )}

                    {(() => {
                      // Hide the "Accept" button (and the extra options) for spelling suggestions of the form
                      // "<word> is not in a word. Did you mean: <alt>?".  Only keep the Dismiss button, centred.
                      const hideAccept =
                        s.title === "Spelling" && /is not in a word/i.test(s.excerpt)

                      return (
                        <div
                          className={`flex items-center gap-3 ${hideAccept ? "justify-center" : ""}`}
                        >
                          {!hideAccept && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const replacement =
                                  s.candidates && s.candidates.length > 0 ? s.candidates[0] : undefined
                                handleAccept(s, replacement)
                              }}
                              className="px-4 py-2 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
                            >
                              Accept
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDismiss(s)
                            }}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors duration-150 bg-gray-100"
                          >
                            Dismiss
                          </button>

                          {!hideAccept && (
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-150"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <CheckCircle2Icon className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No suggestions</p>
                <p className="text-xs text-gray-400 mt-1">Your writing looks great!</p>
              </div>
            )
          )}
        </div>
      </div>
    </aside>
  )
}
