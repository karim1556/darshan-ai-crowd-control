import { NextRequest, NextResponse } from 'next/server'
import { getSecurityUnits, updateSecurityUnitStatus, deploySecurityUnit, recallSecurityUnit } from '@/lib/api'

// Default security units if DB is empty
const DEFAULT_SECURITY_UNITS = [
  { id: 'su-1', unit_name: 'Alpha Squad', unit_type: 'police', personnel_count: 8, status: 'available', current_location: 'Main Gate' },
  { id: 'su-2', unit_name: 'Beta Squad', unit_type: 'barricade', personnel_count: 6, status: 'available', current_location: 'Queue Area' },
  { id: 'su-3', unit_name: 'Gamma Squad', unit_type: 'police', personnel_count: 10, status: 'busy', current_location: 'Inner Temple' },
  { id: 'su-4', unit_name: 'Delta Squad', unit_type: 'crowd-control', personnel_count: 5, status: 'available', current_location: 'Exit Zone' },
  { id: 'su-5', unit_name: 'Rapid Response', unit_type: 'police', personnel_count: 12, status: 'available', current_location: 'Control Room' },
]

export async function GET() {
  try {
    const units = await getSecurityUnits()
    
    // If DB has units, transform them to match expected format
    if (units && units.length > 0) {
      const formattedUnits = units.map((unit: any) => ({
        id: unit.id,
        unit_name: unit.name,
        unit_type: unit.unit_type || 'police',
        personnel_count: unit.personnel_count || 6,
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
    const { id, action, status, zone, personnelCount } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Handle deployment action
    if (action === 'deploy') {
      if (!zone) {
        return NextResponse.json({ error: 'Zone required for deployment' }, { status: 400 })
      }
      const result = await deploySecurityUnit(id, zone, personnelCount)
      return NextResponse.json(result)
    }

    // Handle recall action
    if (action === 'recall') {
      const result = await recallSecurityUnit(id)
      return NextResponse.json(result)
    }

    // Default: update status
    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 })
    }

    const result = await updateSecurityUnitStatus(id, status)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating security unit:', error)
    return NextResponse.json({ error: error.message || 'Failed to update security unit' }, { status: 500 })
  }
}
