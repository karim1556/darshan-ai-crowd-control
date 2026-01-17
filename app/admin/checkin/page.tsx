"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle2, 
  QrCode, 
  AlertTriangle, 
  XCircle,
  Loader2,
  Users,
  MapPin,
  Clock,
  Scan,
  ArrowLeft,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface Booking {
  id: string
  booking_id: string
  user_name: string
  date: string
  members_count: number
  priority_type: string
  gate: string
  status: string
  slot: {
    start_time: string
    end_time: string
  }
}

interface CheckInResult {
  success: boolean
  booking?: Booking
  error?: string
}

export default function CheckInPage() {
  const [qrInput, setQrInput] = useState("")
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentCheckIns, setRecentCheckIns] = useState<Booking[]>([])
  const [stats, setStats] = useState({ today: 0, lastHour: 0 })

  // Fetch recent check-ins
  useEffect(() => {
    const fetchRecentCheckIns = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const res = await fetch(`/api/bookings?date=${today}`)
        if (res.ok) {
          const bookings = await res.json()
          const checkedIn = bookings.filter((b: Booking) => b.status === 'Checked-In')
          setRecentCheckIns(checkedIn.slice(0, 5))
          setStats({
            today: checkedIn.length,
            lastHour: checkedIn.filter((b: Booking) => {
              const checkInTime = new Date(b.checked_in_at || Date.now())
              const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
              return checkInTime > hourAgo
            }).length
          })
        }
      } catch (error) {
        console.error('Failed to fetch recent check-ins:', error)
      }
    }
    fetchRecentCheckIns()
    const interval = setInterval(fetchRecentCheckIns, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCheckIn = async () => {
    const bookingId = qrInput.trim()
    if (!bookingId) {
      toast.error('Please enter a booking ID')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // First verify booking exists and get details
      const fetchRes = await fetch(`/api/bookings?bookingId=${bookingId}`)
      if (!fetchRes.ok) {
        setResult({ success: false, error: 'Booking not found' })
        return
      }

      const booking = await fetchRes.json()

      // Check current status
      if (booking.status === 'Checked-In') {
        setResult({ 
          success: false, 
          error: 'Already checked in', 
          booking 
        })
        return
      }

      if (booking.status === 'Cancelled') {
        setResult({ success: false, error: 'Booking was cancelled', booking })
        return
      }

      if (booking.status === 'Expired') {
        setResult({ success: false, error: 'Booking has expired', booking })
        return
      }

      // Perform check-in
      const checkInRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          bookingId
        })
      })

      if (!checkInRes.ok) {
        const error = await checkInRes.json()
        setResult({ success: false, error: error.error || 'Check-in failed', booking })
        return
      }

      const checkedInBooking = await checkInRes.json()
      setResult({ success: true, booking: checkedInBooking })
      setQrInput('')
      
      // Update recent check-ins
      setRecentCheckIns(prev => [checkedInBooking, ...prev.slice(0, 4)])
      setStats(prev => ({ ...prev, today: prev.today + 1, lastHour: prev.lastHour + 1 }))

      toast.success('Check-in successful!', {
        description: `${checkedInBooking.user_name} - ${checkedInBooking.members_count} member(s)`
      })

      // Auto-clear after 5 seconds
      setTimeout(() => {
        setResult(null)
      }, 5000)

    } catch (error) {
      setResult({ success: false, error: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const simulateRandomScan = async () => {
    // Get a random booked ticket
    try {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const res = await fetch(`/api/bookings?date=${today}`)
      if (res.ok) {
        const bookings = await res.json()
        const bookedTickets = bookings.filter((b: Booking) => b.status === 'Booked')
        if (bookedTickets.length > 0) {
          const randomBooking = bookedTickets[Math.floor(Math.random() * bookedTickets.length)]
          setQrInput(randomBooking.booking_id)
          toast.info('QR Code Scanned', { description: randomBooking.booking_id })
        } else {
          toast.error('No pending bookings to scan')
        }
      }
    } catch (error) {
      toast.error('Failed to simulate scan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-secondary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/60 rounded-xl flex items-center justify-center text-secondary-foreground font-bold shadow-lg shadow-secondary/25">
                A
              </div>
              <div>
                <span className="font-bold text-lg text-secondary">QR Check-In</span>
                <p className="text-xs text-muted-foreground">Temple Admin Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold text-secondary">{stats.today}</p>
              <p className="text-xs text-muted-foreground">Checked in today</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto grid gap-6">
          {/* Main Scanner Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-8 border-2 border-secondary/30 bg-card/50 backdrop-blur">
              <div className="text-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/60 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-secondary/25">
                    <QrCode className="w-10 h-10 text-secondary-foreground" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Pilgrim Check-In</h1>
                <p className="text-muted-foreground">Scan QR code or enter booking ID</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter Booking ID (e.g., DARSH-ABC123-XYZ)"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
                    className="h-14 text-lg font-mono pl-12 border-2 border-secondary/30 focus:border-secondary"
                    disabled={loading}
                  />
                  <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading || !qrInput.trim()}
                    className="h-14 text-lg font-bold bg-secondary hover:bg-secondary/90"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    )}
                    Check In
                  </Button>
                  <Button
                    onClick={simulateRandomScan}
                    disabled={loading}
                    variant="outline"
                    className="h-14 text-lg border-2 border-secondary/30 hover:bg-secondary/10"
                  >
                    <Scan className="w-5 h-5 mr-2" />
                    Simulate Scan
                  </Button>
                </div>
              </div>

              {/* Result Display */}
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6"
                  >
                    {result.success ? (
                      <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
                        <div className="flex items-start gap-4">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                          </motion.div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-green-600 mb-3">Check-In Successful</h2>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Name</p>
                                <p className="font-semibold">{result.booking?.user_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Members</p>
                                <p className="font-semibold">{result.booking?.members_count}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Gate</p>
                                <p className="font-semibold text-secondary">{result.booking?.gate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Slot</p>
                                <p className="font-semibold">
                                  {result.booking?.slot?.start_time} - {result.booking?.slot?.end_time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-500">
                        <div className="flex items-start gap-4">
                          <XCircle className="w-12 h-12 text-red-600" />
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-red-600 mb-2">Check-In Failed</h2>
                            <p className="text-red-700 dark:text-red-400 font-medium">{result.error}</p>
                            {result.booking && (
                              <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm">
                                <p className="text-muted-foreground">Booking: {result.booking.booking_id}</p>
                                <p className="text-muted-foreground">Status: {result.booking.status}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* Stats and Recent Check-ins */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" />
                  Today's Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/10 rounded-xl text-center">
                    <p className="text-3xl font-bold text-secondary">{stats.today}</p>
                    <p className="text-xs text-muted-foreground">Total Check-ins</p>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-xl text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.lastHour}</p>
                    <p className="text-xs text-muted-foreground">Last Hour</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent Check-ins */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  Recent Check-ins
                </h3>
                <div className="space-y-2">
                  {recentCheckIns.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No check-ins yet today
                    </p>
                  ) : (
                    recentCheckIns.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{booking.user_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.booking_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-secondary">{booking.gate}</p>
                          <p className="text-xs text-muted-foreground">{booking.members_count} pax</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-700 dark:text-blue-400">Staff Instructions</p>
                  <ul className="text-blue-600 dark:text-blue-500 mt-1 space-y-1">
                    <li>• Verify pilgrim's photo ID matches the booking name</li>
                    <li>• Count all members in the group before check-in</li>
                    <li>• Direct pilgrims to their assigned gate</li>
                    <li>• Report any issues to the control room immediately</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
