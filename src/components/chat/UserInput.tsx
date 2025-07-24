'use client'

import { useState, useRef, useEffect } from 'react'
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
    
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !disabled) {
      onSubmit(trimmedValue)
      setInputValue('')
      playSound('click')
      
      // Brief focus flash for better UX feedback
      if (inputRef.current) {
        inputRef.current.blur()
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    
    // Play typing sounds occasionally for immersion
    if (!disabled && Math.random() < 0.3) {
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  // Auto-focus when not disabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  const getPlaceholderText = () => {
    const placeholders = {
      ghost: "Whisper to the digital void...",
      goth: "Share your darkest thoughts...",
      nerd: "Enter command or query...",
      poet: "Speak your heart's verse...",
      conspiracy: "What truth do you seek?",
      detective: "State your testimony..."
    }
    
    return placeholders[persona.id as keyof typeof placeholders] || "Type your response..."
  }

  return (
    <form onSubmit={handleSubmit} className="user-input-form">
      <div className={`input-container ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''}`}>
        <span className="choice-number">3.</span>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={getPlaceholderText()}
          disabled={disabled}
          rows={1}
          className="message-input"
          maxLength={500}
        />
        {inputValue.trim() && (
          <button 
            type="submit" 
            className="send-button"
            disabled={disabled}
            title="Send message (Enter)"
          >
            ↵
          </button>
        )}
      </div>

      <style jsx>{`
        .user-input-form {
          width: 100%;
          flex-shrink: 0;
        }

        .input-container {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 107, 71, 0.1);
          border-radius: 4px;
          color: #cccccc;
          padding: 12px 14px;
          font-size: 14px;
          cursor: text;
          transition: all 0.2s ease;
          font-family: inherit;
          text-align: left;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
          min-height: 44px;
          position: relative;
        }

        .input-container.focused {
          border-color: rgba(255, 107, 71, 0.4);
          box-shadow: 0 0 12px rgba(255, 107, 71, 0.15);
          background: rgba(0, 0, 0, 0.3);
        }

        .input-container.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.1);
        }

        .choice-number {
          color: #ff6b47;
          font-weight: bold;
          flex-shrink: 0;
          font-family: inherit;
          font-size: 14px;
          margin-right: 0;
          text-shadow: 0 0 6px rgba(255, 107, 71, 0.3);
          line-height: 20px;
          min-width: 20px;
        }

        .message-input {
          background: transparent;
          border: none;
          color: #ffffff;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.4;
          resize: none;
          outline: none;
          width: 100%;
          padding: 0;
          height: auto;
          min-height: 20px;
          max-height: 120px;
          flex: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
          overflow-y: auto;
        }

        .message-input::placeholder {
          color: #888888;
          font-style: italic;
          opacity: 0.7;
        }

        .message-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          background: rgba(255, 107, 71, 0.1);
          border: 1px solid rgba(255, 107, 71, 0.3);
          color: #ff6b47;
          font-size: 16px;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
          margin-top: -2px;
        }

        .send-button:hover:not(:disabled) {
          background: rgba(255, 107, 71, 0.2);
          border-color: rgba(255, 107, 71, 0.5);
          color: #ffffff;
          box-shadow: 0 0 8px rgba(255, 107, 71, 0.2);
          transform: scale(1.05);
        }

        .send-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .send-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .input-container:hover:not(.disabled) .choice-number {
          color: #ff6b47;
          text-shadow: 0 0 8px rgba(255, 107, 71, 0.4);
        }

        .input-container:hover:not(.disabled) {
          border-color: rgba(255, 107, 71, 0.3);
          box-shadow: 0 0 8px rgba(255, 107, 71, 0.1);
        }
        
        .input-container:hover:not(.disabled) .message-input {
          color: #ffffff;
        }

        /* Scrollbar styling for textarea */
        .message-input::-webkit-scrollbar {
          width: 4px;
        }

        .message-input::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        .message-input::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 71, 0.3);
          border-radius: 2px;
        }

        .message-input::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 107, 71, 0.5);
        }
      `}</style>
    </form>
  )
}