import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Browser client for client-side auth
// Uses localStorage for session persistence by default
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable localStorage persistence so sessions persist across page reloads
    persistSession: true,
    // Auto refresh tokens
    autoRefreshToken: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
    // Use cookies for cross-tab session sharing
    storageKey: 'darshan-auth',
  }
})

// Server-side client (for API routes)
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'public' }
    }
  )
}
