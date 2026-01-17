"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, ShieldAlert, Heart, BarChart3 } from "lucide-react"

export default function DemoPage() {
  const router = useRouter()

  const handleSeedData = async () => {
    // Call API to seed data
    await fetch("/api/demo/seed", { method: "POST" })
    alert("Demo data seeded successfully!")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">DARSHAN.AI Demo</h1>
          <p className="text-lg text-muted-foreground mb-8">Select your role to explore the system</p>
          <Button onClick={handleSeedData} className="mb-8">
            Seed Demo Data
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="p-8 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/pilgrim")}
          >
            <Users className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pilgrim/Devotee</h2>
            <p className="text-muted-foreground mb-6">Book slots, view tickets, check crowd levels, and request SOS</p>
            <Button className="w-full">Enter as Pilgrim</Button>
          </Card>

          <Card className="p-8 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/admin")}>
            <BarChart3 className="w-12 h-12 text-secondary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Temple Admin</h2>
            <p className="text-muted-foreground mb-6">Manage slots, check-in bookings, and monitor crowd</p>
            <Button className="w-full">Enter as Admin</Button>
          </Card>

          <Card className="p-8 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/police")}>
            <ShieldAlert className="w-12 h-12 text-accent mb-4" />
            <h2 className="text-2xl font-bold mb-2">Police/Security</h2>
            <p className="text-muted-foreground mb-6">Monitor incidents and assign security units</p>
            <Button className="w-full">Enter as Police</Button>
          </Card>

          <Card
            className="p-8 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/medical")}
          >
            <Heart className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Medical Emergency</h2>
            <p className="text-muted-foreground mb-6">Manage SOS cases and dispatch ambulances</p>
            <Button className="w-full">Enter as Medical</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
