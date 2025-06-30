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
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // xAI Grok-3 API integration with streaming
  const callXaiApiStream = async (userMessage: string, onProgress: (chunk: string) => void) => {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY
    
    if (!apiKey) {
      throw new Error('xAI API key not found')
    }

    try {
      console.log('[DEBUG] Making xAI Grok-3 API call')
      
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

      console.log('[DEBUG] xAI Grok-3 streaming response completed:', {
        content: fullText,
        persona: persona.id,
        timestamp: new Date().toISOString()
      })

      return fullText
    } catch (error) {
      console.error('[DEBUG] xAI Grok-3 API error:', {
        error: error instanceof Error ? error.message : error,
        persona: persona.id,
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }



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
    console.log('[DEBUG] User message submitted:', {
      message: userMessage,
      persona: persona.id,
      timestamp: new Date().toISOString()
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
      console.error('[DEBUG] Error in handleUserSubmit:', error)
      setStreamingMessage(null)
    } finally {
      setIsWaitingForResponse(false)
      setIsThinking(false)
      onTypingChange(false)
    }
  }


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
          background: ${isMinimized ? 'transparent' : 'rgba(0, 0, 0, 0.3)'};
          border: ${isMinimized ? 'none' : '2px solid #4a4a4a'};
          border-radius: ${isMinimized ? '0' : '8px'};
          overflow: hidden;
          box-shadow: ${isMinimized ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.7)'};
          pointer-events: auto;
          transition: all 0.3s ease;
        }

        .recent-history {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          border-bottom: 1px solid #4a4a4a;
          background: rgba(0, 0, 0, 0.4);
          min-height: 0;
        }

        .history-message {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .user-response {
          color: #ffffff;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .speaker-label {
          color: #888888;
          font-weight: bold;
        }

        .ai-response {
          margin-bottom: 12px;
        }

        .ai-name {
          color: #ffffff;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 13px;
        }

        .ai-text {
          color: #cccccc;
          line-height: 1.4;
          font-size: 14px;
        }

        .character-header {
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: ${isMinimized ? 'none' : '1px solid #4a4a4a'};
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${isMinimized ? '0' : '6px'};
        }

        .character-name {
          color: #ffffff;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
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
          line-height: 1.4;
          font-style: italic;
          opacity: 0.9;
        }

        .dialogue-content {
          flex: 0 0 auto;
          padding: 20px;
          background: rgba(0, 0, 0, 0.1);
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

      `}</style>
    </div>
  )
}