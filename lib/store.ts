// In-memory database for DARSHAN.AI
export interface Slot {
  id: string
  date: string
  startTime: string
  endTime: string
  maxCapacity: number
  bookedCount: number
  locked: boolean
}

export interface Booking {
  id: string
  bookingId: string
  userName: string
  date: string
  slotId: string
  membersCount: number
  priorityType: "normal" | "elderly" | "disabled" | "women-with-children"
  gate: "Gate A" | "Gate B" | "Gate C"
  status: "Booked" | "Checked-In" | "Expired" | "Cancelled"
  createdAt: Date
  checkedInAt?: Date
}

export interface ZoneStats {
  gateCount: number
  queueCount: number
  innerCount: number
  exitCount: number
  updatedAt: Date
}

export interface SOSRequest {
  id: string
  userId: string
  type: "medical" | "security" | "lost-child" | "crowd-risk"
  severity: "critical" | "high" | "medium" | "low"
  lat: number
  lng: number
  note?: string
  status: "Pending" | "Assigned" | "Enroute" | "Resolved"
  assignedTo?: string
  createdAt: Date
  resolvedAt?: Date
  eta?: number // minutes
}

// Global in-memory store
let slots: Slot[] = []
const bookings: Booking[] = []
let zoneStats: ZoneStats = {
  gateCount: 0,
  queueCount: 0,
  innerCount: 0,
  exitCount: 0,
  updatedAt: new Date(),
}
let sosRequests: SOSRequest[] = []
let ambulances: { id: string; status: "Available" | "Busy"; location: string }[] = []

// Initialize demo data
export function initializeDemoData() {
  const today = new Date().toISOString().split("T")[0]

  // Create slots for today
  slots = [
    {
      id: "slot-1",
      date: today,
      startTime: "06:00",
      endTime: "08:00",
      maxCapacity: 500,
      bookedCount: 245,
      locked: false,
    },
    {
      id: "slot-2",
      date: today,
      startTime: "08:00",
      endTime: "10:00",
      maxCapacity: 500,
      bookedCount: 480,
      locked: false,
    },
    {
      id: "slot-3",
      date: today,
      startTime: "10:00",
      endTime: "12:00",
      maxCapacity: 500,
      bookedCount: 500,
      locked: true,
    },
    {
      id: "slot-4",
      date: today,
      startTime: "12:00",
      endTime: "14:00",
      maxCapacity: 500,
      bookedCount: 350,
      locked: false,
    },
    {
      id: "slot-5",
      date: today,
      startTime: "14:00",
      endTime: "16:00",
      maxCapacity: 500,
      bookedCount: 150,
      locked: false,
    },
    {
      id: "slot-6",
      date: today,
      startTime: "16:00",
      endTime: "18:00",
      maxCapacity: 500,
      bookedCount: 400,
      locked: false,
    },
  ]

  // Create sample bookings
  const gates = ["Gate A", "Gate B", "Gate C"] as const
  const priorities = ["normal", "elderly", "disabled", "women-with-children"] as const

  for (let i = 0; i < 10; i++) {
    bookings.push({
      id: `booking-${i}`,
      bookingId: `BK${Date.now()}-${i}`,
      userName: `Devotee ${i + 1}`,
      date: today,
      slotId: `slot-${Math.floor(Math.random() * 6) + 1}`,
      membersCount: Math.floor(Math.random() * 5) + 1,
      priorityType: priorities[Math.floor(Math.random() * priorities.length)],
      gate: gates[Math.floor(Math.random() * gates.length)],
      status: i < 3 ? "Checked-In" : "Booked",
      createdAt: new Date(Date.now() - Math.random() * 3600000),
      checkedInAt: i < 3 ? new Date(Date.now() - Math.random() * 1800000) : undefined,
    })
  }

  // Initialize zone stats
  zoneStats = {
    gateCount: 245,
    queueCount: 380,
    innerCount: 450,
    exitCount: 200,
    updatedAt: new Date(),
  }

  // Create sample SOS requests
  sosRequests = [
    {
      id: "sos-1",
      userId: "user-1",
      type: "medical",
      severity: "high",
      lat: 13.1939,
      lng: 79.1344,
      status: "Assigned",
      assignedTo: "Ambulance A",
      createdAt: new Date(Date.now() - 600000),
      eta: 8,
    },
    {
      id: "sos-2",
      userId: "user-2",
      type: "lost-child",
      severity: "medium",
      lat: 13.1945,
      lng: 79.135,
      status: "Enroute",
      assignedTo: "Security Unit 2",
      createdAt: new Date(Date.now() - 300000),
      eta: 5,
    },
  ]

  // Initialize ambulances
  ambulances = [
    { id: "amb-1", status: "Busy", location: "Gate A" },
    { id: "amb-2", status: "Available", location: "Medical Center" },
    { id: "amb-3", status: "Available", location: "Exit Zone" },
  ]
}

