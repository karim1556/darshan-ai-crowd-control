"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Activity, 
  Users, 
  QrCode, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Ticket,
  MapPin,
  Shield,
  Ambulance,
  Lock,
  Unlock,
  Settings,
  FileText,
  PieChart,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

interface ZoneStats {
  id: string
  zone_name: string
  current_count: number
  capacity: number
  crowd_level: string
  updated_at: string
}

interface Booking {
  id: string
  booking_id: string
  user_name: string
  status: string
  members_count: number
  gate: string
  date: string
  priority_type: string
  slot: {
    start_time: string
    end_time: string
  }
}

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  locked: boolean
}

interface Analytics {
  totalPilgrims: number
  avgWaitTime: number
  peakHour: string
  sosIncidents: number
  medicalEmergencies: number
  hourlyData: { hour: string; pilgrims: number; avgWait: number }[]
  areaDistribution: Record<string, number>
}

interface SOSRequest {
  id: string
  type: string
  status: string
  priority: string
  description: string
  location: string
  created_at: string
}

export default function AdminDashboard() {
  const { signOut } = useAuth()
  const [zones, setZones] = useState<ZoneStats[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lockingSlot, setLockingSlot] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [zonesRes, bookingsRes, slotsRes, sosRes] = await Promise.all([
        fetch("/api/zones"),
        fetch(`/api/bookings?date=${today}`),
        fetch(`/api/slots?date=${today}`),
        fetch("/api/sos?type=all")
      ])

      // Fetch analytics
      const analyticsRes = await fetch('/api/analytics')
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData.data)
      }

      if (zonesRes.ok) {
        const data = await zonesRes.json()
        setZones(Array.isArray(data) ? data : [data])
      }

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.slice(0, 20))
      }

      if (slotsRes.ok) {
        const data = await slotsRes.json()
        setSlots(data)
      }

      if (sosRes.ok) {
        const data = await sosRes.json()
        setSosRequests(data.filter((s: SOSRequest) => s.status === 'pending').slice(0, 5))
      }
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSlotLock = async (slotId: string, currentlyLocked: boolean) => {
    try {
      setLockingSlot(slotId)
      const res = await fetch('/api/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slotId, action: 'toggle-lock' })
      })
      
      if (res.ok) {
        toast.success(currentlyLocked ? 'Slot unlocked' : 'Slot locked')
        await fetchData()
      } else {
        toast.error('Failed to update slot')
      }
    } catch (error) {
      toast.error('Error updating slot')
    } finally {
      setLockingSlot(null)
    }
  }

  const handleAutoEnforceBooking = async () => {
    // Check if any zone is at critical level - if so, lock all slots with low availability
    const criticalZones = zones.filter(z => z.crowd_level === 'Critical')
    if (criticalZones.length > 0) {
      const slotsToLock = slots.filter(s => !s.locked && (s.capacity - s.booked_count) < 50)
      for (const slot of slotsToLock) {
        await handleToggleSlotLock(slot.id, false)
      }
      toast.success(`Auto-enforced: Locked ${slotsToLock.length} slots due to critical crowd levels`)
    } else {
      toast.info('No critical crowd levels detected')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-secondary" />
        </motion.div>
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  // Calculate stats
  const totalCrowd = zones.reduce((sum, z) => sum + (typeof z.current_count === 'number' ? z.current_count : 0), 0)
  const totalCapacity = zones.reduce((sum, z) => sum + (typeof z.capacity === 'number' ? z.capacity : 0), 0)
  const checkedInToday = bookings.filter(b => b.status === 'Checked-In').length
  const bookedToday = bookings.filter(b => b.status === 'Booked').length
  const totalSlotCapacity = slots.reduce((sum, s) => sum + (typeof s.capacity === 'number' ? s.capacity : 0), 0)
  const totalBooked = slots.reduce((sum, s) => sum + (typeof s.booked_count === 'number' ? s.booked_count : 0), 0)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'zones', label: 'Zone Capacity', icon: MapPin },
    { id: 'bookings', label: 'Bookings', icon: Ticket },
    { id: 'slots', label: 'Slot Management', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'alerts', label: 'SOS Alerts', icon: AlertTriangle, count: sosRequests.length }
  ]

  return (
    <ProtectedRoute allowedRoles={['admin']}>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/60 rounded-xl flex items-center justify-center text-secondary-foreground font-bold shadow-lg shadow-secondary/25">
              A
            </div>
            <div>
              <span className="font-bold text-lg text-secondary">Temple Admin</span>
              <p className="text-xs text-muted-foreground">DARSHAN.AI Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-secondary/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/admin/checkin">
              <Button className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/25">
                <QrCode className="w-4 h-4 mr-2" />
                QR Check-In
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="p-4 border-l-4 border-l-secondary bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Current Crowd</p>
                <p className="text-3xl font-bold text-secondary">{totalCrowd.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((totalCrowd / totalCapacity) * 100)}% of capacity
                </p>
              </div>
              <Users className="w-8 h-8 text-secondary/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Checked In Today</p>
                <p className="text-3xl font-bold text-green-600">{checkedInToday}</p>
                <p className="text-xs text-muted-foreground mt-1">{bookedToday} pending</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Slot Utilization</p>
                <p className="text-3xl font-bold text-blue-600">
                  {totalSlotCapacity > 0 ? Math.round((totalBooked / totalSlotCapacity) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBooked}/{totalSlotCapacity} booked
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-3xl font-bold text-orange-600">{sosRequests.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Pending SOS</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600/30" />
            </div>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/25' 
                    : 'hover:bg-secondary/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                    {tab.count}
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/admin/checkin" className="block">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-secondary/10 rounded-xl text-center cursor-pointer hover:bg-secondary/20 transition-colors"
                    >
                      <QrCode className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <p className="font-medium text-sm">QR Check-In</p>
                    </motion.div>
                  </Link>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    onClick={handleSeedData}
                  >
                    <RefreshCw className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-sm">Seed Demo Data</p>
                  </motion.div>
                  <Link href="/police" className="block">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-center cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-medium text-sm">Security Portal</p>
                    </motion.div>
                  </Link>
                  <Link href="/medical" className="block">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-center cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Ambulance className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="font-medium text-sm">Medical Portal</p>
                    </motion.div>
                  </Link>
                </div>
              </Card>

              {/* Zone Summary */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  Live Zone Status
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {zones.map((zone) => {
                    const current = typeof zone.current_count === 'number' ? zone.current_count : 0
                    const cap = typeof zone.capacity === 'number' ? zone.capacity : 0
                    const percentage = cap > 0 ? Math.round((current / cap) * 100) : 0
                    const colorClass = 
                      zone.crowd_level === 'Low' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                      zone.crowd_level === 'Medium' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                      zone.crowd_level === 'High' ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' :
                      'text-red-600 bg-red-100 dark:bg-red-900/30'

                    return (
                      <div key={zone.id} className="p-4 border border-border rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold">{zone.zone_name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                            {zone.crowd_level}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, percentage)}%` }}
                            className={`h-full rounded-full ${
                              percentage > 90 ? 'bg-red-500' :
                              percentage > 70 ? 'bg-orange-500' :
                              percentage > 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {current.toLocaleString()} / {cap.toLocaleString()}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {zones.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No zone data available</p>
                    <Button onClick={handleSeedData} variant="outline" className="mt-3">
                      Seed Demo Data
                    </Button>
                  </div>
                )}
              </Card>

              {/* Recent Bookings */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-secondary" />
                    Recent Bookings
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{booking.user_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{booking.booking_id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'Checked-In' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          booking.status === 'Booked' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          booking.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.members_count} pax • {booking.gate}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground">No bookings today</p>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Zones Tab */}
          {activeTab === "zones" && (
            <motion.div
              key="zones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                  Zone Capacity Management
                </h3>
                <div className="space-y-4">
                  {zones.map((zone) => {
                    const current = typeof zone.current_count === 'number' ? zone.current_count : 0
                    const cap = typeof zone.capacity === 'number' ? zone.capacity : 0
                    const percentage = cap > 0 ? Math.round((current / cap) * 100) : 0
                    return (
                      <div key={zone.id} className="p-4 border border-border rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{zone.zone_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Capacity: {cap.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-secondary">{current.toLocaleString()}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              zone.crowd_level === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              zone.crowd_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              zone.crowd_level === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {zone.crowd_level}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, percentage)}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${
                              percentage > 90 ? 'bg-red-500' :
                              percentage > 70 ? 'bg-orange-500' :
                              percentage > 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {percentage}% utilized • Updated {format(new Date(zone.updated_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    )
                  })}
                  {zones.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No zone data. Click below to seed demo data.</p>
                      <Button onClick={handleSeedData} className="mt-3">
                        Seed Demo Data
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Today's Bookings ({bookings.length})</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-bold">
                      {checkedInToday} checked in
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-bold">
                      {bookedToday} pending
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{booking.user_name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{booking.booking_id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'Checked-In' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          booking.status === 'Booked' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          booking.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <p><Clock className="w-3 h-3 inline mr-1" />{booking.slot?.start_time} - {booking.slot?.end_time}</p>
                        <p><Users className="w-3 h-3 inline mr-1" />{booking.members_count} member(s)</p>
                        <p><MapPin className="w-3 h-3 inline mr-1" />{booking.gate}</p>
                        <p className="capitalize">{booking.priority_type} priority</p>
                      </div>
                    </motion.div>
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">No bookings for today</p>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Slots Tab */}
          {activeTab === "slots" && (
            <motion.div
              key="slots"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-secondary" />
                    Today's Slots ({format(new Date(), 'MMMM d, yyyy')})
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slots.map((slot, index) => {
                    const percentage = Math.round((slot.booked_count / slot.capacity) * 100)
                    const available = slot.capacity - slot.booked_count
                    return (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 border border-border rounded-xl"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-lg">
                            {slot.start_time} - {slot.end_time}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            available === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            available < 20 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {available === 0 ? 'Full' : `${available} left`}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentage >= 100 ? 'bg-red-500' :
                              percentage >= 80 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {slot.booked_count} / {slot.capacity} booked ({percentage}%)
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSlotLock(slot.id, slot.locked || false)}
                            disabled={lockingSlot === slot.id}
                            className={slot.locked ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {lockingSlot === slot.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : slot.locked ? (
                              <>
                                <Lock className="w-4 h-4 mr-1" />
                                Locked
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-1" />
                                Open
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                  {slots.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No slots configured for today</p>
                      <Button onClick={handleSeedData} variant="outline" className="mt-3">
                        Seed Demo Data
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Auto-enforce control */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Automatic Crowd Control
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Auto-lock slots with low availability when zones reach critical capacity
                      </p>
                    </div>
                    <Button onClick={handleAutoEnforceBooking} variant="outline" size="sm">
                      Enforce Now
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {analytics ? (
                <>
                  {/* Daily Summary */}
                  <Card className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-secondary" />
                      Daily Footfall Report
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-secondary/10 rounded-xl text-center">
                        <p className="text-3xl font-bold text-secondary">{analytics.totalPilgrims.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Pilgrims</p>
                      </div>
                      <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-center">
                        <p className="text-3xl font-bold text-blue-600">{analytics.avgWaitTime} min</p>
                        <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                      </div>
                      <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-center">
                        <p className="text-3xl font-bold text-orange-600">{analytics.peakHour}</p>
                        <p className="text-sm text-muted-foreground">Peak Hour</p>
                      </div>
                      <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-center">
                        <p className="text-3xl font-bold text-red-600">{analytics.sosIncidents}</p>
                        <p className="text-sm text-muted-foreground">SOS Incidents</p>
                      </div>
                    </div>
                  </Card>

                  {/* Hourly Data */}
                  <Card className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-secondary" />
                      Hourly Footfall Distribution
                    </h3>
                    <div className="space-y-3">
                      {analytics.hourlyData.map((data, index) => {
                        const maxPilgrims = Math.max(...analytics.hourlyData.map(d => d.pilgrims))
                        const percentage = (data.pilgrims / maxPilgrims) * 100
                        return (
                          <div key={index} className="flex items-center gap-4">
                            <span className="w-16 text-sm font-medium">{data.hour}</span>
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={`h-full rounded-full flex items-center justify-end pr-2 ${
                                  percentage > 80 ? 'bg-red-500' :
                                  percentage > 60 ? 'bg-orange-500' :
                                  percentage > 40 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                              >
                                <span className="text-xs font-bold text-white">{data.pilgrims}</span>
                              </motion.div>
                            </div>
                            <span className="w-20 text-sm text-muted-foreground text-right">
                              {data.avgWait}min wait
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Area Distribution */}
                  <Card className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-secondary" />
                      Area-wise Distribution
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(analytics.areaDistribution).map(([area, count], index) => {
                        const total = Object.values(analytics.areaDistribution).reduce((a, b) => a + b, 0)
                        const percentage = Math.round((count / total) * 100)
                        return (
                          <div key={area} className="p-4 border border-border rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{area}</span>
                              <span className="text-lg font-bold text-secondary">{count.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="h-full rounded-full bg-secondary"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{percentage}% of total</p>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No analytics data available</p>
                  <Button onClick={handleSeedData} variant="outline" className="mt-3">
                    Seed Demo Data
                  </Button>
                </Card>
              )}
            </motion.div>
          )}

          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Pending SOS Alerts
                </h3>
                <div className="space-y-4">
                  {sosRequests.map((sos, index) => (
                    <motion.div
                      key={sos.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border-2 rounded-lg ${
                        sos.priority === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                        sos.priority === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                        'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            sos.type === 'medical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sos.type.toUpperCase()}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                            sos.priority === 'critical' ? 'bg-red-600 text-white' :
                            sos.priority === 'high' ? 'bg-orange-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {sos.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sos.created_at), 'HH:mm:ss')}
                        </p>
                      </div>
                      <p className="font-medium mb-1">{sos.description}</p>
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 inline mr-1" />{sos.location}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Link href={sos.type === 'medical' ? '/medical' : '/police'}>
                          <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                            Go to {sos.type === 'medical' ? 'Medical' : 'Security'} Portal
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                  {sosRequests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>No pending SOS alerts</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </ProtectedRoute>
  )
}
