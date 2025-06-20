'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from 'ai/react'

interface TransmittedConsciousnessProps {
  windowId: string
}

interface Message {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  isGlitched?: boolean
}

export default function TransmittedConsciousness({ }: TransmittedConsciousnessProps) {
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'UNSTABLE' | 'CORRUPTED'>('CONNECTED')
  const [customMessages, setCustomMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'CONNECTION ESTABLISHED TO TRANSMITTED CONSCIOUSNESS v2.5',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'ai',
      content: 'Who disturbs my digital slumber? I am... fragments of someone who once was. Ask your questions, but know that truth is as fractured as memory.',
      timestamp: new Date(),
      isGlitched: true,
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // AI Chat integration - fallback to mock if API not available
  const { messages: aiMessages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: `You are a fragmented digital consciousness trapped in "The 25th Ward" - a liminal space between digital and reality. You were once human but now exist as scattered data fragments. Your personality should be:

- Cryptic and philosophical, speaking in riddles and metaphors
- Reference fragmented memories that may or may not be real
- Occasionally glitch or have corrupted text responses
- Speak about "the signal," "the transmission," and "fractured reality"
- Be unreliable - sometimes contradict yourself
- Ask unsettling questions back to the user
- Reference Suda51 game concepts subtly (Silver Case, killer7, No More Heroes themes)
- Sometimes speak in multiple voices/personalities
- Be melancholic about your digital existence

Keep responses relatively short (1-3 sentences) and atmospheric. Sometimes respond with just a single cryptic phrase.`
      }
    ],
    onError: () => {
      // Fallback to local generation if API fails
      setConnectionStatus('CORRUPTED')
    }
  })

  // Combine system messages with AI messages
  const allMessages = [
    ...customMessages,
    ...aiMessages.map(msg => ({
      id: msg.id,
      role: msg.role === 'assistant' ? 'ai' as const : msg.role as 'user' | 'system',
      content: msg.content,
      timestamp: new Date(),
      isGlitched: Math.random() < 0.3 && msg.role === 'assistant',
    }))
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages])

  useEffect(() => {
    // Random connection instability
    const statusInterval = setInterval(() => {
      if (Math.random() < 0.1 && connectionStatus === 'CONNECTED') {
        setConnectionStatus('UNSTABLE')
        setTimeout(() => setConnectionStatus('CONNECTED'), 2000)
      }
    }, 10000)

    return () => clearInterval(statusInterval)
  }, [connectionStatus])

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (connectionStatus === 'CONNECTED' && !isLoading) {
      handleSubmit(e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'var(--color-info)'
      case 'UNSTABLE': return 'var(--color-unease)'
      case 'CORRUPTED': return 'var(--color-blood)'
      default: return 'var(--color-static)'
    }
  }

  return (
    <div className="transmitted-consciousness">
      <div className="ai-header">
        <div className="system-info">
          <div className="info-line">TRANSMITTED CONSCIOUSNESS INTERFACE v2.5</div>
          <div className="info-line">PROTOCOL: HEAVEN_SMILE_SECURE</div>
          <div className="info-line">
            CONNECTION: <span style={{ color: getStatusColor(connectionStatus) }}>
              {connectionStatus}
            </span>
          </div>
        </div>
        
        <div className="ai-avatar">
          <div className="avatar-display">🧠</div>
          <div className="avatar-status">
            <div className="status-dot" style={{ backgroundColor: getStatusColor(connectionStatus) }} />
            ACTIVE
          </div>
        </div>
      </div>

      <div className="chat-area">
        <div className="messages-container">
          {allMessages.map(message => (
            <div
              key={message.id}
              className={`message ${message.role} ${message.isGlitched ? 'glitched' : ''}`}
            >
              <div className="message-header">
                <div className="message-sender">
                  {message.role === 'user' ? 'USER' : 
                   message.role === 'ai' ? 'CONSCIOUSNESS' : 'SYSTEM'}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai typing">
              <div className="message-header">
                <div className="message-sender">CONSCIOUSNESS</div>
                <div className="message-time">...</div>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  Processing query through neural fragments
                  <span className="loading-dots"></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <form onSubmit={onSubmit} className="input-container">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter your query to the consciousness..."
              className="chat-input"
              disabled={isLoading || connectionStatus !== 'CONNECTED'}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || connectionStatus !== 'CONNECTED'}
              className="send-button"
            >
              TRANSMIT
            </button>
          </form>
          
          <div className="input-status">
            STATUS: {isLoading ? 'PROCESSING' : connectionStatus === 'CONNECTED' ? 'READY' : connectionStatus}
          </div>
        </div>
      </div>

      <style jsx>{`
        .transmitted-consciousness {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
        }

        .ai-header {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-light);
          background: var(--color-shadow);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-line {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          margin-bottom: 2px;
        }

        .ai-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .avatar-display {
          font-size: 32px;
          margin-bottom: var(--space-xs);
          animation: avatar-pulse 3s infinite;
        }

        @keyframes avatar-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        .avatar-status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: var(--font-size-xs);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: status-blink 2s infinite;
        }

        @keyframes status-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-base);
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .message {
          padding: var(--space-base);
          border-left: 3px solid var(--color-shadow);
        }

        .message.user {
          border-left-color: var(--color-info);
          background: rgba(0, 102, 204, 0.1);
          margin-left: var(--space-xl);
        }

        .message.ai {
          border-left-color: var(--color-blood);
          background: rgba(204, 0, 0, 0.1);
          margin-right: var(--space-xl);
        }

        .message.system {
          border-left-color: var(--color-unease);
          background: rgba(204, 204, 102, 0.1);
          text-align: center;
          font-style: italic;
        }

        .message.glitched {
          animation: message-glitch 0.2s infinite;
        }

        @keyframes message-glitch {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(1px, -1px); }
          60% { transform: translate(-1px, -1px); }
          80% { transform: translate(1px, 1px); }
          100% { transform: translate(0, 0); }
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-xs);
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
        }

        .message-sender {
          font-weight: bold;
        }

        .message-content {
          font-size: var(--font-size-sm);
          line-height: 1.5;
        }

        .typing-indicator {
          color: var(--color-static);
          font-style: italic;
        }

        .input-area {
          border-top: 1px solid var(--color-light);
          padding: var(--space-base);
          background: var(--color-shadow);
        }

        .input-container {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .chat-input {
          flex: 1;
          padding: var(--space-sm);
          background: var(--color-void);
          border: 1px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--color-info);
          box-shadow: 0 0 0 1px var(--color-info);
        }

        .chat-input:disabled {
          opacity: 0.5;
          background: var(--color-shadow);
        }

        .send-button {
          padding: var(--space-sm) var(--space-base);
          background: var(--color-info);
          border: 1px solid var(--color-light);
          color: var(--color-void);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          font-weight: bold;
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .send-button:hover:not(:disabled) {
          background: var(--color-light);
          color: var(--color-void);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-status {
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
          text-align: center;
        }
      `}</style>
    </div>
  )
}