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
        if (Math.random() < 0.2) {
          playSound('typing')
        }
      } else {
        setIsComplete(true)
        clearInterval(typeInterval)
      }
    }, speed)

    return () => clearInterval(typeInterval)
  }, [message.content, speed, playSound])

  // Simple clean text display without glitch effects

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
          fontSize: '16px',
          lineHeight: '1.6'
        }
      case 'lyrical_flowing':
        return {
          fontFamily: 'serif',
          lineHeight: '1.7'
        }
      case 'urgent_suspicious':
        return {
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
        className="message-content"
        style={getPersonaSpecificStyling()}
      >
        {displayedText}
        {!isComplete && <span className="cursor">|</span>}
      </div>

      <style jsx>{`
        .typewriter-message {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--persona-accent, #cccc66);
          border-radius: 6px;
          padding: 16px;
          position: relative;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          opacity: 0.9;
        }

        .persona-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .persona-name {
          color: #ffff88;
          font-weight: bold;
          text-shadow: 0 0 5px #ffff88;
        }

        .persona-status {
          color: #ffffff;
          opacity: 0.8;
          font-style: italic;
        }

        .timestamp {
          color: #ffffff;
          opacity: 0.7;
        }

        .message-content {
          color: #ffffff;
          line-height: 1.7;
          min-height: 24px;
          position: relative;
          font-size: 16px;
        }

        .cursor {
          /* animation: cursor-blink 1s infinite; */
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        /* @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        } */

        .typewriter-message::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(45deg, var(--persona-accent, #cccc66), transparent);
          z-index: -1;
          opacity: 0.2;
          border-radius: 6px;
        }
      `}</style>
    </div>
  )
}