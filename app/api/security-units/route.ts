import { NextRequest, NextResponse } from 'next/server'
import { getSecurityUnits, updateSecurityUnitStatus } from '@/lib/api'

export async function GET() {
  try {
    const units = await getSecurityUnits()
    return NextResponse.json(units)
  } catch (error: any) {
    console.error('Error fetching security units:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch security units' }, { status: 500 })
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
