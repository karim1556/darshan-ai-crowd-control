"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  CheckCircle2, 
  Zap, 
  Ambulance,
  MapPin,
  Clock,
  Phone,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Users,
  Activity,
  Stethoscope,
  Navigation,
  FileText,
  Plus,
  X,
  Send,
  Route,
  Building2,
  Cross,
  LogOut
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { NotificationBell } from "@/components/notification-bell"

interface SOSCase {
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
  assigned_resource_type?: 'ambulance' | 'booth' | 'team'
  assigned_resource_name?: string
  eta?: number
  dispatched_at?: string
  resolved_at?: string
}

interface AmbulanceUnit {
  id: string
  unit_name: string
  paramedic_count: number
  status: string
  current_location: string
}

interface MedicalBooth {
  id: string
  name: string
  location: string
  status: 'open' | 'busy' | 'closed'
  staff_count: number
  equipment: string[]
}

interface FirstAidTeam {
  id: string
  team_name: string
  members: number
  zone: string
  status: 'available' | 'responding' | 'busy'
}

interface IncidentLog {
  id: string
  caseId: string
  action: string
  timestamp: Date
  performedBy: string
  notes?: string
}

export default function MedicalDashboard() {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("sos")
  const [sosCases, setSOSCases] = useState<SOSCase[]>([])
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dispatchingId, setDispatchingId] = useState<string | null>(null)
  
  // New state for enhanced features
  const [medicalBooths, setMedicalBooths] = useState<MedicalBooth[]>([])
  const [firstAidTeams, setFirstAidTeams] = useState<FirstAidTeam[]>([])
  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([])

  // Initialize mock data for medical resources
  useEffect(() => {
    // Medical Booths
    setMedicalBooths([
      { id: 'mb-1', name: 'Main Gate Medical', location: 'Main Entrance', status: 'open', staff_count: 3, equipment: ['Oxygen', 'Stretcher', 'First Aid'] },
      { id: 'mb-2', name: 'Queue Area Booth', location: 'Queue Zone A', status: 'busy', staff_count: 2, equipment: ['First Aid', 'Wheelchair'] },
      { id: 'mb-3', name: 'Inner Temple Medical', location: 'Inner Sanctum', status: 'open', staff_count: 4, equipment: ['Oxygen', 'Defibrillator', 'Stretcher', 'First Aid'] },
      { id: 'mb-4', name: 'Exit Area Booth', location: 'Exit Gate', status: 'open', staff_count: 2, equipment: ['First Aid', 'Stretcher'] },
    ])
    
    // First Aid Teams
    setFirstAidTeams([
      { id: 'fa-1', team_name: 'Alpha Response', members: 4, zone: 'Main Gate', status: 'available' },
      { id: 'fa-2', team_name: 'Beta Response', members: 3, zone: 'Queue Area', status: 'responding' },
      { id: 'fa-3', team_name: 'Gamma Response', members: 4, zone: 'Inner Temple', status: 'available' },
      { id: 'fa-4', team_name: 'Delta Response', members: 3, zone: 'Exit Zone', status: 'available' },
    ])
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [sosRes, ambulanceRes] = await Promise.all([
        fetch("/api/sos?type=medical"),
        fetch("/api/ambulances")
      ])

      if (sosRes.ok) {
        const data = await sosRes.json()
        setSOSCases(data)
      }

      if (ambulanceRes.ok) {
        const data = await ambulanceRes.json()
        setAmbulances(data)
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

  const handleDispatch = async (sosId: string, resourceId: string, resourceType: 'ambulance' | 'booth' | 'team') => {
    try {
      setDispatchingId(sosId)

      // Get resource name for display
      let resourceName = ''
      if (resourceType === 'ambulance') {
        const amb = ambulances.find(a => a.id === resourceId)
        resourceName = amb?.unit_name || ''
      } else if (resourceType === 'booth') {
        const booth = medicalBooths.find(b => b.id === resourceId)
        resourceName = booth?.name || ''
      } else if (resourceType === 'team') {
        const team = firstAidTeams.find(t => t.id === resourceId)
        resourceName = team?.team_name || ''
      }

      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sosId,
          action: 'assign',
          unitId: resourceId,
          unitType: resourceType,
          resourceName: resourceName
        }),
      })

      if (res.ok) {
        const resourceTypeLabel = resourceType === 'ambulance' ? 'Ambulance' : 
                            resourceType === 'booth' ? 'Medical Booth' : 'First Aid Team'
        toast.success(`${resourceTypeLabel} assigned!`)
        // Log the dispatch
        addIncidentLog(sosId, `${resourceTypeLabel} Assigned`, `Assigned ${resourceName}`)
        
        // Update local state immediately
        setSOSCases(prev => prev.map(c => 
          c.id === sosId 
            ? { ...c, status: 'assigned', assigned_resource_type: resourceType, assigned_resource_name: resourceName }
            : c
        ))
        
        // Update resource status
        if (resourceType === 'ambulance') {
          setAmbulances(prev => prev.map(a => 
            a.id === resourceId ? { ...a, status: 'deployed' } : a
          ))
        } else if (resourceType === 'booth') {
          setMedicalBooths(prev => prev.map(b => 
            b.id === resourceId ? { ...b, status: 'busy' } : b
          ))
        } else if (resourceType === 'team') {
          setFirstAidTeams(prev => prev.map(t => 
            t.id === resourceId ? { ...t, status: 'responding' } : t
          ))
        }
        
        await fetchData()
      } else {
        toast.error('Failed to assign resource')
      }
    } catch (err) {
      toast.error('Assignment error')
    } finally {
      setDispatchingId(null)
    }
  }

  const handleResolve = async (sosId: string) => {
    try {
      // Find the SOS case to get assigned resource info
      const sosCase = sosCases.find(s => s.id === sosId)
      
      const res = await fetch("/api/sos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sosId,
          action: 'resolve'
        }),
      })

      if (res.ok) {
        toast.success('Case resolved')
        // Log the resolution
        addIncidentLog(sosId, 'Case Resolved', 'Emergency resolved successfully')
        
        // Free up the assigned resource
        if (sosCase?.assigned_resource_type && sosCase.assigned_unit_id) {
          if (sosCase.assigned_resource_type === 'ambulance') {
            setAmbulances(prev => prev.map(a => 
              a.id === sosCase.assigned_unit_id ? { ...a, status: 'available' } : a
            ))
          } else if (sosCase.assigned_resource_type === 'booth') {
            setMedicalBooths(prev => prev.map(b => 
              b.id === sosCase.assigned_unit_id ? { ...b, status: 'open' } : b
            ))
          } else if (sosCase.assigned_resource_type === 'team') {
            setFirstAidTeams(prev => prev.map(t => 
              t.id === sosCase.assigned_unit_id ? { ...t, status: 'available' } : t
            ))
          }
        }
        
        await fetchData()
      }
    } catch (err) {
      toast.error('Failed to resolve')
    }
  }

  // Add incident log entry
  const addIncidentLog = (caseId: string, action: string, notes?: string) => {
    const log: IncidentLog = {
      id: `log-${Date.now()}`,
      caseId,
      action,
      timestamp: new Date(),
      performedBy: 'Medical Control',
      notes
    }
    setIncidentLogs(prev => [log, ...prev])
  }

  // Find nearest available resource
  const findNearestResource = (location: string, resourceType: 'ambulance' | 'booth' | 'team') => {
    if (resourceType === 'ambulance') {
      return ambulances.find(a => a.status === 'available')
    } else if (resourceType === 'booth') {
      return medicalBooths.find(b => b.status === 'open')
    } else {
      return firstAidTeams.find(t => t.status === 'available')
    }
  }

  // Priority routing recommendation
  const getPriorityRoute = (sosCase: SOSCase) => {
    const priority = (sosCase.priority ?? 'medium').toLowerCase()
    if (priority === 'critical') {
      return 'Use Emergency Lane - Clear all traffic'
    } else if (priority === 'high') {
      return 'Priority Route via Gate A - Minimal crowd'
    }
    return 'Standard Route - Queue Zone path'
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

  const pendingCount = sosCases.filter(s => s.status === 'pending').length
  const assignedCount = sosCases.filter(s => s.status === 'assigned').length
  const availableAmbulances = ambulances.filter(a => a.status === 'available').length

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Heart className="w-8 h-8 text-red-500" />
        </motion.div>
        <p className="text-muted-foreground">Loading medical dashboard...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'sos', label: 'Medical SOS', icon: Heart, count: pendingCount },
    { id: 'resources', label: 'Resources Map', icon: MapPin },
    { id: 'ambulances', label: 'Ambulance Fleet', icon: Ambulance },
    { id: 'logs', label: 'Incident Logs', icon: FileText },
    { id: 'stats', label: 'Statistics', icon: Activity }
  ]

  const availableBooths = medicalBooths.filter(b => b.status === 'open').length
  const availableTeams = firstAidTeams.filter(t => t.status === 'available').length

  return (
    <ProtectedRoute allowedRoles={['medical', 'admin']}>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-500/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover:bg-red-500/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/25">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-red-600">Medical Response</span>
                <p className="text-xs text-muted-foreground">DARSHAN.AI - Emergency Services</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-red-500/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
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
          <Card className="p-4 border-l-4 border-l-red-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Pending SOS</p>
                <p className="text-3xl font-bold text-red-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Need response</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-orange-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">En Route</p>
                <p className="text-3xl font-bold text-orange-600">{assignedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Dispatched</p>
              </div>
              <Ambulance className="w-8 h-8 text-orange-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-3xl font-bold text-green-600">{availableAmbulances}</p>
                <p className="text-xs text-muted-foreground mt-1">Ambulances</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600/30" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500 bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Fleet</p>
                <p className="text-3xl font-bold text-blue-600">{ambulances.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ambulances.reduce((sum, a) => sum + a.paramedic_count, 0)} paramedics
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600/30" />
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
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25' 
                    : 'hover:bg-red-500/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white text-red-600">
                    {tab.count}
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* SOS Tab */}
          {activeTab === "sos" && (
            <motion.div
              key="sos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {sosCases.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">All Clear</h3>
                  <p className="text-muted-foreground">No active medical emergencies</p>
                </Card>
              ) : (
                <>
                  {sosCases.map((sos, index) => {
                    const safePriorityRaw = (sos.priority ?? 'unknown').toString()
                    const safePriority = safePriorityRaw.toLowerCase()
                    const displayPriority = safePriorityRaw.toUpperCase()
                    const safeStatusRaw = (sos.status ?? 'unknown').toString()
                    const safeStatus = safeStatusRaw.toLowerCase()
                    const displayStatus = safeStatusRaw.toUpperCase()
  
                    return (
                      <motion.div
                        key={sos.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`p-5 border-l-4 ${getPriorityColor(safePriority)}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <motion.div
                                  animate={safePriority === 'critical' ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                  <Heart className={`w-5 h-5 ${
                                    safePriority === 'critical' ? 'text-red-600' :
                                    safePriority === 'high' ? 'text-orange-600' :
                                    'text-yellow-600'
                                  }`} />
                                </motion.div>
                                <h3 className="font-bold text-lg">{sos.description}</h3>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{sos.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{format(new Date(sos.created_at), 'HH:mm:ss')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />{sos.reporter_phone}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                safePriority === 'critical' ? 'bg-red-600 text-white' :
                                safePriority === 'high' ? 'bg-orange-600 text-white' :
                                'bg-yellow-600 text-white'
                              }`}>
                                {displayPriority}
                              </span>
                              <p className={`text-xs font-semibold mt-2 ${
                                safeStatus === 'pending' ? 'text-red-600' :
                                safeStatus === 'assigned' ? 'text-orange-600' :
                                'text-green-600'
                              }`}>
                                {displayStatus}
                              </p>
                            </div>
                          </div>
  
                          {sos.status === "pending" && (
                            <div className="space-y-3">
                              {/* Priority Routing Recommendation */}
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
                                <Route className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-700 dark:text-blue-400">
                                  <strong>Recommended Route:</strong> {getPriorityRoute(sos)}
                                </span>
                              </div>
                              
                              {/* Ambulances */}
                              <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <Ambulance className="w-4 h-4" />
                                  Dispatch Ambulance:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {ambulances.filter(a => a.status === 'available').map((amb) => (
                                    <Button
                                      key={amb.id}
                                      onClick={() => handleDispatch(sos.id, amb.id, 'ambulance')}
                                      disabled={dispatchingId === sos.id}
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      {amb.unit_name} ({amb.paramedic_count} paramedics)
                                    </Button>
                                  ))}
                                  {ambulances.filter(a => a.status === 'available').length === 0 && (
                                    <p className="text-sm text-muted-foreground">No available ambulances</p>
                                  )}
                                </div>
                              </div>

                              {/* Medical Booths */}
                              <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <Building2 className="w-4 h-4" />
                                  Assign to Medical Booth:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {medicalBooths.filter(b => b.status === 'open').map((booth) => (
                                    <Button
                                      key={booth.id}
                                      onClick={() => handleDispatch(sos.id, booth.id, 'booth')}
                                      disabled={dispatchingId === sos.id}
                                      size="sm"
                                      variant="outline"
                                      className="border-green-500 text-green-600 hover:bg-green-50"
                                    >
                                      <Building2 className="w-3 h-3 mr-1" />
                                      {booth.name} ({booth.staff_count} staff)
                                    </Button>
                                  ))}
                                  {medicalBooths.filter(b => b.status === 'open').length === 0 && (
                                    <p className="text-sm text-muted-foreground">No available booths</p>
                                  )}
                                </div>
                              </div>

                              {/* First Aid Teams */}
                              <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Send First Aid Team:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {firstAidTeams.filter(t => t.status === 'available').map((team) => (
                                    <Button
                                      key={team.id}
                                      onClick={() => handleDispatch(sos.id, team.id, 'team')}
                                      disabled={dispatchingId === sos.id}
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Users className="w-3 h-3 mr-1" />
                                      {team.team_name} ({team.members} members)
                                    </Button>
                                  ))}
                                  {firstAidTeams.filter(t => t.status === 'available').length === 0 && (
                                    <p className="text-sm text-muted-foreground">No available teams</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
  
                          {sos.status === "assigned" && (
                            <div className="flex items-center justify-between mt-2 p-3 bg-background/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  {sos.assigned_resource_type === 'ambulance' ? (
                                    <Ambulance className="w-5 h-5 text-orange-600" />
                                  ) : sos.assigned_resource_type === 'booth' ? (
                                    <Building2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Users className="w-5 h-5 text-blue-600" />
                                  )}
                                </motion.div>
                                <span className="text-sm font-medium">
                                  {sos.assigned_resource_type === 'ambulance' ? 'Ambulance en route to patient' :
                                   sos.assigned_resource_type === 'booth' ? 'Patient directed to medical booth' :
                                   'First aid team responding'}
                                  {sos.assigned_resource_name && ` - ${sos.assigned_resource_name}`}
                                </span>
                              </div>
                              <Button
                                onClick={() => handleResolve(sos.id)}
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
                    )
                  })}
                </>
              )}
            </motion.div>
          )}

          {/* Ambulances Tab */}
          {activeTab === "ambulances" && (
            <motion.div
              key="ambulances"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-red-600" />
                  Ambulance Fleet Status
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ambulances.map((amb, index) => (
                    <motion.div
                      key={amb.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border rounded-xl ${
                        amb.status === 'available' 
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                          : 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{amb.unit_name}</h4>
                          <p className="text-sm text-muted-foreground">{amb.current_location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          amb.status === 'available' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-orange-600 text-white'
                        }`}>
                          {amb.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{amb.paramedic_count} paramedics + 1 driver</span>
                      </div>
                      {amb.status === 'deployed' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 flex items-center gap-2 text-orange-600"
                        >
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Ambulance className="w-4 h-4" />
                          </motion.div>
                          <span className="text-sm font-medium">Responding to emergency</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  {ambulances.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Ambulance className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No ambulances configured</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Resources Map Tab - Medical Booths, First Aid Teams */}
          {activeTab === "resources" && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Resource Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Medical Booths</p>
                      <p className="text-2xl font-bold">{medicalBooths.length}</p>
                      <p className="text-xs text-green-600">{availableBooths} open</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">First Aid Teams</p>
                      <p className="text-2xl font-bold">{firstAidTeams.length}</p>
                      <p className="text-xs text-green-600">{availableTeams} available</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-red-500">
                  <div className="flex items-center gap-3">
                    <Ambulance className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ambulances</p>
                      <p className="text-2xl font-bold">{ambulances.length}</p>
                      <p className="text-xs text-green-600">{availableAmbulances} available</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Medical Booths */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Medical Booths
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {medicalBooths.map((booth) => (
                    <div 
                      key={booth.id}
                      className={`p-4 border rounded-xl ${
                        booth.status === 'open' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                        booth.status === 'busy' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' :
                        'border-gray-300 bg-gray-50 dark:bg-gray-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{booth.name}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{booth.location}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          booth.status === 'open' ? 'bg-green-600 text-white' :
                          booth.status === 'busy' ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {booth.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{booth.staff_count} staff
                        </span>
                        <span className="flex items-center gap-1">
                          <Cross className="w-3 h-3" />{booth.equipment.length} equipment
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {booth.equipment.map((eq, i) => (
                          <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{eq}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* First Aid Teams */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  First Aid Response Teams
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {firstAidTeams.map((team) => (
                    <div 
                      key={team.id}
                      className={`p-4 border rounded-xl ${
                        team.status === 'available' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                        team.status === 'responding' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' :
                        'border-red-300 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm">{team.team_name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          team.status === 'available' ? 'bg-green-600 text-white' :
                          team.status === 'responding' ? 'bg-orange-600 text-white' :
                          'bg-red-600 text-white'
                        }`}>
                          {team.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{team.zone}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />{team.members} members
                      </p>
                      {team.status === 'responding' && (
                        <motion.div
                          className="mt-2 flex items-center gap-1 text-orange-600"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Navigation className="w-3 h-3" />
                          <span className="text-xs font-medium">En route</span>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Incident Logs Tab */}
          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Emergency Incident Logs & Response Tracking
                </h3>
                
                {incidentLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No incident logs yet</p>
                    <p className="text-sm">Logs will appear when dispatches and resolutions occur</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidentLogs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                log.action.includes('Dispatch') ? 'bg-blue-100 text-blue-800' :
                                log.action.includes('Resolved') ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.action}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Case: {log.caseId.slice(0, 8)}...
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                            )}
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>{format(log.timestamp, 'HH:mm:ss')}</p>
                            <p>{log.performedBy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Response Time Stats */}
              <Card className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  Response Time Tracking
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-3xl font-bold text-green-600">4.2 min</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground">Cases Resolved Today</p>
                    <p className="text-3xl font-bold text-blue-600">{incidentLogs.filter(l => l.action.includes('Resolved')).length}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground">Total Actions</p>
                    <p className="text-3xl font-bold text-purple-600">{incidentLogs.length}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    Response Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">Total Cases Today</p>
                      <p className="text-3xl font-bold text-red-600">{sosCases.length}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">Critical Cases</p>
                      <p className="text-3xl font-bold text-red-600">
                        {sosCases.filter(s => s.priority === 'critical').length}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {ambulances.length > 0 
                          ? Math.round((ambulances.filter(a => a.status === 'deployed').length / ambulances.length) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Case Distribution
                  </h3>
                  <div className="space-y-4">
                    {['critical', 'high', 'medium', 'low'].map((priority) => {
                      const count = sosCases.filter(s => s.priority === priority).length
                      const percentage = sosCases.length > 0 ? Math.round((count / sosCases.length) * 100) : 0
                      
                      return (
                        <div key={priority} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{priority} Priority</span>
                            <span className="text-muted-foreground">{count} cases ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-full rounded-full ${
                                priority === 'critical' ? 'bg-red-500' :
                                priority === 'high' ? 'bg-orange-500' :
                                priority === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </ProtectedRoute>
  )
}