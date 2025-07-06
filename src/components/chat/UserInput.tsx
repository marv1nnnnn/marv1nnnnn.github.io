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
        <span className="choice-number">3.</span>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Type your response..."
          disabled={disabled}
          rows={1}
          className="message-input"
        />
      </div>

      <style jsx>{`
        .user-input-form {
          width: 100%;
          flex-shrink: 0;
        }

        .input-container {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 107, 71, 0.1);
          border-radius: 2px;
          color: #cccccc;
          padding: 8px 12px;
          font-size: 14px;
          cursor: text;
          transition: all 0.2s ease;
          font-family: inherit;
          text-align: left;
          display: flex;
          align-items: baseline;
          gap: 0;
          line-height: 1.4;
        }

        .choice-number {
          color: #ff6b47;
          font-weight: bold;
          flex-shrink: 0;
          font-family: inherit;
          font-size: 14px;
          margin-right: 0;
          text-shadow: 0 0 6px rgba(255, 107, 71, 0.3);
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
          padding: 0 0 0 8px;
          height: auto;
          min-height: 20px;
          flex: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
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

        .input-container:hover .choice-number {
          color: #ff6b47;
          text-shadow: 0 0 8px rgba(255, 107, 71, 0.4);
        }

        .input-container:hover {
          border-color: rgba(255, 107, 71, 0.3);
          box-shadow: 0 0 8px rgba(255, 107, 71, 0.1);
        }
        
        .input-container:hover .message-input {
          color: #ffffff;
        }
      `}</style>
    </form>
  )
}