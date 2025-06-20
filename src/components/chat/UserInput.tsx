'use client'

import { useState, useRef } from 'react'
import { AIPersona } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'

interface UserInputProps {
  onSubmit: (message: string) => void
  disabled: boolean
  persona: AIPersona
}

export default function UserInput({ onSubmit, disabled, persona }: UserInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { playSound } = useAudio()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (inputValue.trim() && !disabled) {
      onSubmit(inputValue.trim())
      setInputValue('')
      playSound('click')
      
      // Brief focus flash
      if (inputRef.current) {
        inputRef.current.blur()
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    
    // Play typing sounds
    if (!disabled && Math.random() < 0.4) {
      playSound('typing')
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    playSound('hover')
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const getPlaceholderText = () => {
    const placeholders = {
      ghost: "Whisper to the digital void...",
      goth: "Share your darkest thoughts...",
      nerd: "Enter command or query...",
      poet: "Speak your heart's verse...",
      conspiracy: "What truth do you seek?",
      detective: "State your testimony..."
    }
    
    return placeholders[persona.id as keyof typeof placeholders] || "Type your message..."
  }

  return (
    <form onSubmit={handleSubmit} className="user-input-form">
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={getPlaceholderText()}
            disabled={disabled}
            rows={2}
            className="message-input"
          />
          
          <div className="input-controls">
            <div className="char-counter">
              {inputValue.length}/500
            </div>
            
            <button
              type="submit"
              disabled={disabled || !inputValue.trim()}
              className="send-button"
            >
              {disabled ? 'TRANSMITTING...' : 'SEND'}
            </button>
          </div>
        </div>
        
        <div className="connection-indicator">
          <div className={`signal-dot ${disabled ? 'transmitting' : 'ready'}`} />
          <span className="connection-text">
            {disabled ? 'Transmitting to void...' : 'Ready to transmit'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .user-input-form {
          width: 100%;
        }

        .input-container {
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid ${isFocused ? 'var(--persona-accent, #cccc66)' : 'rgba(255, 255, 255, 0.2)'};
          border-radius: 8px;
          padding: 12px;
          transition: all 0.3s ease;
          position: relative;
        }

        .input-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, var(--persona-accent, #cccc66), transparent, var(--persona-accent, #cccc66));
          border-radius: 8px;
          z-index: -1;
          opacity: ${isFocused ? '0.3' : '0'};
          transition: opacity 0.3s ease;
        }

        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .message-input {
          background: transparent;
          border: none;
          color: var(--persona-text, #cccccc);
          font-family: var(--persona-font, 'Courier New, monospace');
          font-size: 14px;
          line-height: 1.4;
          resize: none;
          outline: none;
          width: 100%;
          padding: 8px 0;
        }

        .message-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }

        .message-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .char-counter {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-family: 'Courier New, monospace';
        }

        .send-button {
          background: transparent;
          border: 1px solid var(--persona-accent, #cccc66);
          color: var(--persona-accent, #cccc66);
          padding: 6px 16px;
          font-size: 12px;
          font-family: 'Courier New, monospace';
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 1px;
        }

        .send-button:hover:not(:disabled) {
          background: var(--persona-accent, #cccc66);
          color: var(--persona-bg, #0a0a0a);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .signal-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .signal-dot.ready {
          background: #00ff00;
          box-shadow: 0 0 8px #00ff00;
        }

        .signal-dot.transmitting {
          background: var(--persona-accent, #cccc66);
          animation: signal-pulse 1s infinite;
        }

        @keyframes signal-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.3);
          }
        }

        .connection-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Courier New, monospace';
        }
      `}</style>
    </form>
  )
}