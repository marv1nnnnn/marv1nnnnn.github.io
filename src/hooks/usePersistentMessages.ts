'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/types/personas'

const STORAGE_KEY = 'marv1nnnnn-chat-history'
const MAX_MESSAGES = 100 // Prevent unlimited growth

export function usePersistentMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(messagesWithDates)
      }
    } catch (error) {
      console.warn('[DEBUG] Failed to load chat history from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (!isLoaded) return // Don't save during initial load
    
    try {
      // Keep only the most recent messages to prevent storage bloat
      const messagesToStore = messages.slice(-MAX_MESSAGES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore))
    } catch (error) {
      console.warn('[DEBUG] Failed to save chat history to localStorage:', error)
    }
  }, [messages, isLoaded])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('[DEBUG] Failed to clear chat history from localStorage:', error)
    }
  }, [])

  const getRecentMessages = useCallback((count: number = 10) => {
    return messages.slice(-count)
  }, [messages])

  const getMessagesByPersona = useCallback((personaId: string) => {
    return messages.filter(msg => msg.personaId === personaId)
  }, [messages])

  return {
    messages,
    addMessage,
    clearMessages,
    getRecentMessages,
    getMessagesByPersona,
    isLoaded
  }
}