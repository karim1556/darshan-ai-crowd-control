import { NextRequest, NextResponse } from 'next/server'

// Voice-to-text transcription endpoint
// Since we're using Groq (which doesn't have STT), the client uses Web Speech API
export async function POST(request: NextRequest) {
  try {
    // This endpoint is kept for potential future integration with other STT services
    // Currently, speech-to-text is handled client-side using Web Speech API
    
    return NextResponse.json({
      success: true,
      message: 'Speech-to-text is handled client-side using Web Speech API',
      method: 'browser-stt',
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET endpoint for API info
export async function GET() {
  return NextResponse.json({
    status: 'Speech-to-Text API (Browser-based)',
    method: 'Web Speech API',
    message: 'STT is handled client-side using the browser Web Speech API (SpeechRecognition)',
    supportedLanguages: ['en-IN', 'en-US', 'hi-IN']
  })
}
