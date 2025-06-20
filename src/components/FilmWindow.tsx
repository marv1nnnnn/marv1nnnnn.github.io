'use client'

import { useState, useEffect, useRef } from 'react'
import { useAudio } from '@/contexts/AudioContext'
import { AIPersona, ChatMessage } from '@/types/personas'
import { AI_PERSONAS } from '@/config/personas'
import PersonaManager from './personas/PersonaManager'
import PersonaVisualizer from './personas/PersonaVisualizer'
import PersonaSelector from './personas/PersonaSelector'
import ChatInterface from './chat/ChatInterface'
import ContentModal from './modals/ContentModal'
import gsap from 'gsap'

type ContentType = 'blogs' | 'music' | 'games' | null

export default function FilmWindow() {
  const { playSound } = useAudio()
  const [currentPersona, setCurrentPersona] = useState<AIPersona>(AI_PERSONAS[0])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [activeContent, setActiveContent] = useState<ContentType>(null)
  const [showPersonaSelector, setShowPersonaSelector] = useState(false)
  const filmWindowRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-1',
      personaId: currentPersona.id,
      content: "Connection established... Multiple consciousnesses detected in the digital realm. Who dares to commune with the fragments of lost souls?",
      timestamp: new Date(),
      isGlitched: true
    }
    
    setMessages([welcomeMessage])
    playSound('boot')
  }, [playSound, currentPersona.id])

  // Film window entrance animation
  useEffect(() => {
    if (filmWindowRef.current) {
      gsap.fromTo(filmWindowRef.current,
        { 
          opacity: 0,
          scale: 0.9,
          y: 50 
        },
        { 
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.5,
          ease: "power2.out"
        }
      )
    }
  }, [])

  const handlePersonaChange = (persona: AIPersona) => {
    setCurrentPersona(persona)
    
    // Brief typing indicator when persona switches
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 1500)

    // Add persona switch message
    const switchMessage: ChatMessage = {
      id: `manual-switch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      personaId: persona.id,
      content: getPersonaSwitchMessage(persona),
      timestamp: new Date(),
      isGlitched: true
    }
    
    setMessages(prev => [...prev, switchMessage])
  }

  const handleOpenPersonaSelector = () => {
    setShowPersonaSelector(true)
    playSound('click')
  }

  const handleClosePersonaSelector = () => {
    setShowPersonaSelector(false)
  }

  const getPersonaSwitchMessage = (persona: AIPersona): string => {
    const messages = {
      ghost: "...manual override detected... consciousness realigned...",
      goth: "*the shadows part to reveal a new form*",
      nerd: "// MANUAL: User-initiated persona switch complete.",
      poet: "By your command, I transform like verses in the wind...",
      conspiracy: "The switch... was it your choice, or were you guided?",
      assassin: "New operative selected. Mission parameters updated.",
      detective: "Manual investigation mode activated. What case requires attention?"
    }
    
    return messages[persona.id as keyof typeof messages] || "Consciousness manually shifted..."
  }

  const handleMessageAdd = (message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }

  const handleMenuClick = (contentType: ContentType) => {
    // Toggle if clicking the same tab
    if (activeContent === contentType) {
      setActiveContent(null)
      playSound('windowClose')
    } else {
      setActiveContent(contentType)
      playSound('click')
    }
  }

  const handleCloseModal = () => {
    setActiveContent(null)
    playSound('windowClose')
  }

  return (
    <PersonaManager 
      onPersonaChange={handlePersonaChange}
      onMessageAdd={handleMessageAdd}
    >
      <div ref={filmWindowRef} className="film-window">
        {/* Film Window Chrome */}
        <div className="film-chrome">
          <div className="chrome-top">
            <div className="location-tabs">
              <div 
                className={`location-tab ${activeContent === 'blogs' ? 'location-active' : 'location-inactive'}`}
                onClick={() => handleMenuClick('blogs')}
              >
                Case Files
              </div>
              <div 
                className={`location-tab ${activeContent === 'music' ? 'location-active' : 'location-inactive'}`}
                onClick={() => handleMenuClick('music')}
              >
                Catherine's Suitcase
              </div>
              <div 
                className={`location-tab ${activeContent === 'games' ? 'location-active' : 'location-inactive'}`}
                onClick={() => handleMenuClick('games')}
              >
                Lost Protocols
              </div>
            </div>
            <div className="spectrum-display">
              <div className="spectrum-label">Spectrum</div>
              <div className="spectrum-bars">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="spectrum-bar"
                    style={{ 
                      height: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="chrome-bottom">
            <div className="status-line">
              Connection Status: ACTIVE | Persona: {currentPersona.displayName} | Signal: STRONG
              <div className="persona-switch-area">
                <div className="persona-indicator">
                  <div className="persona-avatar">
                    <div className={`avatar-${currentPersona.avatar.model}`}></div>
                  </div>
                  <div className="persona-name-display">{currentPersona.displayName}</div>
                </div>
                <button 
                  className="persona-selector-btn"
                  onClick={handleOpenPersonaSelector}
                  title="Switch Consciousness"
                >
                  <span className="switch-icon">⚡</span>
                  <span className="switch-text">SWITCH CONSCIOUSNESS</span>
                  <span className="switch-glow"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          {/* Left Panel - 3D Visualization */}
          <div className="visual-panel">
            <PersonaVisualizer 
              persona={currentPersona}
              isActive={true}
              isTyping={isTyping}
            />
            <div className="persona-info">
              <div className="persona-name">{currentPersona.displayName}</div>
              <div className="persona-description">{currentPersona.description}</div>
            </div>
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="chat-panel">
            <ChatInterface
              persona={currentPersona}
              messages={messages}
              onMessageAdd={handleMessageAdd}
              onTypingChange={setIsTyping}
            />
          </div>
        </div>


        {/* Content Modal */}
        {activeContent && (
          <ContentModal 
            contentType={activeContent}
            onClose={handleCloseModal}
            persona={currentPersona}
          />
        )}

        {/* Persona Selector */}
        <PersonaSelector
          currentPersona={currentPersona}
          onPersonaSelect={handlePersonaChange}
          isVisible={showPersonaSelector}
          onClose={handleClosePersonaSelector}
        />
      </div>

      <style jsx>{`
        .film-window {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .film-chrome {
          background: linear-gradient(90deg, #2a2a2a 0%, #1a1a1a 100%);
          border-bottom: 2px solid var(--persona-accent, #cccc66);
          padding: 12px 20px;
          font-family: var(--persona-font, 'Courier New, monospace');
          font-size: 14px;
        }

        .chrome-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .location-tabs {
          display: flex;
          gap: 16px;
        }

        .location-tab {
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .location-active {
          color: #ffff88;
          text-decoration: underline;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.15);
          text-shadow: 0 0 8px #ffff88;
        }

        .location-inactive {
          color: #aaaaaa;
        }

        .location-tab:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
          text-shadow: 0 0 5px #ffffff;
        }

        .location-active:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .location-disabled {
          opacity: 0.4;
          cursor: not-allowed;
          position: relative;
        }

        .location-disabled:hover {
          color: #666666 !important;
          background: none !important;
          transform: none !important;
        }

        .location-disabled::after {
          content: '🔒';
          margin-left: 8px;
          font-size: 10px;
        }

        .spectrum-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spectrum-label {
          color: var(--persona-accent, #cccc66);
          font-size: 10px;
        }

        .spectrum-bars {
          display: flex;
          gap: 2px;
          height: 20px;
          align-items: end;
        }

        .spectrum-bar {
          width: 3px;
          background: var(--persona-accent, #cccc66);
          opacity: 0.7;
          animation: spectrum-pulse 2s infinite ease-in-out;
        }

        @keyframes spectrum-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .chrome-bottom {
          border-top: 1px solid #333;
          padding-top: 4px;
        }

        .status-line {
          color: var(--persona-text, #cccccc);
          font-size: 14px;
          opacity: 0.9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
        }

        .persona-switch-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .persona-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border: 1px solid var(--persona-accent, #cccc66);
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.3);
        }

        .persona-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
        }

        .avatar-ghost {
          background: radial-gradient(circle, #ffffff88 0%, #cccccc44 100%);
          animation: ghost-pulse 2s infinite ease-in-out;
        }

        .avatar-figure {
          background: linear-gradient(45deg, var(--persona-accent, #cccc66) 0%, var(--persona-text, #cccccc) 100%);
        }

        .avatar-geometric {
          background: linear-gradient(45deg, #00ff41 0%, #003d10 100%);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        .avatar-abstract {
          background: conic-gradient(from 0deg, #ffd700, #b8860b, #ffd700);
          animation: spin 4s linear infinite;
        }

        @keyframes ghost-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .persona-name-display {
          font-size: 12px;
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .persona-selector-btn {
          background: linear-gradient(135deg, var(--persona-accent, #cccc66)22 0%, transparent 100%);
          border: 2px solid var(--persona-accent, #cccc66);
          color: var(--persona-accent, #cccc66);
          padding: 8px 16px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .switch-icon {
          font-size: 16px;
          animation: pulse-glow 2s infinite ease-in-out;
        }

        .switch-text {
          position: relative;
          z-index: 2;
        }

        .switch-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--persona-accent, #cccc66);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .persona-selector-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(204, 204, 102, 0.4);
          border-color: #ffffff;
          color: #000000;
        }

        .persona-selector-btn:hover .switch-glow {
          opacity: 1;
        }

        .persona-selector-btn:hover .switch-icon {
          animation: electric-pulse 0.5s infinite ease-in-out;
        }

        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 5px var(--persona-accent, #cccc66); }
          50% { text-shadow: 0 0 15px var(--persona-accent, #cccc66), 0 0 25px var(--persona-accent, #cccc66); }
        }

        @keyframes electric-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .content-area {
          flex: 1;
          display: flex;
          height: calc(100vh - 120px);
        }

        .visual-panel {
          width: 40%;
          position: relative;
          border-right: 2px solid var(--persona-accent, #cccc66);
          background: radial-gradient(circle at center, var(--persona-bg, #0a0a0a) 0%, #000000 100%);
        }

        .persona-info {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.8);
          padding: 12px;
          border: 1px solid var(--persona-accent, #cccc66);
          font-family: var(--persona-font, 'Courier New, monospace');
        }

        .persona-name {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
          margin-bottom: 4px;
        }

        .persona-description {
          color: var(--persona-text, #cccccc);
          font-size: 12px;
          opacity: 0.9;
        }

        .chat-panel {
          width: 60%;
          background: var(--persona-bg, #0a0a0a);
        }

        /* Film grain effect */
        .film-window::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 10;
        }

        /* Scanlines */
        .film-window::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          );
          pointer-events: none;
          z-index: 9;
        }
      `}</style>
    </PersonaManager>
  )
}