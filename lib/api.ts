// @ts-nocheck
import { supabase } from './supabase'
import type { 
  Slot, SlotInsert, Booking, BookingInsert, 
  ZoneStats, SOSRequest, SOSInsert, Ambulance, SecurityUnit 
} from './database.types'
import { format, addDays } from 'date-fns'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']

// ============ SLOTS API ============
export async function getSlots(date: string) {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('date', date)
    .order('start_time')
  
  if (error) throw error
  return data as Slot[]
}

export async function getSlotById(id: string) {
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Slot
}

export async function createSlot(slot: SlotInsert) {
  const { data, error } = await supabase
    .from('slots')
    .insert(slot as Tables['slots']['Insert'])
    .select()
    .single()
  
  if (error) throw error
  return data as Slot
}

export async function updateSlot(id: string, updates: Partial<Slot>) {
  const { data, error } = await supabase
    .from('slots')
    .update({ ...updates, updated_at: new Date().toISOString() } as Tables['slots']['Update'])
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Slot
}

export async function toggleSlotLock(id: string) {
  const slot = await getSlotById(id)
  return updateSlot(id, { locked: !slot.locked })
}

// ============ BOOKINGS API ============
function generateBookingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `DARSH-${timestamp}-${random}`
}

export async function createBooking(data: {
  userName: string
  userEmail?: string
  userPhone?: string
  date: string
  slotId: string
  membersCount: number
  priorityType: 'normal' | 'elderly' | 'disabled' | 'women-with-children'
}) {
  // Check slot availability
  const slot = await getSlotById(data.slotId)
  if (!slot) throw new Error('Slot not found')
  if (slot.locked) throw new Error('This slot is currently locked')
  
  const available = slot.max_capacity - slot.booked_count
  if (available < data.membersCount) {
    throw new Error(`Only ${available} spots available in this slot`)
  }

  // Assign gate based on priority
  const gates: ('Gate A' | 'Gate B' | 'Gate C')[] = ['Gate A', 'Gate B', 'Gate C']
  let gate: 'Gate A' | 'Gate B' | 'Gate C'
  
  if (data.priorityType === 'elderly' || data.priorityType === 'disabled') {
    gate = 'Gate A' // Priority gate
  } else if (data.priorityType === 'women-with-children') {
    gate = 'Gate B' // Women & children gate
  } else {
    gate = gates[Math.floor(Math.random() * gates.length)]
  }

  const bookingId = generateBookingId()
  
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      booking_id: bookingId,
      user_name: data.userName,
      user_email: data.userEmail,
      user_phone: data.userPhone,
      date: data.date,
      slot_id: data.slotId,
      members_count: data.membersCount,
      priority_type: data.priorityType,
      gate,
      status: 'Booked'
    } as Tables['bookings']['Insert'])
    .select(`
      *,
      slot:slots(*)
    `)
    .single()
  
  if (error) throw error
  return booking as any
}

export async function getBookingByBookingId(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(*)
    `)
    .eq('booking_id', bookingId)
    .single()
  
  if (error) throw error
  return data as any
}

export async function getBookingsByUser(userName: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(*)
    `)
    .ilike('user_name', `%${userName}%`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as any[]
}

export async function getAllBookings(limit = 50) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data as any[]
}

