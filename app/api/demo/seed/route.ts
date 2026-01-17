import { NextResponse } from 'next/server'
import { seedDemoData } from '@/lib/api'

export async function POST() {
  try {
    const result = await seedDemoData()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error seeding demo data:', error)

    // Helpful handling for missing table schema in Supabase (PostgREST error PGRST205)
    if (error?.code === 'PGRST205' || (error?.message && error.message.includes("Could not find the table 'public."))) {
      return NextResponse.json({
        error: "Database schema not found",
        message: error.message || "Supabase could not find required tables (e.g. 'slots').",
        hint: error.hint || "Run the provided supabase-schema.sql in your Supabase project's SQL editor.",
        instructions: [
          "1. Open your Supabase project dashboard at https://supabase.com/dashboard",
          "2. Navigate to SQL Editor",
          "3. Copy the contents of 'supabase-schema.sql' from this repository",
          "4. Paste and run the SQL to create all required tables",
          "5. Retry seeding demo data"
        ]
      }, { status: 500 })
    }

    return NextResponse.json({ error: error.message || 'Failed to seed demo data' }, { status: 500 })
  }
}
