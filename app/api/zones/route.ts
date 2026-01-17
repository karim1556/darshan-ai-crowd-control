import { NextRequest, NextResponse } from 'next/server'
import { getZoneStats, updateZoneStats, simulateCrowdFlow } from '@/lib/api'

export async function GET() {
  try {
    // Simulate crowd flow on each poll
    await simulateCrowdFlow()
    const stats = await getZoneStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching zone stats:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch zone stats' }, { status: 500 })
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