// Slot operations
export function getSlots(date: string) {
  return slots.filter((s) => s.date === date)
}

export function getSlot(id: string) {
  return slots.find((s) => s.id === id)
}

// Booking operations
export function createBooking(data: Omit<Booking, "id" | "createdAt" | "status">) {
  const newBooking: Booking = {
    ...data,
    id: `booking-${Date.now()}`,
    status: "Booked",
    createdAt: new Date(),
  }
  bookings.push(newBooking)

  // Update slot booked count
  const slot = slots.find((s) => s.id === data.slotId)
  if (slot) {
    slot.bookedCount += data.membersCount
  }

  return newBooking
}

export function getBooking(bookingId: string) {
  return bookings.find((b) => b.bookingId === bookingId)
}

export function getBookingsByUser(userName: string) {
  return bookings.filter((b) => b.userName === userName)
}

export function checkInBooking(bookingId: string) {
  const booking = bookings.find((b) => b.bookingId === bookingId)
  if (!booking) throw new Error("Booking not found")
  if (booking.status !== "Booked") throw new Error("Booking already checked in")

  booking.status = "Checked-In"
  booking.checkedInAt = new Date()

  // Update zone stats
  zoneStats.gateCount += booking.membersCount
  zoneStats.queueCount = Math.max(0, zoneStats.queueCount - Math.floor(booking.membersCount * 0.3))
  zoneStats.updatedAt = new Date()

  return booking
}

export function cancelBooking(bookingId: string) {
  const booking = bookings.find((b) => b.bookingId === bookingId)
  if (!booking) throw new Error("Booking not found")
  if (booking.status !== "Booked") throw new Error("Can only cancel booked bookings")

  booking.status = "Cancelled"

  // Update slot booked count
  const slot = slots.find((s) => s.id === booking.slotId)
  if (slot) {
    slot.bookedCount = Math.max(0, slot.bookedCount - booking.membersCount)
  }

  return booking
}

export function getAllBookings() {
  return bookings
}

// Zone stats operations
export function getZoneStats() {
  return zoneStats
}

export function updateZoneStats(updates: Partial<ZoneStats>) {
  zoneStats = { ...zoneStats, ...updates, updatedAt: new Date() }
  return zoneStats
}

// Simulate crowd flow
export function simulateCrowdFlow() {
  const gate = Math.max(0, Math.min(1800, zoneStats.gateCount + Math.floor(Math.random() * 40 - 20)))
  const queue = Math.max(0, Math.min(2000, zoneStats.queueCount + Math.floor(Math.random() * 60 - 30)))
  const inner = Math.max(0, Math.min(2500, zoneStats.innerCount + Math.floor(Math.random() * 80 - 40)))
  const exit = Math.max(0, Math.min(1500, zoneStats.exitCount + Math.floor(Math.random() * 50 - 25)))

  zoneStats = {
    gateCount: gate,
    queueCount: queue,
    innerCount: inner,
    exitCount: exit,
    updatedAt: new Date(),
  }
}

// SOS operations
export function createSOSRequest(data: Omit<SOSRequest, "id" | "status" | "createdAt">) {
  const newSOS: SOSRequest = {
    ...data,
    id: `sos-${Date.now()}`,
    status: "Pending",
    createdAt: new Date(),
  }
  sosRequests.push(newSOS)
  return newSOS
}

export function getSOSRequests(filter?: { type?: string; status?: string }) {
  return sosRequests.filter((s) => {
    if (filter?.type && s.type !== filter.type) return false
    if (filter?.status && s.status !== filter.status) return false
    return true
  })
}

export function updateSOSRequest(id: string, updates: Partial<SOSRequest>) {
  const sos = sosRequests.find((s) => s.id === id)
  if (!sos) throw new Error("SOS request not found")

  Object.assign(sos, updates)
  return sos
}

export function getAmbulances() {
  return ambulances
}

export function updateAmbulance(id: string, status: "Available" | "Busy") {
  const amb = ambulances.find((a) => a.id === id)
  if (amb) amb.status = status
  return amb
}
