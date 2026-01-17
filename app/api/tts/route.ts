import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY
    if (!elevenlabsApiKey) {
      return NextResponse.json({ 
        useBrowserTTS: true,
        message: 'ElevenLabs not configured'
      }, { status: 200 })
    }

    console.log('[TTS] Generating speech for:', text.slice(0, 50))

    // Use ElevenLabs for ultra-natural voice
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[TTS] ElevenLabs error:', error)
      return NextResponse.json({ 
        useBrowserTTS: true,
        message: 'TTS failed'
      }, { status: 200 })
    }

    const audioBuffer = await response.arrayBuffer()
    console.log('[TTS] Success:', audioBuffer.byteLength, 'bytes')
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('[TTS] Error:', error)
    return NextResponse.json({ 
      useBrowserTTS: true,
      message: 'TTS error'
    }, { status: 200 })
  }
}
