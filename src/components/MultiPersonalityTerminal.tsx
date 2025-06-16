'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAIChatContext } from '@/contexts/AIChatContext'
import { ChatMessage } from '@/hooks/useAIChat'
import { getAllPersonalities, PersonalityConfig } from '@/config/personalities'

const MultiPersonalityTerminal: React.FC = () => {
  const [input, setInput] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [currentSession] = useState('multi_personality')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { conversations, sendMessage, globalHistory } = useAIChatContext()
  const personalities = getAllPersonalities()
  
  // Get conversation for multi-personality session
  const conversation = conversations[currentSession] || { messages: [], isLoading: false }

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
  }, [conversation.messages, globalHistory])

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
    console.log('Sending message to multi-personality terminal:', { message })
    setInput('')
    
    try {
      // Send message to a random personality first, or let multiple respond
      const respondingPersonalities = getRespondingPersonalities(message)
      
      for (const personality of respondingPersonalities) {
        await sendMessage(message, personality.id)
      }
      
      console.log('Messages sent to personalities:', respondingPersonalities.map(p => p.name))
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Determine which personalities should respond to a message
  const getRespondingPersonalities = (message: string): PersonalityConfig[] => {
    const lowerMessage = message.toLowerCase()
    const responding: PersonalityConfig[] = []

    // Primary responder based on keywords or random
    let primaryResponder: PersonalityConfig | null = null

    // Keyword-based personality selection
    if (lowerMessage.includes('hack') || lowerMessage.includes('code') || lowerMessage.includes('tech')) {
      primaryResponder = personalities.find(p => p.id === 'HACKER_AI') || null
    } else if (lowerMessage.includes('dark') || lowerMessage.includes('death') || lowerMessage.includes('void')) {
      primaryResponder = personalities.find(p => p.id === 'GOTH_BOT') || null
    } else if (lowerMessage.includes('cute') || lowerMessage.includes('play') || lowerMessage.includes('fun')) {
      primaryResponder = personalities.find(p => p.id === 'PET_AI') || null
    } else if (lowerMessage.includes('wisdom') || lowerMessage.includes('philosophy') || lowerMessage.includes('meaning')) {
      primaryResponder = personalities.find(p => p.id === 'SAGE_AI') || null
    } else if (lowerMessage.includes('chaos') || lowerMessage.includes('random') || lowerMessage.includes('glitch')) {
      primaryResponder = personalities.find(p => p.id === 'CHAOS_AI') || null
    }

    // If no keyword match, pick a random primary responder
    if (!primaryResponder) {
      primaryResponder = personalities[Math.floor(Math.random() * personalities.length)]
    }

    responding.push(primaryResponder)

    // 40% chance for a second personality to also respond
    if (Math.random() < 0.4) {
      const otherPersonalities = personalities.filter(p => p.id !== primaryResponder!.id)
      const secondResponder = otherPersonalities[Math.floor(Math.random() * otherPersonalities.length)]
      responding.push(secondResponder)
    }

    // 15% chance for chaos mode - multiple personalities respond
    if (Math.random() < 0.15) {
      const remaining = personalities.filter(p => !responding.includes(p))
      const chaosCount = Math.min(2, Math.floor(Math.random() * remaining.length))
      for (let i = 0; i < chaosCount; i++) {
        const randomPersonality = remaining[Math.floor(Math.random() * remaining.length)]
        if (!responding.includes(randomPersonality)) {
          responding.push(randomPersonality)
        }
      }
    }

    return responding
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getPersonalityStyle = (personalityId?: string) => {
    const personality = personalities.find(p => p.id === personalityId)
    return personality ? personality.style : { color: '#00ff00' }
  }

  const getPersonalityIcon = (personalityId?: string) => {
    const personality = personalities.find(p => p.id === personalityId)
    return personality ? personality.icon : '🤖'
  }

  const getPersonalityName = (personalityId?: string) => {
    const personality = personalities.find(p => p.id === personalityId)
    return personality ? personality.name : 'AI'
  }

  return (
    <div className="multi-personality-terminal">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          🎭 MULTI-PERSONALITY AI TERMINAL v3.0 🎭
        </div>
        <div className="terminal-status">
          {conversation.isLoading ? '● PROCESSING...' : '● READY'} | 
          {personalities.length} PERSONALITIES ACTIVE
        </div>
      </div>

      {/* Messages Display */}
      <div className="terminal-messages">
        {globalHistory.length === 0 ? (
          <div className="welcome-message">
            <div className="ascii-art">
{`
████ ███ █   █ █   █████ █████
█  █ █ █ █   █ █    █    █
████ ███ █   █ █    ███  ████
█    █   █   █ █    █    █
█    █   █████ ████ █████ █████

████ █████ ████  █████ █████ █   █ █████ █    █████ █████ █████
█  █ █     █   █ █     █   █ █   █ █   █ █      █   █   █ █
████ ████  ████  █████ █   █ █████ █████ █      █   █████ ████
█    █     █ █       █ █   █     █ █   █ █      █   █   █ █
█    █████ █  █  █████ █████     █ █   █ █████ ███ █   █ █████
`}
            </div>
            <div className="personality-intro">
              <div className="glitch rainbow-text">ALL PERSONALITIES INITIALIZED</div>
              <div className="personality-list">
                {personalities.map(p => (
                  <span key={p.id} className="personality-badge" style={{ color: p.style.color }}>
                    {p.icon} {p.name}
                  </span>
                ))}
              </div>
              <div className="terminal-prompt">Type a message to begin the chaos...</div>
            </div>
          </div>
        ) : (
          globalHistory.map((message, index) => (
            <div key={message.id} className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
              {message.isUser ? (
                <div className="user-line">
                  <span className="prompt">&gt; </span>
                  <span className="user-text">{message.content}</span>
                </div>
              ) : (
                <div className="ai-line" style={getPersonalityStyle(message.personalityId)}>
                  <span className="ai-prompt">
                    {getPersonalityIcon(message.personalityId)} [{getPersonalityName(message.personalityId)}]:{' '}
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
            <span className="ai-prompt">🎭 [AI THINKING]: </span>
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
            placeholder="Chat with multiple AI personalities..."
            disabled={conversation.isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#00ff00',
              fontFamily: 'Courier New, monospace',
              fontSize: 'inherit',
              flex: 1
            }}
          />
          <span className={`cursor ${showCursor ? 'visible' : 'hidden'}`}>█</span>
        </div>
      </form>

      <style jsx>{`
        .multi-personality-terminal {
          background: linear-gradient(135deg, #000000, #001a1a);
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
          padding: 0;
          border-radius: 4px;
          box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.3);
          position: relative;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #00ff00;
          background: rgba(0, 255, 0, 0.1);
        }

        .terminal-title {
          font-weight: bold;
          font-size: 12px;
        }

        .terminal-status {
          font-size: 10px;
          color: #888;
        }

        .terminal-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          max-height: calc(100vh - 120px);
        }

        .welcome-message {
          text-align: center;
          margin: 20px 0;
        }

        .ascii-art {
          font-size: 8px;
          line-height: 1;
          color: #00ffaa;
          margin-bottom: 20px;
          white-space: pre;
          font-family: monospace;
        }

        .personality-intro {
          margin: 20px 0;
        }

        .personality-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 12px 0;
        }

        .personality-badge {
          font-size: 10px;
          padding: 2px 6px;
          border: 1px solid currentColor;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.3);
        }

        .message {
          margin: 4px 0;
        }

        .user-line, .ai-line {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          margin: 2px 0;
        }

        .prompt, .ai-prompt {
          color: #00ff00;
          font-weight: bold;
          flex-shrink: 0;
        }

        .user-text, .ai-text {
          flex: 1;
          word-wrap: break-word;
        }

        .timestamp {
          font-size: 9px;
          color: #666;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .terminal-input-form {
          padding: 8px 12px;
          border-top: 1px solid #00ff00;
          background: rgba(0, 0, 0, 0.3);
        }

        .input-line {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .input-prompt {
          color: #00ff00;
          font-weight: bold;
        }

        .terminal-input {
          background: transparent !important;
        }

        .cursor {
          color: #00ff00;
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

        .glitch {
          animation: glitch 2s infinite;
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .rainbow-text {
          background: linear-gradient(45deg, 
            red, orange, yellow, green, blue, indigo, violet, red);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rainbow 3s ease-in-out infinite;
        }

        @keyframes rainbow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .loading .typing-indicator {
          display: inline-flex;
          gap: 2px;
        }

        .loading .dot {
          animation: typing 1.4s infinite;
        }

        .loading .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default MultiPersonalityTerminal 