import { create } from 'zustand'
import { supabase, DocumentVersion } from '../lib/supabase'

interface VersionState {
  versionsByDocument: Record<string, DocumentVersion[]>
  loading: boolean
  fetchVersions: (documentId: string) => Promise<void>
  createVersion: (
    documentId: string,
    userId: string,
    title: string,
    content: string
  ) => Promise<DocumentVersion | null>
}

export const useVersionStore = create<VersionState>((set, get) => ({
  versionsByDocument: {},
  loading: false,

  fetchVersions: async (documentId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set((state) => ({
        versionsByDocument: {
          ...state.versionsByDocument,
          [documentId]: data || [],
        },
        loading: false,
      }))
    } catch (error) {
      console.error('Error fetching versions:', error)
      set({ loading: false })
    }
  },

  createVersion: async (
    documentId: string,
    userId: string,
    title: string,
    content: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .insert([
          {
            document_id: documentId,
            user_id: userId,
            title,
            content,
          },
        ])
        .select()
        .single()

      if (error) throw error

      const { versionsByDocument } = get()
      const updated = {
        ...versionsByDocument,
        [documentId]: [data, ...(versionsByDocument[documentId] || [])],
      }
      set({ versionsByDocument: updated })
      return data
    } catch (error) {
      console.error('Error creating version:', error)
      return null
    }
  },
})) 