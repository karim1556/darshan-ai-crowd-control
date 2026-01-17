import { type NextRequest, NextResponse } from "next/server"
import { 
  createBooking, 
  getBookingByBookingId, 
  getAllBookings,
  checkInBooking,
  cancelBooking
} from "@/lib/api"

interface BookingRequest {
  name: string
  email: string
  phone: string
  date: string
  slot: string
  slotId?: string
  membersCount?: number
  priorityType?: 'normal' | 'elderly' | 'disabled' | 'women-with-children'
  temple?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.date || (!body.slot && !body.slotId)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, date, and slot/slotId" },
        { status: 400 }
      )
    }

    const booking = await createBooking({
      userName: body.name,
      userEmail: body.email,
      userPhone: body.phone,
      date: body.date,
      slotId: body.slotId || body.slot,
      membersCount: body.membersCount || 1,
      priorityType: body.priorityType || 'normal'
    })

    console.log("[DARSHAN.AI] Booking Created:", booking.booking_id)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: booking.booking_id,
          bookingId: booking.booking_id,
          name: booking.user_name,
          email: booking.user_email,
          phone: booking.user_phone,
          date: booking.date,
          slot: booking.slot?.start_time ? `${booking.slot.start_time}-${booking.slot.end_time}` : booking.slot_id,
          slotId: booking.slot_id,
          gate: booking.gate,
          priorityType: booking.priority_type,
          membersCount: booking.members_count,
          status: booking.status.toLowerCase(),
          qrCode: `qr-${booking.booking_id}`,
          timestamp: booking.created_at,
        },
        message: "Booking confirmed! Your QR code is ready.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[DARSHAN.AI] Booking Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create booking",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get("id")

    if (bookingId) {
      const booking = await getBookingByBookingId(bookingId)
      if (booking) {
        return NextResponse.json({
          success: true,
          data: {
            id: booking.booking_id,
            bookingId: booking.booking_id,
            name: booking.user_name,
            email: booking.user_email,
            phone: booking.user_phone,
            date: booking.date,
            slot: booking.slot?.start_time ? `${booking.slot.start_time}-${booking.slot.end_time}` : booking.slot_id,
            slotId: booking.slot_id,
            slotDetails: booking.slot,
            gate: booking.gate,
            priorityType: booking.priority_type,
            membersCount: booking.members_count,
            status: booking.status.toLowerCase(),
            qrCode: `qr-${booking.booking_id}`,
            checkedInAt: booking.checked_in_at,
            timestamp: booking.created_at,
          },
        })
      }
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    const bookings = await getAllBookings(100)
    return NextResponse.json(
      {
        success: true,
        data: bookings.map(b => ({
          id: b.booking_id,
          bookingId: b.booking_id,
          name: b.user_name,
          email: b.user_email,
          date: b.date,
          slot: b.slot?.start_time ? `${b.slot.start_time}-${b.slot.end_time}` : b.slot_id,
          gate: b.gate,
          priorityType: b.priority_type,
          membersCount: b.members_count,
          status: b.status.toLowerCase(),
          timestamp: b.created_at,
        })),
        count: bookings.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (error: any) {
    console.error("[DARSHAN.AI] Fetch Bookings Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch bookings",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, action } = body

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID required" },
        { status: 400 }
      )
    }

    let result
    if (action === 'check-in') {
      result = await checkInBooking(bookingId)
    } else if (action === 'cancel') {
      result = await cancelBooking(bookingId)
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'check-in' or 'cancel'" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: action === 'check-in' ? 'Check-in successful!' : 'Booking cancelled'
    })
  } catch (error: any) {
    console.error("[DARSHAN.AI] Update Booking Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
      { status: 500 }
    )
  }
}
