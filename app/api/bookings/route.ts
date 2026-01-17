import { NextRequest, NextResponse } from 'next/server'
import { 
  createBooking, 
  getBookingByBookingId, 
  getAllBookings, 
  getBookingsByDate,
  getBookingsByUserEmail,
  checkInBooking, 
  cancelBooking,
  incrementZoneStat
} from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const date = searchParams.get('date')
    const userEmail = searchParams.get('userEmail')

    if (bookingId) {
      const booking = await getBookingByBookingId(bookingId)
      return NextResponse.json(booking)
    }

    // Filter by user email for pilgrim dashboard
    if (userEmail) {
      const bookings = await getBookingsByUserEmail(userEmail)
      return NextResponse.json(bookings)
    }

    if (date) {
      const bookings = await getBookingsByDate(date)
      return NextResponse.json(bookings)
    }

    const bookings = await getAllBookings()
    return NextResponse.json(bookings)
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'checkin') {
      if (!data.bookingId) {
        return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
      }
      const result = await checkInBooking(data.bookingId)
      
      // If zone is specified, update that zone's count
      if (data.zone) {
        const zoneFieldMap: Record<string, 'gate_count' | 'queue_count' | 'inner_count' | 'exit_count'> = {
          'zone-gate': 'gate_count',
          'zone-queue': 'queue_count',
          'zone-inner': 'inner_count',
          'zone-exit': 'exit_count',
        }
        const zoneField = zoneFieldMap[data.zone]
        if (zoneField) {
          await incrementZoneStat(zoneField, result.members_count || 1)
        }
      }
      
      return NextResponse.json(result)
    }

    if (action === 'cancel') {
      if (!data.bookingId) {
        return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
      }
      const result = await cancelBooking(data.bookingId)
      return NextResponse.json(result)
    }

    // Create new booking
    const { userName, userEmail, userPhone, date, slotId, membersCount, priorityType, userId } = data

    if (!userName || !date || !slotId || !membersCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking = await createBooking({
      userName,
      userEmail,
      userPhone,
      date,
      slotId,
      membersCount: Number(membersCount),
      priorityType: priorityType || 'normal',
      userId
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error('Error processing booking:', error)
    return NextResponse.json({ error: error.message || 'Failed to process booking' }, { status: 500 })
  }
}
