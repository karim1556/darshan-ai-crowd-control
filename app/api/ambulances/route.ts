import { NextRequest, NextResponse } from 'next/server'
import { getAmbulances, updateAmbulanceStatus } from '@/lib/api'

export async function GET() {
  try {
    const ambulances = await getAmbulances()
    return NextResponse.json(ambulances)
  } catch (error: any) {
    console.error('Error fetching ambulances:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch ambulances' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
    }

    const result = await updateAmbulanceStatus(id, status)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating ambulance:', error)
    return NextResponse.json({ error: error.message || 'Failed to update ambulance' }, { status: 500 })
  }
}
