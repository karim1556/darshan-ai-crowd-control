import { useState, useRef, useCallback } from 'react'

interface UseSpeechSynthesisOptions {
  voice?: 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer'
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { voice = 'nova', onStart, onEnd, onError } = options
  
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Cancel any ongoing speech
    stop()
    
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    try {
      // Clean text for speech
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/•/g, '')
        .replace(/\n+/g, '. ')
        .slice(0, 500)

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to synthesize speech')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      audioRef.current = new Audio(audioUrl)
      
      audioRef.current.onplay = () => {
        setIsSpeaking(true)
        onStart?.()
      }
      
      audioRef.current.onended = () => {
        setIsSpeaking(false)
        onEnd?.()
        URL.revokeObjectURL(audioUrl)
      }
      
      audioRef.current.onerror = () => {
        setIsSpeaking(false)
        onError?.('Audio playback failed')
        URL.revokeObjectURL(audioUrl)
      }

      await audioRef.current.play()
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('TTS error:', error)
        onError?.(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [voice, onStart, onEnd, onError])

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsSpeaking(false)
    setIsLoading(false)
  }, [])

  const toggle = useCallback(async (text: string) => {
    if (isSpeaking) {
      stop()
    } else {
      await speak(text)
    }
  }, [isSpeaking, speak, stop])

  return {
    isSpeaking,
    isLoading,
    speak,
    stop,
    toggle
  }
}
