'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from 'ai/react'
import { AIPersona, ChatMessage } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import TypewriterMessage from './TypewriterMessage'
import UserInput from './UserInput'

interface ChatInterfaceProps {
  persona: AIPersona
  messages: ChatMessage[]
  onMessageAdd: (message: ChatMessage) => void
  onTypingChange: (isTyping: boolean) => void
}

export default function ChatInterface({ 
  persona, 
  messages, 
  onMessageAdd, 
  onTypingChange 
}: ChatInterfaceProps) {
  const { playSound } = useAudio()
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // AI Chat integration with persona-specific prompts
  const { messages: aiMessages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: persona.personality.systemPrompt
      }
    ],
    onFinish: (message) => {
      const newMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        personaId: persona.id,
        content: message.content,
        timestamp: new Date(),
        isGlitched: Math.random() < persona.effects.glitchChance
      }
      
      onMessageAdd(newMessage)
      setIsWaitingForResponse(false)
      onTypingChange(false)
      playSound('success')
    },
    onError: () => {
      // Fallback response when API fails
      const fallbackResponses = [
        "...signal lost... trying to reconnect...",
        "ERROR: Consciousness fragment corrupted.",
        "The void whispers, but words fail to form...",
        "*static interference*",
        "Memory banks damaged... please repeat transmission..."
      ]
      
      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        personaId: persona.id,
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        timestamp: new Date(),
        isGlitched: true
      }
      
      onMessageAdd(fallbackMessage)
      setIsWaitingForResponse(false)
      onTypingChange(false)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update typing state
  useEffect(() => {
    onTypingChange(isLoading || isWaitingForResponse)
  }, [isLoading, isWaitingForResponse, onTypingChange])

  const handleUserSubmit = async (userMessage: string) => {
    // Add user message immediately
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      personaId: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    onMessageAdd(userChatMessage)
    playSound('typing')
    
    // Set waiting state
    setIsWaitingForResponse(true)
    onTypingChange(true)
    
    // Submit to AI
    const syntheticEvent = {
      preventDefault: () => {},
      target: { value: userMessage }
    } as any
    
    handleSubmit(syntheticEvent)
  }

  // Quick response options based on persona
  const getQuickResponses = () => {
    const responses = {
      ghost: ["Who are you?", "What happened to you?", "Are you alone?"],
      goth: ["Tell me about darkness", "What is beauty?", "Speak of eternity"],
      nerd: ["Show me the code", "How does this work?", "Optimize the system"],
      poet: ["Write me a verse", "What inspires you?", "Paint with words"],
      conspiracy: ["What's the truth?", "Who's watching?", "Connect the dots"],
      assassin: ["What's the target?", "Show me the mission", "Execute the plan"],
      detective: ["What's the case?", "Who did it?", "Follow the evidence"]
    }
    
    return responses[persona.id as keyof typeof responses] || responses.ghost
  }

  return (
    <div className="chat-interface" ref={chatContainerRef}>
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.personaId === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {message.personaId !== 'user' ? (
              <TypewriterMessage
                message={message}
                persona={persona}
                speed={persona.effects.typewriterSpeed}
              />
            ) : (
              <div className="user-content">
                <div className="message-header">
                  <span className="sender">You</span>
                  <span className="timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            )}
          </div>
        ))}
        
        {(isLoading || isWaitingForResponse) && (
          <div className="message ai-message typing-indicator">
            <div className="persona-header">
              <span className="persona-name">{persona.displayName}</span>
              <span className="typing-text">is manifesting a response...</span>
            </div>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        <div className="quick-responses">
          {getQuickResponses().map((response, index) => (
            <button
              key={index}
              className="quick-response"
              onClick={() => handleUserSubmit(response)}
              disabled={isLoading || isWaitingForResponse}
            >
              {response}
            </button>
          ))}
        </div>
        
        <UserInput
          onSubmit={handleUserSubmit}
          disabled={isLoading || isWaitingForResponse}
          persona={persona}
        />
      </div>

      <style jsx>{`
        .chat-interface {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--persona-bg, #0a0a0a);
          color: var(--persona-text, #cccccc);
          font-family: var(--persona-font, 'Courier New, monospace');
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          scrollbar-width: thin;
          scrollbar-color: var(--persona-accent, #cccc66) transparent;
        }

        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: var(--persona-accent, #cccc66);
          border-radius: 3px;
        }

        .message {
          margin-bottom: 16px;
          max-width: 80%;
        }

        .ai-message {
          align-self: flex-start;
        }

        .user-message {
          align-self: flex-end;
          margin-left: auto;
        }

        .user-content {
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--persona-accent, #cccc66);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          opacity: 0.8;
        }

        .sender {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        .timestamp {
          color: var(--persona-text, #cccccc);
        }

        .message-content {
          line-height: 1.5;
        }

        .typing-indicator {
          opacity: 0.8;
        }

        .persona-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .persona-name {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        .typing-text {
          opacity: 0.7;
          font-style: italic;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 8px;
          height: 8px;
          background: var(--persona-accent, #cccc66);
          border-radius: 50%;
          animation: typing-pulse 1.4s infinite ease-in-out;
        }

        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }

        @keyframes typing-pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .input-section {
          border-top: 1px solid var(--persona-accent, #cccc66);
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
        }

        .quick-responses {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .quick-response {
          background: transparent;
          border: 1px solid var(--persona-accent, #cccc66);
          color: var(--persona-accent, #cccc66);
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .quick-response:hover:not(:disabled) {
          background: var(--persona-accent, #cccc66);
          color: var(--persona-bg, #0a0a0a);
          transform: translateY(-1px);
        }

        .quick-response:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}