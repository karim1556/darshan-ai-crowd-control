import { NextRequest, NextResponse } from 'next/server'
import { getSlots, createSlot, updateSlot, toggleSlotLock } from '@/lib/api'

// Default slots for when DB is empty
function generateDefaultSlots(date: string) {
  const slots = []
  const times = [
    { start: '06:00', end: '08:00' },
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
    { start: '18:00', end: '20:00' },
  ]
  
  for (let i = 0; i < times.length; i++) {
    slots.push({
      id: `slot-${i + 1}`,
      date: date,
      start_time: times[i].start,
      end_time: times[i].end,
      capacity: 500,
      max_capacity: 500,
      booked_count: Math.floor(Math.random() * 300) + 50,
      locked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  return slots
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const slots = await getSlots(date)
    
    // If no slots found, return default slots
    if (!slots || slots.length === 0) {
      return NextResponse.json(generateDefaultSlots(date))
    }
    
    // Ensure all slots have required fields
    const formattedSlots = slots.map(slot => ({
      ...slot,
      capacity: slot.max_capacity || slot.capacity || 500,
      booked_count: slot.booked_count || 0,
      locked: slot.locked || false
    }))
    
    return NextResponse.json(formattedSlots)
  } catch (error) {
    console.error('Error fetching slots:', error)
    // Return defaults on error
    const date = new Date().toISOString().split('T')[0]
    return NextResponse.json(generateDefaultSlots(date))
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
