// Chatbot Context Aggregation Service
// This service aggregates all relevant data for RAG-based responses

import { supabase } from './supabase'
import { format } from 'date-fns'

export interface TempleContext {
  crowdDensity: CrowdDensityData
  zones: ZoneData[]
  slots: SlotData[]
  bookings: BookingStats
  incidents: IncidentData[]
  facilities: FacilityInfo
  guidelines: string[]
  currentTime: string
  weatherInfo: string
  // Optional lightweight raw DB snapshot for RAG
  rawRecords?: Record<string, any[]>
}

interface CrowdDensityData {
  mainGate: { density: number; level: string; trend: string }
  innerSanctum: { density: number; level: string; trend: string }
  ritualArea: { density: number; level: string; trend: string }
  prayerHall: { density: number; level: string; trend: string }
  overallStatus: string
}

interface ZoneData {
  id: string
  name: string
  currentCount: number
  capacity: number
  crowdLevel: string
  waitTime: number
  recommendation: string
}

interface SlotData {
  id: string
  date: string
  startTime: string
  endTime: string
  available: number
  total: number
  locked: boolean
  popularityScore: number
}

interface BookingStats {
  todayTotal: number
  todayCheckedIn: number
  upcomingSlots: number
  peakHours: string[]
  leastCrowdedSlots: string[]
}

interface IncidentData {
  type: string
  severity: string
  zone: string
  status: string
  timestamp: string
}

interface FacilityInfo {
  medicalCenters: { name: string; status: string; waitTime: number }[]
  amenities: { name: string; location: string; status: string }[]
  parkingStatus: { zone: string; available: number; total: number }[]
}

// Aggregate all context for the chatbot
export async function aggregateChatbotContext(): Promise<TempleContext> {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  const [crowdDensity, zones, slots, bookingStats, incidents] = await Promise.all([
    getCrowdDensityData(),
    getZonesData(),
    getSlotsData(today),
    getBookingStats(today),
    getActiveIncidents()
  ])

  // Fetch lightweight raw records for richer RAG context (only small samples)
  const [profiles, recentIncidents, ambulances, securityUnits, recentBookings] = await Promise.all([
    getProfilesSample(),
    getIncidentReportsSample(),
    getAmbulances(),
    getSecurityUnits(),
    getBookingsSample()
  ])

  const rawRecords = {
    profiles,
    incident_reports: recentIncidents,
    ambulances,
    security_units: securityUnits,
    bookings: recentBookings
  }

  return {
    crowdDensity,
    zones,
    slots,
    bookings: bookingStats,
    incidents,
    facilities: getFacilitiesInfo(),
    guidelines: getTempleGuidelines(),
    currentTime: new Date().toISOString(),
    weatherInfo: getWeatherInfo(),
    rawRecords
  }
}

// -------- Additional lightweight DB helpers --------
async function getProfilesSample(limit = 5) {
  try {
    const { data } = await supabase.from('profiles').select('id,full_name,email,role,created_at').limit(limit)
    return data || []
  } catch (e) {
    console.error('Error fetching profiles sample', e)
    return []
  }
}

async function getIncidentReportsSample(limit = 10) {
  try {
    const { data } = await supabase.from('incident_reports').select('report_id,type,location,severity,status,created_at').order('created_at', { ascending: false }).limit(limit)
    return data || []
  } catch (e) {
    console.error('Error fetching incident reports sample', e)
    return []
  }
}

async function getAmbulances() {
  try {
    const { data } = await supabase.from('ambulances').select('*').order('created_at', { ascending: false })
    return data || []
  } catch (e) {
    console.error('Error fetching ambulances', e)
    return []
  }
}

async function getSecurityUnits() {
  try {
    const { data } = await supabase.from('security_units').select('*').order('created_at', { ascending: false })
    return data || []
  } catch (e) {
    console.error('Error fetching security units', e)
    return []
  }
}

async function getBookingsSample(limit = 8) {
  try {
    const { data } = await supabase.from('bookings').select('booking_id,user_name,date,slot_id,status,created_at').order('created_at', { ascending: false }).limit(limit)
    return data || []
  } catch (e) {
    console.error('Error fetching bookings sample', e)
    return []
  }
}

