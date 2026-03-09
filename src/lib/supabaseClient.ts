import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  display_name: string | null
  role: 'root' | 'teacher' | 'student'
  org: string | null
  class: string | null
  phone: string | null
  emergency_contacts: any
  is_verified: boolean
  created_at: string
}

export type Report = {
  id: string
  reporter_id: string | null
  reporter_secret: string | null
  is_anonymous: boolean
  title: string
  description: string
  category: 'legal' | 'emotional' | 'medical' | 'other'
  status: 'new' | 'triaged' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'emergency'
  assigned_to: string | null
  teacher_owner: string | null
  location: any
  metadata: any
  created_at: string
  updated_at: string
}

export type Evidence = {
  id: string
  report_id: string
  storage_path: string
  file_type: string
  file_size: number
  encrypted: boolean
  encryption_meta: any
  uploaded_by: string | null
  created_at: string
}

export type Appointment = {
  id: string
  user_id: string
  teacher_id: string
  start_time: string
  end_time: string
  status: 'booked' | 'completed' | 'canceled'
  created_at: string
}
