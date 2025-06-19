'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAIChatContext } from '@/contexts/AIChatContext'
import { ChatMessage } from '@/hooks/useAIChat'
import { PersonalityConfig, getPersonality } from '@/config/personalities'

interface AITerminalProps {
  personalityId: string
}

const AITerminal: React.FC<AITerminalProps> = ({ personalityId }) => {
  const [input, setInput] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Try to use AI context, but handle gracefully if not available
  let aiContext: ReturnType<typeof useAIChatContext> | null = null
  try {
    aiContext = useAIChatContext()
  } catch (error) {
    console.warn('⚠️ [AI-TERMINAL] AIChatContext not available, using fallback mode:', error)
  }
  
  const personality = aiContext?.getPersonality(personalityId) || getPersonality(personalityId)
  const conversation = aiContext?.conversations[personalityId] || { messages: localMessages, isLoading: false }

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || conversation.isLoading) {
      console.log('Submit blocked:', { inputEmpty: !input.trim(), isLoading: conversation.isLoading })
      return
    }

    const message = input.trim()
    console.log('Sending message:', { message, personalityId, hasAIContext: !!aiContext })
    setInput('')
    
    if (aiContext?.sendMessage) {
      try {
        await aiContext.sendMessage(message, personalityId)
        console.log('Message sent successfully via AI context')
      } catch (error) {
        console.error('Error sending message via AI context:', error)
      }
    } else {
      // Fallback: Add message to local state if AI context not available
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message,
        isUser: true,
        timestamp: Date.now(),
        personalityId
      }
      
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `[OFFLINE MODE] ${personality?.name || 'AI'}: I'm currently running in offline mode. AI chat features are not available in the 3D brain environment.`,
        isUser: false,
        timestamp: Date.now() + 1,
        personalityId
      }
      
      setLocalMessages(prev => [...prev, userMessage, fallbackResponse])
      console.log('Added messages to local state (fallback mode)')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!personality) {
    return (
      <div className="terminal-error">
        <div className="error-text">ERROR: Personality not found</div>
        <div className="error-code">PERSONALITY_ID: {personalityId}</div>
      </div>
    )
  }

  return (
    <div 
      className="ai-terminal"
      style={{
        background: personality.style.background,
        color: personality.style.color,
        fontFamily: personality.style.fontFamily,
        border: personality.style.border,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          {personality.icon} {personality.name} - AI TERMINAL v2.0
        </div>
        <div className="terminal-status">
          {conversation.isLoading ? '● PROCESSING...' : '● READY'}
        </div>
      </div>

      {/* Messages Display */}
      <div className="terminal-messages">
        {conversation.messages.length === 0 ? (
          <div className="welcome-message">
            <div className="ascii-art">
{`
██████╗ ██╗ ██████╗ ██╗████████╗ █████╗ ██╗      
██╔══██╗██║██╔════╝ ██║╚══██╔══╝██╔══██╗██║      
██║  ██║██║██║  ███╗██║   ██║   ███████║██║      
██║  ██║██║██║   ██║██║   ██║   ██╔══██║██║      
██████╔╝██║╚██████╔╝██║   ██║   ██║  ██║███████╗ 
╚═════╝ ╚═╝ ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ 
                                                 
 ██████╗██╗  ██╗ █████╗  ██████╗ ███████╗        
██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔════╝        
██║     ███████║███████║██║   ██║███████╗        
██║     ██╔══██║██╔══██║██║   ██║╚════██║        
╚██████╗██║  ██║██║  ██║╚██████╔╝███████║        
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝        
`}
            </div>
            <div className="personality-intro">
              <div className="glitch">{personality.name} INITIALIZED</div>
              <div className="terminal-prompt">Type a message to begin...</div>
            </div>
          </div>
        ) : (
          conversation.messages.map((message, index) => (
            <div key={message.id} className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
              {message.isUser ? (
                <div className="user-line">
                  <span className="prompt">&gt; </span>
                  <span className="user-text">{message.content}</span>
                </div>
              ) : (
                <div className="ai-line">
                  <span className="ai-prompt">
                    [{personality.name}]:{' '}
                  </span>
                  <span className="ai-text">
                    {message.content}
                  </span>
                  <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {conversation.isLoading && (
          <div className="ai-line loading">
            <span className="ai-prompt">[{personality.name}]: </span>
            <span className="typing-indicator">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="terminal-input-form">
        <div className="input-line">
          <span className="input-prompt">&gt; </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            placeholder="Enter message..."
            disabled={conversation.isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              flex: 1
            }}
          />
          <span className={`cursor ${showCursor ? 'visible' : 'hidden'}`}>█</span>
        </div>
      </form>

      <style jsx>{`
        .ai-terminal {
          font-size: 14px;
          line-height: 1.4;
          padding: 0;
          border-radius: 4px;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid currentColor;
          background: rgba(0, 0, 0, 0.2);
          font-weight: bold;
          font-size: 12px;
        }

        .terminal-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          min-height: 0;
        }

        .welcome-message {
          text-align: center;
          padding: 20px;
        }

        .ascii-art {
          font-family: 'Courier New', monospace;
          font-size: 8px;
          line-height: 1;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .personality-intro {
          margin-top: 20px;
        }

        .glitch {
          animation: glitch 1s infinite;
          font-weight: bold;
          margin-bottom: 10px;
        }

        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-2px); }
          20% { transform: translateX(2px); }
          30% { transform: translateX(-1px); }
          40% { transform: translateX(1px); }
          50% { transform: translateX(-2px); }
          60% { transform: translateX(2px); }
          70% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          90% { transform: translateX(-2px); }
        }

        .message {
          margin-bottom: 8px;
        }

        .user-line, .ai-line {
          word-wrap: break-word;
        }

        .prompt, .ai-prompt, .input-prompt {
          font-weight: bold;
          opacity: 0.8;
        }

        .ai-text {
          margin-left: 8px;
        }

        .timestamp {
          font-size: 10px;
          opacity: 0.5;
          margin-left: 10px;
        }

        .terminal-input-form {
          border-top: 1px solid currentColor;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.1);
        }

        .input-line {
          display: flex;
          align-items: center;
        }

        .cursor {
          animation: blink 1s infinite;
        }

        .cursor.hidden {
          opacity: 0;
        }

        .cursor.visible {
          opacity: 1;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .loading .typing-indicator {
          display: inline-block;
        }

        .typing-indicator .dot {
          animation: typing 1.4s infinite;
          animation-fill-mode: both;
        }

        .typing-indicator .dot:nth-child(1) { animation-delay: 0s; }
        .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }

        .terminal-error {
          padding: 20px;
          text-align: center;
          background: #000;
          color: #ff0000;
          font-family: 'Courier New', monospace;
        }

        .error-text {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .error-code {
          font-size: 12px;
          opacity: 0.7;
        }

        /* Scrollbar styling */
        .terminal-messages::-webkit-scrollbar {
          width: 8px;
        }

        .terminal-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .terminal-messages::-webkit-scrollbar-thumb {
          background: currentColor;
          opacity: 0.5;
          border-radius: 4px;
        }

        .terminal-messages::-webkit-scrollbar-thumb:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}

export default AITerminal