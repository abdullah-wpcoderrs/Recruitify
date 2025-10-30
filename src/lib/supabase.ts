import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Use placeholder values during build if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Validate environment variables at runtime
if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('Supabase environment variables are not set. Some features may not work.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, error }
  }
  
  // Additional validation: check if user exists in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return { user: null, error: new Error('User profile not found') }
  }
  
  return { user, error: null }
}

// Database Types
export interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  branding: FormBranding
  is_published: boolean
  google_sheet_id?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'file'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

export interface FormBranding {
  primary_color: string
  logo_url?: string
  custom_css?: string
}

export interface FormSubmission {
  id: string
  form_id: string
  data: Record<string, unknown>
  submitted_at: string
}