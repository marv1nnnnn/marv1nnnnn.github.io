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
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 107, 71, 0.2);
          border-radius: 4px;
          padding: 20px;
          position: relative;
          margin-bottom: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(2px);
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
          color: #ff6b47;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(255, 107, 71, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 15px;
        }

        .persona-status {
          color: #cccccc;
          opacity: 0.7;
          font-style: italic;
          font-size: 12px;
        }

        .timestamp {
          color: #cccccc;
          opacity: 0.6;
          font-size: 12px;
        }

        .message-content {
          color: #ffffff;
          line-height: 1.6;
          min-height: 24px;
          position: relative;
          font-size: 15px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          font-weight: 300;
        }

        .cursor {
          animation: cursor-blink 1s infinite;
          color: #ff6b47;
          font-weight: bold;
          text-shadow: 0 0 6px rgba(255, 107, 71, 0.3);
        }
        
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
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
          background: linear-gradient(45deg, rgba(255, 107, 71, 0.1), transparent);
          z-index: -1;
          opacity: 0.3;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}