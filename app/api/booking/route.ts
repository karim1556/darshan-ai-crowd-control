import { type NextRequest, NextResponse } from "next/server"

interface BookingRequest {
  name: string
  email: string
  phone: string
  date: string
  slot: string
  temple: string
}

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  date: string
  slot: string
  temple: string
  status: "confirmed" | "pending" | "cancelled"
  qrCode: string
  timestamp: string
}

// Mock bookings database
const bookings: Map<string, Booking> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()

    const bookingId = `DARSH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    const booking: Booking = {
      id: bookingId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      date: body.date,
      slot: body.slot,
      temple: body.temple,
      status: "confirmed",
      qrCode: `qr-${bookingId}`,
      timestamp: new Date().toISOString(),
    }

    bookings.set(bookingId, booking)

    console.log("[DARSHAN.AI] Booking Created:", booking)

    return NextResponse.json(
      {
        success: true,
        data: booking,
        message: "Booking confirmed! Check your email for QR code.",
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get("id")

    if (bookingId && bookings.has(bookingId)) {
      return NextResponse.json({
        success: true,
        data: bookings.get(bookingId),
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: Array.from(bookings.values()),
        count: bookings.size,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bookings",
      },
      { status: 500 },
    )
  }
}
