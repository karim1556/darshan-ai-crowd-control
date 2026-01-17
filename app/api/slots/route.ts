import { NextRequest, NextResponse } from 'next/server'
import { getSlots, createSlot, updateSlot, toggleSlotLock } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const slots = await getSlots(date)
    return NextResponse.json(slots)
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, startTime, endTime, maxCapacity } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const slot = await createSlot({
      date,
      start_time: startTime,
      end_time: endTime,
      max_capacity: maxCapacity || 500,
      booked_count: 0,
      locked: false
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (error: any) {
    console.error('Error creating slot:', error)
    return NextResponse.json({ error: error.message || 'Failed to create slot' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Slot ID required' }, { status: 400 })
    }

    let result
    if (action === 'toggle-lock') {
      result = await toggleSlotLock(id)
    } else {
      result = await updateSlot(id, updates)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating slot:', error)
    return NextResponse.json({ error: error.message || 'Failed to update slot' }, { status: 500 })
  }
}
