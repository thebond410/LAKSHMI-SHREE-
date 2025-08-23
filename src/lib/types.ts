
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      efficiency_records: {
        Row: {
          id: string
          created_at: string
          date: string
          time: string
          shift: "Day" | "Night"
          machine_number: string
          weft_meter: number
          stops: number
          total_time: string
          run_time: string
        }
        Insert: {
          id?: string
          created_at?: string
          date: string
          time: string
          shift: "Day" | "Night"
          machine_number: string
          weft_meter: number
          stops: number
          total_time: string
          run_time: string
        }
        Update: {
          id?: string
          created_at?: string
          date?: string
          time?: string
          shift?: "Day" | "Night"
          machine_number?: string
          weft_meter?: number
          stops?: number
          total_time?: string
          run_time?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          total_machines: number | null
          low_efficiency_threshold: number | null
          gemini_api_key: string | null
          whatsapp_number: string | null
          whatsapp_message_template: string | null
        }
        Insert: {
          id?: 1
          total_machines?: number | null
          low_efficiency_threshold?: number | null
          gemini_api_key?: string | null
          whatsapp_number?: string | null
          whatsapp_message_template?: string | null
        }
        Update: {
          id?: 1
          total_machines?: number | null
          low_efficiency_threshold?: number | null
          gemini_api_key?: string | null
          whatsapp_number?: string | null
          whatsapp_message_template?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type EfficiencyRecord = Database['public']['Tables']['efficiency_records']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
