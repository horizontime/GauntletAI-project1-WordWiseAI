"use client"

import { useEffect, useState, useCallback, useRef, ReactNode } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { CorrectnessUnderline, correctnessUnderlineKey } from "../extensions/CorrectnessUnderline"
import { ClarityUnderline, clarityUnderlineKey } from "../extensions/ClarityUnderline"
import { EngagementUnderline, engagementUnderlineKey } from "../extensions/EngagementUnderline"
import { DeliveryUnderline, deliveryUnderlineKey } from "../extensions/DeliveryUnderline"
import { useAuthStore } from "../stores/authStore"
import { useDocumentStore } from "../stores/documentStore"
import { useVersionStore } from "../stores/versionStore"
import { LoadingSpinner } from "../components/LoadingSpinner"
import { ScoreBadge } from "../components/ScoreBadge"
import {
  BoldIcon,
  ItalicIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  SaveIcon,
  ArrowLeftIcon,
  FileTextIcon,
  ChevronsLeft,
  SparklesIcon,
  CheckCircleIcon,
} from "lucide-react"
import { SuggestionSidebar, type Suggestion } from "../components/SuggestionSidebar"
import { checkText } from "../lib/textChecker"
import { GenerateTextModal } from "../components/GenerateTextModal"
import { WritingScoreModal } from "../components/WritingScoreModal"

// Utility to split text into sentences (rough approximation)
const RE_SENTENCE = /[^.!?]+[.!?]*/g

/**
 * Find the start character index of a substring within text, accounting for
 * repeated substrings by providing an offset to start searching from.
 */
function findSubTextIndex(text: string, sub: string, fromIdx = 0): number {
  const idx = text.indexOf(sub, fromIdx)
  return idx
}

