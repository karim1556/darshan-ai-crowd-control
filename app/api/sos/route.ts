import { NextRequest, NextResponse } from 'next/server'
import { 
  createSOSRequest, 
  getSOSRequests, 
  getActiveSOSRequests,
  getMedicalSOSRequests,
  getSecuritySOSRequests,
  updateSOSRequest, 
  assignSOSRequest, 
  resolveSOSRequest 
} from '@/lib/api'

// Default SOS cases for when DB is empty
const DEFAULT_SOS_CASES = [
  {
    id: 'sos-1',
    type: 'medical',
    priority: 'critical',
    status: 'pending',
    location: 'Main Gate Area',
    description: 'Elderly person feeling dizzy',
    reporter_name: 'John',
    reporter_phone: '9876543210',
    created_at: new Date().toISOString()
  },
  {
    id: 'sos-2',
    type: 'medical',
    priority: 'high',
    status: 'pending',
    location: 'Queue Zone B',
    description: 'Child with fever',
    reporter_name: 'Mary',
    reporter_phone: '9876543211',
    created_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'sos-3',
    type: 'security',
    priority: 'medium',
    status: 'pending',
    location: 'Exit Gate',
    description: 'Lost child reported',
    reporter_name: 'Admin',
    reporter_phone: '9876543212',
    created_at: new Date(Date.now() - 600000).toISOString()
  }
]

function formatSOSCase(sos: any) {
  return {
    id: sos.id,
    type: sos.type || 'medical',
    priority: sos.severity || sos.priority || 'medium',
    status: (sos.status || 'pending').toLowerCase(),
    location: sos.note?.includes('Location:') 
      ? sos.note.split('Location:')[1]?.split('|')[0]?.trim() 
      : sos.location || 'Unknown Location',
    description: sos.note?.split('|')[0]?.trim() || sos.description || 'Emergency reported',
    reporter_name: sos.note?.includes('Reporter:') 
      ? sos.note.split('Reporter:')[1]?.split('|')[0]?.trim() 
      : sos.reporter_name || 'Anonymous',
    reporter_phone: sos.note?.includes('Phone:') 
      ? sos.note.split('Phone:')[1]?.trim() 
      : sos.reporter_phone || 'N/A',
    created_at: sos.created_at || new Date().toISOString(),
    assigned_unit_id: sos.assigned_to,
    eta: sos.eta,
    dispatched_at: sos.status === 'Assigned' || sos.status === 'Enroute' ? sos.updated_at : undefined,
    resolved_at: sos.resolved_at
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const filter = searchParams.get('filter')

    let requests: any[] = []

    if (filter === 'medical' || type === 'medical') {
      requests = await getMedicalSOSRequests()
    } else if (filter === 'security' || type === 'security') {
      requests = await getSecuritySOSRequests()
    } else if (filter === 'active') {
      requests = await getActiveSOSRequests()
    } else {
      requests = await getSOSRequests({ type: type || undefined, status: status || undefined })
    }

    // If no requests found, return default cases for demo purposes
    if (!requests || requests.length === 0) {
      const filteredDefaults = DEFAULT_SOS_CASES.filter(sos => {
        if (filter === 'medical' || type === 'medical') return sos.type === 'medical'
        if (filter === 'security' || type === 'security') return sos.type === 'security'
        return true
      })
      return NextResponse.json(filteredDefaults)
    }

    // Format the responses
    const formattedRequests = requests.map(formatSOSCase)
    return NextResponse.json(formattedRequests)
  } catch (error: any) {
    console.error('Error fetching SOS requests:', error)
    // Return defaults on error
    return NextResponse.json(DEFAULT_SOS_CASES)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      bookingId,
      type,
      severity,
      lat,
      lng,
      note,
      priority,
      description,
      location,
      reporterName,
      reporterPhone
    } = body

    if (!type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 })
    }

    // Normalize severity/priority
    const sev = severity || priority || 'medium'

    // Fallback for missing coordinates - store as 0,0 and include textual location in note
    const safeLat = typeof lat === 'number' ? lat : 0
    const safeLng = typeof lng === 'number' ? lng : 0

    const combinedNote = [description || note, location ? `Location: ${location}` : null, reporterName ? `Reporter: ${reporterName}` : null, reporterPhone ? `Phone: ${reporterPhone}` : null]
      .filter(Boolean)
      .join(' | ')

    const sos = await createSOSRequest({
      userId: userId || null,
      bookingId,
      type,
      severity: sev,
      lat: safeLat,
      lng: safeLng,
      note: combinedNote || undefined
    })

    return NextResponse.json(sos, { status: 201 })
  } catch (error: any) {
    console.error('Error creating SOS request:', error)
    return NextResponse.json({ error: error.message || 'Failed to create SOS request' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, assignedTo, eta, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'SOS ID required' }, { status: 400 })
    }

    let result
    if (action === 'assign') {
      result = await assignSOSRequest(id, assignedTo, eta)
    } else if (action === 'resolve') {
      result = await resolveSOSRequest(id)
    } else if (action === 'pending') {
      result = await updateSOSRequest(id, { status: 'Pending', assigned_to: null, eta: null })
    } else if (action === 'enroute') {
      result = await updateSOSRequest(id, { status: 'Enroute', eta })
    } else {
      result = await updateSOSRequest(id, updates)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating SOS request:', error)
    return NextResponse.json({ error: error.message || 'Failed to update SOS request' }, { status: 500 })
  }
}
