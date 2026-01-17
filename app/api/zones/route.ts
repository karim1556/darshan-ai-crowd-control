import { NextRequest, NextResponse } from 'next/server'
import { getZoneStats, updateZoneStats, simulateCrowdFlow } from '@/lib/api'

// Define temple zones with capacities
const TEMPLE_ZONES = [
  { id: 'zone-gate', zone_name: 'Main Gate Area', capacity: 2000 },
  { id: 'zone-queue', zone_name: 'Queue Zone', capacity: 2500 },
  { id: 'zone-inner', zone_name: 'Inner Sanctum', capacity: 1500 },
  { id: 'zone-exit', zone_name: 'Exit Corridor', capacity: 1800 },
]

export async function GET() {
  try {
    // Simulate crowd flow on each poll
    await simulateCrowdFlow()
    const stats = await getZoneStats()
    
    // Transform zone_stats into proper zone array with names
    const zones = TEMPLE_ZONES.map((zone, index) => {
      const counts = [
        stats?.gate_count ?? 0,
        stats?.queue_count ?? 0,
        stats?.inner_count ?? 0,
        stats?.exit_count ?? 0
      ]
      const currentCount = counts[index] ?? 0
      const percentage = zone.capacity > 0 ? (currentCount / zone.capacity) * 100 : 0
      
      let crowdLevel = 'Low'
      if (percentage >= 90) crowdLevel = 'Critical'
      else if (percentage >= 70) crowdLevel = 'High'
      else if (percentage >= 50) crowdLevel = 'Medium'
      
      return {
        id: zone.id,
        zone_name: zone.zone_name,
        current_count: currentCount,
        capacity: zone.capacity,
        crowd_level: crowdLevel,
        entry_rate: Math.floor(Math.random() * 50) + 20,
        exit_rate: Math.floor(Math.random() * 40) + 15
      }
    })
    
    return NextResponse.json(zones)
  } catch (error: any) {
    console.error('Error fetching zone stats:', error)
    // Return default zones on error
    return NextResponse.json(TEMPLE_ZONES.map(z => ({
      ...z,
      current_count: 0,
      crowd_level: 'Low',
      entry_rate: 0,
      exit_rate: 0
    })))
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await updateZoneStats(body)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating zone stats:', error)
    return NextResponse.json({ error: error.message || 'Failed to update zone stats' }, { status: 500 })
  }
}
