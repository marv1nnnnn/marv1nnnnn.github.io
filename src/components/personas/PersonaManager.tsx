'use client'

import { useState, useEffect, useCallback } from 'react'
import { AIPersona, ChatMessage } from '@/types/personas'
import { AI_PERSONAS, getRandomPersona } from '@/config/personas'
import { useAudio } from '@/contexts/AudioContext'

interface PersonaManagerProps {
  onPersonaChange: (persona: AIPersona) => void
  onMessageAdd: (message: ChatMessage) => void
  children: React.ReactNode
}

export default function PersonaManager({ onPersonaChange, onMessageAdd, children }: PersonaManagerProps) {
  const [currentPersona, setCurrentPersona] = useState<AIPersona>(AI_PERSONAS[0])
  const [messageCount, setMessageCount] = useState(0)
  const { playSound } = useAudio()

  // Random persona switching logic
  const switchPersona = useCallback(() => {
    const newPersona = getRandomPersona(currentPersona.id)
    setCurrentPersona(newPersona)
    onPersonaChange(newPersona)
    playSound('glitch')
    
    // Add system message about persona switch
    const switchMessage: ChatMessage = {
      id: `switch-${Date.now()}`,
      personaId: newPersona.id,
      content: getPersonaSwitchMessage(newPersona),
      timestamp: new Date(),
      isGlitched: true
    }
    
    onMessageAdd(switchMessage)
  }, [currentPersona.id, onPersonaChange, onMessageAdd, playSound])

  // Disabled automatic persona switching - now manual only
  // useEffect(() => {
  //   // Switch after certain number of messages (3-7 range)
  //   const shouldSwitch = messageCount > 0 && messageCount % (3 + Math.floor(Math.random() * 5)) === 0
  //   
  //   if (shouldSwitch && Math.random() < 0.7) { // 70% chance to actually switch
  //     const delay = 1000 + Math.random() * 2000 // 1-3 second delay
  //     const timeout = setTimeout(switchPersona, delay)
  //     return () => clearTimeout(timeout)
  //   }
  // }, [messageCount, switchPersona])

  // // Random autonomous switches (less frequent)
  // useEffect(() => {
  //   const autonomousSwitch = () => {
  //     if (Math.random() < 0.2) { // 20% chance
  //       switchPersona()
  //     }
  //   }

  //   // Random interval between 30-90 seconds
  //   const interval = setInterval(autonomousSwitch, 30000 + Math.random() * 60000)
  //   return () => clearInterval(interval)
  // }, [switchPersona])

  const incrementMessageCount = () => {
    setMessageCount(prev => prev + 1)
  }

  const getPersonaSwitchMessage = (persona: AIPersona): string => {
    const messages = {
      ghost: "...signal disrupted... another voice emerges from the static...",
      goth: "*shadows shift and coalesce* A darker presence stirs...",
      nerd: "// SYSTEM: Persona module loaded. New instance initialized.",
      poet: "The muse changes, like autumn leaves in digital wind...",
      conspiracy: "[REDACTED] has been replaced. The truth shifts again.",
      assassin: "Target acquired. New operative online. Elimination protocols active.",
      detective: "Case file updated. New perspective required for investigation."
    }
    
    return messages[persona.id as keyof typeof messages] || "The consciousness shifts..."
  }

  return (
    <div 
      className="persona-manager"
      style={{
        '--persona-bg': currentPersona.theme.backgroundColor,
        '--persona-text': currentPersona.theme.textColor,
        '--persona-accent': currentPersona.theme.accentColor,
        '--persona-font': currentPersona.theme.fontFamily || 'Courier New, monospace'
      } as React.CSSProperties}
    >
      {children}
      
      <style jsx>{`
        .persona-manager {
          width: 100%;
          height: 100%;
          background: var(--persona-bg);
          color: var(--persona-text);
          font-family: var(--persona-font);
          transition: all 0.5s ease;
          position: relative;
        }
        
        .persona-manager::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            var(--persona-accent)10 50%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  )
}

export { PersonaManager }