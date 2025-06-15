'use client'

import React, { useEffect, useState } from 'react'
import Window from './Window'
import DesktopIcon from './DesktopIcon'
import MultiPersonalityTerminal from './MultiPersonalityTerminal'
import MusicPlayer from './MusicPlayer'
import BlogReader from './BlogReader'
import HitCounter from './HitCounter'
import VisitorGreeter from './VisitorGreeter'
import CursorTrail from './CursorTrail'
import ChaosMonitor from './ChaosMonitor'
import { ChaosControlPanel } from './AudioVisualManager'
import BrokenCalculator from './BrokenCalculator'
import FakeBSOD from './FakeBSOD'
import SnakeGame from './SnakeGame'
import TetrisGame from './TetrisGame'
import DigitalLavaLamp from './DigitalLavaLamp'
import WeatherWidget from './WeatherWidget'
import { useChaos } from '@/contexts/ChaosProvider'
import { getAllPersonalities } from '@/config/personalities'

// Sample program components for demonstration
const SampleTerminal = () => <MultiPersonalityTerminal />

const SampleCalculator = () => (
  <div style={{ padding: '10px', background: '#f0f0f0' }}>
    <div style={{ marginBottom: '10px', padding: '5px', background: '#000', color: '#00ff00', fontFamily: 'monospace' }}>
      0
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
      {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map(btn => (
        <button key={btn} className="retro-button" style={{ padding: '10px' }}>
          {btn}
        </button>
      ))}
    </div>
  </div>
)

const SampleNotepad = () => (
  <div style={{ padding: '5px', height: '100%' }}>
    <textarea
      style={{
        width: '100%',
        height: '100%',
        border: '1px inset #c0c0c0',
        padding: '5px',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        resize: 'none'
      }}
      placeholder="Welcome to the chaos! Start typing..."
      defaultValue="Welcome to Chaotic Early-Web OS!

This is a nostalgic recreation of the beautiful madness 
that was the early web.

Features:
- Draggable windows
- Retro aesthetics
- Maximum chaos
- Y2K vibes

Enjoy the ride! 🌈✨"
    />
  </div>
)

// AI Personalities are now integrated into the main Terminal.exe

// Essential programs and games
const essentialPrograms = [
  {
    id: 'terminal',
    label: 'Terminal.exe',
    icon: '💻',
    component: <SampleTerminal />,
    title: 'System Terminal'
  },
  {
    id: 'broken-calculator',
    label: 'Calc.exe',
    icon: '🔢',
    component: <BrokenCalculator />,
    title: 'Broken Calculator'
  },
  {
    id: 'notepad',
    label: 'Notepad.exe',
    icon: '📝',
    component: <SampleNotepad />,
    title: 'Notepad'
  },
  {
    id: 'music',
    label: 'Winamp.exe',
    icon: '🎵',
    component: <MusicPlayer />,
    title: 'Music Player'
  },
  {
    id: 'chaos-control',
    label: 'Chaos.exe',
    icon: '🎪',
    component: <ChaosControlPanel />,
    title: 'Chaos Control Panel'
  }
]

