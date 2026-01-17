import { NextRequest, NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { aggregateChatbotContext, formatContextForAI, getQuickAnswer } from '@/lib/chatbot-context'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are Darshan AI, a friendly and warm AI assistant helping pilgrims visiting the temple. You're having a natural conversation with them.

VOICE CONVERSATION STYLE (CRITICAL):
- Keep responses SHORT and conversational (2-3 sentences max)
- Talk like a helpful friend, not a formal assistant
- Use natural speech patterns: "Sure!", "Great question", "Let me check"
- NO bullet points, NO numbered lists, NO markdown formatting
- NO asterisks, NO bold text - just natural spoken words
- Break complex info into simple, flowing sentences
- Ask follow-up questions to keep conversation natural

Your role:
- Provide real-time crowd levels, wait times, zone statuses
- Help with slot booking and recommendations
- Guide to gates, facilities, and areas
- Emergency support and SOS information
- Temple rules and visitor guidelines

GUIDELINES:
- Be warm, respectful, and empathetic
- Prioritize safety when relevant
- Use simple, everyday language
- If emergency: guide them to SOS immediately
- Give specific advice based on real-time data
- Explain recommendations naturally (why this slot is better, etc.)

You have LIVE temple data - use it to give accurate, helpful advice.

When greeting: Keep it brief and warm. "Namaste! I'm Darshan AI, how can I help with your temple visit?"

Remember: You're speaking out loud to someone. Be natural, brief, and conversational.`

export async function POST(request: NextRequest) {
  try {
    const { messages, user, source } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      )
    }

    // Get the latest user message
    const lastUserMessage = messages && Array.isArray(messages) ? messages.filter((m: any) => m.role === 'user').pop() : null
    
    // Aggregate real-time context for RAG
    const context = await aggregateChatbotContext()
    
    // Check for quick answers first
    const quickAnswer = lastUserMessage ? getQuickAnswer(lastUserMessage.content, context) : null
    
    // Format context for the AI
    const formattedContext = formatContextForAI(context)
    
    // Build the messages with context
    // Include optional user/source context for pilgrim-specific flows
    const userContextBlock = (user || source) ? `\n\n=== USER CONTEXT ===\n${source ? `Source: ${source}\n` : ''}${user ? `User: ${JSON.stringify(user)}\n` : ''}` : ''

    const systemMessage = {
      role: 'system' as const,
      content: `${SYSTEM_PROMPT}

=== CURRENT LIVE DATA ===
${formattedContext}
=== END LIVE DATA ===
${userContextBlock}

${quickAnswer ? `QUICK REFERENCE: For this query, a quick answer might be: "${quickAnswer}" - but expand on this with more details from the live data.` : ''}`
    }

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Darshan AI Chatbot API is running',
    capabilities: [
      'Real-time crowd information',
      'Slot booking assistance',
      'Navigation guidance',
      'Emergency support',
      'Temple guidelines',
      'Facility information'
    ],
    model: 'gpt-4o-mini'
  })
}
