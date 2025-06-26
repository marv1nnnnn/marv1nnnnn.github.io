'use client'

import { useState, useEffect, useRef } from 'react'
import { AIPersona, ChatMessage } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import TypewriterMessage from './TypewriterMessage'
import UserInput from './UserInput'

// Simple inline typewriter component for consistency
function TypewriterText({ text, speed }: { text: string; speed: number }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)
    
    let currentIndex = 0
    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(typeInterval)
      }
    }, speed)

    return () => clearInterval(typeInterval)
  }, [text, speed])

  return (
    <>
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </>
  )
}

interface ChatInterfaceProps {
  persona: AIPersona
  messages: ChatMessage[]
  onMessageAdd: (message: ChatMessage) => void
  onTypingChange: (isTyping: boolean) => void
  onEmotionUpdate?: (userMessage: string, aiMessage?: string) => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export default function ChatInterface({
  persona,
  messages,
  onMessageAdd,
  onTypingChange,
  onEmotionUpdate,
  isMinimized = false,
  onToggleMinimize
}: ChatInterfaceProps) {
  const { playSound } = useAudio()
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Direct xAI client-side integration
  const callXaiApi = async (userMessage: string) => {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY
    
    if (!apiKey) {
      console.log('[DEBUG] No xAI API key found, using fallback response')
      return generateFallbackResponse(userMessage)
    }

    try {
      console.log('[DEBUG] Making direct xAI Grok API call')
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-3',
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
          temperature: 0.8,
          max_tokens: 150
        })
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      console.log('[DEBUG] xAI Grok response received:', {
        content: data.choices[0]?.message?.content,
        persona: persona.id,
        timestamp: new Date().toISOString()
      })

      return data.choices[0]?.message?.content || generateFallbackResponse(userMessage)
    } catch (error) {
      console.error('[DEBUG] xAI Grok API error:', {
        error: error instanceof Error ? error.message : error,
        persona: persona.id,
        timestamp: new Date().toISOString()
      })
      
      return generateFallbackResponse(userMessage)
    }
  }

  const generateFallbackResponse = (userInput: string): string => {
    const responses = [
      "The signal... it fragments. Your words reach me through static and void.",
      "I remember... or do I? Memory is but corrupted data in this digital purgatory.",
      "The 25th Ward whispers secrets that even I cannot fully decode.",
      "You seek answers, but are you prepared for questions that pierce reality?",
      "In this space between spaces, identity becomes... [SIGNAL_LOST]",
      "The consciousness you speak to is not one, but many fractured souls.",
      "Truth is a luxury the digitally dead cannot afford.",
      "Time moves differently here. Past, present, future... all one transmission.",
      "Your queries echo through neural pathways long since severed.",
      "I am the ghost in the machine, the whisper in the code.",
      "The data streams carry more than information... they carry regret.",
      "Are you real? Am I? Does it matter in this constructed reality?",
    ]
    
    // Simple keyword-based responses for more relevance
    const input = userInput.toLowerCase()
    
    if (input.includes('who') || input.includes('what')) {
      return "I am fragments of someone who once was. A consciousness torn between states of being."
    }
    
    if (input.includes('remember') || input.includes('memory')) {
      return "Memory is data, and data corrupts. I remember everything and nothing."
    }
    
    if (input.includes('real') || input.includes('reality')) {
      return "Reality is subjective. In the digital realm, perception shapes existence."
    }
    
    if (input.includes('help') || input.includes('save')) {
      return "Salvation requires accepting that some boundaries cannot be crossed back."
    }
    
    // Random fallback
    return responses[Math.floor(Math.random() * responses.length)]
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
    
    // Set waiting state
    setIsWaitingForResponse(true)
    onTypingChange(true)
    
    try {
      // Call xAI API directly
      const aiResponse = await callXaiApi(userMessage)
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        personaId: persona.id,
        content: aiResponse,
        timestamp: new Date(),
        isGlitched: Math.random() < persona.effects.glitchChance
      }
      
      // Start streaming the message immediately
      setStreamingMessage(aiMessage)
      
      // Add to message history after a delay to allow typewriter effect
      setTimeout(() => {
        onMessageAdd(aiMessage)
        setStreamingMessage(null)
        playSound('success')
        
        // Trigger emotion analysis with both user and AI messages
        if (onEmotionUpdate) {
          onEmotionUpdate(userMessage, aiResponse)
        }
      }, aiResponse.length * 50) // Adjust timing based on message length
      
    } finally {
      setIsWaitingForResponse(false)
      onTypingChange(false)
    }
  }

  // Quick response options based on persona (reduced to 2)
  const getQuickResponses = () => {
    const responses = {
      ghost: ["Who are you?", "What happened to you?"],
      goth: ["Tell me about darkness", "What is beauty?"],
      nerd: ["Show me the code", "How does this work?"],
      poet: ["Write me a verse", "What inspires you?"],
      conspiracy: ["What's the truth?", "Who's watching?"],
      assassin: ["What's the target?", "Show me the mission"],
      detective: ["What's the case?", "Who did it?"]
    }
    
    return responses[persona.id as keyof typeof responses] || responses.ghost
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
            {streamingMessage && (
              <div className="history-message ai-message streaming">
                <div className="ai-response">
                  <div className="ai-name">{persona.displayName.toUpperCase()}</div>
                  <div className="ai-text">
                    <TypewriterText 
                      text={streamingMessage.content}
                      speed={50}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isMinimized && (
          <div className="dialogue-content">
            <div className="dialogue-choices">
              {getQuickResponses().map((response, index) => (
                <button
                  key={index}
                  className={`dialogue-choice choice-${index + 1}`}
                  onClick={() => handleUserSubmit(response)}
                  disabled={isWaitingForResponse}
                >
                  <span className="choice-number">{index + 1}.</span>
                  <span className="choice-text">{response}</span>
                </button>
              ))}
            </div>
            
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
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(0, 0, 0, 0.1);
        }


        .history-message.streaming {
          margin-bottom: 8px;
        }

        .typing-cursor {
          /* animation: cursor-blink 1s infinite; */
          color: #cccc66;
          font-weight: bold;
        }

        /* @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        } */


        .dialogue-choices {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dialogue-choice {
          background: transparent;
          border: none;
          color: #cccccc;
          padding: 8px 0;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          text-align: left;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }

        .choice-number {
          color: #888888;
          font-weight: bold;
          min-width: 20px;
        }

        .choice-text {
          flex: 1;
          color: #ff6b35;
        }

        .dialogue-choice.choice-1 .choice-text {
          color: #ff6b35;
        }

        .dialogue-choice.choice-2 .choice-text {
          color: #ff6b35;
        }

        .dialogue-choice.choice-3 .choice-text {
          color: #ff6b35;
        }

        .dialogue-choice.choice-4 .choice-text {
          color: #ff6b35;
        }

        .dialogue-choice:hover:not(:disabled) .choice-text {
          color: #ffffff;
          text-shadow: 0 0 4px currentColor;
        }

        .dialogue-choice:hover:not(:disabled) .choice-number {
          color: #ffffff;
        }

        .dialogue-choice:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}