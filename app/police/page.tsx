"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Radio, 
  CheckCircle2, 
  Shield,
  Users,
  MapPin,
  Clock,
  RefreshCw,
  ArrowLeft,
  Phone,
  Siren,
  UserCheck,
  TrendingUp,
  Bell,
  FileText,
  Navigation,
  Layers,
  ArrowUpCircle,
  Send,
  Grid3X3,
  BarChart3,
  X,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

interface SOSIncident {
  id: string
  type: string
  priority: string
  status: string
  location: string
  description: string
  created_at: string
  reporter_name: string
  reporter_phone: string
  assigned_unit_id?: string
  resolved_at?: string
}

interface SecurityUnit {
  id: string
  unit_name: string
  personnel_count: number
  status: string
  current_location: string
  unit_type?: 'police' | 'barricade' | 'crowd-control'
}

interface ZoneStats {
  id: string
  zone_name: string
  current_count: number
  capacity: number
  crowd_level: string
  entry_rate?: number
  exit_rate?: number
}

interface Alert {
  id: string
  type: 'overcrowding' | 'bottleneck' | 'entry-congestion' | 'exit-congestion'
  zone: string
  message: string
  severity: 'warning' | 'critical'
  timestamp: Date
}

interface IncidentReport {
  id: string
  type: string
  location: string
  description: string
  severity: string
  status: 'reported' | 'escalated' | 'resolved'
  reportedBy: string
  timestamp: Date
  escalatedTo?: string
}