async function getCrowdDensityData(): Promise<CrowdDensityData> {
  // Simulate real-time crowd density - in production this would come from sensors/cameras
  const areas = [
    { key: 'mainGate', name: 'Main Gate', base: 75 },
    { key: 'innerSanctum', name: 'Inner Sanctum', base: 85 },
    { key: 'ritualArea', name: 'Ritual Area', base: 45 },
    { key: 'prayerHall', name: 'Prayer Hall', base: 65 }
  ]

  const trends = ['increasing', 'stable', 'decreasing']
  const result: any = {}

  for (const area of areas) {
    const variation = (Math.random() - 0.5) * 20
    const density = Math.max(15, Math.min(98, area.base + variation))
    result[area.key] = {
      density: Math.round(density),
      level: density > 80 ? 'Critical' : density > 60 ? 'High' : density > 40 ? 'Moderate' : 'Low',
      trend: trends[Math.floor(Math.random() * trends.length)]
    }
  }

  const avgDensity = Object.values(result).reduce((sum: number, area: any) => sum + area.density, 0) / 4
  result.overallStatus = avgDensity > 75 ? 'Very Crowded' : avgDensity > 50 ? 'Moderately Crowded' : 'Less Crowded'

  return result as CrowdDensityData
}

async function getZonesData(): Promise<ZoneData[]> {
  try {
    const { data: stats } = await supabase
      .from('zone_stats')
      .select('*')
      .single()

    const zones = [
      { id: 'zone-gate', name: 'Main Gate Area', capacity: 2000, field: 'gate_count' as const },
      { id: 'zone-queue', name: 'Queue Zone', capacity: 2500, field: 'queue_count' as const },
      { id: 'zone-inner', name: 'Inner Sanctum', capacity: 1500, field: 'inner_count' as const },
      { id: 'zone-exit', name: 'Exit Corridor', capacity: 1800, field: 'exit_count' as const }
    ]

    return zones.map(zone => {
      const statsRecord = stats as Record<string, unknown> | null
      const currentCount = (typeof statsRecord?.[zone.field] === 'number' ? statsRecord[zone.field] : null) as number | null 
        ?? Math.floor(Math.random() * zone.capacity * 0.7)
      const percentage = (currentCount / zone.capacity) * 100
      const waitTime = Math.round(percentage * 0.5) // Approximate wait time in minutes
      
      let crowdLevel = 'Low'
      let recommendation = 'Ideal time to visit'
      
      if (percentage >= 90) {
        crowdLevel = 'Critical'
        recommendation = 'Avoid this area, extremely crowded'
      } else if (percentage >= 70) {
        crowdLevel = 'High'
        recommendation = 'Expect significant wait times'
      } else if (percentage >= 50) {
        crowdLevel = 'Medium'
        recommendation = 'Moderate crowds, reasonable wait'
      }

      return {
        id: zone.id,
        name: zone.name,
        currentCount,
        capacity: zone.capacity,
        crowdLevel,
        waitTime,
        recommendation
      }
    })
  } catch (error) {
    console.error('Error fetching zones:', error)
    return []
  }
}

async function getSlotsData(date: string): Promise<SlotData[]> {
  try {
    const { data: slots } = await supabase
      .from('slots')
      .select('*')
      .eq('date', date)
      .order('start_time')

    if (!slots || slots.length === 0) {
      // Return default slots
      const times = [
        { start: '06:00', end: '08:00' },
        { start: '08:00', end: '10:00' },
        { start: '10:00', end: '12:00' },
        { start: '12:00', end: '14:00' },
        { start: '14:00', end: '16:00' },
        { start: '16:00', end: '18:00' },
        { start: '18:00', end: '20:00' }
      ]
      
      return times.map((time, i) => ({
        id: `slot-${i + 1}`,
        date,
        startTime: time.start,
        endTime: time.end,
        available: Math.floor(Math.random() * 300) + 100,
        total: 500,
        locked: false,
        popularityScore: Math.random()
      }))
    }

    return (slots as Array<{
      id: string
      date: string
      start_time: string
      end_time: string
      max_capacity: number
      booked_count: number
      locked: boolean
    }>).map(slot => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      available: slot.max_capacity - slot.booked_count,
      total: slot.max_capacity,
      locked: slot.locked,
      popularityScore: slot.booked_count / slot.max_capacity
    }))
  } catch (error) {
    console.error('Error fetching slots:', error)
    return []
  }
}

async function getBookingStats(date: string): Promise<BookingStats> {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', date)

    const bookingsTyped = bookings as Array<{ status: string }> | null
    const todayTotal = bookingsTyped?.length || 0
    const todayCheckedIn = bookingsTyped?.filter(b => b.status === 'Checked-In').length || 0

    return {
      todayTotal,
      todayCheckedIn,
      upcomingSlots: 7,
      peakHours: ['10:00-12:00', '16:00-18:00'],
      leastCrowdedSlots: ['06:00-08:00', '18:00-20:00']
    }
  } catch (error) {
    console.error('Error fetching booking stats:', error)
    return {
      todayTotal: 0,
      todayCheckedIn: 0,
      upcomingSlots: 7,
      peakHours: ['10:00-12:00', '16:00-18:00'],
      leastCrowdedSlots: ['06:00-08:00', '18:00-20:00']
    }
  }
}

