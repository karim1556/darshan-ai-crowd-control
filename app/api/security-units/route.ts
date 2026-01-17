import { NextRequest, NextResponse } from 'next/server'
import { getSecurityUnits, updateSecurityUnitStatus } from '@/lib/api'

// Default security units if DB is empty
const DEFAULT_SECURITY_UNITS = [
  { id: 'su-1', unit_name: 'Alpha Squad', personnel_count: 8, status: 'available', current_location: 'Main Gate' },
  { id: 'su-2', unit_name: 'Beta Squad', personnel_count: 6, status: 'available', current_location: 'Queue Area' },
  { id: 'su-3', unit_name: 'Gamma Squad', personnel_count: 10, status: 'busy', current_location: 'Inner Temple' },
  { id: 'su-4', unit_name: 'Delta Squad', personnel_count: 5, status: 'available', current_location: 'Exit Zone' },
  { id: 'su-5', unit_name: 'Rapid Response', personnel_count: 12, status: 'available', current_location: 'Control Room' },
]

export async function GET() {
  try {
    const units = await getSecurityUnits()
    
    // If DB has units, transform them to match expected format
    if (units && units.length > 0) {
      const formattedUnits = units.map(unit => ({
        id: unit.id,
        unit_name: unit.name,
        personnel_count: 6, // Default personnel count
        status: (unit.status || 'available').toLowerCase(),
        current_location: unit.zone || 'Patrol Area'
      }))
      return NextResponse.json(formattedUnits)
    }
    
    // Return default units if DB is empty
    return NextResponse.json(DEFAULT_SECURITY_UNITS)
  } catch (error: any) {
    console.error('Error fetching security units:', error)
    // Return default units on error
    return NextResponse.json(DEFAULT_SECURITY_UNITS)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
    }

    const result = await updateSecurityUnitStatus(id, status)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating security unit:', error)
    return NextResponse.json({ error: error.message || 'Failed to update security unit' }, { status: 500 })
  }
}
