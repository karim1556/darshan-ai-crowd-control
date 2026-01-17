"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Clock, 
  Users, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft
} from "lucide-react"
import { format, addDays } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  booked_count: number
  locked: boolean
}

export default function BookSlotPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [membersCount, setMembersCount] = useState("1")
  const [priorityType, setPriorityType] = useState<"normal" | "elderly" | "disabled" | "women-with-children">("normal")
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  // Fetch slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true)
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const res = await fetch(`/api/slots?date=${dateStr}`)
        if (res.ok) {
          const data = await res.json()
          setSlots(data)
        }
      } catch (error) {
        console.error('Failed to fetch slots:', error)
        toast.error('Failed to load available slots')
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [selectedDate])

  const getAvailability = (slot: Slot) => {
    return slot.max_capacity - slot.booked_count
  }

  const getAvailabilityStatus = (slot: Slot) => {
    const available = getAvailability(slot)
    if (slot.locked || available <= 0) return { color: 'bg-red-500', text: 'Full', disabled: true }
    if (available < 50) return { color: 'bg-orange-500', text: 'Few Left', disabled: false }
    if (available < 150) return { color: 'bg-yellow-500', text: 'Filling Fast', disabled: false }
    return { color: 'bg-green-500', text: 'Available', disabled: false }
  }

  const handleBooking = async () => {
    if (!selectedSlot || !userName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          userEmail: userEmail.trim() || undefined,
          userPhone: userPhone.trim() || undefined,
          date: format(selectedDate, 'yyyy-MM-dd'),
          slotId: selectedSlot.id,
          membersCount: parseInt(membersCount),
          priorityType
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Booking failed')
      }

      const booking = await res.json()
      toast.success('Booking confirmed!', {
        description: `Your booking ID is ${booking.booking_id}`
      })
      router.push(`/pilgrim/ticket/${booking.booking_id}`)
    } catch (error: any) {
      toast.error('Booking failed', {
        description: error.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
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
                <img src="/logo.png" alt="DARSHAN.AI" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg text-primary">DARSHAN.AI</span>
                <p className="text-xs text-muted-foreground">Book Your Darshan</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Date & Slot */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-primary/20">
                  <h2 className="text-2xl font-bold mb-2">Select Date & Time Slot</h2>
                  <p className="text-muted-foreground mb-6">Choose your preferred darshan date and time</p>

                  {/* Date Picker */}
                  <div className="mb-6">
                    <Label className="mb-2 block">Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Available Slots */}
                  <div>
                    <Label className="mb-3 block">Available Slots - {format(selectedDate, 'dd MMM yyyy')}</Label>
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No slots available for this date</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {slots.map((slot) => {
                          const status = getAvailabilityStatus(slot)
                          const available = getAvailability(slot)
                          const isSelected = selectedSlot?.id === slot.id

                          return (
                            <motion.div
                              key={slot.id}
                              whileHover={{ scale: status.disabled ? 1 : 1.01 }}
                              whileTap={{ scale: status.disabled ? 1 : 0.99 }}
                            >
                              <Card
                                className={`p-4 cursor-pointer transition-all ${
                                  status.disabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : isSelected 
                                      ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                                      : 'hover:border-primary/50'
                                }`}
                                onClick={() => !status.disabled && setSelectedSlot(slot)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                    <div>
                                      <p className="font-bold text-lg">
                                        {slot.start_time} - {slot.end_time}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {slot.booked_count} / {slot.max_capacity} booked
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      status.disabled 
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                        : available < 50 
                                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
                                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                      {status.disabled ? 'Full' : `${available} spots`}
                                    </span>
                                    {isSelected && (
                                      <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }}
                                        className="mt-2"
                                      >
                                        <CheckCircle2 className="w-5 h-5 text-primary inline" />
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Capacity bar */}
                                <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(slot.booked_count / slot.max_capacity) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-full rounded-full ${
                                      slot.booked_count / slot.max_capacity > 0.9 
                                        ? 'bg-red-500' 
                                        : slot.booked_count / slot.max_capacity > 0.7 
                                          ? 'bg-orange-500' 
                                          : 'bg-primary'
                                    }`}
                                  />
                                </div>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={() => setStep(2)}
                    disabled={!selectedSlot}
                    className="min-w-40"
                  >
                    Continue
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-primary/20">
                  <h2 className="text-2xl font-bold mb-2">Devotee Details</h2>
                  <p className="text-muted-foreground mb-6">Enter your information for the booking</p>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Number of Members</Label>
                        <Select value={membersCount} onValueChange={setMembersCount}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select members" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <SelectItem key={n} value={String(n)}>
                                {n} {n === 1 ? 'Member' : 'Members'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority Category</Label>
                        <Select value={priorityType} onValueChange={(v) => setPriorityType(v as any)}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">General</SelectItem>
                            <SelectItem value="elderly">Senior Citizen (65+)</SelectItem>
                            <SelectItem value="disabled">Differently Abled</SelectItem>
                            <SelectItem value="women-with-children">Women with Children</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {priorityType !== 'normal' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-semibold text-primary">Priority Entry</p>
                            <p className="text-sm text-muted-foreground">
                              You'll be assigned to a priority gate for faster entry. Please carry valid ID proof.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={() => setStep(3)}
                    disabled={!userName.trim()}
                    className="min-w-40"
                  >
                    Review Booking
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-primary/20">
                  <h2 className="text-2xl font-bold mb-2">Review Your Booking</h2>
                  <p className="text-muted-foreground mb-6">Please confirm your booking details</p>

                  <div className="space-y-4">
                    {/* Temple Info */}
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                      <h3 className="font-bold text-lg text-primary">Kashi Vishwanath Temple</h3>
                      <p className="text-sm text-muted-foreground">Varanasi, Uttar Pradesh</p>
                    </div>

                    {/* Booking Details */}
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">{format(selectedDate, 'PPP')}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Time Slot</span>
                        <span className="font-semibold">{selectedSlot?.start_time} - {selectedSlot?.end_time}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-semibold">{userName}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-semibold">{membersCount} {parseInt(membersCount) === 1 ? 'Person' : 'People'}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-border/50">
                        <span className="text-muted-foreground">Category</span>
                        <span className={`font-semibold capitalize ${priorityType !== 'normal' ? 'text-primary' : ''}`}>
                          {priorityType.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-yellow-600 dark:text-yellow-400">Important</p>
                          <p className="text-muted-foreground">
                            Please arrive 30 minutes before your slot time. Carry a valid ID proof. 
                            The QR code is mandatory for entry.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleBooking}
                    disabled={submitting}
                    className="min-w-48 bg-gradient-to-r from-primary to-primary/80"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 w-4 h-4" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
