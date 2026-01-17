import { NextResponse } from 'next/server'

export async function POST() {
  // Demo seeding is disabled in production
  return NextResponse.json({
    error: "Demo seeding is disabled",
    message: "This endpoint has been disabled for production use. Please use the Supabase dashboard to manage data."
  }, { status: 403 })
}
