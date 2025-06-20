'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update typing state
  useEffect(() => {
    onTypingChange(isWaitingForResponse)
  }, [isWaitingForResponse, onTypingChange])

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
      
      onMessageAdd(aiMessage)
      playSound('success')
    } finally {
      setIsWaitingForResponse(false)
      onTypingChange(false)
    }
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
        
        {isWaitingForResponse && (
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
              disabled={isWaitingForResponse}
            >
              {response}
            </button>
          ))}
        </div>
        
        <UserInput
          onSubmit={handleUserSubmit}
          disabled={isWaitingForResponse}
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
          font-size: 16px;
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
          font-size: 14px;
          opacity: 0.9;
        }

        .sender {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        .timestamp {
          color: var(--persona-text, #cccccc);
        }

        .message-content {
          line-height: 1.6;
          font-size: 16px;
        }

        .typing-indicator {
          opacity: 0.8;
        }

        .persona-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .persona-name {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        .typing-text {
          opacity: 0.8;
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
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          border-radius: 4px;
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