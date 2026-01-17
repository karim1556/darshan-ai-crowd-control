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
      slots: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          max_capacity: number
          booked_count: number
          locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          start_time: string
          end_time: string
          max_capacity: number
          booked_count?: number
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          start_time?: string
          end_time?: string
          max_capacity?: number
          booked_count?: number
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_id: string
          user_name: string
          user_email: string | null
          user_phone: string | null
          date: string
          slot_id: string
          members_count: number
          priority_type: 'normal' | 'elderly' | 'disabled' | 'women-with-children'
          gate: 'Gate A' | 'Gate B' | 'Gate C'
          status: 'Booked' | 'Checked-In' | 'Expired' | 'Cancelled'
          created_at: string
          checked_in_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          user_name: string
          user_email?: string | null
          user_phone?: string | null
          date: string
          slot_id: string
          members_count: number
          priority_type?: 'normal' | 'elderly' | 'disabled' | 'women-with-children'
          gate?: 'Gate A' | 'Gate B' | 'Gate C'
          status?: 'Booked' | 'Checked-In' | 'Expired' | 'Cancelled'
          created_at?: string
          checked_in_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          user_name?: string
          user_email?: string | null
          user_phone?: string | null
          date?: string
          slot_id?: string
          members_count?: number
          priority_type?: 'normal' | 'elderly' | 'disabled' | 'women-with-children'
          gate?: 'Gate A' | 'Gate B' | 'Gate C'
          status?: 'Booked' | 'Checked-In' | 'Expired' | 'Cancelled'
          created_at?: string
          checked_in_at?: string | null
        }
      }
      zone_stats: {
        Row: {
          id: string
          gate_count: number
          queue_count: number
          inner_count: number
          exit_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          gate_count?: number
          queue_count?: number
          inner_count?: number
          exit_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          gate_count?: number
          queue_count?: number
          inner_count?: number
          exit_count?: number
          updated_at?: string
        }
      }
      sos_requests: {
        Row: {
          id: string
          user_id: string
          booking_id: string | null
          type: 'medical' | 'security' | 'lost-child' | 'crowd-risk'
          severity: 'critical' | 'high' | 'medium' | 'low'
          lat: number
          lng: number
          note: string | null
          status: 'Pending' | 'Assigned' | 'Enroute' | 'Resolved'
          assigned_to: string | null
          eta: number | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          booking_id?: string | null
          type: 'medical' | 'security' | 'lost-child' | 'crowd-risk'
          severity?: 'critical' | 'high' | 'medium' | 'low'
          lat: number
          lng: number
          note?: string | null
          status?: 'Pending' | 'Assigned' | 'Enroute' | 'Resolved'
          assigned_to?: string | null
          eta?: number | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string | null
          type?: 'medical' | 'security' | 'lost-child' | 'crowd-risk'
          severity?: 'critical' | 'high' | 'medium' | 'low'
          lat?: number
          lng?: number
          note?: string | null
          status?: 'Pending' | 'Assigned' | 'Enroute' | 'Resolved'
          assigned_to?: string | null
          eta?: number | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      ambulances: {
        Row: {
          id: string
          name: string
          status: 'Available' | 'Busy' | 'Offline'
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'Available' | 'Busy' | 'Offline'
          location?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'Available' | 'Busy' | 'Offline'
          location?: string
          created_at?: string
        }
      }
      security_units: {
        Row: {
          id: string
          name: string
          status: 'Available' | 'Busy' | 'Offline'
          zone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'Available' | 'Busy' | 'Offline'
          zone?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'Available' | 'Busy' | 'Offline'
          zone?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'pilgrim' | 'admin' | 'police' | 'medical'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'pilgrim' | 'admin' | 'police' | 'medical'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'pilgrim' | 'admin' | 'police' | 'medical'
          created_at?: string
          updated_at?: string
        }
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
  }
}

// Helper types
export type Slot = Database['public']['Tables']['slots']['Row']
export type SlotInsert = Database['public']['Tables']['slots']['Insert']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type ZoneStats = Database['public']['Tables']['zone_stats']['Row']
export type SOSRequest = Database['public']['Tables']['sos_requests']['Row']
export type SOSInsert = Database['public']['Tables']['sos_requests']['Insert']
export type Ambulance = Database['public']['Tables']['ambulances']['Row']
export type SecurityUnit = Database['public']['Tables']['security_units']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