async function getActiveIncidents(): Promise<IncidentData[]> {
  try {
    const { data: incidents } = await supabase
      .from('sos_requests')
      .select('*')
      .in('status', ['Pending', 'Assigned', 'Enroute'])
      .order('created_at', { ascending: false })
      .limit(10)

    const incidentsTyped = incidents as Array<{
      type: string
      severity: string
      lat: number
      status: string
      created_at: string
    }> | null

    return (incidentsTyped || []).map(inc => ({
      type: inc.type,
      severity: inc.severity,
      zone: `Zone ${inc.lat > 0 ? 'A' : 'B'}`,
      status: inc.status,
      timestamp: inc.created_at
    }))
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return []
  }
}

function getFacilitiesInfo(): FacilityInfo {
  return {
    medicalCenters: [
      { name: 'Main Medical Center', status: 'Available', waitTime: 5 },
      { name: 'First Aid Post - Gate A', status: 'Available', waitTime: 2 },
      { name: 'Emergency Unit', status: 'Available', waitTime: 0 }
    ],
    amenities: [
      { name: 'Drinking Water', location: 'All gates and main corridors', status: 'Available' },
      { name: 'Restrooms', location: 'Near each gate', status: 'Available' },
      { name: 'Wheelchair Service', location: 'Gate A (Priority)', status: 'Available' },
      { name: 'Lost & Found', location: 'Near Main Gate', status: 'Open' },
      { name: 'Prasad Counter', location: 'Exit area', status: 'Open' },
      { name: 'Shoe Storage', location: 'All gates', status: 'Available' }
    ],
    parkingStatus: [
      { zone: 'Main Parking', available: 150, total: 500 },
      { zone: 'VIP Parking', available: 20, total: 50 },
      { zone: 'Two-Wheeler Parking', available: 300, total: 800 }
    ]
  }
}

function getTempleGuidelines(): string[] {
  return [
    'Temple opens at 6:00 AM and closes at 9:00 PM',
    'Please arrive 15 minutes before your slot time',
    'Mobile phones must be kept on silent mode inside the temple',
    'Photography is not allowed inside the inner sanctum',
    'Dress code: Traditional or modest clothing required',
    'Footwear must be removed before entering the temple premises',
    'Priority entry available for elderly, disabled, and women with children at Gate A and B',
    'Free wheelchair service available at Gate A',
    'Medical assistance available 24/7 at the main medical center',
    'SOS button available in the app for emergencies',
    'Lost children: Report immediately at Lost & Found near Main Gate',
    'Prasad distribution available at exit area'
  ]
}

function getWeatherInfo(): string {
  // In production, this would fetch real weather data
  const conditions = ['Sunny', 'Partly Cloudy', 'Clear']
  const temp = Math.floor(Math.random() * 10) + 25 // 25-35°C
  return `${conditions[Math.floor(Math.random() * conditions.length)]}, ${temp}°C. Good conditions for temple visit.`
}

