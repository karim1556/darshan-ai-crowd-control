import { NextRequest, NextResponse } from 'next/server'
import { getAmbulances, updateAmbulanceStatus } from '@/lib/api'

// Default ambulances if DB is empty
const DEFAULT_AMBULANCES = [
  { id: 'amb-1', unit_name: 'Ambulance A1', paramedic_count: 3, status: 'available', current_location: 'Medical Center' },
  { id: 'amb-2', unit_name: 'Ambulance A2', paramedic_count: 2, status: 'available', current_location: 'Gate A Station' },
  { id: 'amb-3', unit_name: 'Ambulance B1', paramedic_count: 3, status: 'deployed', current_location: 'Queue Area' },
  { id: 'amb-4', unit_name: 'Ambulance B2', paramedic_count: 2, status: 'available', current_location: 'Exit Zone' },
  { id: 'amb-5', unit_name: 'Critical Care Unit', paramedic_count: 4, status: 'available', current_location: 'Hospital Link' },
]

export async function GET() {
  try {
    const ambulances = await getAmbulances()
    
    // If DB has ambulances, transform them to match expected format
    if (ambulances && ambulances.length > 0) {
      const formattedAmbulances = ambulances.map(amb => ({
        id: amb.id,
        unit_name: amb.name,
        paramedic_count: 3, // Default paramedic count
        status: (amb.status || 'available').toLowerCase(),
        current_location: amb.location || 'Medical Center'
      }))
      return NextResponse.json(formattedAmbulances)
    }
    
    // Return default ambulances if DB is empty
    return NextResponse.json(DEFAULT_AMBULANCES)
  } catch (error: any) {
    console.error('Error fetching ambulances:', error)
    // Return default ambulances on error
    return NextResponse.json(DEFAULT_AMBULANCES)
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
