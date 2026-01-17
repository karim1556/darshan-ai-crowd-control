import { NextRequest, NextResponse } from 'next/server'
import { 
  createBooking, 
  getBookingByBookingId, 
  getAllBookings, 
  getBookingsByDate,
  checkInBooking, 
  cancelBooking 
} from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const date = searchParams.get('date')

    if (bookingId) {
      const booking = await getBookingByBookingId(bookingId)
      return NextResponse.json(booking)
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
    const { userName, userEmail, userPhone, date, slotId, membersCount, priorityType } = data

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
      priorityType: priorityType || 'normal'
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error('Error processing booking:', error)
    return NextResponse.json({ error: error.message || 'Failed to process booking' }, { status: 500 })
  }
}
