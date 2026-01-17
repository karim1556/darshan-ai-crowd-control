import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET user's favorites
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('user_music_favorites')
      .select(`
        *,
        track:holy_music(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      favorites: data?.map((f: any) => f.track) || []
    })
  } catch (error: any) {
    console.error('Favorites API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, trackId } = body

    if (!userId || !trackId) {
      return NextResponse.json(
        { error: 'User ID and Track ID are required' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('user_music_favorites')
      .insert({ user_id: userId, music_id: trackId })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already in favorites' })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Added to favorites'
    })
  } catch (error: any) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const trackId = searchParams.get('trackId')

    if (!userId || !trackId) {
      return NextResponse.json(
        { error: 'User ID and Track ID are required' },
        { status: 400 }
      )
    }

    const { error } = await (supabase as any)
      .from('user_music_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('music_id', trackId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites'
    })
  } catch (error: any) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
