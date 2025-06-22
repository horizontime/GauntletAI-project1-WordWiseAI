/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  /** Indicates if the document has been moved to Trash */
  is_deleted: boolean
  /** Timestamp (ISO string) when the document was moved to Trash. Null when not deleted. */
  deleted_at: string | null
  /** Number of suggestions that have been applied to this document */
  suggestions_applied: number
}

export interface DocumentVersion {
  id: string
  document_id: string
  user_id: string
  title: string
  content: string
  created_at: string
} 