export async function getBookingsByDate(date: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(*)
    `)
    .eq('date', date)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as any[]
}

export async function checkInBooking(bookingId: string) {
  // Get booking
  const booking = await getBookingByBookingId(bookingId)
  if (!booking) throw new Error('Booking not found')
  if (booking.status === 'Checked-In') throw new Error('Already checked in')
  if (booking.status === 'Cancelled') throw new Error('Booking was cancelled')
  if (booking.status === 'Expired') throw new Error('Booking has expired')

  // Check if within slot time (with 30 min grace period)
  const now = new Date()
  const slotDate = new Date(booking.date)
  const [startHour, startMin] = booking.slot.start_time.split(':').map(Number)
  const [endHour, endMin] = booking.slot.end_time.split(':').map(Number)
  
  const slotStart = new Date(slotDate)
  slotStart.setHours(startHour, startMin - 30, 0, 0) // 30 min early allowed
  
  const slotEnd = new Date(slotDate)
  slotEnd.setHours(endHour, endMin + 30, 0, 0) // 30 min grace after

  // For demo purposes, we'll skip time validation
  // if (now < slotStart || now > slotEnd) {
  //   throw new Error('Check-in only allowed during slot time window')
  // }

  // Update booking status
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'Checked-In',
      checked_in_at: new Date().toISOString()
    } as Tables['bookings']['Update'])
    .eq('booking_id', bookingId)
    .select(`
      *,
      slot:slots(*)
    `)
    .single()
  
  if (error) throw error

  // Update zone stats (increment gate count)
  await incrementZoneStat('gate_count', booking.members_count)

  return data as any
}

export async function cancelBooking(bookingId: string) {
  const booking = await getBookingByBookingId(bookingId)
  if (!booking) throw new Error('Booking not found')
  if (booking.status !== 'Booked') throw new Error('Can only cancel pending bookings')

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'Cancelled' } as Tables['bookings']['Update'])
    .eq('booking_id', bookingId)
    .select()
    .single()
  
  if (error) throw error
  return data as Booking
}

// ============ ZONE STATS API ============
export async function getZoneStats(): Promise<ZoneStats> {
  const { data, error } = await supabase
    .from('zone_stats')
    .select('*')
    .limit(1)
    .single()
  
  if (error) {
    // If no stats exist, create initial
    const { data: newStats, error: insertError } = await supabase
      .from('zone_stats')
      .insert({
        gate_count: 0,
        queue_count: 0,
        inner_count: 0,
        exit_count: 0
      } as Tables['zone_stats']['Insert'])
      .select()
      .single()
    
    if (insertError) throw insertError
    return newStats as ZoneStats
  }
  
  return data as ZoneStats
}

export async function updateZoneStats(updates: Partial<ZoneStats>) {
  const stats = await getZoneStats()
  
  const { data, error } = await supabase
    .from('zone_stats')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    } as Tables['zone_stats']['Update'])
    .eq('id', stats.id)
    .select()
    .single()
  
  if (error) throw error
  return data as ZoneStats
}

export async function incrementZoneStat(field: 'gate_count' | 'queue_count' | 'inner_count' | 'exit_count', amount: number) {
  const stats = await getZoneStats()
  const currentValue = stats[field] || 0
  
  return updateZoneStats({
    [field]: currentValue + amount
  })
}

export async function simulateCrowdFlow() {
  const stats = await getZoneStats()
  
  // Simulate crowd movement
  const gate = Math.max(0, Math.min(1800, stats.gate_count + Math.floor(Math.random() * 40 - 20)))
  const queue = Math.max(0, Math.min(2000, stats.queue_count + Math.floor(Math.random() * 60 - 30)))
  const inner = Math.max(0, Math.min(2500, stats.inner_count + Math.floor(Math.random() * 80 - 40)))
  const exit = Math.max(0, Math.min(1500, stats.exit_count + Math.floor(Math.random() * 50 - 25)))
  
  return updateZoneStats({
    gate_count: gate,
    queue_count: queue,
    inner_count: inner,
    exit_count: exit
  })
}

// ============ SOS API ============
export async function createSOSRequest(data: {
  userId?: string | null
  bookingId?: string
  type: 'medical' | 'security' | 'lost-child' | 'crowd-risk'
  severity?: 'critical' | 'high' | 'medium' | 'low'
  lat: number
  lng: number
  note?: string
}) {
  const { data: sos, error } = await supabase
    .from('sos_requests')
    .insert({
      user_id: data.userId && data.userId.length > 0 ? data.userId : 'guest',
      booking_id: data.bookingId,
      type: data.type,
      severity: data.severity || 'medium',
      lat: data.lat,
      lng: data.lng,
      note: data.note,
      status: 'Pending'
    } as Tables['sos_requests']['Insert'])
    .select()
    .single()
  
  if (error) throw error
  return sos as SOSRequest
}

export async function getSOSRequests(filters?: { type?: string; status?: string }) {
  let query = supabase
    .from('sos_requests')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data as SOSRequest[]
}

export async function getActiveSOSRequests() {
  const { data, error } = await supabase
    .from('sos_requests')
    .select('*')
    .in('status', ['Pending', 'Assigned', 'Enroute'])
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as SOSRequest[]
}

export async function getMedicalSOSRequests() {
  const { data, error } = await supabase
    .from('sos_requests')
    .select('*')
    .eq('type', 'medical')
    .in('status', ['Pending', 'Assigned', 'Enroute'])
    .order('severity')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as SOSRequest[]
}

export async function getSecuritySOSRequests() {
  const { data, error } = await supabase
    .from('sos_requests')
    .select('*')
    .in('type', ['security', 'crowd-risk', 'lost-child'])
    .in('status', ['Pending', 'Assigned', 'Enroute'])
    .order('severity')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as SOSRequest[]
}

export async function updateSOSRequest(id: string, updates: Partial<SOSRequest>) {
  const { data, error } = await supabase
    .from('sos_requests')
    .update(updates as Tables['sos_requests']['Update'])
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as SOSRequest
}

export async function assignSOSRequest(id: string, assignedTo: string, eta: number) {
  return updateSOSRequest(id, {
    status: 'Assigned',
    assigned_to: assignedTo,
    eta
  })
}

export async function resolveSOSRequest(id: string) {
  return updateSOSRequest(id, {
    status: 'Resolved',
    resolved_at: new Date().toISOString()
  })
}

// ============ AMBULANCES API ============
export async function getAmbulances() {
  const { data, error } = await supabase
    .from('ambulances')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data as Ambulance[]
}

export async function updateAmbulanceStatus(id: string, status: 'Available' | 'Busy' | 'Offline') {
  const { data, error } = await supabase
    .from('ambulances')
    .update({ status } as Tables['ambulances']['Update'])
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Ambulance
}

// ============ SECURITY UNITS API ============
export async function getSecurityUnits() {
  const { data, error } = await supabase
    .from('security_units')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data as SecurityUnit[]
}

export async function updateSecurityUnitStatus(id: string, status: 'Available' | 'Busy' | 'Offline') {
  const { data, error } = await supabase
    .from('security_units')
    .update({ status } as Tables['security_units']['Update'])
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as SecurityUnit
}

// ============ DEMO DATA SEEDING ============
export async function seedDemoData() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Check if data already exists
  // Check if data already exists
  const { data: existingSlots, error: checkError } = await supabase
    .from('slots')
    .select('id')
    .eq('date', today)
    .limit(1)

  // If PostgREST reports missing table (PGRST205), throw a helpful error
  if (checkError) {
    if (checkError.code === 'PGRST205' || checkError.message.includes("Could not find the table 'public.")) {
      throw {
        code: 'PGRST205',
        message: checkError.message,
        hint: 'Database schema not found. Run supabase-schema.sql in your Supabase SQL Editor to create the required tables.',
        instruction: 'Open your Supabase project dashboard → SQL Editor → paste the contents of supabase-schema.sql and run it.'
      }
    }
    throw checkError
  }

  if (existingSlots && existingSlots.length > 0) {
    return { message: 'Demo data already exists' }
  }

  // Create slots for today and tomorrow
  const slotsToCreate = [
    { date: today, start_time: '06:00', end_time: '08:00', max_capacity: 500, booked_count: 145, locked: false },
    { date: today, start_time: '08:00', end_time: '10:00', max_capacity: 500, booked_count: 380, locked: false },
    { date: today, start_time: '10:00', end_time: '12:00', max_capacity: 500, booked_count: 490, locked: false },
    { date: today, start_time: '12:00', end_time: '14:00', max_capacity: 500, booked_count: 250, locked: false },
    { date: today, start_time: '14:00', end_time: '16:00', max_capacity: 500, booked_count: 120, locked: false },
    { date: today, start_time: '16:00', end_time: '18:00', max_capacity: 500, booked_count: 300, locked: false },
    { date: today, start_time: '18:00', end_time: '20:00', max_capacity: 500, booked_count: 180, locked: false },
    { date: tomorrow, start_time: '06:00', end_time: '08:00', max_capacity: 500, booked_count: 50, locked: false },
    { date: tomorrow, start_time: '08:00', end_time: '10:00', max_capacity: 500, booked_count: 100, locked: false },
    { date: tomorrow, start_time: '10:00', end_time: '12:00', max_capacity: 500, booked_count: 75, locked: false },
  ]

  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .insert(slotsToCreate as Tables['slots']['Insert'][])
    .select()

  if (slotsError) throw slotsError

  // Create sample bookings
  const bookingsToCreate = (slots as Slot[])!.slice(0, 6).map((slot, i) => ({
    booking_id: `DARSH-DEMO-${String(i + 1).padStart(4, '0')}`,
    user_name: ['Ramesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Devi', 'Rajesh Verma', 'Meera Iyer'][i],
    user_email: `user${i + 1}@example.com`,
    user_phone: `98765${String(i).padStart(5, '0')}`,
    date: today,
    slot_id: slot.id,
    members_count: Math.floor(Math.random() * 4) + 1,
    priority_type: ['normal', 'elderly', 'disabled', 'women-with-children'][i % 4] as any,
    gate: ['Gate A', 'Gate B', 'Gate C'][i % 3] as any,
    status: i < 2 ? 'Checked-In' : 'Booked' as any
  }))

  await supabase.from('bookings').insert(bookingsToCreate as Tables['bookings']['Insert'][])

  // Initialize zone stats
  await supabase.from('zone_stats').upsert({
    id: '00000000-0000-0000-0000-000000000001',
    gate_count: 245,
    queue_count: 380,
    inner_count: 520,
    exit_count: 180
  } as Tables['zone_stats']['Insert'])

  // Create sample SOS requests
  const sosToCreate = [
    {
      user_id: 'user-1',
      type: 'medical' as const,
      severity: 'high' as const,
      lat: 25.3176,
      lng: 82.9739,
      note: 'Elderly person feeling dizzy',
      status: 'Pending' as const
    },
    {
      user_id: 'user-2',
      type: 'security' as const,
      severity: 'medium' as const,
      lat: 25.3180,
      lng: 82.9742,
      note: 'Suspicious person near Gate B',
      status: 'Assigned' as const,
      assigned_to: 'Security Unit Alpha',
      eta: 5
    },
    {
      user_id: 'user-3',
      type: 'lost-child' as const,
      severity: 'critical' as const,
      lat: 25.3175,
      lng: 82.9735,
      note: 'Child separated from parents in queue area',
      status: 'Enroute' as const,
      assigned_to: 'Security Unit Beta',
      eta: 3
    }
  ]

  await supabase.from('sos_requests').insert(sosToCreate as Tables['sos_requests']['Insert'][])

  // Create ambulances
  const ambulances = [
    { name: 'Ambulance A1', status: 'Available' as const, location: 'Medical Center' },
    { name: 'Ambulance A2', status: 'Busy' as const, location: 'Gate A Area' },
    { name: 'Ambulance A3', status: 'Available' as const, location: 'Exit Zone' },
    { name: 'Ambulance B1', status: 'Available' as const, location: 'Medical Center' },
    { name: 'Ambulance B2', status: 'Offline' as const, location: 'Maintenance' },
  ]

  await supabase.from('ambulances').upsert(ambulances as Tables['ambulances']['Insert'][], { onConflict: 'name' })

  // Create security units
  const securityUnits = [
    { name: 'Alpha Squad', status: 'Available' as const, zone: 'Main Gate' },
    { name: 'Beta Squad', status: 'Busy' as const, zone: 'Queue Area' },
    { name: 'Gamma Squad', status: 'Available' as const, zone: 'Inner Temple' },
    { name: 'Delta Squad', status: 'Available' as const, zone: 'Exit Zone' },
    { name: 'Rapid Response', status: 'Available' as const, zone: 'Mobile' },
  ]

  await supabase.from('security_units').upsert(securityUnits as Tables['security_units']['Insert'][], { onConflict: 'name' })

  return { success: true, message: 'Demo data seeded successfully' }
}
