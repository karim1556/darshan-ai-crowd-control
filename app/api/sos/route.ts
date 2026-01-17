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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const filter = searchParams.get('filter')

    if (filter === 'medical') {
      const requests = await getMedicalSOSRequests()
      return NextResponse.json(requests)
    }

    if (filter === 'security') {
      const requests = await getSecuritySOSRequests()
      return NextResponse.json(requests)
    }

    if (filter === 'active') {
      const requests = await getActiveSOSRequests()
      return NextResponse.json(requests)
    }

    const requests = await getSOSRequests({ type: type || undefined, status: status || undefined })
    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Error fetching SOS requests:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch SOS requests' }, { status: 500 })
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
