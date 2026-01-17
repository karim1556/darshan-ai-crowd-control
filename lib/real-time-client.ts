// Client-side real-time data fetching utility
export async function fetchCrowdDensity() {
  try {
    const response = await fetch("/api/crowd-density")
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch crowd density:", error)
    return null
  }
}

export async function fetchActiveSOS() {
  try {
    const response = await fetch("/api/sos")
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch SOS cases:", error)
    return null
  }
}

export async function createSOS(sosData: {
  pilgramId: string
  location: string
  type: string
  description: string
}) {
  try {
    const response = await fetch("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sosData),
    })
    return await response.json()
  } catch (error) {
    console.error("Failed to create SOS:", error)
    return null
  }
}

export async function createBooking(bookingData: {
  name: string
  email: string
  phone: string
  date: string
  slot: string
  temple: string
}) {
  try {
    const response = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    })
    return await response.json()
  } catch (error) {
    console.error("Failed to create booking:", error)
    return null
  }
}

export async function getAIGuidance(guidance: {
  currentLocation: string
  destination: string
  crowdLevel: string
  preferences?: string[]
}) {
  try {
    const response = await fetch("/api/ai-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guidance),
    })
    return await response.json()
  } catch (error) {
    console.error("Failed to get AI guidance:", error)
    return null
  }
}

export async function reportIncident(incident: {
  type: string
  location: string
  severity: string
  description: string
  reportedBy: string
}) {
  try {
    const response = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident),
    })
    return await response.json()
  } catch (error) {
    console.error("Failed to report incident:", error)
    return null
  }
}

export async function getHospitalCapacity() {
  try {
    const response = await fetch("/api/hospital-capacity")
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch hospital data:", error)
    return null
  }
}

export async function getAnalytics(date?: string) {
  try {
    const url = new URL("/api/analytics", window.location.origin)
    if (date) url.searchParams.append("date", date)
    const response = await fetch(url.toString())
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return null
  }
}

// Setup polling for real-time updates
export function setupRealtimePolling(callback: (data: any) => void, endpoint: string, intervalMs = 3000) {
  const pollFn = async () => {
    const data = await fetch(endpoint).then((r) => r.json())
    callback(data)
  }

  pollFn() // Initial call
  return setInterval(pollFn, intervalMs)
}
