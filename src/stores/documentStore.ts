import { create } from 'zustand'
import { supabase, Document } from '../lib/supabase'

interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  loading: boolean
  saving: boolean
  trashedDocuments: Document[]
  fetchTrashedDocuments: (userId: string) => Promise<void>
  restoreDocument: (documentId: string) => Promise<void>
  permanentDeleteDocument: (documentId: string) => Promise<void>
  fetchDocuments: (userId: string) => Promise<void>
  createDocument: (userId: string, title?: string) => Promise<Document | null>
  loadDocument: (documentId: string) => Promise<void>
  saveDocument: (documentId: string, content: string, title?: string) => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
  setCurrentDocument: (document: Document | null) => void
  updateCurrentDocumentContent: (content: string) => void
  incrementSuggestionsApplied: (documentId: string) => Promise<void>
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  saving: false,
  trashedDocuments: [],

  fetchDocuments: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })

      if (error) throw error
      set({ documents: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching documents:', error)
      set({ loading: false })
    }
  },

  createDocument: async (userId: string, title = 'Untitled Document') => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            user_id: userId,
            title,
            content: '',
            suggestions_applied: 0,
          }
        ])
        .select()
        .single()

      if (error) {
        // Check if the column doesn't exist
        if (error.message && error.message.includes('column "suggestions_applied" of relation "documents" does not exist')) {
          console.error('IMPORTANT: The suggestions_applied column does not exist in the database.')
          console.error('Please run the database migration as described in MIGRATION_INSTRUCTIONS.md')
          
          // Try creating without the suggestions_applied field
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('documents')
            .insert([
              {
                user_id: userId,
                title,
                content: '',
              }
            ])
            .select()
            .single()
            
          if (fallbackError) throw fallbackError
          
          // Add the field locally so the UI doesn't break
          const documentWithField = { ...fallbackData, suggestions_applied: 0 }
          const { documents } = get()
          set({ documents: [documentWithField, ...documents] })
          
          return documentWithField
        }
        
        throw error
      }
      
      const { documents } = get()
      set({ documents: [data, ...documents] })
      
      return data
    } catch (error) {
      console.error('Error creating document:', error)
      return null
    }
  },

  loadDocument: async (documentId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) throw error
      set({ currentDocument: data, loading: false })
    } catch (error) {
      console.error('Error loading document:', error)
      set({ loading: false })
    }
  },

  saveDocument: async (documentId: string, content: string, title?: string) => {
    set({ saving: true })
    try {
      const updateData: any = { content, updated_at: new Date().toISOString() }
      if (title) updateData.title = title

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error

      const { documents, currentDocument } = get()
      const updatedDocuments = documents.map(doc => 
        doc.id === documentId ? data : doc
      )
      
      set({ 
        documents: updatedDocuments,
        currentDocument: currentDocument?.id === documentId ? data : currentDocument,
        saving: false 
      })
    } catch (error) {
      console.error('Error saving document:', error)
      set({ saving: false })
    }
  },

  deleteDocument: async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', documentId)

      if (error) throw error

      const { documents, currentDocument } = get()
      const updatedDocuments = documents.filter(doc => doc.id !== documentId)
      
      set({ 
        documents: updatedDocuments,
        currentDocument: currentDocument?.id === documentId ? null : currentDocument
      })
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  },

  setCurrentDocument: (document: Document | null) => {
    set({ currentDocument: document })
  },

  updateCurrentDocumentContent: (content: string) => {
    const { currentDocument } = get()
    if (currentDocument) {
      set({ 
        currentDocument: { 
          ...currentDocument, 
          content 
        } 
      })
    }
  },

  incrementSuggestionsApplied: async (documentId: string) => {
    try {
      // Get the current document to increment the count
      const { data: currentDoc, error: fetchError } = await supabase
        .from('documents')
        .select('suggestions_applied')
        .eq('id', documentId)
        .single()

      if (fetchError) {
        // Check if the column doesn't exist
        if (fetchError.message && fetchError.message.includes('column "suggestions_applied" does not exist')) {
          console.error('IMPORTANT: The suggestions_applied column does not exist in the database.')
          console.error('Please run the database migration as described in MIGRATION_INSTRUCTIONS.md')
          alert('Database migration needed: The suggestions_applied column is missing. Please check the console and MIGRATION_INSTRUCTIONS.md')
        }
        
        throw fetchError
      }

      const newCount = (currentDoc.suggestions_applied || 0) + 1

      const { data, error } = await supabase
        .from('documents')
        .update({ suggestions_applied: newCount })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        throw error
      }

      const { documents, currentDocument } = get()
      const updatedDocuments = documents.map(doc => 
        doc.id === documentId ? data : doc
      )
      
      set({ 
        documents: updatedDocuments,
        currentDocument: currentDocument?.id === documentId ? data : currentDocument
      })
    } catch (error) {
      console.error('Error incrementing suggestions applied:', error)
    }
  },

  fetchTrashedDocuments: async (userId: string) => {
    set({ loading: true })
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('documents')
        .delete()
        .eq('user_id', userId)
        .eq('is_deleted', true)
        .lt('deleted_at', thirtyDaysAgo)

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      set({ trashedDocuments: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching trashed documents:', error)
      set({ loading: false })
    }
  },

  restoreDocument: async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({ is_deleted: false, deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .select()
        .single()

      if (error) throw error

      const { trashedDocuments, documents } = get()
      const updatedTrash = trashedDocuments.filter(doc => doc.id !== documentId)
      set({ trashedDocuments: updatedTrash, documents: [data, ...documents] })
    } catch (error) {
      console.error('Error restoring document:', error)
    }
  },

  permanentDeleteDocument: async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      const { trashedDocuments } = get()
      const updatedTrash = trashedDocuments.filter(doc => doc.id !== documentId)
      set({ trashedDocuments: updatedTrash })
    } catch (error) {
      console.error('Error permanently deleting document:', error)
    }
  },
})) 