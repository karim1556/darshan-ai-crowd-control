"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Phone, 
  AlertTriangle, 
  Home, 
  MapPin, 
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Ambulance,
  Shield,
  Users,
  Siren
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface SOSRequest {
  id: string
  type: "medical" | "security" | "lost-child" | "crowd-risk"
  priority: "critical" | "high" | "medium" | "low"
  status: "pending" | "assigned" | "resolved"
  description: string
  location: string
}

const emergencyTypes = [
  {
    type: "medical" as const,
    icon: "🏥",
    label: "Medical Emergency",
    description: "Injury, illness, or medical distress",
    color: "border-red-500 bg-red-50 dark:bg-red-900/20",
    priority: "high" as const
  },
  {
    type: "security" as const,
    icon: "🔐",
    label: "Security Issue",
    description: "Threat, harassment, or security concern",
    color: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
    priority: "medium" as const
  },
  {
    type: "lost-child" as const,
    icon: "👶",
    label: "Lost Child",
    description: "Child missing or separated from group",
    color: "border-orange-500 bg-orange-50 dark:bg-orange-900/20",
    priority: "critical" as const
  },
  {
    type: "crowd-risk" as const,
    icon: "👥",
    label: "Crowd Risk",
    description: "Dangerous crowd surge or congestion",
    color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
    priority: "high" as const
  },
]

export default function SOSPage() {
  const [selectedType, setSelectedType] = useState<typeof emergencyTypes[0] | null>(null)
  const [note, setNote] = useState("")
  const [activeSOS, setActiveSOS] = useState<SOSRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'confirm' | 'tracking'>('select')

  const handleCreateSOS = async () => {
    if (!selectedType) {
      toast.error("Please select an emergency type")
      return
    }

    try {
      setLoading(true)

      // Simulate getting location
      const locations = [
        "Main Gate Area",
        "Queue Zone - Section A",
        "Inner Sanctum Entrance",
        "Exit Gate B",
        "Prasad Counter Area"
      ]
      const location = locations[Math.floor(Math.random() * locations.length)]

      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType.type,
          priority: selectedType.priority,
          description: note || `${selectedType.label} reported`,
          location,
          reporterName: "Pilgrim User",
          reporterPhone: "+91 98765 43210"
        }),
      })

      if (!res.ok) throw new Error("Failed to create SOS")

      const newSOS = await res.json()
      setActiveSOS(newSOS)
      setStep('tracking')
      toast.success('Emergency alert sent!', {
        description: 'Help is on the way'
      })

      // Simulate status update
      setTimeout(() => {
        setActiveSOS(prev => prev ? { ...prev, status: 'assigned' } : null)
        toast.success('Responder assigned!', {
          description: 'Unit is en route to your location'
        })
      }, 3000)

    } catch (error) {
      toast.error("Failed to create SOS. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetSOS = () => {
    setActiveSOS(null)
    setSelectedType(null)
    setNote("")
    setStep('select')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-background dark:from-red-950/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pilgrim">
              <Button variant="ghost" size="icon" className="hover:bg-red-500/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/25"
              >
                <Siren className="w-5 h-5" />
              </motion.div>
              <div>
                <span className="font-bold text-lg text-red-600">Emergency SOS</span>
                <p className="text-xs text-muted-foreground">DARSHAN.AI</p>
              </div>
            </div>
          </div>
          <Link href="/pilgrim">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Emergency Type */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="p-6 border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-red-600">Emergency Alert</h2>
                    <p className="text-sm text-muted-foreground">Select the type of emergency</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {emergencyTypes.map((option, index) => (
                    <motion.button
                      key={option.type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        setSelectedType(option)
                        setStep('confirm')
                      }}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all hover:scale-[1.02] ${option.color}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          option.priority === 'critical' ? 'bg-red-600 text-white' :
                          option.priority === 'high' ? 'bg-orange-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {option.priority.toUpperCase()}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>

              <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    <strong>Important:</strong> Only use for genuine emergencies. Misuse is punishable by law.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Confirm and Add Details */}
          {step === 'confirm' && selectedType && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className={`p-6 border-2 ${selectedType.color}`}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{selectedType.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedType.label}</h2>
                    <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    placeholder="Describe your situation briefly..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background resize-none"
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-background/50 rounded-xl mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Your location will be shared automatically</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>Responders will contact you via phone</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('select')
                      setSelectedType(null)
                    }}
                    className="py-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    onClick={handleCreateSOS}
                    disabled={loading}
                    className="py-6 bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Siren className="w-5 h-5 mr-2" />
                    )}
                    {loading ? "Sending..." : "SEND ALERT"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Tracking Active SOS */}
          {step === 'tracking' && activeSOS && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="p-6 border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-center mb-6"
                >
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 mb-1">Alert Sent!</h2>
                  <p className="text-muted-foreground">Help is on the way</p>
                </motion.div>

                {/* Status Indicator */}
                <div className="p-4 bg-background rounded-xl mb-6">
                  <div className="flex justify-between items-center mb-4">
                    {['pending', 'assigned', 'resolved'].map((status, i) => (
                      <div key={status} className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.2 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            activeSOS.status === status 
                              ? 'bg-green-500 text-white' 
                              : ['pending', 'assigned', 'resolved'].indexOf(activeSOS.status) >= i
                                ? 'bg-green-500 text-white'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {['pending', 'assigned', 'resolved'].indexOf(activeSOS.status) >= i ? '✓' : i + 1}
                        </motion.div>
                        <span className="text-xs mt-1 capitalize">{status}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emergency Type</span>
                      <span className="font-semibold capitalize">{activeSOS.type.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-semibold capitalize ${
                        activeSOS.status === 'assigned' ? 'text-orange-600' :
                        activeSOS.status === 'resolved' ? 'text-green-600' :
                        'text-yellow-600'
                      }`}>
                        {activeSOS.status === 'assigned' ? 'Unit En Route' : activeSOS.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-semibold">{activeSOS.location}</span>
                    </div>
                  </div>
                </div>

                {activeSOS.status === 'assigned' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl mb-6 flex items-center gap-3"
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {activeSOS.type === 'medical' ? (
                        <Ambulance className="w-8 h-8 text-orange-600" />
                      ) : (
                        <Shield className="w-8 h-8 text-orange-600" />
                      )}
                    </motion.div>
                    <div>
                      <p className="font-bold text-orange-700 dark:text-orange-400">
                        {activeSOS.type === 'medical' ? 'Ambulance' : 'Security Unit'} dispatched
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-500">
                        Estimated arrival: 5-8 minutes
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <Button className="w-full py-6 bg-green-600 hover:bg-green-700">
                    <Phone className="w-5 h-5 mr-2" />
                    Call Responder
                  </Button>
                  <Button variant="outline" onClick={resetSOS} className="w-full">
                    Close & Return
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-800 dark:text-blue-400 mb-2">What to do now:</p>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-500">
                  <li>• Stay calm and keep your phone accessible</li>
                  <li>• Stay in your current location if safe</li>
                  <li>• Responder will contact you shortly</li>
                  <li>• Wave to the emergency personnel when they arrive</li>
                </ul>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
