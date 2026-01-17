import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@deepgram/sdk'

// Use Node.js runtime for file handling
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const deepgramApiKey = process.env.DEEPGRAM_API_KEY
    if (!deepgramApiKey) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 })
    }

    console.log('[Transcribe] Received audio:', audioFile.size, 'bytes')

    // Convert to buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use Deepgram for transcription (better than Whisper)
    const deepgram = createClient(deepgramApiKey)
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        language: 'en',
        detect_language: false,
      }
    )

    if (error) {
      console.error('[Transcribe] Deepgram error:', error)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || ''
    console.log('[Transcribe] Success:', transcript.slice(0, 100))
    
    return NextResponse.json({ text: transcript })
  } catch (error) {
    console.error('[Transcribe] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
