'use client'

import { usePathname } from 'next/navigation'
import { DarshanChatbot } from './darshan-chatbot'

// Only show the floating chatbot on pilgrim pages (not on the dedicated chat page)
export function ChatbotWrapper() {
  const pathname = usePathname()
  
  // Show on pilgrim-related pages except the dedicated chat page
  const shouldShow = 
    pathname?.startsWith('/pilgrim') && 
    !pathname?.includes('/chat')
  
  if (!shouldShow) return null
  
  return <DarshanChatbot />
}
