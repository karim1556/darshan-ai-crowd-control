import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Generate order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// GET orders for a vendor or pilgrim
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const pilgrimPhone = searchParams.get('phone')
    const orderId = searchParams.get('orderId')

    let query = (supabase as any)
      .from('vendor_orders')
      .select(`
        *,
        vendor:vendors(name, shop_name, phone, location)
      `)
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }

    if (pilgrimPhone) {
      query = query.eq('pilgrim_phone', pilgrimPhone)
    }

    const { data, error } = await query.limit(50)

    if (error) throw error

    return NextResponse.json({
      success: true,
      orders: data || []
    })
  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      vendorId, 
      pilgrimName, 
      pilgrimPhone, 
      pilgrimLocation, 
      bookingId,
      items, 
      totalAmount,
      deliveryNotes 
    } = body

    if (!vendorId || !pilgrimName || !pilgrimPhone || !pilgrimLocation || !items || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const orderId = generateOrderId()

    const { data, error } = await (supabase as any)
      .from('vendor_orders')
      .insert({
        order_id: orderId,
        vendor_id: vendorId,
        pilgrim_name: pilgrimName,
        pilgrim_phone: pilgrimPhone,
        pilgrim_location: pilgrimLocation,
        booking_id: bookingId,
        items,
        total_amount: totalAmount,
        delivery_notes: deliveryNotes,
        status: 'pending',
        payment_status: 'pending'
      })
      .select(`
        *,
        vendor:vendors(name, shop_name, phone)
      `)
      .single()

    if (error) throw error

    // Update vendor's total orders
    await (supabase as any)
      .from('vendors')
      .update({ total_orders: (supabase as any).rpc('increment_orders', { vendor_id: vendorId }) })
      .eq('id', vendorId)

    return NextResponse.json({
      success: true,
      order: data,
      message: `Order ${orderId} placed successfully! Delivery in ~15 minutes.`
    })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, paymentStatus } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (status) updates.status = status
    if (paymentStatus) updates.payment_status = paymentStatus
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()

    const { data, error } = await (supabase as any)
      .from('vendor_orders')
      .update(updates)
      .eq('order_id', orderId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      order: data
    })
  } catch (error: any) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}
