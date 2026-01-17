import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const hospitals = [
      {
        id: "hosp-001",
        name: "Central Medical Hospital",
        distance: 2.3,
        capacity: 85,
        emergencyUnit: true,
        phone: "+91-9876543210",
        address: "Varanasi, Uttar Pradesh",
        specialties: ["Cardiac", "Trauma", "Neurology"],
      },
      {
        id: "hosp-002",
        name: "Trauma Care Center",
        distance: 1.8,
        capacity: 95,
        emergencyUnit: true,
        phone: "+91-9876543211",
        address: "Varanasi, Uttar Pradesh",
        specialties: ["Trauma", "Orthopedic", "General Surgery"],
      },
      {
        id: "hosp-003",
        name: "City General Hospital",
        distance: 3.5,
        capacity: 60,
        emergencyUnit: false,
        phone: "+91-9876543212",
        address: "Varanasi, Uttar Pradesh",
        specialties: ["General Medicine", "Pediatrics"],
      },
    ]

    return NextResponse.json(
      {
        success: true,
        data: hospitals,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch hospital data",
      },
      { status: 500 },
    )
  }
}
