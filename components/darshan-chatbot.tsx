'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Minimize2,
  Maximize2,
  Phone,
  PhoneOff,
  AlertCircle,
  MapPin,
  Clock,
  Users,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  message: string
}

const quickActions: QuickAction[] = [
  { 
    id: 'crowd', 
    label: 'Crowd Status', 
    icon: <Users className="w-3 h-3" />, 
    message: 'What is the current crowd status in different zones?' 
  },
  { 
    id: 'best-time', 
    label: 'Best Time', 
    icon: <Clock className="w-3 h-3" />, 
    message: 'What is the best time to visit today with least crowd?' 
  },
  { 
    id: 'slots', 
    label: 'Available Slots', 
    icon: <Zap className="w-3 h-3" />, 
    message: 'Show me available darshan slots for today' 
  },
  { 
    id: 'gates', 
    label: 'Gate Info', 
    icon: <MapPin className="w-3 h-3" />, 
    message: 'Which gate should I use and what are the current wait times?' 
  },
]

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `🙏 Namaste! I'm **Darshan AI**, your personal temple guide. 

I have real-time information about:
• 📊 Current crowd levels in all zones
• 🎫 Available darshan slots
• 🚪 Gate wait times & recommendations
• 🏥 Facilities & amenities
• 🆘 Emergency assistance

How can I help make your visit peaceful and smooth today?`
}

export function DarshanChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioPlaying, setAudioPlaying] = useState(false)
  
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-IN'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const current = event.resultIndex
          const transcriptResult = event.results[current][0].transcript
          setTranscript(transcriptResult)
          
          if (event.results[current].isFinal) {
            setInput(transcriptResult)
            setIsListening(false)
          }
        }

        recognition.onerror = () => {
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  // Send message to API
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: ''
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

      // Auto-speak response if voice mode is enabled
      if (voiceEnabled && isVoiceMode && assistantMessage.content) {
        await speakText(assistantMessage.content)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, voiceEnabled, isVoiceMode])

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  // Text-to-speech using browser's built-in API
  const speakText = async (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return

    try {
      setIsSpeaking(true)
      
      // Clean the text for speech (remove markdown)
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/•/g, '')
        .replace(/\n+/g, '. ')
        .slice(0, 500)

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'en-IN'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setAudioPlaying(false)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        setAudioPlaying(false)
      }
      
      setAudioPlaying(true)
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
      setAudioPlaying(false)
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
    setAudioPlaying(false)
  }

  // Handle quick action
  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.message)
  }

  // Handle form submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input?.trim()) {
      sendMessage(input)
      setTranscript('')
    }
  }

  // Submit on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  // Reload last message
  const reload = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      // Remove last assistant message and resend
      setMessages(prev => prev.slice(0, -1))
      sendMessage(lastUserMessage.content)
    }
  }

  // Render message content with basic markdown
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold text
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      if (line.startsWith('•') || line.startsWith('-')) {
        processedLine = `<span class="block ml-2">${processedLine}</span>`
      }
      return (
        <span 
          key={i} 
          className="block"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      )
    })
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          "fixed z-50 bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden",
          isExpanded 
            ? "inset-4 md:inset-8" 
            : "bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Darshan AI</h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live • Real-time assistance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Mute voice responses' : 'Enable voice responses'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              title={isVoiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
            >
              {isVoiceMode ? <Phone className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b bg-muted/30">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border rounded-full hover:bg-accent transition-colors whitespace-nowrap"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
              )}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              )}>
                {renderMessageContent(message.content)}
                {message.role === 'assistant' && voiceEnabled && (
                  <button
                    onClick={() => audioPlaying ? stopSpeaking() : speakText(message.content)}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {audioPlaying && isSpeaking ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        Listen
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking real-time data...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to get response. Please try again.</span>
              <button onClick={reload} className="ml-auto">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Mode Indicator */}
        {isVoiceMode && isListening && (
          <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/30 border-t">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-orange-700 dark:text-orange-300">
                Listening... {transcript && `"${transcript}"`}
              </span>
            </div>
          </div>
        )}

        {/* Input */}
        <form 
          id="chat-form"
          onSubmit={onSubmit} 
          className="p-3 border-t bg-background"
        >
          <div className="flex items-center gap-2">
            {isVoiceMode ? (
              <Button
                type="button"
                variant={isListening ? "destructive" : "default"}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full shrink-0",
                  isListening && "animate-pulse"
                )}
                onClick={toggleListening}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            ) : null}
            
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isVoiceMode ? "Tap mic to speak or type..." : "Ask about crowd, slots, gates..."}
                className="w-full h-10 px-4 pr-10 rounded-full border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                disabled={isLoading}
              />
              {!isVoiceMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={toggleListening}
                >
                  <Mic className={cn("w-4 h-4", isListening && "text-red-500 animate-pulse")} />
                </Button>
              )}
            </div>
            
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              disabled={isLoading || !input?.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Powered by Darshan AI • Real-time temple information
          </p>
        </form>
      </motion.div>
    </AnimatePresence>
  )
}
