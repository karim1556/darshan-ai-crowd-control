'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Types for real-time data
interface ZoneStats {
  id: string
  gate_count: number
  queue_count: number
  inner_count: number
  exit_count: number
  updated_at: string
}

interface SOSRequest {
  id: string
  user_id: string
  type: 'medical' | 'security' | 'lost-child' | 'crowd-risk'
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'Pending' | 'Assigned' | 'Enroute' | 'Resolved'
  lat: number
  lng: number
  note: string | null
  assigned_to: string | null
  eta: number | null
  created_at: string
}

interface Booking {
  id: string
  booking_id: string
  user_name: string
  status: 'Booked' | 'Checked-In' | 'Expired' | 'Cancelled'
  date: string
  slot_id: string
  gate: string
  priority_type: string
  members_count: number
  created_at: string
  checked_in_at: string | null
}

interface IncidentReport {
  id: string
  report_id: string
  type: string
  location: string
  severity: string
  status: string
  created_at: string
}

// Hook for real-time zone stats (crowd monitoring)
export function useRealtimeZoneStats() {
  const [zoneStats, setZoneStats] = useState<ZoneStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    // Initial fetch
    async function fetchInitial() {
      try {
        const { data, error } = await supabase
          .from('zone_stats')
          .select('*')
          .limit(1)
          .single()
        
        if (error && error.code !== 'PGRST116') throw error
        setZoneStats(data)
      } catch (e: any) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()

    // Subscribe to real-time updates
    channelRef.current = supabase
      .channel('zone_stats_changes')
      .on<ZoneStats>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zone_stats' },
        (payload: RealtimePostgresChangesPayload<ZoneStats>) => {
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            setZoneStats(payload.new as ZoneStats)
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return { zoneStats, loading, error }
}

// Hook for real-time SOS requests
export function useRealtimeSOS(filter?: { type?: string }) {
  const [sosRequests, setSOSRequests] = useState<SOSRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const refresh = useCallback(async () => {
    try {
      let query = supabase
        .from('sos_requests')
        .select('*')
        .in('status', ['Pending', 'Assigned', 'Enroute'])
        .order('created_at', { ascending: false })
      
      if (filter?.type) {
        query = query.eq('type', filter.type)
      }
      
      const { data, error } = await query
      if (error) throw error
      setSOSRequests(data || [])
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [filter?.type])

  useEffect(() => {
    refresh()

    // Subscribe to real-time updates
    channelRef.current = supabase
      .channel('sos_requests_changes')
      .on<SOSRequest>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_requests' },
        (payload: RealtimePostgresChangesPayload<SOSRequest>) => {
          if (payload.eventType === 'INSERT') {
            const newSOS = payload.new as SOSRequest
            if (!filter?.type || newSOS.type === filter.type) {
              setSOSRequests(prev => [newSOS, ...prev])
              // Trigger browser notification for new SOS
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🚨 New SOS Alert', {
                  body: `${newSOS.severity.toUpperCase()} - ${newSOS.type}: ${newSOS.note || 'Emergency reported'}`,
                  icon: '/logo.png',
                  tag: newSOS.id,
                  requireInteraction: true
                })
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SOSRequest
            setSOSRequests(prev => prev.map(s => s.id === updated.id ? updated : s))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id?: string }
            if (deleted?.id) {
              setSOSRequests(prev => prev.filter(s => s.id !== deleted.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [filter?.type, refresh])

  return { sosRequests, loading, error, refresh }
}

// Hook for real-time bookings (for admin check-in)
export function useRealtimeBookings(filter?: { date?: string; status?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const refresh = useCallback(async () => {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (filter?.date) {
        query = query.eq('date', filter.date)
      }
      if (filter?.status) {
        query = query.eq('status', filter.status)
      }
      
      const { data, error } = await query
      if (error) throw error
      setBookings(data || [])
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [filter?.date, filter?.status])

  useEffect(() => {
    refresh()

    // Subscribe to real-time updates
    channelRef.current = supabase
      .channel('bookings_changes')
      .on<Booking>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload: RealtimePostgresChangesPayload<Booking>) => {
          if (payload.eventType === 'INSERT') {
            setBookings(prev => [payload.new as Booking, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Booking
            setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id?: string }
            if (deleted?.id) {
              setBookings(prev => prev.filter(b => b.id !== deleted.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [filter?.date, filter?.status, refresh])

  return { bookings, loading, error, refresh }
}

// Hook for real-time incident reports
export function useRealtimeIncidents() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setIncidents(data || [])
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    // Subscribe to real-time updates
    channelRef.current = supabase
      .channel('incidents_changes')
      .on<IncidentReport>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        (payload: RealtimePostgresChangesPayload<IncidentReport>) => {
          if (payload.eventType === 'INSERT') {
            const newIncident = payload.new as IncidentReport
            setIncidents(prev => [newIncident, ...prev])
            // Notify for critical/high severity
            if (['critical', 'high'].includes(newIncident.severity)) {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ Incident Report', {
                  body: `${newIncident.severity.toUpperCase()} at ${newIncident.location}: ${newIncident.type}`,
                  icon: '/logo.png',
                  tag: newIncident.id
                })
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as IncidentReport
            setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i))
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [refresh])

  return { incidents, loading, error, refresh }
}

// Hook for notification permission
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied' as NotificationPermission
  }, [])

  return { permission, requestPermission }
}

// Subscribe to specific booking updates (for pilgrim view)
export function useBookingStatus(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!bookingId) return

    async function fetchBooking() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', bookingId)
        .single()
      
      if (!error && data) {
        setBooking(data as Booking)
      }
      setLoading(false)
    }

    fetchBooking()

    // Subscribe to updates for this specific booking
    channelRef.current = supabase
      .channel(`booking_${bookingId}`)
      .on<Booking>(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'bookings',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload: RealtimePostgresChangesPayload<Booking>) => {
          setBooking(payload.new as Booking)
          // Notify on status change
          if ('Notification' in window && Notification.permission === 'granted') {
            const updated = payload.new as Booking
            if (updated.status === 'Checked-In') {
              new Notification('✅ Check-in Successful', {
                body: `Your booking ${bookingId} has been checked in at ${updated.gate}`,
                icon: '/logo.png'
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [bookingId])

  return { booking, loading }
}
