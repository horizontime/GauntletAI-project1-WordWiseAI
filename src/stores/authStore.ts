import { create } from 'zustand'
import { supabase, User } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at
        }
        set({ user, loading: false })
      } else {
        set({ user: null, loading: false })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at
          }
          set({ user })
        } else {
          set({ user: null })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ user: null, loading: false })
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        return { error: error.message }
      }
      
      // If user is not immediately confirmed, show success message
      if (data.user && !data.session) {
        return { success: 'Check your email for a confirmation link!' }
      }
      
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  },
})) 