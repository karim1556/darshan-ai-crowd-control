'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Bot,
  User,
  Loader2,
  Sparkles,
  RefreshCw,
  Phone,
  AlertCircle,
  ArrowLeft,
  HelpCircle,
  MapPin,
  Clock,
  Users,
  Zap,
  Calendar,
  Navigation,
  Shield,
  Heart,
  Ticket
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VoiceChatRoom } from '@/components/voice-chat-room'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

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
  color: string
}

const quickActions: QuickAction[] = [
  { 
    id: 'crowd', 
    label: 'Live Crowd Status', 
    icon: <Users className="w-4 h-4" />, 
    message: 'What is the current crowd status in all zones? Which area is least crowded right now?',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'best-time', 
    label: 'Best Time to Visit', 
    icon: <Clock className="w-4 h-4" />, 
    message: 'What is the best time to visit today with the least crowd? When should I come for a peaceful darshan?',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    id: 'slots', 
    label: 'Available Slots', 
    icon: <Calendar className="w-4 h-4" />, 
    message: 'Show me all available darshan slots for today. Which slot has the most availability?',
    color: 'from-purple-500 to-violet-500'
  },
  { 
    id: 'gates', 
    label: 'Gate & Wait Times', 
    icon: <Navigation className="w-4 h-4" />, 
    message: 'Which gate should I use? What are the current wait times at each gate?',
    color: 'from-orange-500 to-amber-500'
  },
  { 
    id: 'booking', 
    label: 'How to Book', 
    icon: <Ticket className="w-4 h-4" />, 
    message: 'How do I book a darshan slot? What is the booking process?',
    color: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'facilities', 
    label: 'Facilities & Amenities', 
    icon: <Heart className="w-4 h-4" />, 
    message: 'What facilities are available? Where are the restrooms, drinking water, and medical centers?',
    color: 'from-teal-500 to-cyan-500'
  },
  { 
    id: 'priority', 
    label: 'Priority Entry', 
    icon: <Shield className="w-4 h-4" />, 
    message: 'I am elderly/disabled/with small children. How do I get priority entry? Which gate should I use?',
    color: 'from-indigo-500 to-blue-500'
  },
  { 
    id: 'emergency', 
    label: 'Emergency Help', 
    icon: <AlertCircle className="w-4 h-4" />, 
    message: 'I need emergency help. Where can I get medical assistance or report a lost child?',
    color: 'from-red-500 to-orange-500'
  },
]

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `🙏 **Namaste! Welcome to Darshan AI**

I'm your personal temple guide with access to real-time information. I can help you with:

📊 **Live Crowd Status** - Know which areas are crowded right now
🎫 **Slot Availability** - Find the best time slots for darshan
🚪 **Gate Information** - Which gate to use & wait times
🏥 **Facilities** - Medical centers, amenities & parking
🆘 **Emergency Help** - Quick access to assistance

**Tap a quick action below or ask me anything!**`
}

export default function ChatbotPage() {
  const { user } = useAuth()
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  
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
    setShowQuickActions(false)

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
      if (voiceEnabled && assistantMessage.content) {
        await speakText(assistantMessage.content)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, voiceEnabled])

  // Toggle listening
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

  // Reload last message
  const reload = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1))
      sendMessage(lastUserMessage.content)
    }
  }

  // Clear chat
  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `🙏 Chat cleared! How can I help you with your temple visit?`
    }])
    setShowQuickActions(true)
  }

  // Render message content
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pilgrim">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Darshan AI</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live • Real-time temple data
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              variant={showVoiceChat ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVoiceChat(!showVoiceChat)}
              className={showVoiceChat ? "bg-gradient-to-r from-orange-500 to-amber-500" : ""}
            >
              <Phone className="w-4 h-4 mr-2" />
              Voice Chat
            </Button>
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Voice Chat Panel */}
        <AnimatePresence>
          {showVoiceChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <VoiceChatRoom 
                userName={user?.full_name || 'Pilgrim'} 
                userId={user?.id}
                onClose={() => setShowVoiceChat(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <AnimatePresence>
          {showQuickActions && messages.length <= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action)}
                    className={cn(
                      "p-4 rounded-xl bg-gradient-to-br text-white text-left transition-shadow hover:shadow-lg",
                      action.color
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                      {action.icon}
                    </div>
                    <p className="text-sm font-medium">{action.label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="h-[50vh] overflow-y-auto p-6 space-y-4">
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
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                )}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-700 rounded-bl-md'
                )}>
                  {renderMessageContent(message.content)}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => audioPlaying ? stopSpeaking() : speakText(message.content)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
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
                    </div>
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing real-time temple data...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4" />
                <span>Failed to get response. Please try again.</span>
                <button onClick={reload} className="ml-auto hover:text-foreground">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Listening Indicator */}
          {isListening && (
            <div className="px-6 py-3 bg-orange-50 dark:bg-orange-950/30 border-t">
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
            className="p-4 border-t bg-gray-50/50 dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full shrink-0",
                  isListening && "animate-pulse"
                )}
                onClick={toggleListening}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onSubmit(e)
                    }
                  }}
                  placeholder="Ask about crowd, slots, gates, facilities..."
                  className="w-full h-12 px-5 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 text-sm"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 rounded-full shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                disabled={isLoading || !input?.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-3">
              <button 
                type="button"
                onClick={() => setShowQuickActions(true)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Show quick actions
              </button>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                Powered by Darshan AI
              </span>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
