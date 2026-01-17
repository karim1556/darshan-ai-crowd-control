import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date")

    const analytics = {
      date: dateParam || new Date().toISOString().split("T")[0],
      totalPilgrims: 7850,
      avgWaitTime: 23,
      peakHour: "10:00 AM",
      sosIncidents: 4,
      medicalEmergencies: 2,
      lostPersonReports: 1,
      areaDistribution: {
        "Main Gate": 1850,
        "Inner Sanctum": 2800,
        "Ritual Area": 1200,
        "Prayer Hall": 2000,
      },
      hourlyData: [
        { hour: "6 AM", pilgrims: 200, avgWait: 5 },
        { hour: "8 AM", pilgrims: 1200, avgWait: 10 },
        { hour: "10 AM", pilgrims: 3500, avgWait: 45 },
        { hour: "12 PM", pilgrims: 2800, avgWait: 35 },
        { hour: "2 PM", pilgrims: 1500, avgWait: 15 },
        { hour: "4 PM", pilgrims: 900, avgWait: 8 },
        { hour: "6 PM", pilgrims: 450, avgWait: 3 },
      ],
      sosBreakdown: {
        medical: 2,
        lostPerson: 1,
        crowdControl: 1,
      },
    }

    return NextResponse.json(
      {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics",
      },
      { status: 500 },
    )
  }
}
