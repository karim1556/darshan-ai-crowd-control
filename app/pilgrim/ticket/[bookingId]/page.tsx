"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { QRCodeCanvas } from "qrcode.react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle, 
  Phone, 
  Calendar,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Navigation
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface Booking {
  id: string
  booking_id: string
  user_name: string
  user_email: string | null
  user_phone: string | null
  date: string
  slot_id: string
  members_count: number
  priority_type: string
  gate: string
  status: string
  created_at: string
  checked_in_at: string | null
  slot: {
    id: string
    date: string
    start_time: string
    end_time: string
    max_capacity: number
    booked_count: number
  }
}

export default function TicketPage() {
  const { bookingId } = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [crowdLevel, setCrowdLevel] = useState<"Low" | "Moderate" | "High" | "Critical">("Low")

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings?bookingId=${bookingId}`)
        if (!res.ok) throw new Error("Not found")
        const data = await res.json()
        setBooking(data)

        // Fetch real crowd data
        const crowdRes = await fetch('/api/zones')
        if (crowdRes.ok) {
          const crowdData = await crowdRes.json()
          const total = (crowdData.gate_count || 0) + (crowdData.queue_count || 0) + (crowdData.inner_count || 0)
          if (total < 500) setCrowdLevel("Low")
          else if (total < 1500) setCrowdLevel("Moderate")
          else if (total < 3000) setCrowdLevel("High")
          else setCrowdLevel("Critical")
        }
      } catch (err) {
        console.error("Error fetching booking:", err)
      } finally {
        setLoading(false)
      }
    }
    if (bookingId) fetchBooking()
  }, [bookingId])

  const handleCancel = async () => {
    if (!booking) return
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setCancelling(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', bookingId: booking.booking_id })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to cancel')
      }

      toast.success('Booking cancelled successfully')
      router.push('/pilgrim')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCancelling(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Checked-In":
        return { 
          bg: "bg-green-100 dark:bg-green-900/30", 
          text: "text-green-700 dark:text-green-400",
          icon: CheckCircle2
        }
      case "Booked":
        return { 
          bg: "bg-blue-100 dark:bg-blue-900/30", 
          text: "text-blue-700 dark:text-blue-400",
          icon: Clock
        }
      case "Cancelled":
        return { 
          bg: "bg-red-100 dark:bg-red-900/30", 
          text: "text-red-700 dark:text-red-400",
          icon: XCircle
        }
      default:
        return { 
          bg: "bg-gray-100 dark:bg-gray-800", 
          text: "text-gray-700 dark:text-gray-400",
          icon: Clock
        }
    }
  }

  const getCrowdConfig = (level: string) => {
    switch (level) {
      case "Low":
        return { bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800", emoji: "🟢", color: "text-green-600" }
      case "Moderate":
        return { bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800", emoji: "🟡", color: "text-yellow-600" }
      case "High":
        return { bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800", emoji: "🟠", color: "text-orange-600" }
      case "Critical":
        return { bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", emoji: "🔴", color: "text-red-600" }
      default:
        return { bg: "bg-background", emoji: "⚪", color: "text-muted-foreground" }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground mb-6">The booking ID you provided does not exist.</p>
          <Link href="/pilgrim/book">
            <Button className="w-full">Book a New Slot</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const statusConfig = getStatusConfig(booking.status)
  const crowdConfig = getCrowdConfig(crowdLevel)
  const StatusIcon = statusConfig.icon

  // Generate QR code data
  const qrData = JSON.stringify({
    bookingId: booking.booking_id,
    name: booking.user_name,
    date: booking.date,
    slot: `${booking.slot.start_time}-${booking.slot.end_time}`,
    gate: booking.gate,
    members: booking.members_count
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pilgrim">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25">
                D
              </div>
              <div>
                <span className="font-bold text-lg text-primary">Digital Ticket</span>
                <p className="text-xs text-muted-foreground">DARSHAN.AI</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Main Ticket Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 shadow-xl">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold">Kashi Vishwanath Temple</h1>
                    <p className="opacity-90">Varanasi, Uttar Pradesh</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{booking.status}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="p-6 flex flex-col items-center border-b border-dashed border-border">
                <motion.div 
                  className="bg-white p-4 rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <QRCodeCanvas 
                    value={qrData}
                    size={180}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </motion.div>
                <p className="mt-4 font-mono text-xl font-bold text-primary tracking-wider">
                  {booking.booking_id}
                </p>
                <p className="text-sm text-muted-foreground">Show this QR at entry gate</p>
              </div>

              {/* Booking Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs">Devotee</span>
                    </div>
                    <p className="font-semibold">{booking.user_name}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Date</span>
                    </div>
                    <p className="font-semibold">{format(new Date(booking.date), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Time Slot</span>
                    </div>
                    <p className="font-semibold">{booking.slot.start_time} - {booking.slot.end_time}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">Entry Gate</span>
                    </div>
                    <p className="font-semibold text-primary">{booking.gate}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Members</p>
                    <p className="font-semibold">{booking.members_count} {booking.members_count === 1 ? 'Person' : 'People'}</p>
                  </div>
                  <div className="flex-1 p-4 bg-muted/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <p className="font-semibold capitalize">{booking.priority_type.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Crowd Status */}
              <div className={`mx-6 mb-6 p-4 rounded-xl border-2 ${crowdConfig.bg}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{crowdConfig.emoji}</span>
                  <div>
                    <p className={`font-bold ${crowdConfig.color}`}>Current Crowd: {crowdLevel}</p>
                    <p className="text-sm text-muted-foreground">
                      {crowdLevel === "Low" && "Perfect time for peaceful darshan"}
                      {crowdLevel === "Moderate" && "Moderate crowd, expect short wait"}
                      {crowdLevel === "High" && "High footfall, plan accordingly"}
                      {crowdLevel === "Critical" && "Very crowded, use caution"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs">Add to Calendar</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                  <Navigation className="w-5 h-5" />
                  <span className="text-xs">Get Directions</span>
                </Button>
                {booking.status === 'Booked' && (
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex-col gap-1 col-span-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                    <span className="text-xs">{cancelling ? 'Cancelling...' : 'Cancel Booking'}</span>
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Emergency SOS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-600">Emergency Assistance</h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                Face any medical, security, or crowd-related emergency during your visit? Get immediate help.
              </p>
              <Link href="/pilgrim/sos">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <Phone className="mr-2 w-4 h-4" />
                  Emergency SOS
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
