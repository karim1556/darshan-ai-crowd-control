import { NextRequest, NextResponse } from 'next/server'
import { aggregateChatbotContext, formatContextForAI } from '@/lib/chatbot-context'

// Get all temple context for chatbot or RAG systems
export async function GET() {
  try {
    const context = await aggregateChatbotContext()
    const formattedContext = formatContextForAI(context)
    
    return NextResponse.json({
      success: true,
      data: {
        raw: context,
        formatted: formattedContext
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Context API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get context' },
      { status: 500 }
    )
  }
}
