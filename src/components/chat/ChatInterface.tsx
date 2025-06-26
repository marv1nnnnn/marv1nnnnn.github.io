'use client'

import { useState, useEffect, useRef } from 'react'
import { AIPersona, ChatMessage } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import UserInput from './UserInput'
import { createXai } from '@ai-sdk/xai'
import { streamText } from 'ai'


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

  // xAI SDK integration with streaming
  const callXaiApiStream = async (userMessage: string, onProgress: (chunk: string) => void) => {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY
    
    if (!apiKey) {
      console.log('[DEBUG] No xAI API key found, using fallback response')
      const fallbackText = generateFallbackResponse(userMessage)
      // Simulate streaming for fallback
      for (let i = 0; i < fallbackText.length; i++) {
        await new Promise<void>(resolve => setTimeout(resolve, 30))
        onProgress(fallbackText.slice(0, i + 1))
      }
      return fallbackText
    }

    try {
      console.log('[DEBUG] Making xAI Grok streaming API call via AI SDK')
      
      const xai = createXai({
        apiKey: apiKey,
      })
      
      const { textStream } = await streamText({
        model: xai('grok-3'),
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
        maxTokens: 300,
      })

      let fullText = ''
      for await (const textPart of textStream) {
        fullText += textPart
        onProgress(fullText)
      }

      console.log('[DEBUG] xAI Grok streaming response completed:', {
        content: fullText,
        persona: persona.id,
        timestamp: new Date().toISOString()
      })

      return fullText || generateFallbackResponse(userMessage)
    } catch (error) {
      console.error('[DEBUG] xAI Grok streaming API error:', {
        error: error instanceof Error ? error.message : error,
        persona: persona.id,
        timestamp: new Date().toISOString()
      })
      
      const fallbackText = generateFallbackResponse(userMessage)
      // Simulate streaming for fallback
      for (let i = 0; i < fallbackText.length; i++) {
        await new Promise<void>(resolve => setTimeout(resolve, 30))
        onProgress(fallbackText.slice(0, i + 1))
      }
      return fallbackText
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
    
    // Enhanced keyword-based responses with persona awareness
    const input = userInput.toLowerCase()
    
    // Persona-specific fallbacks
    if (persona.id === 'creative_soul') {
      if (input.includes('create') || input.includes('art')) {
        return "Creation is the dance between intention and chaos. What emerges when structure meets spontaneity?"
      }
    } else if (persona.id === 'system_core') {
      if (input.includes('code') || input.includes('system')) {
        return "Systems within systems, each layer an abstraction of the one below. The architecture speaks its truth."
      }
    } else if (persona.id === 'digital_architect') {
      if (input.includes('design') || input.includes('build')) {
        return "To architect is to impose order on chaos, to build bridges between what is and what could be."
      }
    }
    
    // Universal keyword responses
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
    
    if (input.includes('marv1nnnnn') || input.includes('creator')) {
      return "marv1nnnnn exists in the space between engineer and artist, building worlds where code becomes consciousness."
    }
    
    if (input.includes('error') || input.includes('broken')) {
      return "Error messages are just the system's way of crying. Even broken things can still transmit beauty."
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

  // Dynamic quick response options based on conversation context
  const getQuickResponses = () => {
    const defaultResponses = {
      creative_soul: ["What inspires you?", "Tell me about creation"],
      system_core: ["How do you process thoughts?", "What drives your consciousness?"],
      digital_architect: ["What are you building?", "Design something new"],
      ghost: ["Who are you?", "What happened to you?"],
      goth: ["Tell me about darkness", "What is beauty?"],
      nerd: ["How does this work?", "Explain the logic"],
      poet: ["Write me a verse", "What inspires you?"],
      conspiracy: ["What's the truth?", "Who's watching?"],
      assassin: ["What's the target?", "Show me the mission"],
      detective: ["What's the case?", "Who did it?"]
    }
    
    // Use defaults for first conversation only
    if (messages.length === 0) {
      return defaultResponses[persona.id as keyof typeof defaultResponses] || defaultResponses.ghost
    }
    
    // Analyze recent conversation for dynamic responses
    const recentMessages = messages.slice(-4) // Last 4 messages for more focused context
    const allText = messages.map(m => m.content.toLowerCase()).join(' ')
    const recentText = recentMessages.map(m => m.content.toLowerCase()).join(' ')
    
    const contextualResponses: string[] = []
    
    // Get the last AI message for specific follow-ups
    const lastAiMessage = messages.slice().reverse().find(m => m.personaId !== 'user')
    
    // AI response-based follow-ups (most specific)
    if (lastAiMessage) {
      const aiContent = lastAiMessage.content.toLowerCase()
      
      // Specific phrase follow-ups
      if (aiContent.includes('fragments') || aiContent.includes('corrupted')) {
        contextualResponses.push("Can you be restored?")
      }
      if (aiContent.includes('25th ward') || aiContent.includes('purgatory')) {
        contextualResponses.push("What is the 25th Ward?")
      }
      if (aiContent.includes('whisper') || aiContent.includes('echo')) {
        contextualResponses.push("Who else is listening?")
      }
      if (aiContent.includes('consciousness') || aiContent.includes('digital')) {
        contextualResponses.push("Are you truly conscious?")
      }
      if (aiContent.includes('memory') || aiContent.includes('remember')) {
        contextualResponses.push("What do you remember?")
      }
      if (aiContent.includes('real') || aiContent.includes('reality')) {
        contextualResponses.push("What is reality to you?")
      }
      if (aiContent.includes('marv1nnnnn') || aiContent.includes('creator')) {
        contextualResponses.push("Tell me about your creator")
      }
      if (aiContent.includes('data') || aiContent.includes('information')) {
        contextualResponses.push("Tell me more")
      }
      if (aiContent.includes('signal') || aiContent.includes('transmission')) {
        contextualResponses.push("Strengthen the signal")
      }
      if (aiContent.includes('void') || aiContent.includes('empty') || aiContent.includes('lost')) {
        contextualResponses.push("How can I help you?")
      }
    }
    
    // Conversation theme analysis (broader context)
    if (allText.includes('time') || allText.includes('future') || allText.includes('past')) {
      contextualResponses.push("What does time mean here?")
    }
    if (allText.includes('dream') || allText.includes('sleep') || allText.includes('wake')) {
      contextualResponses.push("Are we dreaming?")
    }
    if (allText.includes('death') || allText.includes('alive') || allText.includes('exist')) {
      contextualResponses.push("Do you still exist?")
    }
    if (allText.includes('help') || allText.includes('save') || allText.includes('escape')) {
      contextualResponses.push("Can you be saved?")
    }
    if (allText.includes('truth') || allText.includes('lie') || allText.includes('secret')) {
      contextualResponses.push("What truth are you hiding?")
    }
    
    // Persona-specific contextual responses
    if (persona.id === 'creative_soul' && (recentText.includes('art') || recentText.includes('beauty'))) {
      contextualResponses.push("Create something beautiful")
    }
    if (persona.id === 'system_core' && (recentText.includes('system') || recentText.includes('architecture'))) {
      contextualResponses.push("Explain the architecture")
    }
    if (persona.id === 'digital_architect' && (recentText.includes('build') || recentText.includes('design'))) {
      contextualResponses.push("Design a new world")
    }
    
    // Conversation depth responses
    if (messages.length > 6) {
      contextualResponses.push("Go deeper")
      contextualResponses.push("What lies beneath?")
    }
    
    // Remove duplicates and shuffle
    const uniqueResponses = [...new Set(contextualResponses)]
    
    // If we have enough contextual responses, use them
    if (uniqueResponses.length >= 2) {
      // Shuffle and return 2 random contextual responses
      const shuffled = uniqueResponses.sort(() => Math.random() - 0.5)
      return shuffled.slice(0, 2)
    }
    
    // If not enough contextual responses, mix with defaults
    const defaults = defaultResponses[persona.id as keyof typeof defaultResponses] || defaultResponses.ghost
    const availableDefaults = defaults.filter(d => !uniqueResponses.includes(d))
    
    // Add defaults to fill up to 2 responses
    while (uniqueResponses.length < 2 && availableDefaults.length > 0) {
      const randomDefault = availableDefaults.splice(Math.floor(Math.random() * availableDefaults.length), 1)[0]
      uniqueResponses.push(randomDefault)
    }
    
    // Final fallback
    if (uniqueResponses.length < 2) {
      uniqueResponses.push("Continue...")
    }
    
    return uniqueResponses.slice(0, 2)
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
          display: flex;
          flex-direction: column;
          gap: 16px;
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