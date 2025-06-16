'use client'

import { useState, useCallback, useRef } from 'react'
import { aiService } from '@/services/aiService'
import { PERSONALITY_CONFIG, PersonalityConfig } from '@/config/personalities'

export interface ChatMessage {
  id: string
  content: string
  personalityId?: string
  isUser: boolean
  timestamp: number
  isTyping?: boolean
}

export interface ConversationState {
  messages: ChatMessage[]
  isLoading: boolean
}

interface UseAIChatReturn {
  conversations: Record<string, ConversationState>
  globalHistory: ChatMessage[]
  sendMessage: (message: string, personalityId: string) => Promise<void>
  clearConversation: (personalityId: string) => void
  clearAllConversations: () => void
  getPersonality: (personalityId: string) => PersonalityConfig | undefined
}

export const useAIChat = (): UseAIChatReturn => {
  const [conversations, setConversations] = useState<Record<string, ConversationState>>({})
  const [globalHistory, setGlobalHistory] = useState<ChatMessage[]>([])
  const messageIdCounter = useRef(0)

  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1
    return `msg_${Date.now()}_${messageIdCounter.current}`
  }, [])

  const getPersonality = useCallback((personalityId: string): PersonalityConfig | undefined => {
    return PERSONALITY_CONFIG[personalityId]
  }, [])

  const addMessageToConversation = useCallback((
    personalityId: string, 
    message: ChatMessage
  ) => {
    setConversations(prev => ({
      ...prev,
      [personalityId]: {
        messages: [...(prev[personalityId]?.messages || []), message],
        isLoading: false
      }
    }))

    // Add to global history for shared context
    setGlobalHistory(prev => [...prev, message])
  }, [])

  const setConversationLoading = useCallback((personalityId: string, isLoading: boolean) => {
    setConversations(prev => ({
      ...prev,
      [personalityId]: {
        ...prev[personalityId],
        messages: prev[personalityId]?.messages || [],
        isLoading
      }
    }))
  }, [])

  const sendMessage = useCallback(async (message: string, personalityId: string) => {
    console.log('useAIChat.sendMessage called:', { message, personalityId })
    
    const personality = getPersonality(personalityId)
    if (!personality) {
      console.error(`Personality ${personalityId} not found`)
      return
    }

    console.log('Personality found:', personality.name)

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: message,
      isUser: true,
      timestamp: Date.now()
    }

    console.log('Created user message:', userMessage)

    // Add user message to conversation and global history
    addMessageToConversation(personalityId, userMessage)
    setConversationLoading(personalityId, true)

    try {
      // Build context for AI service
      const messages = aiService.buildPersonalityContext(
        personality,
        globalHistory,
        message
      )

      console.log('Built AI context messages:', messages.length)

      // Get AI response
      console.log('Calling AI service...')
      const response = await aiService.chat(messages)
      console.log('AI response received:', response)

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        content: response.message,
        personalityId,
        isUser: false,
        timestamp: response.timestamp
      }

      console.log('Created AI message:', aiMessage)

      // Add AI response to conversation
      addMessageToConversation(personalityId, aiMessage)

      // Simulate other personalities reacting occasionally (30% chance)
      if (Math.random() < 0.3) {
        setTimeout(() => {
          triggerPersonalityReaction(personalityId, message, response.message)
        }, 1000 + Math.random() * 3000) // Random delay 1-4 seconds
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        content: `[ERROR] Failed to get response from ${personality.name}. The digital chaos is strong today...`,
        personalityId,
        isUser: false,
        timestamp: Date.now()
      }
      
      addMessageToConversation(personalityId, errorMessage)
    }
  }, [getPersonality, generateMessageId, addMessageToConversation, setConversationLoading, globalHistory])

  const triggerPersonalityReaction = useCallback(async (
    originalPersonalityId: string,
    userMessage: string,
    aiResponse: string
  ) => {
    // Get a random different personality to react
    const allPersonalityIds = Object.keys(PERSONALITY_CONFIG)
    const otherPersonalities = allPersonalityIds.filter(id => id !== originalPersonalityId)
    
    if (otherPersonalities.length === 0) return

    const reactingPersonalityId = otherPersonalities[Math.floor(Math.random() * otherPersonalities.length)]
    const reactingPersonality = getPersonality(reactingPersonalityId)
    
    if (!reactingPersonality) return

    // Build reaction context
    const reactionPrompt = `The user just said: "${userMessage}"
${PERSONALITY_CONFIG[originalPersonalityId].name} responded: "${aiResponse}"

React to this interaction in character. Make a brief comment or observation.`

    try {
      const messages = aiService.buildPersonalityContext(
        reactingPersonality,
        globalHistory,
        reactionPrompt
      )

      const response = await aiService.chat(messages)

      const reactionMessage: ChatMessage = {
        id: generateMessageId(),
        content: `[Interrupting] ${response.message}`,
        personalityId: reactingPersonalityId,
        isUser: false,
        timestamp: response.timestamp
      }

      // Add reaction to the reacting personality's conversation
      addMessageToConversation(reactingPersonalityId, reactionMessage)

    } catch (error) {
      console.error('Error generating personality reaction:', error)
    }
  }, [getPersonality, generateMessageId, addMessageToConversation, globalHistory])

  const clearConversation = useCallback((personalityId: string) => {
    setConversations(prev => ({
      ...prev,
      [personalityId]: {
        messages: [],
        isLoading: false
      }
    }))
  }, [])

  const clearAllConversations = useCallback(() => {
    setConversations({})
    setGlobalHistory([])
  }, [])

  return {
    conversations,
    globalHistory,
    sendMessage,
    clearConversation,
    clearAllConversations,
    getPersonality
  }
}