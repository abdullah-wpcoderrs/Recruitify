// Type for JSONB fields
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          title: string
          description: string | null
          fields: Json
          branding: Json
          is_published: boolean
          total_views: number
          google_sheet_id: string | null
          google_sheet_url: string | null
          google_sheet_last_sync?: string | null  // Optional - may not exist in database yet
          custom_slug?: string | null  // Optional - may not exist in database yet
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          fields?: Json
          branding?: Json
          is_published?: boolean
          total_views?: number
          google_sheet_id?: string | null
          google_sheet_url?: string | null
          google_sheet_last_sync?: string | null
          custom_slug?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          fields?: Json
          branding?: Json
          is_published?: boolean
          total_views?: number
          google_sheet_id?: string | null
          google_sheet_url?: string | null
          google_sheet_last_sync?: string | null
          custom_slug?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      form_submissions: {
        Row: {
          id: string
          form_id: string
          data: Json
          submitted_at: string
          completion_time_seconds: number | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          form_id: string
          data: Json
          submitted_at?: string
          completion_time_seconds?: number | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          form_id?: string
          data?: Json
          submitted_at?: string
          completion_time_seconds?: number | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      form_views: {
        Row: {
          id: string
          form_id: string
          viewed_at: string
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          form_id: string
          viewed_at?: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          form_id?: string
          viewed_at?: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          session_id?: string | null
        }
      }
      form_files: {
        Row: {
          id: string
          form_id: string
          field_id: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          public_url: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          field_id: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          public_url: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          field_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          storage_path?: string
          public_url?: string
          uploaded_by?: string
          created_at?: string
        }
      }
    }
  }
}