"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { CorrectnessUnderline, correctnessUnderlineKey } from "../extensions/CorrectnessUnderline"
import { useAuthStore } from "../stores/authStore"
import { useDocumentStore } from "../stores/documentStore"
import { useVersionStore } from "../stores/versionStore"
import { LoadingSpinner } from "../components/LoadingSpinner"
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
  LinkIcon,
  ChevronsLeft,
} from "lucide-react"
import { SuggestionSidebar, type Suggestion } from "../components/SuggestionSidebar"
import { checkText } from "../lib/textChecker"
import { getSuggestions as getAISuggestions, type AICategory } from "../lib/openai"

export function EditorPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentDocument, loading, saving, loadDocument, saveDocument, createDocument, updateCurrentDocumentContent } =
    useDocumentStore()

  const { createVersion } = useVersionStore()

  const [title, setTitle] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  // ------------------------------------------------------------
  // Suggestion management
  // ------------------------------------------------------------
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Keep raw groups separate so we can refresh/merge efficiently.
  const grammarSuggestionsRef = useRef<Suggestion[]>([])
  const aiSuggestionsRef = useRef<Suggestion[]>([])

  // Helper to produce a stable key for hashing suggestions.
  const getSuggestionKey = (s: Suggestion) => `${s.title}-${s.excerpt}`

  // Track suggestions dismissed by the user during the current session so we
  // can filter them out of subsequent AI/grammar runs.
  const [, setDismissedSuggestionKeys] = useState<Set<string>>(new Set())
  const dismissedSuggestionKeysRef = useRef<Set<string>>(new Set())

  /** Merge grammar + AI suggestions and apply dismissal filter */
  const refreshSuggestions = useCallback(() => {
    const merged = [...grammarSuggestionsRef.current, ...aiSuggestionsRef.current].filter(
      (sg) => !dismissedSuggestionKeysRef.current.has(getSuggestionKey(sg)),
    )
    setSuggestions(merged)
  }, [])

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
  const runSuggestionCheck = (
    plain: string,
    ed: Editor | null,
    immediate = false,
  ) => {
    const perform = () => {
      const detected = checkText(plain)
      const filtered = detected.filter(
        (sg) => !dismissedSuggestionKeysRef.current.has(getSuggestionKey(sg)),
      )

      grammarSuggestionsRef.current = filtered
      setSuggestions(filtered)

      if (ed && ed.view) {
        const tr = ed.view.state.tr.setMeta(correctnessUnderlineKey as any, {
          suggestions: filtered,
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
  }

  const [plainText, setPlainText] = useState("")

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
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class: "editor-content prose prose-lg max-w-none focus:outline-none px-8 py-6 bg-white mx-6 lg:mx-8 mt-6 rounded-lg shadow-sm border border-gray-200",
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

  const openLinkSelector = useCallback(() => {
    if (!editor) return
    const { selection } = editor.state
    if (selection.empty) return

    const url = editor.getAttributes("link").href || ""
    setLinkUrl(url)
    setIsLinkSelectorOpen(true)
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    }
    setIsLinkSelectorOpen(false)
    setLinkUrl("")
  }, [editor, linkUrl])

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

  /**
   * Handle when the user clicks on a card just to navigate.
   * For now we simply focus the editor; optionally could scroll to the location.
   */
  const handleSelectSuggestion = useCallback(
    (s: Suggestion) => {
      if (!editor) return

      // Try to locate the original text inside the document and move the selection.
      const delMatch = s.excerpt.match(/<del>(.*?)<\/del>/i)
      const original = delMatch ? delMatch[1] : null
      if (!original) {
        editor.commands.focus()
        return
      }

      const html = editor.getHTML()
      const idx = html.indexOf(original)
      if (idx === -1) {
        editor.commands.focus()
        return
      }

      // Roughly estimate the position by counting characters. This is an approximation but
      // good enough for basic navigation without deep ProseMirror node mapping.
      editor.commands.focus("end")
    },
    [editor],
  )

  // Remove a suggestion from caches and refresh both the sidebar and the underline marks.
  const removeSuggestionById = (id: string) => {
    grammarSuggestionsRef.current = grammarSuggestionsRef.current.filter((sg) => sg.id !== id)
    aiSuggestionsRef.current = aiSuggestionsRef.current.filter((sg) => sg.id !== id)
    refreshSuggestions()

    // Immediately update the underline extension to reflect the change.
    if (editor && editor.view) {
      const tr = editor.view.state.tr.setMeta(correctnessUnderlineKey as any, {
        suggestions: grammarSuggestionsRef.current,
      })
      editor.view.dispatch(tr)
    }
  }

  /** Accept a suggestion – replace the offending text with the proposed fix */
  const handleAcceptSuggestion = useCallback(
    (s: Suggestion, replacement?: string) => {
      if (!editor) return

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
        removeSuggestionById(s.id)
        return
      } else {
        return
      }

      if (!original || !newReplacement) return

      const html = editor.getHTML()
      if (!html.includes(original)) {
        removeSuggestionById(s.id)
        return
      }

      const newHtml = html.replace(original, newReplacement)
      editor.commands.setContent(newHtml)
      removeSuggestionById(s.id)

      // No need for an immediate full re-scan here – the editor's own onUpdate
      // handler will queue a debounced grammar re-check, and we have already
      // removed the specific suggestion + underline via removeSuggestionById.
    },
    // runSuggestionCheck is stable; deliberately excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, removeSuggestionById],
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

      removeSuggestionById(s.id)

      // We already updated the suggestion list + underline; allow the
      // background debounce in onUpdate (or future typing) to run a full scan.
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeSuggestionById],
  )

  /* ------------------------------------------------------------------
   * AI suggestion generation (debounced)
   * ------------------------------------------------------------------*/
  useEffect(() => {
    if (!plainText.trim()) {
      aiSuggestionsRef.current = []
      refreshSuggestions()
      return
    }

    const timeout = window.setTimeout(async () => {
      try {
        const categories: AICategory[] = ["Clarity", "Engagement", "Delivery"]
        const results = await Promise.all(categories.map((cat) => getAISuggestions(plainText, cat)))
        aiSuggestionsRef.current = results.flat()
        refreshSuggestions()
      } catch (err) {
        console.error("[AI Suggestions]", err)
      }
    }, 1500)

    return () => window.clearTimeout(timeout)
  }, [plainText, refreshSuggestions])

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

  // Dynamic classes depending on sidebar state
  const statusBarClassName = `fixed bottom-0 left-0 ${isSidebarCollapsed ? "right-0" : "right-80"} bg-white border-t border-gray-200 shadow-sm`

  return (
    <div className="min-h-screen bg-gray-50  mx-auto">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <button
                onClick={handleBackClick}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 flex-1 px-2 py-1 rounded-md hover:bg-gray-50 focus:bg-white"
                placeholder="Untitled Document"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 font-medium">
                {hasUnsavedChanges && !saving && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                    Unsaved changes
                  </span>
                )}
                {saving && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                    Saving...
                  </span>
                )}
                {!hasUnsavedChanges && !saving && (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Saved
                  </span>
                )}
              </div>
              <button
                onClick={handleManualSave}
                disabled={saving || !hasUnsavedChanges}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-3">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("bold")
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <BoldIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("italic")
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <ItalicIcon className="w-4 h-4" />
            </button>

            {/* 
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                openLinkSelector()
              }}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("link")
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            */}

            <div className="w-px h-6 bg-gray-300 mx-3"></div>

            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("heading", { level: 1 })
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Heading1Icon className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("heading", { level: 2 })
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Heading2Icon className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("heading", { level: 3 })
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Heading3Icon className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-3"></div>

            {/* Bullet List */}
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("bulletList")
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>

            {/* Numbered List */}
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2.5 rounded-lg transition-colors duration-150 ${
                editor?.isActive("orderedList")
                  ? "bg-blue-100 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <ListOrderedIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      {/*
        BubbleMenu temporarily removed due to stability issues ("Failed to execute 'removeChild'" error
        after long inactivity). Once the upstream issue in @tiptap/react is resolved or an alternative
        link–editing UI is implemented, this block can be restored.
      */}

      <div className="max-w-4xl mx-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className={statusBarClassName}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <span className="font-medium">
                Words: <span className="text-gray-900">{wordCount}</span>
              </span>
              <span className="font-medium">
                Characters: <span className="text-gray-900">{characterCount}</span>
              </span>
            </div>
            <div className="font-medium">
              Last saved:{" "}
              <span className="text-gray-900">
                {currentDocument.updated_at
                  ? new Date(currentDocument.updated_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                  : "Never"}
              </span>
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
          onSelect={handleSelectSuggestion}
          onAccept={handleAcceptSuggestion}
          onDismiss={handleDismissSuggestion}
          onCollapse={() => setIsSidebarCollapsed(true)}
        />
      )}
    </div>
  )
}