export default function PoliceBoard() {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("incidents")
  const [incidents, setIncidents] = useState<SOSIncident[]>([])
  const [units, setUnits] = useState<SecurityUnit[]>([])
  const [zones, setZones] = useState<ZoneStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [newReport, setNewReport] = useState({
    type: 'crowd-surge',
    location: '',
    description: '',
    severity: 'medium'
  })

  // Generate alerts based on zone data
  const generateAlerts = (zonesData: ZoneStats[]): Alert[] => {
    const newAlerts: Alert[] = []
    zonesData.forEach(zone => {
      const percentage = zone.capacity > 0 ? (zone.current_count / zone.capacity) * 100 : 0
      
      if (percentage >= 95) {
        newAlerts.push({
          id: `alert-${zone.id}-overcrowd`,
          type: 'overcrowding',
          zone: zone.zone_name,
          message: `CRITICAL: ${zone.zone_name} at ${Math.round(percentage)}% capacity - Immediate action required`,
          severity: 'critical',
          timestamp: new Date()
        })
      } else if (percentage >= 80) {
        newAlerts.push({
          id: `alert-${zone.id}-warning`,
          type: 'overcrowding',
          zone: zone.zone_name,
          message: `WARNING: ${zone.zone_name} approaching capacity (${Math.round(percentage)}%)`,
          severity: 'warning',
          timestamp: new Date()
        })
      }
      
      // Simulate bottleneck detection based on entry/exit rates
      if (zone.entry_rate && zone.exit_rate && zone.entry_rate > zone.exit_rate * 2) {
        newAlerts.push({
          id: `alert-${zone.id}-bottleneck`,
          type: 'bottleneck',
          zone: zone.zone_name,
          message: `Bottleneck detected at ${zone.zone_name} - Entry rate exceeds exit rate`,
          severity: 'warning',
          timestamp: new Date()
        })
      }
    })
    return newAlerts
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [sosRes, unitsRes, zonesRes] = await Promise.all([
        fetch("/api/sos?type=security"),
        fetch("/api/security-units"),
        fetch("/api/zones")
      ])

      if (sosRes.ok) {
        const data = await sosRes.json()
        setIncidents(data)
      }

      if (unitsRes.ok) {
        const data = await unitsRes.json()
        // Enhance units with types for deployment dashboard
        const enhancedUnits = data.map((u: SecurityUnit, i: number) => ({
          ...u,
          unit_type: i % 3 === 0 ? 'police' : i % 3 === 1 ? 'barricade' : 'crowd-control'
        }))
        setUnits(enhancedUnits)
      }

      if (zonesRes.ok) {
        const data = await zonesRes.json()
        // Enhance with entry/exit rates for congestion monitoring
        const zonesArray = Array.isArray(data) ? data : [data]
        const enhancedZones = zonesArray.map((z: ZoneStats) => ({
          ...z,
          entry_rate: Math.floor(Math.random() * 50) + 10,
          exit_rate: Math.floor(Math.random() * 40) + 10
        }))
        setZones(enhancedZones)
        setAlerts(generateAlerts(enhancedZones))
      }
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  const handleDispatch = async (incidentId: string, unitId: string) => {
    try {
      setDispatchingId(incidentId)
      
      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: incidentId,
          action: 'assign',
          unitId,
          unitType: 'security'
        }),
      })

      if (res.ok) {
        toast.success('Unit dispatched successfully')
        await fetchData()
      } else {
        toast.error('Failed to dispatch unit')
      }
    } catch (err) {
      toast.error('Dispatch error')
    } finally {
      setDispatchingId(null)
    }
  }

  const handleResolve = async (incidentId: string) => {
    try {
      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: incidentId,
          action: 'resolve'
        }),
      })

      if (res.ok) {
        toast.success('Incident resolved')
        await fetchData()
      }
    } catch (err) {
      toast.error('Failed to resolve incident')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-900/20"
      case "high":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
    }
  }

  // Handle incident report submission
  const handleSubmitReport = async () => {
    if (!newReport.location || !newReport.description) {
      toast.error('Please fill in all required fields')
      return
    }
    
    const report: IncidentReport = {
      id: `RPT-${Date.now()}`,
      ...newReport,
      status: 'reported',
      reportedBy: 'Control Room',
      timestamp: new Date()
    }
    
    setIncidentReports(prev => [report, ...prev])
    setNewReport({ type: 'crowd-surge', location: '', description: '', severity: 'medium' })
    setShowReportForm(false)
    toast.success('Incident reported successfully')
  }

  // Handle escalation
  const handleEscalate = (reportId: string, escalateTo: string) => {
    setIncidentReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, status: 'escalated', escalatedTo: escalateTo } : r
    ))
    toast.success(`Incident escalated to ${escalateTo}`)
  }

  const pendingCount = incidents.filter(i => i.status === 'pending').length
  const assignedCount = incidents.filter(i => i.status === 'assigned').length
  const availableUnits = units.filter(u => u.status === 'available').length

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-8 h-8 text-accent" />
        </motion.div>
        <p className="text-muted-foreground">Loading security dashboard...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'incidents', label: 'Active Incidents', icon: AlertTriangle, count: pendingCount },
    { id: 'heatmap', label: 'Crowd Heatmap', icon: Grid3X3 },
    { id: 'deployment', label: 'Deployment', icon: Navigation },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'zones', label: 'Entry/Exit', icon: MapPin }
  ]

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const policeUnits = units.filter(u => u.unit_type === 'police')
  const barricadeUnits = units.filter(u => u.unit_type === 'barricade')
  const crowdControlUnits = units.filter(u => u.unit_type === 'crowd-control')

  return (
    <ProtectedRoute allowedRoles={['police', 'admin']}>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-accent/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/60 rounded-xl flex items-center justify-center text-accent-foreground font-bold shadow-lg shadow-accent/25">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-accent">Security Control</span>
                <p className="text-xs text-muted-foreground">DARSHAN.AI - Police Portal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Sign Out Button */}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            {/* Alerts Button */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowAlerts(!showAlerts)}
                className={`hover:bg-accent/10 ${criticalAlerts > 0 ? 'text-red-500' : ''}`}
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white ${
                    criticalAlerts > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                  }`}>
                    {alerts.length}
                  </span>
                )}
              </Button>
              
              {/* Alerts Panel */}
              <AnimatePresence>
                {showAlerts && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-card border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="p-3 border-b flex justify-between items-center">
                      <h4 className="font-bold text-sm">Early Warning Alerts</h4>
                      <Button variant="ghost" size="icon" onClick={() => setShowAlerts(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {alerts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No active alerts
                      </div>
                    ) : (
                      <div className="divide-y">
                        {alerts.map(alert => (
                          <div 
                            key={alert.id} 
                            className={`p-3 ${
                              alert.severity === 'critical' 
                                ? 'bg-red-50 dark:bg-red-900/20' 
                                : 'bg-orange-50 dark:bg-orange-900/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                                alert.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{alert.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(alert.timestamp, 'HH:mm:ss')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-accent/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">Exit</Button>
            </Link>
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
          <Card className="p-4 border-l-4 border-l-red-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-red-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Need response</p>
              </div>
              <Siren className="w-8 h-8 text-red-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-orange-600">{assignedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Units deployed</p>
              </div>
              <Radio className="w-8 h-8 text-orange-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Available Units</p>
                <p className="text-3xl font-bold text-green-600">{availableUnits}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready to deploy</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-accent bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-3xl font-bold text-accent">{units.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Personnel: {units.reduce((sum, u) => sum + u.personnel_count, 0)}</p>
              </div>
              <Shield className="w-8 h-8 text-accent/30" />
            </div>
          </Card>
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
                className={`whitespace-nowrap gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25' 
                    : 'hover:bg-accent/10'
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
          {/* Incidents Tab */}
          {activeTab === "incidents" && (
            <motion.div
              key="incidents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {incidents.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">All Clear</h3>
                  <p className="text-muted-foreground">No active security incidents</p>
                </Card>
              ) : (
                incidents.map((incident, index) => {
                  const priority = (incident.priority ?? 'unknown').toString()
                  const status = (incident.status ?? 'unknown').toString()
                  return (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`p-5 border-l-4 ${getPriorityColor(priority)}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-5 h-5 ${
                              incident.priority === 'critical' ? 'text-red-600' :
                              incident.priority === 'high' ? 'text-orange-600' :
                              'text-yellow-600'
                            }`} />
                            <h3 className="font-bold text-lg">{incident.description}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{incident.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{format(new Date(incident.created_at), 'HH:mm:ss')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{incident.reporter_phone}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            priority === 'critical' ? 'bg-red-600 text-white' :
                            priority === 'high' ? 'bg-orange-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {priority.toUpperCase()}
                          </span>
                          <p className={`text-xs font-semibold mt-2 ${
                            status === 'pending' ? 'text-red-600' :
                            status === 'assigned' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {status.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {incident.status === "pending" && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-2">Dispatch Unit:</p>
                          <div className="flex flex-wrap gap-2">
                            {units.filter(u => u.status === 'available').map((unit) => (
                              <Button
                                key={unit.id}
                                onClick={() => handleDispatch(incident.id, unit.id)}
                                disabled={dispatchingId === incident.id}
                                size="sm"
                                className="bg-accent hover:bg-accent/90"
                              >
                                <Radio className="w-3 h-3 mr-1" />
                                {unit.unit_name} ({unit.personnel_count} personnel)
                              </Button>
                            ))}
                            {units.filter(u => u.status === 'available').length === 0 && (
                              <p className="text-sm text-muted-foreground">No available units</p>
                            )}
                          </div>
                        </div>
                      )}

                      {incident.status === "assigned" && (
                        <div className="flex items-center justify-between mt-2 p-3 bg-background/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Radio className="w-4 h-4 text-orange-600" />
                            </motion.div>
                            <span className="text-sm font-medium">
                              Unit deployed - En route to location
                            </span>
                          </div>
                          <Button
                            onClick={() => handleResolve(incident.id)}
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Resolved
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )})
              )}
            </motion.div>
          )}

          {/* Heatmap Tab - Live Crowd Heatmaps */}
          {activeTab === "heatmap" && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-accent" />
                  Live Crowd Heatmap - Temple Zones
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {zones.map((zone) => {
                    const percentage = zone.capacity > 0 ? (zone.current_count / zone.capacity) * 100 : 0
                    const heatColor = percentage >= 90 ? 'from-red-500 to-red-600' :
                                      percentage >= 70 ? 'from-orange-500 to-orange-600' :
                                      percentage >= 50 ? 'from-yellow-500 to-yellow-600' :
                                      'from-green-500 to-green-600'
                    
                    return (
                      <motion.div
                        key={zone.id}
                        className={`relative p-4 rounded-xl bg-gradient-to-br ${heatColor} text-white overflow-hidden`}
                        animate={percentage >= 90 ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="relative z-10">
                          <h4 className="font-bold text-sm">{zone.zone_name}</h4>
                          <p className="text-2xl font-bold mt-1">{Math.round(percentage)}%</p>
                          <p className="text-xs opacity-80">{zone.current_count?.toLocaleString() ?? 0} / {zone.capacity?.toLocaleString() ?? 'N/A'}</p>
                        </div>
                        {percentage >= 80 && (
                          <motion.div
                            className="absolute inset-0 bg-white/20"
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Congestion Points Legend */}
                <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Congestion Legend
                  </h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      <span>Normal (0-50%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500" />
                      <span>Moderate (50-70%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-500" />
                      <span>High (70-90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500 animate-pulse" />
                      <span>Critical (90%+)</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Entry/Exit Congestion Points */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-accent" />
                  Entry/Exit Congestion Monitoring
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="p-4 border rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">{zone.zone_name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          (zone.entry_rate ?? 0) > (zone.exit_rate ?? 0) * 1.5 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {(zone.entry_rate ?? 0) > (zone.exit_rate ?? 0) * 1.5 ? 'CONGESTING' : 'FLOWING'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <p className="text-muted-foreground">Entry Rate</p>
                          <p className="text-lg font-bold text-green-600">{zone.entry_rate ?? 0}/min</p>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <p className="text-muted-foreground">Exit Rate</p>
                          <p className="text-lg font-bold text-red-600">{zone.exit_rate ?? 0}/min</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Deployment Dashboard Tab */}
          {activeTab === "deployment" && (
            <motion.div
              key="deployment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Deployment Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Police Units</p>
                      <p className="text-2xl font-bold">{policeUnits.length}</p>
                      <p className="text-xs text-green-600">{policeUnits.filter(u => u.status === 'available').length} available</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center gap-3">
                    <Layers className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Barricades</p>
                      <p className="text-2xl font-bold">{barricadeUnits.length}</p>
                      <p className="text-xs text-green-600">{barricadeUnits.filter(u => u.status === 'available').length} available</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Crowd Control</p>
                      <p className="text-2xl font-bold">{crowdControlUnits.length}</p>
                      <p className="text-xs text-green-600">{crowdControlUnits.filter(u => u.status === 'available').length} available</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Police Personnel */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Police Personnel Deployment
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {policeUnits.map((unit, index) => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border rounded-xl ${
                        unit.status === 'available' 
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                          : 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{unit.unit_name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{unit.current_location}
                          </p>
                          <p className="text-sm text-muted-foreground">{unit.personnel_count} personnel</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          unit.status === 'available' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                        }`}>
                          {(unit.status ?? 'unknown').toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Barricades & Crowd Control */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-orange-500" />
                    Barricade Units
                  </h3>
                  <div className="space-y-3">
                    {barricadeUnits.map((unit) => (
                      <div key={unit.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{unit.unit_name}</p>
                          <p className="text-xs text-muted-foreground">{unit.current_location}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          unit.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {(unit.status ?? 'unknown').toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {barricadeUnits.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No barricade units</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Crowd Control Units
                  </h3>
                  <div className="space-y-3">
                    {crowdControlUnits.map((unit) => (
                      <div key={unit.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{unit.unit_name}</p>
                          <p className="text-xs text-muted-foreground">{unit.current_location}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          unit.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {(unit.status ?? 'unknown').toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {crowdControlUnits.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No crowd control units</p>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Reports Tab - Incident Reporting & Escalation */}
          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* New Report Button */}
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Incident Reporting & Escalation</h3>
                <Button onClick={() => setShowReportForm(true)} className="bg-accent hover:bg-accent/90">
                  <FileText className="w-4 h-4 mr-2" />
                  New Incident Report
                </Button>
              </div>

              {/* Report Form Modal */}
              <AnimatePresence>
                {showReportForm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowReportForm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-card rounded-xl p-6 w-full max-w-md"
                      onClick={e => e.stopPropagation()}
                    >
                      <h3 className="font-bold text-lg mb-4">Report New Incident</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Incident Type</label>
                          <select 
                            className="w-full p-2 border rounded-lg bg-background"
                            value={newReport.type}
                            onChange={e => setNewReport({...newReport, type: e.target.value})}
                          >
                            <option value="crowd-surge">Crowd Surge</option>
                            <option value="stampede-risk">Stampede Risk</option>
                            <option value="fight">Fight/Altercation</option>
                            <option value="theft">Theft</option>
                            <option value="suspicious">Suspicious Activity</option>
                            <option value="lost-person">Lost Person</option>
                            <option value="infrastructure">Infrastructure Issue</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Location *</label>
                          <input 
                            type="text"
                            className="w-full p-2 border rounded-lg bg-background"
                            placeholder="e.g., Main Gate, Queue Area"
                            value={newReport.location}
                            onChange={e => setNewReport({...newReport, location: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Description *</label>
                          <textarea 
                            className="w-full p-2 border rounded-lg bg-background h-24"
                            placeholder="Describe the incident..."
                            value={newReport.description}
                            onChange={e => setNewReport({...newReport, description: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Severity</label>
                          <select 
                            className="w-full p-2 border rounded-lg bg-background"
                            value={newReport.severity}
                            onChange={e => setNewReport({...newReport, severity: e.target.value})}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" onClick={() => setShowReportForm(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleSubmitReport} className="flex-1 bg-accent hover:bg-accent/90">
                            <Send className="w-4 h-4 mr-2" />
                            Submit
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Incident Reports List */}
              <Card className="p-6">
                <h4 className="font-bold mb-4">Recent Incident Reports</h4>
                {incidentReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No incident reports yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidentReports.map((report) => (
                      <div key={report.id} className={`p-4 border rounded-xl ${
                        report.severity === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
                        report.severity === 'high' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' :
                        'border-border'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{report.type.replace('-', ' ').toUpperCase()}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                report.status === 'escalated' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {report.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {report.location} • {format(report.timestamp, 'HH:mm:ss')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            report.severity === 'critical' ? 'bg-red-600 text-white' :
                            report.severity === 'high' ? 'bg-orange-600 text-white' :
                            report.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {report.severity.toUpperCase()}
                          </span>
                        </div>
                        {report.status === 'reported' && (
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEscalate(report.id, 'District SP')}
                              className="text-xs"
                            >
                              <ArrowUpCircle className="w-3 h-3 mr-1" />
                              Escalate to SP
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEscalate(report.id, 'Medical Team')}
                              className="text-xs"
                            >
                              <ArrowUpCircle className="w-3 h-3 mr-1" />
                              Escalate to Medical
                            </Button>
                          </div>
                        )}
                        {report.escalatedTo && (
                          <p className="text-xs text-purple-600 mt-2 font-medium">
                            ↗ Escalated to: {report.escalatedTo}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Zones Tab - Entry/Exit Monitoring */}
          {activeTab === "zones" && (
            <motion.div
              key="zones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Live Crowd Monitoring
                </h3>
                <div className="space-y-4">
                  {zones.map((zone) => {
                    const safeCurrent = zone.current_count ?? 0
                    const safeCapacity = zone.capacity ?? 0
                    const percentage = safeCapacity > 0 ? Math.round((safeCurrent / safeCapacity) * 100) : 0
                    const isCritical = zone.crowd_level === 'Critical'
                    const isHigh = zone.crowd_level === 'High'
                    
                    return (
                      <div 
                        key={zone.id} 
                        className={`p-4 border rounded-xl ${
                          isCritical ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                          isHigh ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                          'border-border'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-5 h-5 ${
                              isCritical ? 'text-red-600' : 
                              isHigh ? 'text-orange-600' : 
                              'text-accent'
                            }`} />
                            <h4 className="font-semibold text-lg">{zone.zone_name}</h4>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              zone.crowd_level === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              zone.crowd_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              zone.crowd_level === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {zone.crowd_level}
                            </span>
                            <p className="text-2xl font-bold mt-1">{(zone.current_count ?? 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
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
                        <p className="text-sm text-muted-foreground mt-2">
                          {percentage}% of {safeCapacity > 0 ? safeCapacity.toLocaleString() : 'N/A'} capacity
                        </p>
                        {isCritical && (
                          <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">
                              ALERT: Critical crowd density - Consider restricting entry
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {zones.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No zone data available</p>
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
