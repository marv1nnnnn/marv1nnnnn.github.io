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
          background: transparent;
          border: none;
          color: #cccccc;
          padding: 8px 0;
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
          color: #888888;
          font-weight: bold;
          flex-shrink: 0;
          font-family: inherit;
          font-size: 14px;
          margin-right: 0;
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
        }

        .message-input::placeholder {
          color: #888888;
          font-style: normal;
        }

        .message-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-container:hover .choice-number {
          color: #cccccc;
        }

        .input-container:hover .message-input {
          color: #ffffff;
        }
      `}</style>
    </form>
  )
}