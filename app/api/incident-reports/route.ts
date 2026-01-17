import { NextRequest, NextResponse } from 'next/server'
import { 
  getIncidentReports, 
  createIncidentReport, 
  escalateIncidentReport, 
  resolveIncidentReport 
} from '@/lib/api'

export async function GET() {
  try {
    const reports = await getIncidentReports()
    return NextResponse.json(reports)
  } catch (error: any) {
    console.error('Error fetching incident reports:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'escalate') {
      if (!data.id || !data.escalateTo) {
        return NextResponse.json({ error: 'Report ID and escalateTo required' }, { status: 400 })
      }
      const result = await escalateIncidentReport(data.id, data.escalateTo)
      return NextResponse.json(result)
    }

    if (action === 'resolve') {
      if (!data.id) {
        return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
      }
      const result = await resolveIncidentReport(data.id)
      return NextResponse.json(result)
    }

    // Create new report
    const { type, location, description, severity, reportedBy } = data

    if (!type || !location || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const report = await createIncidentReport({
      type,
      location,
      description,
      severity: severity || 'medium',
      reportedBy
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error: any) {
    console.error('Error processing incident report:', error)
    return NextResponse.json({ error: error.message || 'Failed to process report' }, { status: 500 })
  }
}
