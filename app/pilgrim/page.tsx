"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Phone, 
  Navigation, 
  Activity,
  Ticket,
  Users,
  Calendar,
  ArrowRight,
  QrCode,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Bell,
  Accessibility,
  Baby,
  Heart,
  Flower2,
  Music2
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface Booking {
  id: string
  booking_id: string
  user_name: string
  date: string
  members_count: number
  gate: string
  status: string
  priority_type: string
  slot: {
    start_time: string
    end_time: string
  }
}

interface ZoneStats {
  id: string
  zone_name: string
  current_count: number
  capacity: number
  crowd_level: string
}

interface Notification {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  time: string
  read: boolean
}

export default function PilgrimApp() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [zones, setZones] = useState<ZoneStats[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("bookings")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    // Clear bookings when user changes to avoid stale data
    setBookings([])
    setLoading(true)
    fetchData()
    const interval = setInterval(fetchData, 10000) // Reduced frequency
    return () => clearInterval(interval)
  }, [user?.email]) // Re-run when user email changes

  const fetchData = async () => {
    try {
      // Only fetch user-specific bookings if logged in with email
      const userEmail = user?.email
      
      let bookingsData: Booking[] = []
      
      // Fetch zones regardless of user
      const zonesRes = await fetch("/api/zones")
      
      // Only fetch bookings if we have a logged-in user with email
      if (userEmail) {
        const bookingsRes = await fetch(`/api/bookings?userEmail=${encodeURIComponent(userEmail)}`)
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          bookingsData = data.filter((b: Booking) => b.status !== 'Cancelled')
        }
      }
      // If no user email, bookingsData stays empty (new/logged-out users see empty dashboard)
      
      setBookings(bookingsData)

      // Load pilgrim orders if we've stored a phone locally
      try {
        const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('pilgrim_phone') : null
        if (storedPhone) {
          const ordersRes = await fetch(`/api/vendors/orders?phone=${encodeURIComponent(storedPhone)}`)
          if (ordersRes.ok) {
            const odata = await ordersRes.json()
            setOrders(Array.isArray(odata.orders) ? odata.orders : [])
          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
      }

      if (zonesRes.ok) {
        const data = await zonesRes.json()
        setZones(Array.isArray(data) ? data : [data])
        
        // Generate notifications based on crowd and bookings
        generateNotifications(data, bookingsData)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateNotifications = (zonesData: ZoneStats[], bookingsData: Booking[]) => {
    const newNotifications: Notification[] = []
    const now = new Date()
    
    // Entry time reminders for upcoming bookings
    bookingsData.filter(b => b.status === 'Booked').forEach(booking => {
      const bookingDate = new Date(booking.date)
      const [startHour, startMin] = booking.slot?.start_time?.split(':').map(Number) || [0, 0]
      bookingDate.setHours(startHour, startMin)
      
      const timeDiff = bookingDate.getTime() - now.getTime()
      const hoursUntil = timeDiff / (1000 * 60 * 60)
      
      if (hoursUntil > 0 && hoursUntil <= 2) {
        newNotifications.push({
          id: `reminder-${booking.id}`,
          type: 'reminder',
          title: 'Entry Time Reminder',
          message: `Your darshan slot at ${booking.slot?.start_time} is coming up. Please arrive at ${booking.gate} 15 minutes early.`,
          time: 'Upcoming',
          read: false
        })
      }
    })
    
    // Crowd alerts for high density zones
    const zonesArr = Array.isArray(zonesData) ? zonesData : [zonesData]
    zonesArr.filter(z => z.crowd_level === 'High' || z.crowd_level === 'Critical').forEach(zone => {
      newNotifications.push({
        id: `crowd-${zone.id}`,
        type: 'alert',
        title: 'Crowd Alert',
        message: `${zone.zone_name} is experiencing ${zone.crowd_level.toLowerCase()} crowd density. Consider alternate routes.`,
        time: 'Now',
        read: false
      })
    })
    
    // Info notifications
    if (zonesArr.some(z => z.crowd_level === 'Low')) {
      newNotifications.push({
        id: 'low-crowd-info',
        type: 'info',
        title: 'Best Time to Visit',
        message: 'Some zones have low crowd levels right now. Great time for peaceful darshan!',
        time: 'Now',
        read: false
      })
    }
    
    setNotifications(newNotifications)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const getCrowdColor = (level: string) => {
    switch (level) {
      case "Critical": return "text-red-600 bg-red-100 dark:bg-red-900/30"
      case "High": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
      case "Medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30"
      default: return "text-green-600 bg-green-100 dark:bg-green-900/30"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Checked-In": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Booked": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "Cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="text-muted-foreground">Loading pilgrim portal...</p>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => b.status === 'Booked')
  const checkedInBookings = bookings.filter(b => b.status === 'Checked-In')
  const highCrowdZones = zones.filter(z => z.crowd_level === 'High' || z.crowd_level === 'Critical')
  const unreadNotifications = notifications.filter(n => !n.read).length

  const getPriorityIcon = (priorityType: string) => {
    switch (priorityType) {
      case 'elderly': return <Heart className="w-3 h-3" />
      case 'disabled': return <Accessibility className="w-3 h-3" />
      case 'women-with-children': return <Baby className="w-3 h-3" />
      default: return null
    }
  }

  const getPriorityLabel = (priorityType: string) => {
    switch (priorityType) {
      case 'elderly': return 'Senior Citizen'
      case 'disabled': return 'Differently Abled'
      case 'women-with-children': return 'Women with Children'
      default: return 'General'
    }
  }

  const tabs = [
    { id: 'bookings', label: 'My Bookings', icon: Ticket },
    { id: 'crowd', label: 'Crowd Status', icon: Activity },
    { id: 'guide', label: 'AI Guide', icon: Sparkles }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25">
                <img src="/logo.png" alt="DARSHAN.AI" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg text-primary">DARSHAN.AI</span>
                <p className="text-xs text-muted-foreground">Pilgrim Portal</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-50 w-80 max-h-96 overflow-y-auto"
          >
            <Card className="p-4 shadow-xl border-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                >
                  Mark all read
                </Button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3 rounded-lg text-sm ${
                        notif.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' :
                        notif.type === 'reminder' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' :
                        'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                      } ${!notif.read ? 'font-medium' : 'opacity-75'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold">{notif.title}</span>
                        <span className="text-xs text-muted-foreground">{notif.time}</span>
                      </div>
                      <p className="text-muted-foreground">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Emergency SOS Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/pilgrim/sos">
            <Button className="w-full py-6 text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/25 transition-all">
              <Phone className="mr-3 w-6 h-6" />
              EMERGENCY SOS
            </Button>
          </Link>
        </motion.div>

        {/* My Orders (from Seva Marketplace) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.115 }}
          className="mb-4"
        >
          <h2 className="font-bold text-lg mb-2 flex items-center justify-between">
            <span>My Orders</span>
            <span className="text-sm text-muted-foreground">Recent deliveries</span>
          </h2>

          {orders.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">No recent orders. Order flowers or prasad and track delivery here.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => (
                <Card key={order.order_id || i} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{order.order_id}</p>
                    <p className="font-semibold">{order.vendor?.shop_name || order.vendor?.name || 'Vendor'}</p>
                    <p className="text-sm text-muted-foreground">₹{order.total_amount} • {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'out-for-delivery' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>{order.status}</span>
                    <Link href={`/pilgrim/orders/${order.order_id}`}>
                      <Button size="sm" className="bg-primary">Track</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{upcomingBookings.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{checkedInBookings.length}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </Card>
          <Card className="p-3 text-center">
            <p className={`text-2xl font-bold ${highCrowdZones.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {highCrowdZones.length > 0 ? 'High' : 'Low'}
            </p>
            <p className="text-xs text-muted-foreground">Crowd</p>
          </Card>
        </motion.div>

        {/* AI Chatbot CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Link href="/pilgrim/chat">
            <Card className="p-4 mb-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      Darshan AI Assistant
                      <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">NEW</span>
                    </h3>
                    <p className="text-sm text-white/80">Ask about crowd, slots, gates & more</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5" />
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Seva Marketplace & Holy Music - X-Factor Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <Link href="/pilgrim/marketplace">
            <Card className="p-4 bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Flower2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Seva Marketplace</h3>
                  <p className="text-xs text-white/80">Flowers, Prasad & Puja Items</p>
                </div>
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">Delivery to Queue!</span>
              </div>
            </Card>
          </Link>
          <Link href="/pilgrim/music">
            <Card className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 text-white border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Music2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Holy Music</h3>
                  <p className="text-xs text-white/80">Bhajans, Mantras & Aarti</p>
                </div>
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">Listen While Waiting</span>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Book New Slot CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link href="/pilgrim/book">
            <Card className="p-4 mb-6 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Book New Darshan Slot</h3>
                    <p className="text-sm text-muted-foreground">Plan your temple visit</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap gap-2 flex-1 ${
                  activeTab === tab.id 
                    ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25' 
                    : 'hover:bg-primary/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {bookings.length === 0 ? (
                <Card className="p-8 text-center">
                  <Ticket className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Bookings Yet</h3>
                  <p className="text-muted-foreground mb-4">Book a darshan slot to get started</p>
                  <Link href="/pilgrim/book">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                  </Link>
                </Card>
              ) : (
                bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`p-4 border-l-4 ${
                      booking.status === 'Checked-In' ? 'border-l-green-500' :
                      booking.status === 'Booked' ? 'border-l-primary' :
                      'border-l-gray-300'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">{booking.booking_id}</p>
                          <h3 className="font-bold text-lg">{booking.user_name}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                            {booking.status === 'Checked-In' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                            {booking.status}
                          </span>
                          {booking.priority_type && booking.priority_type !== 'normal' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                              {getPriorityIcon(booking.priority_type)}
                              {getPriorityLabel(booking.priority_type)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{format(new Date(booking.date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{booking.slot?.start_time} - {booking.slot?.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{booking.gate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{booking.members_count} member(s)</span>
                        </div>
                      </div>

                      {booking.status === 'Booked' && (
                        <Link href={`/pilgrim/ticket/${booking.booking_id}`}>
                          <Button className="w-full bg-primary hover:bg-primary/90">
                            <QrCode className="w-4 h-4 mr-2" />
                            View QR Ticket
                          </Button>
                        </Link>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Crowd Status Tab */}
          {activeTab === "crowd" && (
            <motion.div
              key="crowd"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {highCrowdZones.length > 0 && (
                <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-400">High Crowd Alert</p>
                      <p className="text-sm text-amber-800 dark:text-amber-500">
                        {highCrowdZones.map(z => z.zone_name).join(', ')} {highCrowdZones.length === 1 ? 'is' : 'are'} at high capacity
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {zones.map((zone, index) => {
                const percentage = Math.round((zone.current_count / zone.capacity) * 100)
                return (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          <h3 className="font-bold">{zone.zone_name}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCrowdColor(zone.crowd_level)}`}>
                          {zone.crowd_level}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Capacity</span>
                          <span className="font-semibold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, percentage)}%` }}
                            className={`h-full ${
                              percentage > 80 ? 'bg-red-500' :
                              percentage > 60 ? 'bg-orange-500' :
                              percentage > 40 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {zone.current_count.toLocaleString()} / {zone.capacity.toLocaleString()} people
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}

              {zones.length === 0 && (
                <Card className="p-8 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No crowd data available</p>
                </Card>
              )}
            </motion.div>
          )}

          {/* AI Guide Tab */}
          {activeTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Darshan Guide</h3>
                    <p className="text-sm text-muted-foreground">Smart recommendations for your visit</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Recommended Route
                    </p>
                    <ol className="space-y-2 text-sm">
                      {zones.filter(z => z.crowd_level === 'Low' || z.crowd_level === 'Medium').slice(0, 3).map((zone, i) => (
                        <li key={zone.id} className="flex gap-2">
                          <span className="font-bold text-primary min-w-[20px]">{i + 1}.</span>
                          <span>Visit <strong>{zone.zone_name}</strong> - currently at {zone.crowd_level.toLowerCase()} capacity</span>
                        </li>
                      ))}
                      {zones.length === 0 && (
                        <li className="text-muted-foreground">Loading route recommendations...</li>
                      )}
                    </ol>
                  </div>

                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Best Times to Visit
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Early morning (6 AM - 8 AM) - Low crowd
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Evening (4 PM - 6 PM) - Moderate crowd
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Peak hours (10 AM - 2 PM) - Avoid if possible
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Safety Tips
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Keep your phone charged - SOS available 24/7</li>
                      <li>• Stay hydrated - water stations at all zones</li>
                      <li>• Keep your QR ticket ready for quick check-in</li>
                      <li>• Emergency helpline displayed at all checkpoints</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