/** Compute a simple Jaccard similarity between two sentences */
function sentenceSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/[^a-zA-Z']+/).filter(Boolean))
  const setB = new Set(b.toLowerCase().split(/[^a-zA-Z']+/).filter(Boolean))
  if (!setA.size || !setB.size) return 0
  let intersect = 0
  setA.forEach((w) => {
    if (setB.has(w)) intersect += 1
  })
  return intersect / Math.max(setA.size, setB.size)
}

// ------------------------------------------------------------
// TooltipButton – reusable button with hover tooltip
// ------------------------------------------------------------

interface TooltipButtonProps {
  onClick: () => void
  active?: boolean
  tooltip: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

const TooltipButton = ({ onClick, active = false, tooltip, children, disabled, className = "" }: TooltipButtonProps) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2.5 rounded-lg transition-colors duration-150 ${
          active ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        {children}
      </button>
      {/* Tooltip */}
      <span
        className="absolute left-1/2 -translate-x-1/2 -top-9 bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-[1000ms] whitespace-nowrap pointer-events-none z-10"
      >
        {tooltip}
      </span>
    </div>
  )
}

export function EditorPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    currentDocument, 
    loading, 
    saving, 
    loadDocument, 
    saveDocument, 
    createDocument, 
    updateCurrentDocumentContent,
    incrementSuggestionsApplied,
    calculateDocumentScore
  } = useDocumentStore()

  const { createVersion } = useVersionStore()

  const [title, setTitle] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [scoreLoading, setScoreLoading] = useState(false)

  // ------------------------------------------------------------
  // Suggestion management
  // ------------------------------------------------------------
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  
  // Track which suggestions are currently highlighted using stable keys
  const [highlightedSuggestionKeys, setHighlightedSuggestionKeys] = useState<Set<string>>(new Set())

  // Loading state for AI suggestions
  const [clarityLoading, setClarityLoading] = useState(false)
  const [engagementLoading, setEngagementLoading] = useState(false)
  const [deliveryLoading, setDeliveryLoading] = useState(false)

  // Track active sidebar category
  const [activeSidebarCategory, setActiveSidebarCategory] = useState<"Correctness" | "Clarity" | "Engagement" | "Delivery">("Correctness")

  // Keep raw groups separate so we can refresh/merge efficiently.
  const grammarSuggestionsRef = useRef<Suggestion[]>([])
  const aiSuggestionsRef = useRef<Suggestion[]>([])

  // Helper to produce a stable key for hashing suggestions.
  const getSuggestionKey = (s: Suggestion) => `${s.title}-${s.excerpt}`
  
  // Helper to produce a stable key for tracking highlights
  const getHighlightKey = (s: Suggestion) => {
    // For spell check suggestions, use index and title as a stable identifier
    if (s.category === "Correctness" && s.index !== undefined) {
      return `${s.category}-${s.index}-${s.title}`
    }
    // For AI suggestions, use the excerpt as it's unique
    return `${s.category}-${s.excerpt}`
  }

  // Track suggestions dismissed by the user during the current session so we
  // can filter them out of subsequent AI/grammar runs.
  const [, setDismissedSuggestionKeys] = useState<Set<string>>(new Set())
  const dismissedSuggestionKeysRef = useRef<Set<string>>(new Set())

  /** Merge grammar + AI suggestions and apply dismissal filter */
  const refreshSuggestions = useCallback(() => {
    const merged = [...grammarSuggestionsRef.current, ...aiSuggestionsRef.current]
      .filter((sg) => !dismissedSuggestionKeysRef.current.has(getSuggestionKey(sg)))
      .map(sg => ({
        ...sg,
        highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
      }))
    setSuggestions(merged)
  }, [highlightedSuggestionKeys])

  /* ------------------------------------------------------------
   *  Grammar check + underline refresh helpers
   * -----------------------------------------------------------*/

  // Stores the debounce timer handle between keystrokes.
  const checkTimerRef = useRef<number | null>(null)

  /**
   * Perform grammar/spelling analysis and refresh the red underlines.
   *
   * Pass the current plain-text content and the editor instance that should
   * receive the underline decorations.  The check is debounced when invoked
   * continuously while typing, but will run instantly when called after a
   * suggestion is accepted or dismissed (set `immediate` to true).
   */
  const runSuggestionCheck = useCallback((
    plain: string,
    ed: Editor | null,
    immediate = false,
  ) => {
    const perform = () => {
      const detected = checkText(plain)
      const filtered = detected.filter(
        (sg) => !dismissedSuggestionKeysRef.current.has(getSuggestionKey(sg)),
      )

      // Preserve highlight state from previous suggestions
      const highlightedKeys = highlightedSuggestionKeys
      const suggestionsWithHighlight = filtered.map(sg => ({
        ...sg,
        highlighted: highlightedKeys.has(getHighlightKey(sg))
      }))

      grammarSuggestionsRef.current = suggestionsWithHighlight
      setSuggestions([...suggestionsWithHighlight, ...aiSuggestionsRef.current])

      if (ed && ed.view) {
        const tr = ed.view.state.tr.setMeta(correctnessUnderlineKey as any, {
          suggestions: suggestionsWithHighlight,
        })
        ed.view.dispatch(tr)
      }
    }

    if (immediate) {
      perform()
      return
    }

    // Debounce when called rapidly (typing) --------------------------------
    if (checkTimerRef.current) {
      window.clearTimeout(checkTimerRef.current)
    }
    checkTimerRef.current = window.setTimeout(perform, 600)
  }, [highlightedSuggestionKeys, aiSuggestionsRef, refreshSuggestions])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The typography plugin will handle styling
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
      Placeholder.configure({
        placeholder: "Start writing your thoughts here...",
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      CorrectnessUnderline,
      ClarityUnderline,
      EngagementUnderline,
      DeliveryUnderline,
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class: "editor-content prose prose-lg max-w-none focus:outline-none px-6 pt-4 pb-2 bg-white rounded-lg",
        spellcheck: "true",
        style: "white-space: pre-wrap; min-height: 500px;",
        "data-gramm": "false",
      },
    },
    parseOptions: {
      preserveWhitespace: "full",
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      updateCurrentDocumentContent(content)
      setHasUnsavedChanges(true)

      const plainText = editor.getText()
      runSuggestionCheck(plainText, editor)
    },
  })

  /**
   * Auto-save (debounced)
   * ------------------------------------------------------------
   * Instead of running an interval every second – even when there
   * are no pending changes – we debounce the save call so it only
   * fires once the user has been idle for the specified delay.
   * This dramatically reduces the amount of work React needs to
   * do while the editor is idle and prevents the "white screen"
   * crash that appeared after leaving the tab open for a while.
   */
  const autoSave = useCallback(async () => {
    if (!currentDocument || !editor || saving || !hasUnsavedChanges) return

    const content = editor.getHTML()
    await saveDocument(currentDocument.id, content, title)
    setHasUnsavedChanges(false)
  }, [currentDocument, editor, hasUnsavedChanges, saving, title, saveDocument])

  // Debounce auto-save whenever there are unsaved changes.
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timeout = window.setTimeout(autoSave, 1000) // 1 s idle period
    return () => window.clearTimeout(timeout)
  }, [hasUnsavedChanges, autoSave])

  // Calculate score after document is saved
  useEffect(() => {
    if (hasUnsavedChanges || !currentDocument?.content || scoreLoading) return
    
    const calculateScore = async () => {
      if (!editor) return
      setScoreLoading(true)
      try {
        const plainText = editor.getText()
        await calculateDocumentScore(currentDocument.id, plainText)
      } catch (error) {
        console.error('Error calculating score:', error)
      } finally {
        setScoreLoading(false)
      }
    }
    
    // Only calculate score if we don't already have one or if content has changed
    if (!currentDocument.writingScore || 
        new Date(currentDocument.updated_at) > new Date(currentDocument.writingScore.lastCalculated)) {
      calculateScore()
    }
  }, [hasUnsavedChanges, currentDocument, editor, calculateDocumentScore, scoreLoading])

  /* ------------------------------------------------------------------
   * Manual interactions – save, title change, and navigation
   * ------------------------------------------------------------------*/
  const handleManualSave = async () => {
    if (currentDocument && editor) {
      const content = editor.getHTML()
      await saveDocument(currentDocument.id, content, title)
      setHasUnsavedChanges(false)
    }
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasUnsavedChanges(true)
  }

  // Handle back navigation and version creation
  const handleBackClick = async () => {
    if (currentDocument && user) {
      const content = editor?.getHTML() || currentDocument.content

      // Ensure latest changes are persisted
      await saveDocument(currentDocument.id, content, title)

      // Record a new version entry
      await createVersion(currentDocument.id, user.id, title || currentDocument.title, content)
    }

    navigate("/dashboard")
  }

  /**
   * Handle when the user clicks on a card to toggle highlighting.
   */
  const handleSelectSuggestion = useCallback(
    (s: Suggestion) => {
      if (!editor) return

      // Toggle highlight state
      setHighlightedSuggestionKeys((prev: Set<string>) => {
        const newSet = new Set(prev)
        const key = getHighlightKey(s)
        
        if (newSet.has(key)) {
          newSet.delete(key)
        } else {
          newSet.add(key)
        }
        
        // Update all underline extensions with the highlighted suggestions
        if (editor && editor.view) {
          // For grammar/correctness suggestions
          const correctnessSuggestions = grammarSuggestionsRef.current.map(sg => ({
            ...sg,
            highlighted: newSet.has(getHighlightKey(sg))
          }))
          
          const tr1 = editor.view.state.tr.setMeta(correctnessUnderlineKey as any, {
            suggestions: correctnessSuggestions,
          })
          editor.view.dispatch(tr1)

          // For AI suggestions (Clarity, Engagement, Delivery)
          const aiSuggestionsWithHighlight = aiSuggestionsRef.current.map(sg => ({
            ...sg,
            highlighted: newSet.has(getHighlightKey(sg))
          }))

          const tr2 = editor.view.state.tr.setMeta(clarityUnderlineKey as any, {
            suggestions: aiSuggestionsWithHighlight.filter((sg) => sg.category === "Clarity"),
          })
          editor.view.dispatch(tr2)

          const tr3 = editor.view.state.tr.setMeta(engagementUnderlineKey as any, {
            suggestions: aiSuggestionsWithHighlight.filter((sg) => sg.category === "Engagement"),
          })
          editor.view.dispatch(tr3)

          const tr4 = editor.view.state.tr.setMeta(deliveryUnderlineKey as any, {
            suggestions: aiSuggestionsWithHighlight.filter((sg) => sg.category === "Delivery"),
          })
          editor.view.dispatch(tr4)
        }
        
        return newSet
      })

      // If the suggestion has position info, scroll to it
      if (s.index !== undefined && s.length !== undefined) {
        // This is an AI suggestion with both index and length
        // Use the TipTap API to find the position
        const { state } = editor
        const { doc } = state
        let charCount = 0
        let from = -1
        
        // Convert character index to document position
        doc.descendants((node: any, pos: any) => {
          if (from !== -1) return false // Already found
          
          if (node.isText) {
            const textLength = node.text?.length || 0
            if (charCount + textLength > s.index!) {
              from = pos + (s.index! - charCount)
              return false
            }
            charCount += textLength
          } else if (node.isBlock && charCount > 0) {
            charCount += 1 // Account for newline
          }
        })
        
        if (from !== -1 && editor.view) {
          // Get the coordinates of the position
          const coords = editor.view.coordsAtPos(from)
          const editorElement = editor.view.dom
          const editorRect = editorElement.getBoundingClientRect()
          
          // Calculate if we need to scroll
          const isAboveViewport = coords.top < editorRect.top + 50 // 50px buffer
          const isBelowViewport = coords.bottom > editorRect.bottom - 50 // 50px buffer
          
          if (isAboveViewport || isBelowViewport) {
            // Calculate the target scroll position to center the text
            const targetScrollTop = coords.top - editorRect.top - (editorRect.height / 2) + editorElement.scrollTop
            
            // Smooth scroll to the position
            editorElement.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            })
          }
          
          // Just focus the editor without setting any selection
          editor.commands.focus('start', { scrollIntoView: false })
        }
      } else if (s.index !== undefined) {
        // This is a spell check suggestion with only index (no length)
        // Use the original behavior - just focus the editor
        // The highlighting is handled by the toggle state above
        editor.commands.focus()
      } else {
        // Just focus without selection
        editor.commands.focus('start', { scrollIntoView: false })
      }
    },
    [editor],
  )

  // Remove a suggestion from caches and refresh both the sidebar and the underline marks.
  const removeSuggestionById = (id: string) => {
    grammarSuggestionsRef.current = grammarSuggestionsRef.current.filter((sg) => sg.id !== id)
    aiSuggestionsRef.current = aiSuggestionsRef.current.filter((sg) => sg.id !== id)
    refreshSuggestions()

    // Immediately update underline extensions to reflect the change.
    if (editor && editor.view) {
      // Add highlight state to remaining suggestions
      const correctnessWithHighlight = grammarSuggestionsRef.current.map(sg => ({
        ...sg,
        highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
      }))
      
      const tr1 = editor.view.state.tr.setMeta(correctnessUnderlineKey as any, {
        suggestions: correctnessWithHighlight,
      })
      editor.view.dispatch(tr1)

      const aiWithHighlight = aiSuggestionsRef.current.map(sg => ({
        ...sg,
        highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
      }))

      const tr2 = editor.view.state.tr.setMeta(clarityUnderlineKey as any, {
        suggestions: aiWithHighlight.filter((sg) => sg.category === "Clarity"),
      })
      editor.view.dispatch(tr2)

      const tr3 = editor.view.state.tr.setMeta(engagementUnderlineKey as any, {
        suggestions: aiWithHighlight.filter((sg) => sg.category === "Engagement"),
      })
      editor.view.dispatch(tr3)

      const tr4 = editor.view.state.tr.setMeta(deliveryUnderlineKey as any, {
        suggestions: aiWithHighlight.filter((sg) => sg.category === "Delivery"),
      })
      editor.view.dispatch(tr4)
    }
  }

  /** Accept a suggestion – replace the offending text with the proposed fix */
  const handleAcceptSuggestion = useCallback(
    (s: Suggestion, replacement?: string) => {
      if (!editor || !currentDocument) return

      let original: string | null = null
      let newReplacement: string | null = null

      if (s.title === "Sentence start") {
        const delMatch = s.excerpt.match(/<del>(.*?)<\/del>/i)
        const strongMatch = s.excerpt.match(/<strong>(.*?)<\/strong>/i)
        if (!delMatch || !strongMatch) return
        original = delMatch[1]
        newReplacement = strongMatch[1]
      } else if (s.title === "Spelling") {
        if (!replacement) {
          if (s.candidates && s.candidates.length > 0) {
            replacement = s.candidates[0]
          } else {
            return
          }
        }

        const match = s.excerpt.match(/"\s*(.+?)\s*"/)
        if (!match) return
        original = match[1]
        newReplacement = replacement
      } else if (s.title === "Capitalisation") {
        if (!replacement) {
          if (s.candidates && s.candidates.length > 0) {
            replacement = s.candidates[0]
          } else {
            return
          }
        }

        const delMatch = s.excerpt.match(/<del>(.*?)<\/del>/i)
        if (!delMatch) return
        original = delMatch[1]
        newReplacement = replacement
      } else if (s.title === "Punctuation") {
        if (!replacement) {
          replacement = s.candidates && s.candidates.length > 0 ? s.candidates[0] : "."
        }

        editor.chain().focus("end").insertContent(replacement).run()
        
        // Remove highlight for the accepted suggestion
        setHighlightedSuggestionKeys((prev: Set<string>) => {
          const newSet = new Set(prev)
          newSet.delete(getHighlightKey(s))
          return newSet
        })
        
        removeSuggestionById(s.id)

        // Increment the suggestions applied count for this document
        incrementSuggestionsApplied(currentDocument.id)

        return
      } else if (s.category === "Clarity" || s.category === "Engagement" || s.category === "Delivery") {
        const delMatch = s.excerpt.match(/<del>(.*?)<\/del>/i)
        const strongMatch = s.excerpt.match(/<strong>(.*?)<\/strong>/i)
        if (!delMatch || !strongMatch) return

        original = delMatch[1]
        newReplacement = strongMatch[1]
      } else {
        return
      }

      if (!original || !newReplacement) return

      const html = editor.getHTML()
      if (!html.includes(original)) {
        removeSuggestionById(s.id)
        return
      }

      // Difference in length so we can shift later indices of remaining AI suggestions
      const lengthDelta = newReplacement.length - original.length
      const acceptedCharIndex = typeof s.index === "number" ? s.index : null

      const newHtml = html.replace(original, newReplacement)
      editor.commands.setContent(newHtml)
      
      // Remove highlight for the accepted suggestion
      setHighlightedSuggestionKeys((prev: Set<string>) => {
        const newSet = new Set(prev)
        newSet.delete(getHighlightKey(s))
        return newSet
      })
      
      removeSuggestionById(s.id)

      // Increment the suggestions applied count for this document
      incrementSuggestionsApplied(currentDocument.id)

      /* --------------------------------------------------------------
       *  Recalculate decorations & suggestion indices immediately
       * ------------------------------------------------------------*/

      // 1) Shift the stored indices of any remaining AI suggestions that
      //    appear after the position we just modified so their underlines
      //    stay aligned with the moved text.
      if (acceptedCharIndex !== null && lengthDelta !== 0) {
        aiSuggestionsRef.current = aiSuggestionsRef.current.map((sg) => {
          if (sg.index != null && sg.index > acceptedCharIndex) {
            return { ...sg, index: sg.index + lengthDelta }
          }
          return sg
        })
      }
      
      // Clear highlights for any suggestions that were in the replaced text
      if (acceptedCharIndex !== null && s.length) {
        const affectedStart = acceptedCharIndex
        const affectedEnd = acceptedCharIndex + s.length
        
        setHighlightedSuggestionKeys((prev: Set<string>) => {
          const newSet = new Set(prev)
          // Remove highlights for suggestions that were in the replaced text range
          grammarSuggestionsRef.current.forEach((sg) => {
            if (sg.index !== undefined && 
                sg.index >= affectedStart && 
                sg.index < affectedEnd) {
              newSet.delete(getHighlightKey(sg))
            }
          })
          return newSet
        })
      }

      // 2) Immediately run the grammar/spelling checker again so the red
      //    underlines are rebuilt based on the new document contents.
      const plainAfterEdit = editor.getText()
      runSuggestionCheck(plainAfterEdit, editor, true)

      // 3) Refresh the merged suggestion list (grammar + AI).
      refreshSuggestions()

      // 4) Update the AI underline decorations with their (potentially) new
      //    indices.
      if (editor && editor.view) {
        const view = editor.view

        const tr1 = view.state.tr.setMeta(clarityUnderlineKey as any, {
          suggestions: aiSuggestionsRef.current.filter((sg) => sg.category === "Clarity"),
        })
        view.dispatch(tr1)

        const tr2 = view.state.tr.setMeta(engagementUnderlineKey as any, {
          suggestions: aiSuggestionsRef.current.filter((sg) => sg.category === "Engagement"),
        })
        view.dispatch(tr2)

        const tr3 = view.state.tr.setMeta(deliveryUnderlineKey as any, {
          suggestions: aiSuggestionsRef.current.filter((sg) => sg.category === "Delivery"),
        })
        view.dispatch(tr3)
      }
    },
    // runSuggestionCheck is stable; deliberately excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, removeSuggestionById, refreshSuggestions, incrementSuggestionsApplied, currentDocument],
  )

  /** Dismiss a suggestion and refresh underline */
  const handleDismissSuggestion = useCallback(
    (s: Suggestion) => {
      const key = getSuggestionKey(s)
      setDismissedSuggestionKeys((prev) => {
        const next = new Set(prev)
        next.add(key)
        dismissedSuggestionKeysRef.current = next
        return next
      })
      
      // Remove highlight for the dismissed suggestion
      setHighlightedSuggestionKeys((prev: Set<string>) => {
        const newSet = new Set(prev)
        newSet.delete(getHighlightKey(s))
        return newSet
      })

      removeSuggestionById(s.id)

      // We already updated the suggestion list + underline; allow the
      // background debounce in onUpdate (or future typing) to run a full scan.
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeSuggestionById],
  )

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Automatically collapse sidebar on smaller screens (<1280px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsSidebarCollapsed(true)
      } else {
        setIsSidebarCollapsed(false)
      }
    }

    // Initialize
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  /* ------------------------------------------------------------------
   *  AI – Clarity analysis via OpenAI
   * ----------------------------------------------------------------*/

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

  const runClarityAnalysis = useCallback(
    async (plain: string, ed: Editor | null) => {
      if (!openaiApiKey || !plain.trim()) return

      setClarityLoading(true)

      try {
        const prompt = `Revise the following between the textbox tags. Select the three sentences (Or one or two if there are less than three) that could use the most revision for clarity. Rewrite those three sentences for conciseness and clarity while keeping original meaning. Return an array with at most three sentences.<textbox>${plain}</textbox>`

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
          }),
        })

        const data = await res.json()
        const rawContent: string = data?.choices?.[0]?.message?.content ?? ""

        // Attempt to parse as JSON array; fallback to extracting bracketed content
        let rewrittenArr: string[] = []
        try {
          rewrittenArr = JSON.parse(rawContent)
        } catch {
          const m = rawContent.match(/\[.*\]/s)
          if (m) {
            try {
              rewrittenArr = JSON.parse(m[0])
            } catch {
              /* empty */
            }
          }
        }

        if (!Array.isArray(rewrittenArr) || !rewrittenArr.length) return

        // Map rewritten sentences back to originals
        const sentences = plain.match(RE_SENTENCE) ?? []
        const usedIdx = new Set<number>()

        const claritySuggestions: Suggestion[] = []
        let searchStart = 0

        rewrittenArr.forEach((rewritten, i) => {
          // Find best matching original sentence not yet used
          let bestIdx = -1
          let bestScore = 0
          sentences.forEach((orig, idx) => {
            if (usedIdx.has(idx)) return
            const score = sentenceSimilarity(orig, rewritten)
            if (score > bestScore) {
              bestScore = score
              bestIdx = idx
            }
          })

          if (bestIdx === -1) return
          usedIdx.add(bestIdx)

          const originalSentence = sentences[bestIdx].trim()
          const charIndex = findSubTextIndex(plain, originalSentence, searchStart)
          if (charIndex === -1) return

          searchStart = charIndex + originalSentence.length

          claritySuggestions.push({
            id: `Clarity-${charIndex}-${i}`,
            category: "Clarity",
            title: "Clarity",
            excerpt: `<del>${originalSentence}</del> → <strong>${rewritten.trim()}</strong>`,
            index: charIndex,
            length: originalSentence.length,
          })
        })

        aiSuggestionsRef.current = claritySuggestions
        refreshSuggestions()

        if (ed && ed.view) {
          // Update clarity underlines while preserving grammar highlight states
          const clarityWithHighlight = claritySuggestions.map(sg => ({
            ...sg,
            highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
          }))
          
          const tr = ed.view.state.tr.setMeta(clarityUnderlineKey as any, {
            suggestions: clarityWithHighlight,
          })
          ed.view.dispatch(tr)
          
          // Also update grammar suggestions to preserve their highlight state
          const grammarWithHighlight = grammarSuggestionsRef.current.map(sg => ({
            ...sg,
            highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
          }))
          
          const tr2 = ed.view.state.tr.setMeta(correctnessUnderlineKey as any, {
            suggestions: grammarWithHighlight,
          })
          ed.view.dispatch(tr2)
        }
      } catch (err) {
        console.error("Error generating clarity suggestions", err)
      } finally {
        setClarityLoading(false)
      }
    },
    [openaiApiKey, refreshSuggestions],
  )

  /* ------------------------------------------------------------------
   * AI – Engagement analysis
   * ----------------------------------------------------------------*/

  const runEngagementAnalysis = useCallback(
    async (plain: string, ed: Editor | null) => {
      if (!openaiApiKey || !plain.trim()) return
      setEngagementLoading(true)

      try {
        const prompt = `Revise the following between the textbox tags. Select the three sentences (Or one or two if there are less than three) that could use the most revision for engagement. Rewrite those three sentences more vividly to paint a stronger mental image while keeping original meaning. Return an array with at most three sentences.<textbox>${plain}</textbox>`

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
          }),
        })

        const data = await res.json()
        const rawContent: string = data?.choices?.[0]?.message?.content ?? ""

        let rewrittenArr: string[] = []
        try {
          rewrittenArr = JSON.parse(rawContent)
        } catch {
          const m = rawContent.match(/\[.*\]/s)
          if (m) {
            try { rewrittenArr = JSON.parse(m[0]) } catch {}
          }
        }
        if (!Array.isArray(rewrittenArr) || !rewrittenArr.length) return

        const sentences = plain.match(RE_SENTENCE) ?? []
        const usedIdx = new Set<number>()
        const engagementSuggestions: Suggestion[] = []
        let searchStart = 0

        rewrittenArr.forEach((rewritten, i) => {
          let bestIdx = -1
          let bestScore = 0
          sentences.forEach((orig, idx) => {
            if (usedIdx.has(idx)) return
            const score = sentenceSimilarity(orig, rewritten)
            if (score > bestScore) { bestScore = score; bestIdx = idx }
          })
          if (bestIdx === -1) return
          usedIdx.add(bestIdx)
          const originalSentence = sentences[bestIdx].trim()
          const charIndex = findSubTextIndex(plain, originalSentence, searchStart)
          if (charIndex === -1) return
          searchStart = charIndex + originalSentence.length
          engagementSuggestions.push({
            id: `Engagement-${charIndex}-${i}`,
            category: "Engagement",
            title: "Engagement",
            excerpt: `<del>${originalSentence}</del> → <strong>${rewritten.trim()}</strong>`,
            index: charIndex,
            length: originalSentence.length,
          })
        })

        // Merge with existing AI suggestions excluding previous Engagement ones
        aiSuggestionsRef.current = [
          ...aiSuggestionsRef.current.filter((sg) => sg.category !== "Engagement"),
          ...engagementSuggestions,
        ]
        refreshSuggestions()

        if (ed && ed.view) {
          // Update engagement underlines while preserving all highlight states
          const engagementWithHighlight = engagementSuggestions.map(sg => ({
            ...sg,
            highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
          }))
          
          const tr = ed.view.state.tr.setMeta(engagementUnderlineKey as any, {
            suggestions: engagementWithHighlight,
          })
          ed.view.dispatch(tr)
          
          // Preserve grammar suggestions highlight state
          const grammarWithHighlight = grammarSuggestionsRef.current.map(sg => ({
            ...sg,
            highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
          }))
          
          const tr2 = ed.view.state.tr.setMeta(correctnessUnderlineKey as any, {
            suggestions: grammarWithHighlight,
          })
          ed.view.dispatch(tr2)
          
          // Preserve other AI suggestions highlight state
          const clarityWithHighlight = aiSuggestionsRef.current
            .filter((sg) => sg.category === "Clarity")
            .map(sg => ({
              ...sg,
              highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
            }))
          
          if (clarityWithHighlight.length > 0) {
            const tr3 = ed.view.state.tr.setMeta(clarityUnderlineKey as any, {
              suggestions: clarityWithHighlight,
            })
            ed.view.dispatch(tr3)
          }
        }
      } catch (err) {
        console.error("Error generating engagement suggestions", err)
      } finally {
        setEngagementLoading(false)
      }
    },
    [openaiApiKey, refreshSuggestions],
  )

  /* ------------------------------------------------------------------
   * AI – Delivery analysis
   * ----------------------------------------------------------------*/

  const runDeliveryAnalysis = useCallback(
    async (plain: string, ed: Editor | null) => {
      if (!openaiApiKey || !plain.trim()) return
      setDeliveryLoading(true)

      try {
        const prompt = `Revise the following between the textbox tags. Select the three sentences (Or one or two if there are less than three) that could use the most revision for delivery. Rewrite those three sentences to smooth out the flow and adjust tone to be encouraging and academic while keeping original meaning. Return an array with at most three sentences.<textbox>${plain}</textbox>`

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
          }),
        })

        const data = await res.json()
        const rawContent: string = data?.choices?.[0]?.message?.content ?? ""

        let rewrittenArr: string[] = []
        try { rewrittenArr = JSON.parse(rawContent) } catch {
          const m = rawContent.match(/\[.*\]/s)
          if (m) { try { rewrittenArr = JSON.parse(m[0]) } catch {} }
        }
        if (!Array.isArray(rewrittenArr) || !rewrittenArr.length) return

        const sentences = plain.match(RE_SENTENCE) ?? []
        const usedIdx = new Set<number>()
        const deliverySuggestions: Suggestion[] = []
        let searchStart = 0

        rewrittenArr.forEach((rewritten, i) => {
          let bestIdx = -1, bestScore = 0
          sentences.forEach((orig, idx) => {
            if (usedIdx.has(idx)) return
            const score = sentenceSimilarity(orig, rewritten)
            if (score > bestScore) { bestScore = score; bestIdx = idx }
          })
          if (bestIdx === -1) return
          usedIdx.add(bestIdx)
          const originalSentence = sentences[bestIdx].trim()
          const charIndex = findSubTextIndex(plain, originalSentence, searchStart)
          if (charIndex === -1) return
          searchStart = charIndex + originalSentence.length
          deliverySuggestions.push({
            id: `Delivery-${charIndex}-${i}`,
            category: "Delivery",
            title: "Delivery",
            excerpt: `<del>${originalSentence}</del> → <strong>${rewritten.trim()}</strong>`,
            index: charIndex,
            length: originalSentence.length,
          })
        })

        aiSuggestionsRef.current = [
          ...aiSuggestionsRef.current.filter((sg) => sg.category !== "Delivery"),
          ...deliverySuggestions,
        ]
        refreshSuggestions()

        if (ed && ed.view) {
          // Update delivery underlines while preserving all highlight states
          const deliveryWithHighlight = deliverySuggestions.map(sg => ({
            ...sg,
            highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
          }))
          
          const tr = ed.view.state.tr.setMeta(deliveryUnderlineKey as any, { 
            suggestions: deliveryWithHighlight 
          })
          ed.view.dispatch(tr)
          
          // Preserve grammar suggestions highlight state
          const grammarWithHighlight = grammarSuggestionsRef.current.map(sg => ({
            ...sg,
            highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
          }))
          
          const tr2 = ed.view.state.tr.setMeta(correctnessUnderlineKey as any, {
            suggestions: grammarWithHighlight,
          })
          ed.view.dispatch(tr2)
          
          // Preserve other AI suggestions highlight states
          const clarityWithHighlight = aiSuggestionsRef.current
            .filter((sg) => sg.category === "Clarity")
            .map(sg => ({
              ...sg,
              highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
            }))
          
          if (clarityWithHighlight.length > 0) {
            const tr3 = ed.view.state.tr.setMeta(clarityUnderlineKey as any, {
              suggestions: clarityWithHighlight,
            })
            ed.view.dispatch(tr3)
          }
          
          const engagementWithHighlight = aiSuggestionsRef.current
            .filter((sg) => sg.category === "Engagement")
            .map(sg => ({
              ...sg,
              highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
            }))
          
          if (engagementWithHighlight.length > 0) {
            const tr4 = ed.view.state.tr.setMeta(engagementUnderlineKey as any, {
              suggestions: engagementWithHighlight,
            })
            ed.view.dispatch(tr4)
          }
        }
      } catch (err) {
        console.error("Delivery suggestions error", err)
      } finally {
        setDeliveryLoading(false)
      }
    },
    [openaiApiKey, refreshSuggestions],
  )

  /* ------------------------------------------------------------
   * Handle category change events (trigger AI generation)
   * -----------------------------------------------------------*/

  const handleCategoryChange = useCallback(
    (cat: "Correctness" | "Clarity" | "Engagement" | "Delivery") => {
      if (cat === "Clarity") {
        const plain = editor?.getText() || ""
        runClarityAnalysis(plain, editor)
      } else if (cat === "Engagement") {
        const plain = editor?.getText() || ""
        runEngagementAnalysis(plain, editor)
      } else if (cat === "Delivery") {
        const plain = editor?.getText() || ""
        runDeliveryAnalysis(plain, editor)
      } else if (cat === "Correctness" && editor && editor.view) {
        // When switching back to Correctness, ensure grammar suggestions have correct highlight state
        const grammarWithHighlight = grammarSuggestionsRef.current.map(sg => ({
          ...sg,
          highlighted: highlightedSuggestionKeys.has(getHighlightKey(sg))
        }))
        
        const tr = editor.view.state.tr.setMeta(correctnessUnderlineKey as any, {
          suggestions: grammarWithHighlight,
        })
        editor.view.dispatch(tr)
      }
      setActiveSidebarCategory(cat)
    },
    [editor, runClarityAnalysis, runEngagementAnalysis, runDeliveryAnalysis, highlightedSuggestionKeys, getHighlightKey],
  )

  // Load document on mount
  useEffect(() => {
    const initializeDocument = async () => {
      if (documentId) {
        await loadDocument(documentId)
      } else if (user) {
        // Create new document if no ID provided
        const newDoc = await createDocument(user.id)
        if (newDoc) {
          navigate(`/editor/${newDoc.id}`, { replace: true })
        }
      }
    }

    initializeDocument()
  }, [documentId, user, loadDocument, createDocument, navigate, currentDocument?.id])

  // Update editor content when document loads
  useEffect(() => {
    if (currentDocument && editor) {
      setTitle(currentDocument.title)
      editor.commands.setContent(currentDocument.content || "")
      setHasUnsavedChanges(false)
    }
    // Only run when the document ID changes to avoid resetting content on each keystroke
  }, [currentDocument?.id, editor])

  // Generate text modal state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  
  // Writing score modal state
  const [isWritingScoreModalOpen, setIsWritingScoreModalOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentDocument) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <FileTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Document not found</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            The document you're looking for doesn't exist or may have been deleted.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const wordCount = editor?.storage.characterCount.words() || 0
  const characterCount = editor?.storage.characterCount.characters() || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-sm bg-white/80 sticky top-0 z-40">
        <div className="h-16 px-4">
          <div className={`h-full flex items-center justify-between ${isSidebarCollapsed ? "max-w-3xl mx-auto" : "mr-80"}`}>
            {/* Left section: Back button and title */}
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={handleBackClick}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back
              </button>

              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-2 ml-4 flex-1 min-w-0"
                placeholder="Untitled Document"
              />
            </div>

            {/* Right section: Save status */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {!hasUnsavedChanges && !saving && (
                  <>
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span>Saved</span>
                  </>
                )}
                {saving && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                    Saving...
                  </span>
                )}
              </div>
              <button
                onClick={handleManualSave}
                disabled={saving || !hasUnsavedChanges}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <SaveIcon className="w-4 h-4 mr-2 inline" />
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-4">
        <div className={`${isSidebarCollapsed ? "max-w-3xl mx-auto" : "mr-80"}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded-md transition-colors ${
                editor?.isActive("bold") 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <BoldIcon className="w-4 h-4" />
            </button>

          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-md transition-colors ${
              editor?.isActive("italic") 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ItalicIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-md transition-colors ${
              editor?.isActive("heading", { level: 1 }) 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Heading1Icon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-md transition-colors ${
              editor?.isActive("heading", { level: 2 }) 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Heading2Icon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded-md transition-colors ${
              editor?.isActive("heading", { level: 3 }) 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Heading3Icon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-md transition-colors ${
              editor?.isActive("bulletList") 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ListIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-md transition-colors ${
              editor?.isActive("orderedList") 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ListOrderedIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
              onClick={() => setIsGenerateOpen(true)}
              className="p-2 rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">AI writing assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col">
          {/* Writing Area */}
          <div className="flex-1 pt-4 px-4 pb-0">
            <div className={`${isSidebarCollapsed ? "w-full max-w-3xl mx-auto" : "mr-80"}`}>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Status Bar */}
          <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="h-14 px-4">
              <div className={`h-full ${isSidebarCollapsed ? "max-w-3xl mx-auto" : "mr-80"}`}>
                <div className="h-full flex items-center justify-between">
                  {/* Left section with word count, etc */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>Words: {wordCount}</span>
                    <span>Characters: {characterCount}</span>
                    <div className="flex items-center gap-2">
                      <span>Writing Score:</span>
                      {scoreLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : currentDocument?.writingScore ? (
                        <ScoreBadge 
                          score={currentDocument.writingScore.overall} 
                          writingScore={currentDocument.writingScore}
                          size="sm"
                          clickable
                          onClick={() => setIsWritingScoreModalOpen(true)}
                        />
                      ) : (
                        <span className="text-gray-500 text-sm" title="Score will be calculated after saving">
                          Not calculated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right section - Last saved */}
                  <span className="text-sm text-gray-600">Last saved: {currentDocument.updated_at
                    ? new Date(currentDocument.updated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "Never"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Render collapsed toggle button */}
        {isSidebarCollapsed ? (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open suggestion panel"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        ) : (
          <SuggestionSidebar
            editor={editor}
            suggestions={suggestions}
            highlightedSuggestionIds={highlightedSuggestionKeys}
            onSelect={handleSelectSuggestion}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
            onCollapse={() => setIsSidebarCollapsed(true)}
            loading={activeSidebarCategory === "Clarity" ? clarityLoading : activeSidebarCategory === "Engagement" ? engagementLoading : activeSidebarCategory === "Delivery" ? deliveryLoading : false}
            onCategoryChange={handleCategoryChange}
          />
        )}
      </div>

      {/* Generate Text Modal */}
      <GenerateTextModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        currentText={editor?.getText() || ""}
        onInsert={(text) => {
          if (!editor) return
          editor.chain().focus().insertContent(text).run()
          setIsGenerateOpen(false)
        }}
      />

      {/* Writing Score Modal */}
      {currentDocument?.writingScore && (
        <WritingScoreModal
          isOpen={isWritingScoreModalOpen}
          onClose={() => setIsWritingScoreModalOpen(false)}
          writingScore={currentDocument.writingScore}
          documentText={editor?.getText() || ""}
        />
      )}
    </div>
  )
}