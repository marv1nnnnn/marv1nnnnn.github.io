'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BootPhase } from '@/types'
import { useAudio } from '@/contexts/AudioContext'
import { gsap } from 'gsap'

interface BootSequenceProps {
  onBootComplete: () => void
}

const BOOT_PHASES: BootPhase[] = [
  {
    id: 1,
    name: 'SYSTEM_INITIALIZATION',
    messages: [
      'TRANSMITTER-RECEIVER OS v2.5.1',
      'Initializing consciousness fragments...',
      'Loading neural pathways...',
      'Connecting to The 25th Ward...',
    ],
    duration: 2000,
    errorChance: 0.1,
  },
  {
    id: 2,
    name: 'MEMORY_ALLOCATION',
    messages: [
      'Allocating memory sectors...',
      'ERROR: Memory fragment corrupted at 0x7F4A',
      'Attempting recovery protocol...',
      'Recovery successful - utilizing backup engrams',
    ],
    duration: 1500,
    errorChance: 0.3,
    glitchEffect: true,
  },
  {
    id: 3,
    name: 'PERSONALITY_MATRIX',
    messages: [
      'Loading personality matrix...',
      'Scanning for fractured identities...',
      'WARNING: Multiple consciousness detected',
      'Personality conflicts resolved',
    ],
    duration: 1800,
    errorChance: 0.2,
  },
  {
    id: 4,
    name: 'NETWORK_CONNECTION',
    messages: [
      'Establishing connection to Kamino Network...',
      'Signal strength: [REDACTED]',
      'Authentication: HEAVEN_SMILE protocol',
      'Connection secured - entering system',
    ],
    duration: 2200,
    errorChance: 0.15,
  },
  {
    id: 5,
    name: 'FINAL_CHECKS',
    messages: [
      'Running system diagnostics...',
      'Checking for anomalies...',
      'All systems nominal',
      'Welcome to the 25th Ward',
    ],
    duration: 1000,
    errorChance: 0.05,
  },
]

