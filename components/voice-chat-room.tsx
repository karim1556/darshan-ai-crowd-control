'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  Bot,
  AlertCircle,
  User,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Room,
  RoomEvent,
  LocalAudioTrack,
  createLocalAudioTrack,
} from 'livekit-client'

interface VoiceChatRoomProps {
  userName: string
  userId?: string
  onClose?: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function VoiceChatRoom({ userName, userId, onClose }: VoiceChatRoomProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  
  const roomRef = useRef<Room | null>(null)
  const audioTrackRef = useRef<LocalAudioTrack | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const isRecordingRef = useRef(false)
  const isConnectedRef = useRef(false)
  const autoStartAttempts = useRef(0)
  const nativeStreamRef = useRef<MediaStream | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Track call duration
  useEffect(() => {
    if (!isConnected) return
    const interval = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isConnected])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Transcribe audio using Whisper via Groq
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      return data.text || ''
    } catch (err) {
      console.error('[VoiceChat] Transcription error:', err)
      return ''
    }
  }

  // Send message to AI
  const sendToAI = async (text: string) => {
    if (!text.trim() || isProcessing) return

    console.log('[VoiceChat] Sending to AI:', text)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsProcessing(true)

    try {
      const allMessages = [...messages, userMessage]
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          assistantMessage.content += chunk
          
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: assistantMessage.content }
                : m
            )
          )
        }
      }

      // Speak the response
      if (voiceEnabled && assistantMessage.content) {
        await speakText(assistantMessage.content)
      }
    } catch (err) {
      console.error('[VoiceChat] AI error:', err)
      setError('Failed to get AI response')
    } finally {
      setIsProcessing(false)
      // Resume recording after AI responds (with delay to ensure everything is ready)
      console.log('[VoiceChat] AI processing complete, resuming recording...')
      if (isConnected && !isMuted && !isSpeaking) {
        setTimeout(() => {
          console.log('[VoiceChat] Restarting recording after AI response')
          startRecording()
        }, 500)
      }
    }
  }

  // Text-to-speech with OpenAI TTS (fallback to browser)
  const speakText = async (text: string): Promise<void> => {
    if (!voiceEnabled || typeof window === 'undefined') {
      return
    }

    try {
      // Try OpenAI TTS first
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        
        // Check if we got audio back or fallback message
        if (contentType?.includes('audio')) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          
          setIsSpeaking(true)
          
          audio.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
          }
          
          audio.onerror = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
            // Fallback to browser TTS on error
            speakWithBrowserTTS(text)
          }
          
          await audio.play()
          return
        }
      }
    } catch (err) {
      console.error('[VoiceChat] TTS API error:', err)
    }

    // Fallback to browser TTS
    speakWithBrowserTTS(text)
  }

  // Browser TTS fallback
  const speakWithBrowserTTS = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/•/g, '')
        .replace(/\n+/g, '. ')
        .slice(0, 800)

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'en-IN'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => 
        v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'))
      ) || voices.find(v => v.lang.includes('en'))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    
    // Resume listening after stopping speech
    if (isConnected && !isMuted && !isProcessing && !isRecordingRef.current) {
      console.log('[VoiceChat] Resuming recording after stopping speech')
      setTimeout(() => startRecording(), 300)
    }
  }

  // Start recording audio via WebRTC  
  const startRecording = async () => {
    // Use ref for connection state (more reliable than state)
    if (!isConnectedRef.current || isRecordingRef.current || isMuted) {
      console.log('[VoiceChat] ❌ Cannot start recording:')
      console.log('  - Connected (ref):', isConnectedRef.current)
      console.log('  - Already recording:', isRecordingRef.current)
      console.log('  - Muted:', isMuted)
      console.log('  - Processing:', isProcessing)
      console.log('  - Speaking:', isSpeaking)
      
      // Auto-retry if just processing/speaking but connected
      if (isConnectedRef.current && !isRecordingRef.current && !isMuted && (isProcessing || isSpeaking)) {
        console.log('[VoiceChat] Will retry after processing/speaking...')
        setTimeout(() => startRecording(), 1000)
      }
      return
    }

    // Stop any existing recorder first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('[VoiceChat] Stopping existing recorder first...')
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Use our native stream instead of LiveKit's mediaStream
    const mediaStream = nativeStreamRef.current
    if (!mediaStream) {
      console.error('[VoiceChat] ❌ No native stream available!')
      return
    }

    // Verify stream is active
    if (!mediaStream.active) {
      console.error('[VoiceChat] ❌ Media stream is not active!')
      
      // Try to recreate stream from track
      const track = audioTrackRef.current?.mediaStreamTrack
      if (track && track.readyState === 'live') {
        console.log('[VoiceChat] Recreating stream from live track...')
        nativeStreamRef.current = new MediaStream([track])
        // Retry with new stream
        setTimeout(() => startRecording(), 500)
      }
      return
    }

    console.log('[VoiceChat] Media stream info:')
    console.log('  - Active:', mediaStream.active)
    console.log('  - Tracks:', mediaStream.getTracks().length)
    console.log('  - Audio tracks:', mediaStream.getAudioTracks().length)
    
    const audioTracks = mediaStream.getAudioTracks()
    if (audioTracks.length === 0) {
      console.error('[VoiceChat] ❌ No audio tracks in stream!')
      return
    }
    
    const audioTrack = audioTracks[0]
    if (audioTrack.readyState !== 'live') {
      console.error('[VoiceChat] ❌ Audio track not live:', audioTrack.readyState)
      return
    }
    
    console.log('  - Track enabled:', audioTrack.enabled)
    console.log('  - Track state:', audioTrack.readyState)

    try {
      isRecordingRef.current = true
      audioChunksRef.current = []
      
      // Try different mimeTypes
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=vp8')) {
        mimeType = 'audio/webm;codecs=vp8'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      }
      
      console.log('[VoiceChat] Creating MediaRecorder with:', mimeType)
      
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        console.log('[VoiceChat] Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('[VoiceChat] Recording stopped, processing...')
        const wasRecording = isRecordingRef.current
        isRecordingRef.current = false
        setIsListening(false)
        
        if (audioChunksRef.current.length === 0 || audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0) < 1000) {
          console.log('[VoiceChat] Audio too small, restarting')
          // Only restart if we were actively recording (not manually stopped)
          if (wasRecording && isConnectedRef.current && !isMuted) {
            setTimeout(() => startRecording(), 500)
          }
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('[VoiceChat] Processing', audioBlob.size, 'bytes')
        
        setTranscript('Transcribing...')
        const text = await transcribeAudio(audioBlob)
        setTranscript('')
        
        if (text.trim() && text.length > 2) {
          console.log('[VoiceChat] Got text:', text)
          await sendToAI(text)
        } else {
          console.log('[VoiceChat] Empty transcription, restarting')
          // Restart listening after empty transcription
          if (isConnectedRef.current && !isMuted) {
            setTimeout(() => startRecording(), 500)
          }
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('[VoiceChat] MediaRecorder error:', event)
        isRecordingRef.current = false
        setIsListening(false)
        
        // Retry after error
        setTimeout(() => {
          if (isConnectedRef.current && !isMuted) {
            console.log('[VoiceChat] Retrying after MediaRecorder error...')
            startRecording()
          }
        }, 1000)
      }

      mediaRecorderRef.current = mediaRecorder
      
      // Start with a small timeslice to ensure we get data
      mediaRecorder.start(1000) // Request data every 1 second
      
      setIsListening(true)
      console.log('[VoiceChat] ✓✓✓ Recording STARTED - speak now! ✓✓✓')
      console.log('[VoiceChat] 🎤 MICROPHONE IS NOW ACTIVE AND LISTENING')

      // Voice activity detection for auto-stop
      setupVoiceActivityDetection(mediaStream)
      
      // Reset auto-start attempts since we're now recording
      autoStartAttempts.current = 0
    } catch (err) {
      console.error('[VoiceChat] ❌ Recording error:', err)
      console.error('Error details:', err)
      isRecordingRef.current = false
      setIsListening(false)
      
      // Try to restart after error
      setTimeout(() => {
        if (isConnected && !isMuted) {
          console.log('[VoiceChat] Retrying recording after error...')
          startRecording()
        }
      }, 1000)
    }
  }

  // Voice activity detection to auto-stop on silence
  const setupVoiceActivityDetection = (stream: MediaStream) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let silenceStart: number | null = null
      let hasSpoken = false
      const SILENCE_THRESHOLD = 30 // Adjusted for better detection
      const SILENCE_DURATION = 1800 // 1.8 seconds
      const MIN_SPEECH_DURATION = 500 // Must speak for at least 0.5s

      let speechStart: number | null = null

      const checkAudio = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
          return
        }

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length

        if (average > SILENCE_THRESHOLD) {
          if (!speechStart) {
            speechStart = Date.now()
          }
          if (Date.now() - speechStart > MIN_SPEECH_DURATION) {
            hasSpoken = true
          }
          silenceStart = null
        } else if (hasSpoken) {
          // Only count silence after minimum speech duration
          if (!silenceStart) {
            silenceStart = Date.now()
          } else if (Date.now() - silenceStart > SILENCE_DURATION) {
            console.log('[VoiceChat] VAD: Silence detected after speech')
            stopRecording()
            return
          }
        }

        requestAnimationFrame(checkAudio)
      }

      // Start checking after brief delay
      setTimeout(() => checkAudio(), 200)
    } catch (err) {
      console.error('[VoiceChat] VAD error:', err)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state
      console.log('[VoiceChat] Stopping recording, state:', state)
      
      if (state === 'recording') {
        mediaRecorderRef.current.stop()
      } else {
        // If not recording, reset state
        isRecordingRef.current = false
        setIsListening(false)
      }
    }
  }

  // Connect to LiveKit room
  const connect = async () => {
    setIsConnecting(true)
    setError(null)
    setMessages([])
    setDuration(0)

    try {
      // Request microphone permission first
      console.log('[VoiceChat] Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('[VoiceChat] ✓ Microphone permission granted')
      
      // Stop the test stream - LiveKit will create its own
      stream.getTracks().forEach(track => track.stop())

      // Get LiveKit token
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `voice-chat-${userId || 'guest'}-${Date.now()}`,
          participantName: userName,
        }),
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error || 'Failed to get token')
      }

      const { token, wsUrl } = await tokenResponse.json()
      const url = wsUrl || undefined
      console.log('[VoiceChat] Got token, connecting to LiveKit:', url)

      // Create room and connect
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })

      room.on(RoomEvent.Connected, () => {
        console.log('[VoiceChat] ✓ Connected to LiveKit room')
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('[VoiceChat] Disconnected from LiveKit room')
        setIsConnected(false)
      })

      await room.connect(url, token)
      roomRef.current = room

      // Create and publish audio track with WebRTC
      console.log('[VoiceChat] Creating audio track...')
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })

      await room.localParticipant.publishTrack(audioTrack)
      audioTrackRef.current = audioTrack
      
      // Get the underlying MediaStreamTrack and create a fresh MediaStream
      const mediaStreamTrack = audioTrack.mediaStreamTrack
      if (!mediaStreamTrack) {
        throw new Error('Failed to get MediaStreamTrack from audio track')
      }
      
      // Create our own MediaStream for recording (more reliable than LiveKit's)
      const nativeStream = new MediaStream([mediaStreamTrack])
      nativeStreamRef.current = nativeStream
      
      console.log('[VoiceChat] ✓ Audio track published')
      console.log('[VoiceChat] ✓ Created native MediaStream:', nativeStream.active)
      console.log('[VoiceChat] ✓ MediaStreamTrack state:', mediaStreamTrack.readyState)

      // Add welcome message
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: '🙏 Namaste! I\'m Darshan AI. How can I help you with your temple visit today? You can ask about crowd status, available slots, gate information, or anything else!',
        timestamp: new Date()
      }
      setMessages([welcomeMsg])
      setIsConnected(true)
      isConnectedRef.current = true // Set ref immediately
      
      console.log('[VoiceChat] ✓ Connection complete, starting auto-recording system...')

      // Start aggressive auto-recording with retries
      const attemptAutoStart = () => {
        autoStartAttempts.current++
        console.log(`[VoiceChat] 🎯 Auto-start attempt #${autoStartAttempts.current}`)
        
        if (autoStartAttempts.current <= 10 && isConnectedRef.current && !isRecordingRef.current && !isMuted) {
          startRecording()
          
          // Keep trying every 2 seconds until it works
          if (!isRecordingRef.current) {
            setTimeout(attemptAutoStart, 2000)
          }
        }
      }
      
      // First attempt after 1 second
      setTimeout(attemptAutoStart, 1000)

      // Speak welcome in background (don't block anything)
      if (voiceEnabled) {
        setTimeout(() => {
          speakText('Namaste! I\'m Darshan AI. How can I help you?').catch(err => {
            console.error('[VoiceChat] TTS error:', err)
          })
        }, 500)
      }
    } catch (err) {
      console.error('[VoiceChat] Connection error:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect')
      }
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect
  const disconnect = () => {
    stopRecording()
    stopSpeaking()

    if (audioTrackRef.current) {
      audioTrackRef.current.stop()
      audioTrackRef.current = null
    isConnectedRef.current = false
    autoStartAttempts.current = 0
    }

    if (roomRef.current) {
      roomRef.current.disconnect()
      roomRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setIsConnected(false)
    setIsListening(false)
    setMessages([])
    setDuration(0)
    onClose?.()
  }

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      if (audioTrackRef.current) {
        audioTrackRef.current.unmute()
      }
      if (isConnected && !isProcessing && !isSpeaking) {
        setTimeout(() => startRecording(), 100)
      }
    } else {
      setIsMuted(true)
      stopRecording()
      if (audioTrackRef.current) {
        audioTrackRef.current.mute()
      }
    }
  }

  // Toggle voice output
  const toggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking()
    }
    setVoiceEnabled(!voiceEnabled)
  }

  // Handle text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && !isProcessing) {
      stopRecording()
      sendToAI(textInput.trim())
      setTextInput('')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nativeStreamRef.current) {
        nativeStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
      }
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => setError(null)}>
            Dismiss
          </Button>
          <Button size="sm" onClick={connect}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Voice Assistant</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Talk to Darshan AI using LiveKit WebRTC. Real-time voice conversation with AI-powered assistance.
          </p>
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Start Voice Chat
              </>
            )}
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Connected via WebRTC</span>
            <span className="text-xs text-muted-foreground">• {formatDuration(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleVoice}
              title={voiceEnabled ? 'Mute AI voice' : 'Enable AI voice'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Avatars */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className={cn(
              "w-14 h-14 rounded-full bg-primary flex items-center justify-center transition-all",
              isListening && !isMuted && "ring-4 ring-green-400 ring-opacity-50 animate-pulse"
            )}>
              <span className="text-xl text-primary-foreground font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs mt-1 text-muted-foreground">You</p>
          </div>

          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: (isListening || isSpeaking) ? [8, 16, 8] : 8,
                  opacity: (isListening || isSpeaking) ? 1 : 0.3
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: (isListening || isSpeaking) ? Infinity : 0,
                  delay: i * 0.1 
                }}
                className="w-1 bg-green-500 rounded-full"
              />
            ))}
          </div>

          <div className="text-center">
            <div className={cn(
              "w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center transition-all",
              isSpeaking && "ring-4 ring-orange-400 ring-opacity-50 animate-pulse"
            )}>
              <Bot className="w-7 h-7 text-white" />
            </div>
            <p className="text-xs mt-1 text-muted-foreground">AI</p>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="h-48 overflow-y-auto p-4 space-y-3 bg-white/50 dark:bg-black/20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
            )}>
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-xl px-3 py-2 text-sm",
              message.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
            )}>
              {message.content}
            </div>
          </div>
        ))}

        {/* Processing/Transcribing indicator */}
        {(isProcessing || transcript) && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{transcript || 'Thinking...'}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-white/30 dark:bg-black/10 border-t border-green-200 dark:border-green-800">
        <p className="text-xs text-center font-medium">
          {isSpeaking 
            ? "🔊 AI is speaking..." 
            : isProcessing
              ? "🤔 Processing..."
              : transcript
                ? `🎙️ ${transcript}`
                : isListening && !isMuted
                  ? "🎤 LISTENING - Speak now!"
                  : isMuted
                    ? "🔇 Microphone muted"
                    : "⏸️ Not listening"}
        </p>
        {isListening && !isMuted && (
          <p className="text-[10px] text-center text-green-600 dark:text-green-400 mt-1 animate-pulse">
            Recording in progress - I can hear you!
          </p>
        )}
      </div>

      {/* Text input fallback */}
      <form onSubmit={handleTextSubmit} className="p-3 border-t border-green-200 dark:border-green-800 bg-white/50 dark:bg-black/10">
        <p className="text-[10px] text-muted-foreground mb-2 text-center">
          Voice not working? Type your message:
        </p>
        <div className="flex gap-2">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type here..."
            disabled={isProcessing}
            className="flex-1 text-sm"
          />
          <Button type="submit" size="icon" disabled={isProcessing || !textInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "w-14 h-14 rounded-full",
            isMuted && "bg-red-100 dark:bg-red-900/30 border-red-300"
          )}
          onClick={toggleMute}
          disabled={isProcessing || isSpeaking}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6 text-red-500" />
          ) : (
            <Mic className={cn("w-6 h-6", isListening && "text-green-500")} />
          )}
        </Button>

        {/* Manual start recording button */}
        {!isListening && !isMuted && !isProcessing && !isSpeaking && (
          <Button
            variant="default"
            size="lg"
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600"
            onClick={() => {
              console.log('[VoiceChat] Manual start recording triggered')
              startRecording()
            }}
            title="Start Recording"
          >
            <Mic className="w-6 h-6 animate-pulse" />
          </Button>
        )}

        <Button
          variant="destructive"
          size="lg"
          className="w-14 h-14 rounded-full"
          onClick={disconnect}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>

        {isSpeaking && (
          <Button
            variant="outline"
            size="lg"
            className="w-14 h-14 rounded-full"
            onClick={stopSpeaking}
            title="Stop AI speaking"
          >
            <VolumeX className="w-6 h-6" />
          </Button>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground pb-3">
        Powered by LiveKit WebRTC • Groq Whisper • LLaMA 3.3
      </p>
    </motion.div>
  )
}
