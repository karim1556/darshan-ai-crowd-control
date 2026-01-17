import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk'

// LiveKit Webhook handler for room events
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    // Verify webhook
    const receiver = new WebhookReceiver(apiKey, apiSecret)
    const event = await receiver.receive(body, authHeader)

    console.log('LiveKit webhook event:', event.event)

    // Handle different events
    switch (event.event) {
      case 'room_started':
        console.log('Room started:', event.room?.name)
        break
      
      case 'participant_joined':
        console.log('Participant joined:', event.participant?.identity)
        // Could trigger AI agent to join here
        break
      
      case 'participant_left':
        console.log('Participant left:', event.participant?.identity)
        break
      
      case 'room_finished':
        console.log('Room finished:', event.room?.name)
        break
      
      case 'track_published':
        console.log('Track published:', event.track?.type)
        // When audio track is published, we could process it
        break
      
      default:
        console.log('Unhandled event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  return NextResponse.json({
    status: 'LiveKit Webhook Endpoint',
    configured: !!(apiKey && apiSecret && wsUrl),
    events: [
      'room_started',
      'room_finished', 
      'participant_joined',
      'participant_left',
      'track_published',
      'track_unpublished'
    ]
  })
}
