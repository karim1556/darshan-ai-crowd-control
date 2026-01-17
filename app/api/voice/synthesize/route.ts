import { NextRequest, NextResponse } from 'next/server'

// Text-to-speech endpoint - returns text for browser-based TTS
// Since we're using Groq (which doesn't have TTS), the client will use Web Speech API
export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'default' } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Clean the text for speech (remove markdown)
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/•/g, '')
      .replace(/\n+/g, '. ')
      .slice(0, 1000)

    // Return the cleaned text for browser-based TTS
    // The client will use Web Speech API (SpeechSynthesis)
    return NextResponse.json({
      success: true,
      text: cleanText,
      voice: voice,
      method: 'browser-tts',
      message: 'Use Web Speech API on client side for synthesis'
    })
  } catch (error: unknown) {
    console.error('TTS error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process text'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET endpoint to list available voices
export async function GET() {
  return NextResponse.json({
    status: 'Text-to-Speech API (Browser-based)',
    method: 'Web Speech API',
    message: 'TTS is handled client-side using the browser Web Speech API',
    voices: 'Available voices depend on the user browser and operating system'
  })
}
