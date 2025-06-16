import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useAuthStore } from '../stores/authStore'
import { useDocumentStore } from '../stores/documentStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon, 
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  SaveIcon,
  ArrowLeftIcon,
  FileTextIcon,
  LinkIcon
} from 'lucide-react'

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
    updateCurrentDocumentContent 
  } = useDocumentStore()

  const [title, setTitle] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // The typography plugin will handle styling
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your thoughts here...',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'editor-content',
        spellcheck: 'true',
        style: 'white-space: pre-wrap;',
        'data-gramm': 'false',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      updateCurrentDocumentContent(content)
      setHasUnsavedChanges(true)
    },
  })

  const openLinkSelector = useCallback(() => {
    if (!editor) return;
    const { selection } = editor.state
    if (selection.empty) return

    const url = editor.getAttributes('link').href || ''
    setLinkUrl(url)
    setIsLinkSelectorOpen(true)
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setIsLinkSelectorOpen(false)
    setLinkUrl('')
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
  }, [documentId, user, loadDocument, createDocument, navigate])

  // Update editor content when document loads
  useEffect(() => {
    if (currentDocument && editor) {
      setTitle(currentDocument.title)
      editor.commands.setContent(currentDocument.content || '')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentDocument) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600 mb-4">The document you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-600 hover:text-primary-500 font-medium"
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 flex-1"
                placeholder="Untitled Document"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {hasUnsavedChanges && !saving && '• Unsaved changes'}
                {saving && '• Saving...'}
                {!hasUnsavedChanges && !saving && '• Saved'}
              </div>
              <button
                onClick={handleManualSave}
                disabled={saving || !hasUnsavedChanges}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SaveIcon className="w-4 h-4 mr-1" />
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-3">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded-md ${
                editor?.isActive('bold') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BoldIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-md ${
                editor?.isActive('italic') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ItalicIcon className="w-4 h-4" />
            </button>

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                openLinkSelector();
              }}
              className={`p-2 rounded-md ${
                editor?.isActive('link') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded-md ${
                editor?.isActive('heading', { level: 1 }) 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heading1Icon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded-md ${
                editor?.isActive('heading', { level: 2 }) 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heading2Icon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded-md ${
                editor?.isActive('heading', { level: 3 }) 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heading3Icon className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Bullet List */}
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-md ${
                editor?.isActive('bulletList')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>

            {/* Numbered List */}
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-md ${
                editor?.isActive('orderedList')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-200'
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
            onHide: () => setIsLinkSelectorOpen(false) 
          }}
          shouldShow={() => !!editor && editor.state.selection.from !== editor.state.selection.to && isLinkSelectorOpen}
          className="bg-white border border-gray-200 rounded-md shadow-lg p-2 flex items-center space-x-2"
        >
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm p-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setLink()
              }
            }}
          />
          <button
            onClick={setLink}
            className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none"
          >
            Apply
          </button>
        </BubbleMenu>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="prose w-full max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 text-sm text-gray-600">
            <div>
              Words: {wordCount} • Characters: {characterCount}
            </div>
            <div>
              Last saved: {currentDocument.updated_at 
                ? new Date(currentDocument.updated_at).toLocaleTimeString() 
                : 'Never'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 