'use client'

import { useState, useEffect } from 'react'
import { ChatMessage, AIPersona } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'

interface TypewriterMessageProps {
  message: ChatMessage
  persona: AIPersona
  speed: number
}

export default function TypewriterMessage({ message, persona, speed }: TypewriterMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)
  const { playSound } = useAudio()

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)
    
    const text = message.content
    let currentIndex = 0
    
    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
        
        // Play typing sound occasionally
        if (Math.random() < 0.3) {
          playSound('typing')
        }
        
        // Random glitch effect during typing
        if (message.isGlitched && Math.random() < 0.1) {
          setIsGlitching(true)
          setTimeout(() => setIsGlitching(false), 100)
        }
      } else {
        setIsComplete(true)
        clearInterval(typeInterval)
      }
    }, speed)

    return () => clearInterval(typeInterval)
  }, [message.content, speed, message.isGlitched, playSound])

  const renderGlitchedText = (text: string) => {
    if (!message.isGlitched && !isGlitching) return text
    
    return text.split('').map((char, index) => {
      const shouldGlitch = isGlitching || (message.isGlitched && Math.random() < 0.1)
      
      if (shouldGlitch && char !== ' ') {
        const glitchChars = ['█', '▓', '▒', '░', '¿', '§', '†', '‡', '¤', '◊']
        const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)]
        
        return (
          <span 
            key={index}
            className="glitch-char"
            style={{
              color: Math.random() < 0.5 ? '#ff0000' : '#00ff00',
              textShadow: '0 0 5px currentColor'
            }}
          >
            {glitchChar}
          </span>
        )
      }
      
      return <span key={index}>{char}</span>
    })
  }

  const getPersonaSpecificStyling = () => {
    switch (persona.personality.speakingStyle) {
      case 'dramatic_poetic':
        return {
          fontStyle: 'italic',
          lineHeight: '1.8',
          letterSpacing: '0.5px'
        }
      case 'technical_precise':
        return {
          fontFamily: 'Courier New, monospace',
          fontSize: '13px',
          lineHeight: '1.4'
        }
      case 'lyrical_flowing':
        return {
          fontFamily: 'serif',
          lineHeight: '1.7',
          textAlign: 'center' as const
        }
      case 'urgent_suspicious':
        return {
          textTransform: 'uppercase' as const,
          letterSpacing: '1px',
          fontWeight: 'bold'
        }
      default:
        return {}
    }
  }

  return (
    <div className="typewriter-message">
      <div className="message-header">
        <span className="persona-indicator">
          <span className="persona-name">{persona.displayName}</span>
          <span className="persona-status">
            {!isComplete ? 'transmitting...' : 'signal complete'}
          </span>
        </span>
        <span className="timestamp">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      <div 
        className={`message-content ${isGlitching ? 'glitching' : ''}`}
        style={getPersonaSpecificStyling()}
      >
        {renderGlitchedText(displayedText)}
        {!isComplete && <span className="cursor">|</span>}
      </div>
      
      {message.isGlitched && isComplete && (
        <div className="glitch-warning">
          [SIGNAL CORRUPTED - TRANSMISSION MAY BE INCOMPLETE]
        </div>
      )}

      <style jsx>{`
        .typewriter-message {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--persona-accent, #cccc66);
          border-radius: 4px;
          padding: 12px;
          position: relative;
          margin-bottom: 8px;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 11px;
          opacity: 0.9;
        }

        .persona-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .persona-name {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        .persona-status {
          color: var(--persona-text, #cccccc);
          opacity: 0.7;
          font-style: italic;
        }

        .timestamp {
          color: var(--persona-text, #cccccc);
          opacity: 0.6;
        }

        .message-content {
          color: var(--persona-text, #cccccc);
          line-height: 1.6;
          min-height: 20px;
          position: relative;
        }

        .message-content.glitching {
          animation: content-glitch 0.1s ease-in-out;
        }

        @keyframes content-glitch {
          0% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }

        .cursor {
          animation: cursor-blink 1s infinite;
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .glitch-char {
          animation: glitch-flicker 0.15s ease-in-out;
        }

        @keyframes glitch-flicker {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        .glitch-warning {
          margin-top: 8px;
          font-size: 10px;
          color: #ff6666;
          text-align: center;
          opacity: 0.8;
          font-style: italic;
          border-top: 1px solid #ff6666;
          padding-top: 4px;
        }

        .typewriter-message::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(45deg, var(--persona-accent, #cccc66), transparent);
          z-index: -1;
          opacity: 0.3;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}