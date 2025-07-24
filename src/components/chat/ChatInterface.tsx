'use client'

import { useState, useEffect, useRef } from 'react'
import { AIPersona, ChatMessage } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import UserInput from './UserInput'


interface ChatInterfaceProps {
  persona: AIPersona
  messages: ChatMessage[]
  onMessageAdd: (message: ChatMessage) => void
  onTypingChange: (isTyping: boolean) => void
  onEmotionUpdate?: (userMessage: string, aiMessage?: string) => void
  onClearMessages?: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export default function ChatInterface({
  persona,
  messages,
  onMessageAdd,
  onTypingChange,
  onEmotionUpdate,
  onClearMessages,
  isMinimized = false,
  onToggleMinimize
}: ChatInterfaceProps) {
  const { playSound } = useAudio()
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [quickResponses, setQuickResponses] = useState<string[]>([])
  const [isGeneratingQuickResponses, setIsGeneratingQuickResponses] = useState(false)
  const [quickResponseError, setQuickResponseError] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fallback quick responses when API fails or for offline use
  const getFallbackQuickResponses = (): string[] => {
    const fallbackSets = [
      ["Tell me more", "That's interesting"],
      ["How does that work?", "Can you explain?"],
      ["What do you think?", "Any suggestions?"],
      ["Go on", "I see"],
      ["What's next?", "Anything else?"],
      ["Why is that?", "Makes sense"],
      ["Really?", "Cool"],
      ["What about you?", "I understand"]
    ]
    
    // Return a random set of fallback responses
    return fallbackSets[Math.floor(Math.random() * fallbackSets.length)]
  }

  // xAI Grok-3 API integration with streaming
  const callXaiApiStream = async (userMessage: string, onProgress: (chunk: string) => void) => {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY
    
    if (!apiKey) {
      throw new Error('xAI API key not found')
    }

    const startTime = Date.now()
    
    try {
      console.log('[xAI API] Starting streaming request:', {
        model: 'grok-3',
        temperature: 0.9,
        personaId: persona.id,
        timestamp: new Date().toISOString(),
        messageLength: userMessage.length
      })
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: persona.personality.systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          model: 'grok-3',
          stream: true,
          temperature: 0.9
        })
      })

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              
              if (content) {
                fullText += content
                onProgress(fullText)
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      console.log('[xAI API] Streaming completed:', {
        responseLength: fullText.length,
        personaId: persona.id,
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`
      })

      return fullText
    } catch (error) {
      console.error('[xAI API] Error during streaming:', {
        error: error instanceof Error ? error.message : error,
        personaId: persona.id,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      throw error
    }
  }

  // Generate quick responses based on conversation history
  const generateQuickResponses = async () => {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY
    
    // Always ensure we have quick responses, even without API
    if (!apiKey) {
      console.log('[Quick Response] No API key, using fallback responses')
      setQuickResponses(getFallbackQuickResponses())
      return
    }

    if (messages.length === 0) {
      console.log('[Quick Response] No messages, skipping generation')
      return
    }

    console.log('[xAI API] Generating quick responses:', {
      messagesCount: messages.length,
      timestamp: new Date().toISOString()
    })
    
    setIsGeneratingQuickResponses(true)
    setQuickResponseError(false)
    
    try {
      // Get last few messages for context
      const recentMessages = messages.slice(-4).map(msg => 
        `${msg.personaId === 'user' ? 'User' : persona.displayName}: ${msg.content}`
      ).join('\n')

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Based on this conversation, generate exactly 2 natural follow-up questions or responses the user might want to say next. Keep them short (under 10 words each), conversational, and relevant to the discussion. Return only the 2 options separated by a pipe character (|). No numbering, no extra text.`
            },
            {
              role: 'user',
              content: `Recent conversation:\n${recentMessages}\n\nGenerate 2 quick response options:`
            }
          ],
          model: 'grok-3',
          stream: false,
          temperature: 0.8,
          max_tokens: 50
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0]?.message?.content || ''
        const options = content.split('|').map((s: string) => s.trim()).filter((s: string) => s.length > 0).slice(0, 2)
        
        console.log('[xAI API] Quick responses generated:', {
          rawContent: content,
          optionsCount: options.length,
          options: options,
          timestamp: new Date().toISOString()
        })
        
        if (options.length >= 2) {
          setQuickResponses(options)
        } else {
          // Fallback if API didn't return enough options
          console.log('[Quick Response] Insufficient options from API, using fallback')
          setQuickResponses(getFallbackQuickResponses())
          setQuickResponseError(true)
        }
      } else {
        console.error('[xAI API] Quick response request failed:', {
          status: response.status,
          statusText: response.statusText
        })
        // Use fallback responses on API failure
        setQuickResponses(getFallbackQuickResponses())
        setQuickResponseError(true)
      }
    } catch (error) {
      console.error('[xAI API] Error generating quick responses:', {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
        messagesCount: messages.length
      })
      // Use fallback responses on error
      setQuickResponses(getFallbackQuickResponses())
      setQuickResponseError(true)
    } finally {
      setIsGeneratingQuickResponses(false)
    }
  }

  // Generate quick responses when messages change (with debouncing)
  useEffect(() => {
    // Only generate for conversation messages (not initial welcome)
    if (messages.length > 0 && !isWaitingForResponse && !streamingMessage) {
      // Small delay to avoid rapid regeneration
      const timer = setTimeout(() => {
        generateQuickResponses()
      }, 500)
      
      return () => clearTimeout(timer)
    } else if (messages.length === 0) {
      // Clear quick responses for new conversations
      setQuickResponses([])
    }
  }, [messages.length, isWaitingForResponse, streamingMessage])

  // Update typing state
  useEffect(() => {
    onTypingChange(isWaitingForResponse)
  }, [isWaitingForResponse, onTypingChange])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      const historyElement = chatContainerRef.current.querySelector('.recent-history')
      if (historyElement) {
        historyElement.scrollTop = historyElement.scrollHeight
      }
    }
  }, [messages, streamingMessage])

  const handleUserSubmit = async (userMessage: string) => {
    console.log('[xAI API] User message submitted:', {
      messageLength: userMessage.length,
      personaId: persona.id,
      timestamp: new Date().toISOString(),
      isWaitingForResponse: isWaitingForResponse
    })

    // Add user message immediately
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      personaId: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    onMessageAdd(userChatMessage)
    playSound('typing')
    
    // Trigger emotion analysis for user message immediately
    if (onEmotionUpdate) {
      onEmotionUpdate(userMessage)
    }
    
    // Set waiting states
    setIsWaitingForResponse(true)
    setIsThinking(true)
    onTypingChange(true)
    
    try {
      // Create streaming message placeholder
      const aiMessageId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const streamingPlaceholder: ChatMessage = {
        id: aiMessageId,
        personaId: persona.id,
        content: '',
        timestamp: new Date(),
        isGlitched: Math.random() < persona.effects.glitchChance
      }
      
      setStreamingMessage(streamingPlaceholder)
      setIsThinking(false) // Stop thinking indicator when streaming starts
      
      // Stream the response
      const finalResponse = await callXaiApiStream(userMessage, (progressText) => {
        setStreamingMessage(prev => prev ? { ...prev, content: progressText } : null)
      })
      
      // Final message for history
      const finalAiMessage: ChatMessage = {
        id: aiMessageId,
        personaId: persona.id,
        content: finalResponse,
        timestamp: new Date(),
        isGlitched: Math.random() < persona.effects.glitchChance
      }
      
      // Add to message history after streaming completes
      onMessageAdd(finalAiMessage)
      setStreamingMessage(null)
      playSound('success')
      
      // Trigger emotion analysis with both messages
      if (onEmotionUpdate) {
        onEmotionUpdate(userMessage, finalResponse)
      }
      
    } catch (error) {
      console.error('[xAI API] Error in message handling:', {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      })
      setStreamingMessage(null)
    } finally {
      setIsWaitingForResponse(false)
      setIsThinking(false)
      onTypingChange(false)
    }
  }

  // Determine if we should show quick responses
  const shouldShowQuickResponses = !isWaitingForResponse && !streamingMessage && !isMinimized

  return (
    <div className="chat-interface" ref={chatContainerRef}>
      <div className="dialogue-panel">
        
        {isMinimized ? (
          <div className="minimized-icon">
            <button 
              className="restore-button"
              onClick={() => {
                onToggleMinimize?.()
                playSound('click')
              }}
              title="Restore dialogue"
            >
              ◢
            </button>
          </div>
        ) : (
          <div className="character-header">
            <div className="header-top">
              <div className="character-name">{persona.displayName.toUpperCase()}</div>
              <div className="header-controls">
                {messages.length > 1 && (
                  <button 
                    className="clear-button"
                    onClick={() => {
                      if (confirm('Clear all chat history? This cannot be undone.')) {
                        onClearMessages?.()
                        playSound('click')
                      }
                    }}
                    title="Clear chat history"
                  >
                    ✗
                  </button>
                )}
                {onToggleMinimize && (
                  <button 
                    className="minimize-button"
                    onClick={() => {
                      onToggleMinimize()
                      playSound('click')
                    }}
                    title="Minimize dialogue"
                  >
                    ◣
                  </button>
                )}
              </div>
            </div>
            <div className="character-description">
              {persona.description || `A ${persona.id} entity in the digital consciousness. They regard you with ${persona.id === 'ghost' ? 'hollow eyes' : 'intense focus'}, ${persona.id === 'detective' ? 'analyzing your every word' : 'waiting for your response'}.`}
            </div>
          </div>
        )}
        {/* Full conversation history within dialogue box */}
        {!isMinimized && (messages.length > 0 || streamingMessage) && (
          <div className="recent-history">
            {messages.map((message) => (
              <div key={message.id} className={`history-message ${message.personaId === 'user' ? 'user-message' : 'ai-message'}`}>
                {message.personaId === 'user' ? (
                  <div className="user-response">
                    <span className="speaker-label">YOU</span> — {message.content}
                  </div>
                ) : (
                  <div className="ai-response">
                    <div className="ai-name">{persona.displayName.toUpperCase()}</div>
                    <div className="ai-text">{message.content}</div>
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="history-message ai-message thinking">
                <div className="ai-response">
                  <div className="ai-name">{persona.displayName.toUpperCase()}</div>
                  <div className="ai-text thinking-indicator">
                    <span className="thinking-dots">●</span>
                    <span className="thinking-dots">●</span>
                    <span className="thinking-dots">●</span>
                  </div>
                </div>
              </div>
            )}
            {streamingMessage && (
              <div className="history-message ai-message streaming">
                <div className="ai-response">
                  <div className="ai-name">{persona.displayName.toUpperCase()}</div>
                  <div className="ai-text">
                    {streamingMessage.content}
                    <span className="typing-cursor">|</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isMinimized && (
          <div className="dialogue-content">
            {shouldShowQuickResponses && (
              <div className="quick-responses">
                {messages.length === 0 ? (
                  // Default quick responses for new conversations
                  <>
                    <button 
                      className="quick-response-btn"
                      onClick={() => {
                        playSound('click')
                        handleUserSubmit("Tell me about yourself")
                      }}
                    >
                      <span className="option-number">1.</span> Tell me about yourself
                    </button>
                    <button 
                      className="quick-response-btn"
                      onClick={() => {
                        playSound('click')
                        handleUserSubmit("What are you working on?")
                      }}
                    >
                      <span className="option-number">2.</span> What are you working on?
                    </button>
                  </>
                ) : (
                  // Dynamic quick responses based on conversation
                  <>
                    {isGeneratingQuickResponses ? (
                      <div className="quick-response-loading">
                        <span className="loading-text">Generating responses</span>
                        <span className="loading-dots">●</span>
                        <span className="loading-dots">●</span>
                        <span className="loading-dots">●</span>
                      </div>
                    ) : (
                      quickResponses.map((response, index) => (
                        <button 
                          key={`${index}-${response}`}
                          className={`quick-response-btn dynamic ${quickResponseError ? 'fallback' : ''}`}
                          onClick={() => {
                            playSound('click')
                            handleUserSubmit(response)
                          }}
                          title={quickResponseError ? 'Fallback response (API unavailable)' : 'AI-generated response'}
                        >
                          <span className="option-number">{index + 1}.</span> {response}
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
            <UserInput
              onSubmit={handleUserSubmit}
              disabled={isWaitingForResponse}
              persona={persona}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-interface {
          height: 100%;
          width: 100%;
          position: relative;
          background: transparent;
          color: var(--persona-text, #cccccc);
          font-family: var(--persona-font, 'Courier New, monospace');
          font-size: 16px;
        }

        .dialogue-panel {
          position: absolute;
          top: 20px;
          bottom: ${isMinimized ? 'auto' : '20px'};
          right: 20px;
          width: ${isMinimized ? 'auto' : '480px'};
          height: ${isMinimized ? 'auto' : 'calc(100vh - 40px)'};
          display: flex;
          flex-direction: column;
          background: ${isMinimized ? 'transparent' : 'rgba(0, 0, 0, 0.85)'};
          border: ${isMinimized ? 'none' : '2px solid #3a3a3a'};
          border-radius: ${isMinimized ? '0' : '6px'};
          overflow: hidden;
          box-shadow: ${isMinimized ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)'};
          pointer-events: auto;
          transition: all 0.3s ease;
        }

        .recent-history {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          border-bottom: 1px solid #4a4a4a;
          background: rgba(0, 0, 0, 0.7);
          min-height: 0;
          backdrop-filter: blur(2px);
        }

        .history-message {
          margin-bottom: 16px;
          font-size: 14px;
          position: relative;
        }

        .user-response {
          color: #ffffff;
          margin-bottom: 12px;
          opacity: 0.95;
          font-size: 14px;
          line-height: 1.5;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
        }

        .speaker-label {
          color: #ff6b47;
          font-weight: bold;
          text-shadow: 0 0 6px rgba(255, 107, 71, 0.3);
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        .ai-response {
          margin-bottom: 16px;
          padding: 2px 0;
        }

        .ai-name {
          color: #ff6b47;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          font-size: 15px;
          text-shadow: 0 0 8px rgba(255, 107, 71, 0.4);
          letter-spacing: 1px;
        }

        .ai-text {
          color: #ffffff;
          line-height: 1.6;
          font-size: 15px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          font-weight: 300;
        }

        .character-header {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.7);
          border-bottom: ${isMinimized ? 'none' : '1px solid rgba(255, 107, 71, 0.2)'};
          backdrop-filter: blur(4px);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${isMinimized ? '0' : '6px'};
        }

        .character-name {
          color: #ff6b47;
          font-size: 15px;
          font-weight: bold;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255, 107, 71, 0.4);
        }

        .header-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .clear-button {
          background: transparent;
          border: 1px solid #4a4a4a;
          color: #cccccc;
          font-size: 14px;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.7;
        }

        .clear-button:hover {
          background: rgba(255, 100, 100, 0.1);
          border-color: #ff6464;
          color: #ff6464;
          opacity: 1;
        }

        .minimize-button {
          background: transparent;
          border: 1px solid #4a4a4a;
          color: #cccccc;
          font-size: 16px;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .minimize-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #ffffff;
          color: #ffffff;
        }

        .minimized-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }

        .restore-button {
          background: transparent;
          border: 1px solid #4a4a4a;
          color: #cccccc;
          font-size: 16px;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .restore-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #ffffff;
          color: #ffffff;
        }

        .character-description {
          color: #cccccc;
          font-size: 12px;
          line-height: 1.5;
          font-style: italic;
          opacity: 0.8;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .dialogue-content {
          flex: 0 0 auto;
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          border-top: 1px solid rgba(255, 107, 71, 0.1);
        }

        .quick-responses {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .quick-response-btn {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 107, 71, 0.2);
          color: #ffffff;
          padding: 12px 14px;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          font-weight: normal;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
          position: relative;
        }

        .quick-response-btn:hover {
          background: rgba(255, 107, 71, 0.15);
          border-color: rgba(255, 107, 71, 0.5);
          color: #ffffff;
          box-shadow: 0 0 12px rgba(255, 107, 71, 0.25);
          transform: translateY(-1px);
        }

        .quick-response-btn:active {
          background: rgba(255, 107, 71, 0.25);
          transform: translateY(0);
        }

        .quick-response-btn.dynamic {
          background: rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 107, 71, 0.3);
        }

        .quick-response-btn.fallback {
          border-color: rgba(255, 200, 100, 0.3);
          background: rgba(255, 200, 100, 0.1);
        }

        .quick-response-btn.fallback:hover {
          border-color: rgba(255, 200, 100, 0.5);
          background: rgba(255, 200, 100, 0.15);
          box-shadow: 0 0 12px rgba(255, 200, 100, 0.2);
        }

        .option-number {
          color: #ff6b47;
          font-weight: bold;
          flex-shrink: 0;
          font-size: 14px;
          opacity: 1;
          text-shadow: 0 0 6px rgba(255, 107, 71, 0.3);
          margin-right: 4px;
          min-width: 20px;
        }

        .quick-response-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 107, 71, 0.1);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .loading-text {
          color: #888888;
          font-size: 12px;
          font-style: italic;
          margin-right: 8px;
        }

        .loading-dots {
          animation: loading-pulse 1.5s infinite;
          color: #ff6b47;
          font-size: 12px;
        }

        .loading-dots:nth-child(2) {
          animation-delay: 0s;
        }

        .loading-dots:nth-child(3) {
          animation-delay: 0.5s;
        }

        .loading-dots:nth-child(4) {
          animation-delay: 1s;
        }

        @keyframes loading-pulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .history-message.streaming {
          margin-bottom: 8px;
        }

        .typing-cursor {
          animation: cursor-blink 1s infinite;
          color: #cccc66;
          font-weight: bold;
        }

        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .thinking-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .thinking-dots {
          animation: thinking-pulse 1.5s infinite;
          color: #888888;
          font-size: 12px;
        }

        .thinking-dots:nth-child(1) {
          animation-delay: 0s;
        }

        .thinking-dots:nth-child(2) {
          animation-delay: 0.5s;
        }

        .thinking-dots:nth-child(3) {
          animation-delay: 1s;
        }

        @keyframes thinking-pulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes subtle-glow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(255, 107, 71, 0.1);
          }
          50% {
            box-shadow: 0 0 12px rgba(255, 107, 71, 0.2);
          }
        }
        
        .dialogue-panel:not(.minimized) {
          animation: subtle-glow 4s ease-in-out infinite;
        }

      `}</style>
    </div>
  )
}