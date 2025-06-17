import { create } from 'zustand'
import { supabase, User } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateEmail: (currentPassword: string, newEmail: string) => Promise<{ error?: string; success?: string }>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string; success?: string }>
  deleteAccount: () => Promise<void>
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

  updateEmail: async (currentPassword: string, newEmail: string) => {
    const { user } = get()
    if (!user) return { error: 'User not signed in' }

    try {
      // Re-authenticate user to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        return { error: 'Current password is incorrect' }
      }

      const { data, error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) {
        return { error: error.message }
      }

      if (data?.user) {
        // Update local store with new email (may be null until email confirmed)
        set({ user: { ...user, email: data.user?.email || newEmail } })
      }

      return { success: 'We\'ve sent a confirmation link to your new email address. Please confirm to complete the update.' }
    } catch (error) {
      return { error: 'Unable to update email at this time.' }
    }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const { user } = get()
    if (!user) return { error: 'User not signed in' }

    try {
      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        return { error: 'Current password is incorrect' }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        return { error: error.message }
      }

      return { success: 'Password updated successfully.' }
    } catch (error) {
      return { error: 'Unable to update password at this time.' }
    }
  },

  deleteAccount: async () => {
    // TODO: Implement actual account deletion using a backend function
    try {
      console.warn('deleteAccount called — implement backend deletion logic here.')
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  },
})) 