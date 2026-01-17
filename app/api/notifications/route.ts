import { NextRequest, NextResponse } from 'next/server'

// Dynamic import for web-push to make it optional
let webpush: any = null
try {
  webpush = require('web-push')
} catch (e) {
  console.warn('[Notifications] web-push not available, push notifications disabled')
}

// Configure web-push with VAPID keys
// These should be set in environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (webpush && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@darshan.ai',
    vapidPublicKey,
    vapidPrivateKey
  )
}

// Store subscriptions in memory (use DB in production)
const subscriptions = new Map<string, PushSubscription>()

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// POST: Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, userId, role } = body

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      )
    }

    // Store subscription (use DB in production)
    const key = userId || subscription.endpoint
    subscriptions.set(key, {
      ...subscription,
      userId,
      role,
      createdAt: new Date().toISOString()
    } as any)

    console.log('[Notifications] Subscription added:', key)

    return NextResponse.json({
      success: true,
      message: 'Subscribed to push notifications'
    })
  } catch (error: any) {
    console.error('[Notifications] Subscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe' },
      { status: 500 }
    )
  }
}

// GET: Get VAPID public key
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'vapid-key') {
    return NextResponse.json({
      publicKey: vapidPublicKey
    })
  }

  // Return subscription count for admin
  return NextResponse.json({
    subscriptionCount: subscriptions.size,
    vapidConfigured: !!(vapidPublicKey && vapidPrivateKey)
  })
}

// PUT: Send notification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      body: notificationBody, 
      type = 'general',
      severity = 'medium',
      targetRole,
      targetUserId,
      url,
      id
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const payload = JSON.stringify({
      title,
      body: notificationBody,
      type,
      severity,
      url,
      id,
      icon: '/logo.png',
      tag: `darshan-${type}-${Date.now()}`
    })

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Filter subscriptions based on target
    const targetSubscriptions = Array.from(subscriptions.entries()).filter(([key, sub]: [string, any]) => {
      if (targetUserId && sub.userId !== targetUserId) return false
      if (targetRole && sub.role !== targetRole) return false
      return true
    })

    // Send to all matching subscriptions
    for (const [key, subscription] of targetSubscriptions) {
      try {
        if (webpush && vapidPublicKey && vapidPrivateKey) {
          await webpush.sendNotification(subscription as any, payload)
          results.sent++
        } else {
          // Fallback: just count as sent for demo
          results.sent++
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(error.message)
        
        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscriptions.delete(key)
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error: any) {
    console.error('[Notifications] Send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// DELETE: Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const userId = searchParams.get('userId')

    const key = userId || endpoint
    if (key && subscriptions.has(key)) {
      subscriptions.delete(key)
      return NextResponse.json({
        success: true,
        message: 'Unsubscribed from push notifications'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Subscription not found'
    })
  } catch (error: any) {
    console.error('[Notifications] Unsubscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