// Format context as a structured prompt for the AI
export function formatContextForAI(context: TempleContext): string {
  const { crowdDensity, zones, slots, bookings, incidents, facilities, guidelines, weatherInfo, rawRecords } = context
  
  const availableSlots = slots.filter(s => s.available > 0 && !s.locked)
  const leastCrowdedSlot = availableSlots.sort((a, b) => a.popularityScore - b.popularityScore)[0]
  const mostAvailableSlot = availableSlots.sort((a, b) => b.available - a.available)[0]
  
  const leastCrowdedZone = zones.sort((a, b) => (a.currentCount / a.capacity) - (b.currentCount / b.capacity))[0]
  const mostCrowdedZone = zones.sort((a, b) => (b.currentCount / b.capacity) - (a.currentCount / a.capacity))[0]

  // Build a compact raw DB snapshot section (small samples only)
  let rawSection = ''
  try {
    if (rawRecords && Object.keys(rawRecords).length > 0) {
      rawSection = '\n\n## RAW DATABASE SNAPSHOT (small samples):\n'
      rawSection += Object.entries(rawRecords).map(([table, rows]) => {
        const count = Array.isArray(rows) ? rows.length : 0
        const sample = Array.isArray(rows) ? rows.slice(0, 3).map(r => JSON.stringify(r)).join('\n') : ''
        return `- ${table}: ${count} rows\n${sample ? '  Sample:\n' + sample : ''}`
      }).join('\n')
    }
  } catch (e) {
    console.error('Error building raw DB snapshot section', e)
  }

  return `
=== LIVE TEMPLE STATUS (Updated: ${new Date().toLocaleTimeString()}) ===

**Overall Crowd Status:** ${crowdDensity.overallStatus}
**Weather:** ${weatherInfo}

## Current Crowd Density by Area:

## Zone-wise Details:
${zones.map(z => `- ${z.name}: ${z.currentCount}/${z.capacity} people (${z.crowdLevel}) | Wait: ~${z.waitTime} mins | ${z.recommendation}`).join('\n')}

**Best Zone Right Now:** ${leastCrowdedZone?.name} (${leastCrowdedZone?.crowdLevel}, ~${leastCrowdedZone?.waitTime} min wait)
**Avoid if possible:** ${mostCrowdedZone?.name} (${mostCrowdedZone?.crowdLevel})

## Today's Slot Availability:
${slots.map(s => `- ${s.startTime}-${s.endTime}: ${s.available}/${s.total} available ${s.locked ? '(LOCKED)' : ''}`).join('\n')}

**Recommended Slot:** ${leastCrowdedSlot ? `${leastCrowdedSlot.startTime}-${leastCrowdedSlot.endTime} (${leastCrowdedSlot.available} spots available)` : 'No slots currently available'}
**Most Available:** ${mostAvailableSlot ? `${mostAvailableSlot.startTime}-${mostAvailableSlot.endTime} (${mostAvailableSlot.available} spots)` : 'N/A'}

## Booking Statistics:

## Gates Information:

## Facilities Status:
${facilities.medicalCenters.map(m => `- ${m.name}: ${m.status} (Wait: ${m.waitTime} mins)`).join('\n')}

Amenities: ${facilities.amenities.map(a => a.name).join(', ')}

Parking: ${facilities.parkingStatus.map(p => `${p.zone}: ${p.available}/${p.total} available`).join(', ')}

${incidents.length > 0 ? `
## Active Alerts (${incidents.length}):
${incidents.map(i => `- ${i.type} (${i.severity}) in ${i.zone}: ${i.status}`).join('\n')}
` : '## No Active Alerts - All areas safe'}

## Temple Guidelines:
${guidelines.map((g, i) => `${i + 1}. ${g}`).join('\n')}
`.trim()
}

// Get quick answers for common questions
export function getQuickAnswer(query: string, context: TempleContext): string | null {
  const lowerQuery = query.toLowerCase()
  
  // Timing questions
  if (lowerQuery.includes('opening') || lowerQuery.includes('timing') || lowerQuery.includes('hours')) {
    return 'The temple opens at 6:00 AM and closes at 9:00 PM. Darshan slots are available every 2 hours from 6 AM to 8 PM.'
  }
  
  // Best time questions
  if (lowerQuery.includes('best time') || lowerQuery.includes('least crowd') || lowerQuery.includes('when should')) {
    const bestSlots = context.bookings.leastCrowdedSlots
    return `Based on current patterns, the least crowded times are ${bestSlots.join(' and ')}. Right now, the ${context.zones.sort((a, b) => (a.currentCount / a.capacity) - (b.currentCount / b.capacity))[0]?.name} has the lowest crowd.`
  }
  
  // Emergency
  if (lowerQuery.includes('emergency') || lowerQuery.includes('help') || lowerQuery.includes('sos')) {
    return 'For emergencies, use the SOS button in the app or call the temple emergency line. Medical centers are available near all gates. For lost children, report immediately to Lost & Found near the Main Gate.'
  }
  
  // Gate questions
  if (lowerQuery.includes('gate') || lowerQuery.includes('entry') || lowerQuery.includes('enter')) {
    return 'Gate A is for elderly/disabled/VIPs with wheelchair service. Gate B is for women with children. Gate C is for general entry. Priority categories get faster entry through dedicated lanes.'
  }
  
  // Parking
  if (lowerQuery.includes('parking') || lowerQuery.includes('park')) {
    const parking = context.facilities.parkingStatus
    return `Current parking availability: ${parking.map(p => `${p.zone}: ${p.available} spots available`).join(', ')}.`
  }
  
  // Wheelchair/accessibility
  if (lowerQuery.includes('wheelchair') || lowerQuery.includes('disabled') || lowerQuery.includes('accessibility')) {
    return 'Free wheelchair service is available at Gate A. Use Gate A for priority entry if you need accessibility assistance. Please book with "Disabled" priority type for dedicated lane access.'
  }
  
  return null
}
