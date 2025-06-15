'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAIChat } from '@/hooks/useAIChat'

interface AIChatContextType {
  conversations: ReturnType<typeof useAIChat>['conversations']
  globalHistory: ReturnType<typeof useAIChat>['globalHistory']
  sendMessage: ReturnType<typeof useAIChat>['sendMessage']
  clearConversation: ReturnType<typeof useAIChat>['clearConversation']
  clearAllConversations: ReturnType<typeof useAIChat>['clearAllConversations']
  getPersonality: ReturnType<typeof useAIChat>['getPersonality']
}

const AIChatContext = createContext<AIChatContextType | null>(null)

export const AIChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const aiChatHook = useAIChat()

  return (
    <AIChatContext.Provider value={aiChatHook}>
      {children}
    </AIChatContext.Provider>
  )
}

export const useAIChatContext = (): AIChatContextType => {
  const context = useContext(AIChatContext)
  if (!context) {
    throw new Error('useAIChatContext must be used within an AIChatProvider')
  }
  return context
}