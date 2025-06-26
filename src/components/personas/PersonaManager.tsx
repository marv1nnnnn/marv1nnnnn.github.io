'use client'

import { AIPersona } from '@/types/personas'
import { DEFAULT_PERSONA } from '@/config/personas'

interface PersonaManagerProps {
  onPersonaChange?: (persona: AIPersona) => void
  onMessageAdd?: (message: any) => void
  children: React.ReactNode
}

export default function PersonaManager({ children }: PersonaManagerProps) {
  const currentPersona = DEFAULT_PERSONA

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