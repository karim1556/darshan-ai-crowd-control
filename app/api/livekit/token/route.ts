import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

// LiveKit token generation for voice chat
export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, participantIdentity } = await request.json()

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    // Support both NEXT_PUBLIC_LIVEKIT_URL (common) and LIVEKIT_URL (legacy .env)
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL

    const missing: string[] = []
    if (!apiKey) missing.push('LIVEKIT_API_KEY')
    if (!apiSecret) missing.push('LIVEKIT_API_SECRET')
    if (!wsUrl) missing.push('NEXT_PUBLIC_LIVEKIT_URL or LIVEKIT_URL')

    if (missing.length) {
      return NextResponse.json(
        { error: `LiveKit credentials not configured. Missing: ${missing.join(', ')}` },
        { status: 500 }
      )
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity || `pilgrim-${Date.now()}`,
      name: participantName,
      // Token valid for 24 hours
      ttl: 60 * 60 * 24,
    })

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({
      token,
      wsUrl,
      roomName,
      participantName
    })
  } catch (error: any) {
    console.error('LiveKit token error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate token' },
      { status: 500 }
    )
  }
}

// GET endpoint for connection test
export async function GET() {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL
  const hasCredentials = !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET && wsUrl)

  return NextResponse.json({
    status: 'LiveKit Voice Chat API',
    configured: hasCredentials,
    wsUrl: wsUrl || 'Not configured',
    capabilities: [
      'Real-time voice chat',
      'Push-to-talk',
      'Voice activity detection',
      'Multi-participant support'
    ]
  })
}
