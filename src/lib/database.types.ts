export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          model: string
          persona_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          model: string
          persona_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          model?: string
          persona_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
      personas: {
        Row: {
          id: string
          user_id: string
          name: string
          avatar_url: string
          system_prompt: string
          description: string
          model: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          avatar_url: string
          system_prompt: string
          description: string
          model: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          avatar_url?: string
          system_prompt?: string
          description?: string
          model?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      persona_likes: {
        Row: {
          id: string
          persona_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          persona_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          persona_id?: string
          user_id?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          default_model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_model: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_model?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}