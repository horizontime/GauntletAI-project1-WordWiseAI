import { create } from 'zustand'
import { supabase, Document } from '../lib/supabase'

interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  loading: boolean
  saving: boolean
  fetchDocuments: (userId: string) => Promise<void>
  createDocument: (userId: string, title?: string) => Promise<Document | null>
  loadDocument: (documentId: string) => Promise<void>
  saveDocument: (documentId: string, content: string, title?: string) => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
  setCurrentDocument: (document: Document | null) => void
  updateCurrentDocumentContent: (content: string) => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  saving: false,

  fetchDocuments: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
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
          }
        ])
        .select()
        .single()

      if (error) throw error
      
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
        .delete()
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
})) 