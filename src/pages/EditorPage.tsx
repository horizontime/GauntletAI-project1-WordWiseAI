"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
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
} from "lucide-react"
import { SuggestionSidebar, type Suggestion } from "../components/SuggestionSidebar"
import { checkText } from "../lib/textChecker"
// @ts-ignore – the package ships without TypeScript types but works in runtime
import WProofreader from "@webspellchecker/wproofreader-sdk-js"

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

  // Mock suggestions to demonstrate the sidebar UI
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  /**
   * Keep track of suggestions that the user explicitly dismissed so they
   * won't show up again for the current document editing session.
   * We store a stable "key" derived from the suggestion's semantic content
   * (title + excerpt) instead of the built-in id because the id contains the
   * character index which may shift as the user continues typing.
   */
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState<Set<string>>(new Set())
  const dismissedSuggestionKeysRef = useRef<Set<string>>(new Set())

  const getSuggestionKey = (s: Suggestion) => `${s.title}-${s.excerpt}`

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
      const detected = checkText(plainText)
      // Filter out any suggestions that the user has previously dismissed.
      const filtered = detected.filter((sg) => !dismissedSuggestionKeysRef.current.has(getSuggestionKey(sg)))
      setSuggestions(filtered)
    },
  })

  // Initialize WProofreader for real-time grammar suggestions once the editor DOM is mounted.
  useEffect(() => {
    if (!editor) return

    try {
      // The editable element can be accessed via editor.view.dom.
      const container = (editor.view as any)?.dom as HTMLElement | null
      if (container) {
        WProofreader.init({
          container,
          lang: "en_US",
          serviceId: "TDHiXV50gZlQaDw", // Demo service ID – replace with real key in production
        })
      }
    } catch (err) {
      // Fail silently – the proofreading service is optional.
      console.error("Failed to initialize WProofreader", err)
    }
  }, [editor])

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

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (currentDocument && hasUnsavedChanges && !saving && editor) {
      const content = editor.getHTML()
      await saveDocument(currentDocument.id, content, title)
      setHasUnsavedChanges(false)
    }
  }, [currentDocument, hasUnsavedChanges, saving, editor, title, saveDocument])

  // Auto-save every 1 second
  useEffect(() => {
    const interval = setInterval(autoSave, 1000)
    return () => clearInterval(interval)
  }, [autoSave])

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

  const removeSuggestionById = (id: string) => {
    setSuggestions((prev) => prev.filter((sg) => sg.id !== id))
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
        // For spelling suggestions, we received replacement candidate.
        if (!replacement) {
          // No replacement selected; default to first candidate if present
          if (s.candidates && s.candidates.length > 0) {
            replacement = s.candidates[0]
          } else {
            return
          }
        }

        // Extract the misspelled word from the excerpt (quoted word)
        const match = s.excerpt.match(/"\s*(.+?)\s*"/)
        if (!match) return
        original = match[1]
        newReplacement = replacement
      } else {
        // Unsupported suggestion type for auto accept
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
    },
    [editor, removeSuggestionById],
  )

  const handleDismissSuggestion = useCallback(
    (s: Suggestion) => {
      // Remember that the user dismissed this suggestion so we don't show it again.
      const key = getSuggestionKey(s)
      setDismissedSuggestionKeys((prev) => {
        const next = new Set(prev)
        next.add(key)
        dismissedSuggestionKeysRef.current = next
        return next
      })

      removeSuggestionById(s.id)
    },
    [removeSuggestionById],
  )

  // Reset dismissed suggestions when a different document is loaded.
  useEffect(() => {
    setDismissedSuggestionKeys(new Set())
    dismissedSuggestionKeysRef.current = new Set()
  }, [currentDocument?.id])

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
    <div className="min-h-screen bg-gray-50 pr-80">
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
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{
            duration: 100,
            onHide: () => setIsLinkSelectorOpen(false),
          }}
          shouldShow={() => !!editor && editor.state.selection.from !== editor.state.selection.to && isLinkSelectorOpen}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center space-x-3"
        >
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="bg-transparent border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm px-3 py-2 min-w-[200px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                setLink()
              }
            }}
          />
          <button
            onClick={setLink}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
          >
            Apply
          </button>
        </BubbleMenu>
      )}

      <div className="max-w-5xl mx-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-80 bg-white border-t border-gray-200 shadow-sm">
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
                {currentDocument.updated_at ? new Date(currentDocument.updated_at).toLocaleTimeString() : "Never"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grammarly-like sidebar */}
      <SuggestionSidebar
        editor={editor}
        suggestions={suggestions}
        onSelect={handleSelectSuggestion}
        onAccept={handleAcceptSuggestion}
        onDismiss={handleDismissSuggestion}
      />
    </div>
  )
}
