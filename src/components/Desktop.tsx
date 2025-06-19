'use client'

import React, { useEffect, useState, useCallback } from 'react'
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
import dynamic from 'next/dynamic'

// Dynamic import for BrainDashboard to prevent SSR issues
const BrainDashboard = dynamic(() => import('./brain/BrainDashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-black text-cyan-400">
      <div className="text-center">
        <div className="text-2xl mb-2">🧠</div>
        <div>Loading Brain Interface...</div>
      </div>
    </div>
  )
})
import { useChaos } from '@/contexts/ChaosProvider'
import { getAllPersonalities } from '@/config/personalities'
import { useWindowManager } from '@/hooks/useWindowManager'
import { getProgram, PROGRAM_REGISTRY } from '@/config/programRegistry'

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
  },
  {
    id: 'brain-dashboard',
    label: 'Brain.exe',
    icon: '🧠',
    component: null, // Will be handled specially
    title: 'Brain Module Dashboard'
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
    startupState,
    registerProgramLaunch,
    registerProgramClose,
    isProgramRunning
  } = useChaos()
  
  const [showWelcome, setShowWelcome] = useState(true)
  const [show3DBrain, setShow3DBrain] = useState(false)
  const { createWindow: createWindowDirect } = useWindowManager()

  // Wrapper to register program launches
  const createWindowWithRegistration = useCallback((config: any, programId?: string) => {
    const windowId = createWindow(config)
    if (programId && windowId) {
      registerProgramLaunch(programId, 'desktop-window', windowId)
    }
    return windowId
  }, [createWindow, registerProgramLaunch])

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
    
    // Special handling for Brain Dashboard
    if (iconConfig.id === 'brain-dashboard') {
      createWindowWithRegistration({
        title: iconConfig.title,
        component: (
          <BrainDashboard
            onModuleLaunch={handleProgramLaunch}
            showInstructions={true}
            enableAutoRotation={true}
            className="w-full h-full"
          />
        ),
        size: {
          width: typeof window !== 'undefined' ? Math.min(800, window.innerWidth * 0.9) : 800,
          height: typeof window !== 'undefined' ? Math.min(600, window.innerHeight * 0.8) : 600
        },
        icon: iconConfig.icon,
        position: systemState.isMobile
          ? { x: 10, y: 50 }
          : undefined
      }, iconConfig.id)
      return
    }
    
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

    createWindowWithRegistration({
      title: iconConfig.title,
      component: iconConfig.component,
      size: windowSize,
      icon: iconConfig.icon,
      position: systemState.isMobile
        ? { x: 10, y: 50 + windows.length * 20 } // Stack on mobile
        : undefined // Random positioning on desktop
    }, iconConfig.id)
  }

  // Enhanced program launch handler for 3D brain
  const handleProgramLaunch = (moduleId: string, regionId?: string) => {
    console.log('🧠 Brain launching program:', moduleId, 'from region:', regionId)
    
    const program = getProgram(moduleId)
    if (!program) {
      console.error(`❌ Program not found in registry: ${moduleId}`)
      console.log('📋 Available programs:', Object.keys(PROGRAM_REGISTRY))
      return
    }

    console.log('✅ Program found:', program.title)

    // This is now handled by the BrainDashboard's own handleModuleLaunch
    // We only create 2D windows if the call comes from outside the 3D brain
    if (!regionId) {
      // Audio-visual feedback for program launch
      triggerSystemWideEffect('rainbow-cascade')

      // Create traditional 2D window
      createWindowWithRegistration({
        title: program.title,
        component: React.createElement(program.component),
        size: program.size,
        icon: program.icon,
        position: program.position || undefined
      }, program.id)
      
      console.log('🚀 2D Window created for:', program.title)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'e':
            triggerSystemWideEffect('full-chaos')
            e.preventDefault()
            break
          case 'b':
            setShow3DBrain(!show3DBrain)
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
    {/* 3D Brain Experience */}
    {show3DBrain ? (
      <BrainDashboard
        onModuleLaunch={handleProgramLaunch}
        showInstructions={true}
        enableAutoRotation={true}
        className="fixed inset-0 z-50"
      />
    ) : (
      <>
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
                  Press Ctrl+E for full chaos! Press Ctrl+B to enter 3D brain mode!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile touch feedback overlay */}
        {systemState.isMobile && (
          <div className="mobile-touch-feedback" />
        )}
      </>
    )}

    {/* 3D Brain Toggle Button - Enhanced persistent floating interface */}
    <div className="brain-toggle-dock">
      <button
        className="brain-toggle-button"
        onClick={() => setShow3DBrain(!show3DBrain)}
        title={show3DBrain ? "Exit 3D Brain" : "Enter 3D Brain"}
      >
        {show3DBrain ? '🔙' : '🧠'}
      </button>
    </div>

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

        /* Enhanced 3D Brain Toggle Button */
        .brain-toggle-dock {
          position: fixed;
          bottom: 100px;
          right: 100px;
          width: 70px;
          height: 70px;
          z-index: 1000;
          animation: floating 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5));
        }

        .brain-toggle-button {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ff0080, #00ffff);
          border: 3px solid #ffffff;
          border-radius: 50%;
          color: white;
          font-size: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.8));
          animation: pulseGlow 2s ease-in-out infinite alternate;
        }

        .brain-toggle-button:hover {
          transform: scale(1.1);
          filter: drop-shadow(0 0 25px rgba(255, 0, 128, 1));
          background: linear-gradient(135deg, #00ffff, #ff0080);
        }

        .brain-toggle-button:active {
          transform: scale(0.95);
        }

        @keyframes floating {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          25% {
            transform: translateY(-8px) scale(1.02);
          }
          50% {
            transform: translateY(-4px) scale(1.01);
          }
          75% {
            transform: translateY(-12px) scale(1.03);
          }
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          }
          100% {
            box-shadow: 0 0 30px rgba(255, 0, 128, 0.8), 0 0 40px rgba(0, 255, 255, 0.6);
          }
        }

        @media (max-width: 768px) {
          .brain-toggle-dock {
            bottom: 80px;
            right: 20px;
            width: 60px;
            height: 60px;
          }
          
          .brain-toggle-button {
            font-size: 24px;
            border-width: 2px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brain-toggle-dock,
          .brain-toggle-button {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

export default Desktop