export default function BootSequence({ onBootComplete }: BootSequenceProps) {
  const { playSound } = useAudio()
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [glitchActive, setGlitchActive] = useState(false)
  const bootContainerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const typeMessage = useCallback((message: string, callback?: () => void) => {
    setIsTyping(true)
    setDisplayText('')
    
    let index = 0
    const typeChar = () => {
      if (index < message.length) {
        setDisplayText(prev => prev + message[index])
        index++
        
        // Play typing sound occasionally
        if (Math.random() < 0.3) {
          playSound('typing')
        }
        
        // Random typing speed for more organic feel
        const delay = Math.random() * 5 + 1 // "Incredible speed"
        setTimeout(typeChar, delay)
      } else {
        setIsTyping(false)
        callback?.()
      }
    }
    
    typeChar()
  }, [playSound])

  const triggerGlitch = useCallback(() => {
    setGlitchActive(true)
    playSound('glitch')
    
    // GSAP glitch animation
    if (bootContainerRef.current) {
      gsap.fromTo(bootContainerRef.current, 
        { x: 0, y: 0, rotationZ: 0 },
        { 
          x: "random(-5, 5)", 
          y: "random(-3, 3)", 
          rotationZ: "random(-0.5, 0.5)",
          duration: 0.05,
          repeat: 3,
          yoyo: true,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(bootContainerRef.current, { x: 0, y: 0, rotationZ: 0 })
          }
        }
      )
    }
    
    setTimeout(() => setGlitchActive(false), 200)
  }, [playSound])

  useEffect(() => {
    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  useEffect(() => {
    // Play boot sound at start
    playSound('boot')
    
    // Initial boot animation
    if (bootContainerRef.current) {
      gsap.fromTo(bootContainerRef.current,
        { opacity: 0, scale: 0.8, y: 50 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 1,
          ease: "power2.out"
        }
      )
    }
  }, [playSound])

  useEffect(() => {
    if (currentPhase >= BOOT_PHASES.length) {
      // Boot complete
      setTimeout(() => {
        onBootComplete()
      }, 50) // Faster final delay
      return
    }

    const phase = BOOT_PHASES[currentPhase]
    const message = phase.messages[currentMessage]

    // Random glitch effect for certain phases
    if (phase.glitchEffect && Math.random() < 0.3) {
      triggerGlitch()
    }

    // Type current message
    typeMessage(message, () => {
      setTimeout(() => {
        if (currentMessage < phase.messages.length - 1) {
          // Move to next message in current phase
          setCurrentMessage(prev => prev + 1)
        } else {
          // Move to next phase
          setTimeout(() => {
            setCurrentPhase(prev => prev + 1)
            setCurrentMessage(0)
          }, 50) // Faster delay between phases
        }
      }, 20) // Faster delay between messages
    })
  }, [currentPhase, currentMessage, typeMessage, triggerGlitch, onBootComplete])

  const currentPhaseData = BOOT_PHASES[currentPhase]
  const progress = currentPhase >= BOOT_PHASES.length ? 100 : 
    ((currentPhase * 100) + ((currentMessage + 1) / (currentPhaseData?.messages.length || 1) * 100)) / BOOT_PHASES.length

  // Animate progress bar with GSAP
  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${progress}%`,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }, [progress])

  return (
    <div className={`boot-sequence ${glitchActive ? 'glitch-active' : ''}`}>
      <div ref={bootContainerRef} className="boot-container">
        <div className="boot-header">
          <div className="boot-logo">
            █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█<br/>
            █  TRANSMITTER-RECEIVER OS  █<br/>
            █         v2.5.1            █<br/>
            █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█
          </div>
        </div>

        <div className="boot-content">
          <div className="system-info">
            <div>System: KAMINO_OS_CORE</div>
            <div>Build: 25TH_WARD_STABLE</div>
            <div>Architecture: CONSCIOUSNESS_x64</div>
            <div>Memory: [CLASSIFIED] TB</div>
          </div>

          <div className="boot-progress">
            <div className="progress-bar">
              <div 
                ref={progressBarRef}
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round(progress)}% Complete
            </div>
          </div>

          <div className="boot-messages">
            <div className="current-message">
              {displayText}
              {showCursor && !isTyping && <span className="cursor">_</span>}
              {isTyping && <span className="cursor typing">█</span>}
            </div>
          </div>

          <div className="system-status">
            <div className="status-line">
              Status: {currentPhaseData?.name || 'INITIALIZING'}
            </div>
            <div className="status-line">
              Phase: {currentPhase + 1}/{BOOT_PHASES.length}
            </div>
          </div>
        </div>

        <div className="boot-footer">
          <div className="warning-text">
            WARNING: This system contains CLASSIFIED information.<br/>
            Unauthorized access is strictly prohibited.<br/>
            All activities are monitored and recorded.
          </div>
        </div>
      </div>

      <style jsx>{`
        .boot-sequence {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .boot-sequence.glitch-active {
          animation: boot-glitch 0.2s ease-out;
        }

        @keyframes boot-glitch {
          0% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
          40% { transform: translate(2px, -1px); filter: hue-rotate(180deg); }
          60% { transform: translate(-1px, 2px); filter: hue-rotate(270deg); }
          80% { transform: translate(1px, -2px); filter: hue-rotate(360deg); }
          100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
        }

        .boot-container {
          width: 80%;
          max-width: 800px;
          border: 2px solid var(--color-light);
          padding: var(--space-xl);
          background: var(--color-void);
        }

        .boot-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .boot-logo {
          font-size: var(--font-size-sm);
          line-height: 1.2;
          color: var(--color-info);
          white-space: pre-line;
        }

        .boot-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .system-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-sm);
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
        }

        .boot-progress {
          margin: var(--space-lg) 0;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          border: 1px solid var(--color-light);
          background: var(--color-void);
          margin-bottom: var(--space-sm);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-info), var(--color-blood));
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-size: var(--font-size-sm);
        }

        .boot-messages {
          min-height: 60px;
          padding: var(--space-base);
          border: 1px solid var(--color-shadow);
          background: rgba(0, 0, 0, 0.5);
        }

        .current-message {
          font-size: var(--font-size-base);
          line-height: 1.4;
          color: var(--color-light);
        }

        .cursor {
          color: var(--color-info);
          animation: cursor-blink 1s infinite;
        }

        .cursor.typing {
          animation: none;
          color: var(--color-blood);
        }

        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .system-status {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
        }

        .boot-footer {
          margin-top: var(--space-xl);
          padding-top: var(--space-base);
          border-top: 1px solid var(--color-shadow);
        }

        .warning-text {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          text-align: center;
          line-height: 1.3;
        }
      `}</style>
    </div>
  )
}