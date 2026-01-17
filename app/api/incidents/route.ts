import { type NextRequest, NextResponse } from "next/server"

interface IncidentReport {
  type: string
  location: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  reportedBy: string
}

interface Incident {
  id: string
  type: string
  location: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "responded" | "resolved"
  assignedUnit: string
  timestamp: string
}

// Mock incidents database
const incidents: Map<string, Incident> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body: IncidentReport = await request.json()

    const incidentId = `INC-${Date.now()}`
    const incident: Incident = {
      id: incidentId,
      type: body.type,
      location: body.location,
      severity: body.severity,
      status: "active",
      assignedUnit: assignNearestUnit(body.location),
      timestamp: new Date().toISOString(),
    }

    incidents.set(incidentId, incident)

    // Alert police and medical teams
    console.log("[DARSHAN.AI] INCIDENT ALERT:", incident)

    return NextResponse.json(
      {
        success: true,
        data: incident,
        message: "Incident reported. Units dispatched.",
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to report incident",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const statusFilter = request.nextUrl.searchParams.get("status")

    let result = Array.from(incidents.values())
    if (statusFilter) {
      result = result.filter((inc) => inc.status === statusFilter)
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        count: result.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch incidents",
      },
      { status: 500 },
    )
  }
}

function assignNearestUnit(location: string): string {
  // Simple location-based unit assignment
  const unitMap: Record<string, string> = {
    "Main Gate": "Unit-3",
    "Inner Sanctum": "Unit-5",
    "Prayer Hall": "Unit-2",
    "Ritual Area": "Unit-1",
  }
  return unitMap[location] || "Unit-Dispatch"
}
