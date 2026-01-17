import { type NextRequest, NextResponse } from "next/server"

// Mock real-time crowd density data
const crowdDensityMap: Record<string, number> = {
  "Main Gate": 85,
  "Inner Sanctum": 92,
  "Ritual Area": 45,
  "Prayer Hall": 70,
}

const trends: Record<string, string> = {
  "Main Gate": "increasing",
  "Inner Sanctum": "stable",
  "Ritual Area": "decreasing",
  "Prayer Hall": "increasing",
}

export async function GET(request: NextRequest) {
  try {
    // Simulate real-time density fluctuations
    const updatedDensity = Object.entries(crowdDensityMap).reduce(
      (acc, [area, density]) => {
        const variation = (Math.random() - 0.5) * 15
        const newDensity = Math.max(20, Math.min(99, density + variation))
        acc[area] = {
          density: Math.round(newDensity),
          crowdLevel: newDensity > 80 ? "Critical" : newDensity > 60 ? "High" : newDensity > 40 ? "Moderate" : "Low",
          trend: trends[area],
          timestamp: new Date().toISOString(),
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json(
      {
        success: true,
        data: updatedDensity,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch crowd density",
      },
      { status: 500 },
    )
  }
}
