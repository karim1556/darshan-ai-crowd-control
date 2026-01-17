import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all music tracks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const deity = searchParams.get('deity')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    let query = (supabase as any)
      .from('holy_music')
      .select('*')
      .order('plays_count', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (deity && deity !== 'all') {
      query = query.eq('deity', deity)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%,deity.ilike.%${search}%`)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error

    return NextResponse.json({
      success: true,
      tracks: data || []
    })
  } catch (error: any) {
    console.error('Music API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch music' },
      { status: 500 }
    )
  }
}

// POST - Add a new track (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, artist, album, category, duration, audioUrl, coverImage, deity, language, isFeatured } = body

    if (!title || !audioUrl || !duration) {
      return NextResponse.json(
        { error: 'Title, audio URL, and duration are required' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .from('holy_music')
      .insert({
        title,
        artist,
        album,
        category: category || 'bhajan',
        duration,
        audio_url: audioUrl,
        cover_image: coverImage,
        deity,
        language: language || 'Hindi',
        is_featured: isFeatured || false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      track: data
    })
  } catch (error: any) {
    console.error('Music creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add track' },
      { status: 500 }
    )
  }
}

// PATCH - Increment play count
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackId, userId } = body

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    // Increment play count
    const { error: updateError } = await (supabase as any).rpc('increment_plays', { track_id: trackId })
    
    // If RPC doesn't exist, do manual update
    if (updateError) {
      await (supabase as any)
        .from('holy_music')
        .update({ plays_count: (supabase as any).sql`plays_count + 1` })
        .eq('id', trackId)
    }

    // Log play history
    if (userId) {
      await (supabase as any)
        .from('music_play_history')
        .insert({ user_id: userId, music_id: trackId })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Play count update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update play count' },
      { status: 500 }
    )
  }
}
