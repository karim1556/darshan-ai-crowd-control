"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { 
  Users, 
  ShieldAlert, 
  Heart, 
  BarChart3, 
  Sparkles, 
  Calendar,
  QrCode,
  Activity,
  ArrowRight,
  CheckCircle2,
  Zap,
  LogIn
} from "lucide-react"

const features = [
  { icon: Calendar, text: "Smart Slot Booking" },
  { icon: QrCode, text: "QR Ticket Generation" },
  { icon: Activity, text: "Real-time Crowd Monitoring" },
  { icon: Zap, text: "Emergency SOS Dispatch" },
]

const roleCards = [
  {
    role: "Pilgrim",
    icon: Users,
    color: "from-primary to-primary/60",
    shadowColor: "shadow-primary/25",
    href: "/pilgrim",
    description: "Book slots, view QR tickets, monitor crowds, request SOS",
    features: ["Book Darshan Slots", "Digital QR Tickets", "Live Crowd Status", "Emergency SOS"]
  },
  {
    role: "Temple Admin",
    icon: BarChart3,
    color: "from-secondary to-secondary/60",
    shadowColor: "shadow-secondary/25",
    href: "/admin",
    description: "Check-in pilgrims, manage slots, monitor capacity",
    features: ["QR Check-In", "Slot Management", "Zone Monitoring", "Booking Overview"]
  },
  {
    role: "Police/Security",
    icon: ShieldAlert,
    color: "from-accent to-accent/60",
    shadowColor: "shadow-accent/25",
    href: "/police",
    description: "Monitor security incidents, dispatch units, respond to SOS",
    features: ["Incident Response", "Unit Dispatch", "Crowd Alerts", "Zone Security"]
  },
  {
    role: "Medical Team",
    icon: Heart,
    color: "from-red-500 to-red-600",
    shadowColor: "shadow-red-500/25",
    href: "/medical",
    description: "Dispatch ambulances, manage medical SOS, track resources",
    features: ["Ambulance Dispatch", "Emergency Response", "Fleet Tracking", "Triage Priority"]
  },
]

export default function LandingPage() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25"
              >
                <img src="/logo.png" alt="DARSHAN.AI" className="w-8 h-8 object-contain" />
              </motion.div>
            <div>
              <span className="text-xl font-bold text-primary">DARSHAN.AI</span>
              <p className="text-xs text-muted-foreground">Temple Crowd Management</p>
            </div>
          </div>
          {loading ? (
            <Button className="bg-primary/60 shadow-lg shadow-primary/25 opacity-70 cursor-wait" disabled>
              Loading...
            </Button>
          ) : user ? (
            <Button
              onClick={async () => {
                try {
                  await signOut()
                } catch (e) {
                  console.error('Sign out failed', e)
                } finally {
                  // Force full reload to ensure cookies/localStorage cleared
                  window.location.href = '/'
                }
              }}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Sign Out
            </Button>
          ) : (
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Crowd Management</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              Smart Temple & Pilgrimage
              <span className="text-primary"> Crowd Control</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
              Real-time crowd monitoring, smart slot booking, QR ticketing, and emergency response 
              for safe and seamless pilgrimage experiences.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link href="/pilgrim/book">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 gap-2">
                  <Calendar className="w-5 h-5" />
                  Book Darshan Slot
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="gap-2">
                  <Activity className="w-5 h-5" />
                  View Live Demo
                </Button>
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </section>

        {/* Role Selection Cards */}
        <section className="container mx-auto px-4 pb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Choose Your Portal</h2>
            <p className="text-muted-foreground">Select your role to access the appropriate dashboard</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roleCards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.role}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Link href={card.href}>
                    <Card className="p-6 h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
                      <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${card.shadowColor} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {card.role}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-4">
                        {card.description}
                      </p>
                      
                      <ul className="space-y-2 mb-4">
                        {card.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Enter Portal
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Tech Stack / Footer */}
        <section className="border-t border-border bg-card/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Built with</span>
                <span className="font-semibold text-foreground">Next.js</span>
                <span>•</span>
                <span className="font-semibold text-foreground">Supabase</span>
                <span>•</span>
                <span className="font-semibold text-foreground">Shadcn UI</span>
                <span>•</span>
                <span className="font-semibold text-foreground">Tailwind CSS</span>
              </div>
              <div className="text-sm text-muted-foreground">
                🙏 DARSHAN.AI - Hackathon Project
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