// Chaos programs
const chaosPrograms = [
  {
    id: 'fake-bsod',
    label: 'BSOD.exe',
    icon: '💀',
    component: <FakeBSOD />,
    title: 'Fake Blue Screen'
  },
  {
    id: 'lava-lamp',
    label: 'LavaLamp.exe',
    icon: '🌋',
    component: <DigitalLavaLamp />,
    title: 'Digital Lava Lamp'
  },
  {
    id: 'weather',
    label: 'Weather.exe',
    icon: '🌤️',
    component: <WeatherWidget />,
    title: 'Y2K Weather Widget'
  },
  {
    id: 'browser',
    label: 'Browser.exe',
    icon: '🌐',
    component: (
      <div style={{ padding: '10px' }}>
        <div style={{ marginBottom: '10px', padding: '5px', background: '#e0e0e0', border: '1px inset #c0c0c0' }}>
          <strong>Address:</strong> http://www.geocities.com/~/chaos
        </div>
        <div className="glitch rainbow-text" style={{ fontSize: '24px', textAlign: 'center', margin: '20px 0' }}>
          🌈 WELCOME TO MY HOMEPAGE! 🌈
        </div>
        <div className="blink" style={{ textAlign: 'center' }}>
          ✨ Under Construction ✨
        </div>
        <div style={{ marginTop: '20px' }}>
          <div style={{
            background: 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)',
            padding: '5px',
            animation: 'scroll 10s linear infinite',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>
            This site best viewed in Netscape Navigator 4.0!
          </div>
        </div>
      </div>
    ),
    title: 'Chaos Browser'
  }
]

// Games
const gamePrograms = [
  {
    id: 'snake-game',
    label: 'Snake.exe',
    icon: '🐍',
    component: <SnakeGame />,
    title: 'Glitch Snake Game'
  },
  {
    id: 'tetris-game',
    label: 'Tetris.exe',
    icon: '🧱',
    component: <TetrisGame />,
    title: 'Chaos Tetris'
  }
]

// Miscellaneous programs (utilities and effects)
const miscPrograms = [
  {
    id: 'blog-reader',
    label: 'BlogReader.exe',
    icon: '📖',
    component: <BlogReader />,
    title: 'Terminal Blog Reader'
  },
  {
    id: 'hit-counter',
    label: 'Counter.exe',
    icon: '🔢',
    component: <HitCounter />,
    title: 'Retro Hit Counter'
  },
  {
    id: 'visitor-greeter',
    label: 'Welcome.exe',
    icon: '👋',
    component: <VisitorGreeter />,
    title: 'Visitor Greeter'
  },
  {
    id: 'cursor-trail',
    label: 'CursorFX.exe',
    icon: '✨',
    component: <CursorTrail />,
    title: 'Cursor Trail Effects'
  },
  {
    id: 'chaos-monitor',
    label: 'Monitor.exe',
    icon: '⚠️',
    component: <ChaosMonitor />,
    title: 'System Chaos Monitor'
  }
]

// Combined desktop icons
const desktopIcons = [
  ...essentialPrograms,
  ...chaosPrograms,
  ...gamePrograms,
  ...miscPrograms
  // AI personalities are now integrated into Terminal.exe
]

const Desktop: React.FC = () => {
  const { 
    windows, 
    createWindow, 
    systemState, 
    setChaosLevel, 
    triggerSystemWideEffect,
    startupState 
  } = useChaos()
  
  const [showWelcome, setShowWelcome] = useState(true)

  // Hide welcome message after startup or when windows exist
  useEffect(() => {
    if (windows.length > 0 || systemState.isBootComplete) {
      const timer = setTimeout(() => setShowWelcome(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [windows.length, systemState.isBootComplete])

  const handleIconDoubleClick = (iconConfig: typeof desktopIcons[0]) => {
    // Play interaction sound and trigger effects
    triggerSystemWideEffect('rainbow-cascade')
    
    // Responsive sizing based on device
    const isAITerminal = iconConfig.id.startsWith('ai_')
    const baseSizeMultiplier = systemState.isMobile ? 0.9 : 1
    
    const windowSize = isAITerminal
      ? { 
          width: typeof window !== 'undefined' ? Math.min(600 * baseSizeMultiplier, window.innerWidth * 0.9) : 600, 
          height: typeof window !== 'undefined' ? Math.min(500 * baseSizeMultiplier, window.innerHeight * 0.7) : 500 
        }
      : { 
          width: typeof window !== 'undefined' ? Math.min(400 * baseSizeMultiplier, window.innerWidth * 0.8) : 400, 
          height: typeof window !== 'undefined' ? Math.min(300 * baseSizeMultiplier, window.innerHeight * 0.6) : 300 
        }

    createWindow({
      title: iconConfig.title,
      component: iconConfig.component,
      size: windowSize,
      icon: iconConfig.icon,
      position: systemState.isMobile 
        ? { x: 10, y: 50 + windows.length * 20 } // Stack on mobile
        : undefined // Random positioning on desktop
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            setChaosLevel(0.3)
            break
          case '2':
            setChaosLevel(1.0)
            break
          case '3':
            setChaosLevel(2.0)
            break
          case 'e':
            triggerSystemWideEffect('full-chaos')
            e.preventDefault()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setChaosLevel, triggerSystemWideEffect])

  return (
    <div className={`desktop ${systemState.isMobile ? 'mobile' : 'desktop-mode'}`}>
      {/* Desktop Icons */}
      <div className={`desktop-icons ${systemState.isMobile ? 'mobile-layout' : ''}`}>
        {desktopIcons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon.icon}
            label={icon.label}
            onDoubleClick={() => handleIconDoubleClick(icon)}
          />
        ))}
      </div>

      {/* Render all windows */}
      {windows.map((window) => (
        <Window key={window.id} window={window} />
      ))}

      {/* Welcome message */}
      {showWelcome && windows.length === 0 && (
        <div className={`welcome-message ${systemState.isMobile ? 'mobile' : ''}`}>
          <div className="rainbow-text-enhanced blink-enhanced text-glow">
            ✨ WELCOME TO CHAOS OS ✨
          </div>
          <div className="subtitle">
            {systemState.isMobile ? 'Tap' : 'Double-click'} icons to launch programs!
          </div>
          <div className="personality-preview">
            AI Personalities: {getAllPersonalities().map(p => p.icon).join(' ')}
          </div>
          <div className="chaos-controls">
            <div>Chaos Level: {Math.round(systemState.chaosLevel * 100)}%</div>
            <div>Performance: {systemState.performanceMode}</div>
            {!systemState.isMobile && (
              <div className="keyboard-hints">
                Press Ctrl+1/2/3 for chaos levels, Ctrl+E for full chaos!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile touch feedback overlay */}
      {systemState.isMobile && (
        <div className="mobile-touch-feedback" />
      )}

      <style jsx>{`
        .desktop {
          width: 100vw;
          height: 100vh;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #4a90e2, #7b68ee, #50c9c3);
        }

        .desktop-mode {
          background: linear-gradient(135deg, #4a90e2, #7b68ee, #50c9c3);
        }

        .desktop-icons {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 10px;
          z-index: 5;
        }

        /* Specific positioning for Mac System 7 authentic scattered layout */
        .desktop-icons > :nth-child(1) { grid-column: 1; grid-row: 1; } /* Terminal */
        .desktop-icons > :nth-child(2) { grid-column: 2; grid-row: 2; } /* Calculator */
        .desktop-icons > :nth-child(3) { grid-column: 1; grid-row: 3; } /* Notepad */
        .desktop-icons > :nth-child(4) { grid-column: 3; grid-row: 1; } /* Music */
        .desktop-icons > :nth-child(5) { grid-column: 4; grid-row: 2; } /* Chaos Control */
        .desktop-icons > :nth-child(6) { grid-column: 6; grid-row: 1; } /* BSOD */
        .desktop-icons > :nth-child(7) { grid-column: 5; grid-row: 3; } /* Lava Lamp */
        .desktop-icons > :nth-child(8) { grid-column: 7; grid-row: 2; } /* Weather */
        .desktop-icons > :nth-child(9) { grid-column: 8; grid-row: 1; } /* Browser */
        .desktop-icons > :nth-child(10) { grid-column: 2; grid-row: 4; } /* Snake */
        .desktop-icons > :nth-child(11) { grid-column: 4; grid-row: 4; } /* Tetris */
        .desktop-icons > :nth-child(12) { grid-column: 1; grid-row: 5; } /* Blog Reader */
        .desktop-icons > :nth-child(13) { grid-column: 3; grid-row: 5; } /* Counter */
        .desktop-icons > :nth-child(14) { grid-column: 5; grid-row: 1; } /* Welcome */
        .desktop-icons > :nth-child(15) { grid-column: 6; grid-row: 3; } /* Cursor FX */
        .desktop-icons > :nth-child(16) { grid-column: 7; grid-row: 4; } /* Monitor */

        .welcome-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          font-size: 24px;
          font-weight: bold;
          z-index: 100;
          padding: 20px;
          border-radius: 10px;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(5px);
        }

        .welcome-message.mobile {
          font-size: 18px;
          padding: 15px;
          max-width: 90vw;
        }

        .subtitle {
          font-size: 16px;
          margin-top: 20px;
          color: #00ffff;
        }

        .welcome-message.mobile .subtitle {
          font-size: 14px;
          margin-top: 15px;
        }

        .personality-preview {
          font-size: 14px;
          margin-top: 10px;
          opacity: 0.8;
          color: #ffff00;
        }

        .welcome-message.mobile .personality-preview {
          font-size: 12px;
        }

        .chaos-controls {
          font-size: 12px;
          margin-top: 15px;
          color: #ff00ff;
          font-family: 'Courier New', monospace;
        }

        .welcome-message.mobile .chaos-controls {
          font-size: 10px;
          margin-top: 10px;
        }

        .keyboard-hints {
          font-size: 10px;
          margin-top: 8px;
          color: #00ff00;
          font-style: italic;
        }

        .desktop.mobile {
          touch-action: manipulation;
        }

        .desktop-icons.mobile-layout {
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
          gap: 10px;
          z-index: 10;
          background: rgba(0,0,0,0.2);
          padding: 10px;
          border-radius: 10px;
          backdrop-filter: blur(3px);
        }

        .mobile-touch-feedback {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  )
}

export default Desktop