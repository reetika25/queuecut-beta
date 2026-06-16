import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  patients: {
    id: string
    email: string
    name: string
    phone: string
    created_at: string
  }
  clinics: {
    id: string
    email: string
    name: string
    address: string
    specialty: string
    created_at: string
  }
  doctors: {
    id: string
    clinic_id: string
    name: string
    specialty: string
    available: boolean
    created_at: string
  }
  tokens: {
    id: string
    patient_id: string
    clinic_id: string
    doctor_id: string
    token_number: number
    status: 'waiting' | 'active' | 'completed' | 'skipped'
    booked_at: string
    called_at: string | null
    completed_at: string | null
  }
}
