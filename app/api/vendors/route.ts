import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all active vendors with their products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = (supabase as any)
      .from('vendors')
      .select(`
        *,
        products:vendor_products(*)
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      vendors: data || []
    })
  } catch (error: any) {
    console.error('Vendors API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

// POST - Register a new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, shopName, location, category } = body

    if (!name || !phone || !shopName || !location) {
      return NextResponse.json(
        { error: 'Name, phone, shop name, and location are required' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('vendors')
      .insert({
        name,
        phone,
        email,
        shop_name: shopName,
        location,
        category: category || 'flowers',
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      vendor: data,
      message: 'Vendor registered successfully!'
    })
  } catch (error: any) {
    console.error('Vendor registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to register vendor' },
      { status: 500 }
    )
  }
}
