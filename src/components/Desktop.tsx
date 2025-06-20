'use client'

import { useState, useEffect, useRef } from 'react'
import WindowManager from '@/components/WindowManager'
import Taskbar from '@/components/Taskbar'
import DesktopIcon from '@/components/DesktopIcon'
import { WindowState, DesktopIcon as DesktopIconType, SystemState } from '@/types'
import { useAudio } from '@/contexts/AudioContext'
import { gsap } from 'gsap'

const DESKTOP_ICONS: DesktopIconType[] = [
  {
    id: 'case-files',
    name: 'Case Files',
    icon: '📁',
    position: { x: 50, y: 50 },
    application: 'CaseFileReader',
  },
  {
    id: 'heavens-smile',
    name: "Heaven's Smile",
    icon: '🎯',
    position: { x: 50, y: 150 },
    application: 'HeavensSmileGallery',
  },
  {
    id: 'catherines-suitcase',
    name: "Catherine's Suitcase",
    icon: '📻',
    position: { x: 50, y: 250 },
    application: 'CatherinesSuitcase',
  },
  {
    id: 'lost-found',
    name: 'Lost & Found',
    icon: '🎮',
    position: { x: 50, y: 350 },
    application: 'LostFoundGames',
  },
  {
    id: 'consciousness',
    name: 'Transmitted Consciousness',
    icon: '🧠',
    position: { x: 50, y: 450 },
    application: 'TransmittedConsciousness',
  },
]

export default function Desktop() {
  const { playSound } = useAudio()
  const [windows, setWindows] = useState<WindowState[]>([])
  const [systemState, setSystemState] = useState<SystemState>({
    bootSequence: {
      isComplete: true,
      currentPhase: 5,
      errors: [],
    },
    audio: {
      masterVolume: 0.7,
      effectsVolume: 0.8,
      musicVolume: 0.6,
      isMuted: false,
    },
    windows: [],
    desktopIcons: DESKTOP_ICONS,
    systemTime: new Date(),
    glitchLevel: 0,
    connectionStatus: 'CONNECTED',
  })
  const [cursorTrails, setCursorTrails] = useState<Array<{ id: string; x: number; y: number }>>([])
  const desktopRef = useRef<HTMLDivElement>(null)

  // Update system time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setSystemState(prev => ({
        ...prev,
        systemTime: new Date(),
      }))
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Desktop entrance animation
  useEffect(() => {
    if (desktopRef.current) {
      gsap.fromTo(desktopRef.current,
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 1,
          ease: "power2.out"
        }
      )

      // Animate desktop icons
      const icons = desktopRef.current.querySelectorAll('.desktop-icon')
      gsap.fromTo(icons,
        { opacity: 0, y: 20, scale: 0.8 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.3,
          ease: "back.out(1.7)"
        }
      )
    }
  }, [])

  // Cursor trail effect
  useEffect(() => {
    let trailCounter = 0
    
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = {
        id: `${Date.now()}-${trailCounter++}`,
        x: e.clientX,
        y: e.clientY,
      }

      setCursorTrails(prev => {
        const updated = [...prev, newTrail]
        // Keep only last 10 trails
        return updated.slice(-10)
      })

      // Remove trail after animation
      setTimeout(() => {
        setCursorTrails(prev => prev.filter(trail => trail.id !== newTrail.id))
      }, 500)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Random glitch effects
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every 5 seconds
        setSystemState(prev => ({
          ...prev,
          glitchLevel: Math.random() * 3,
        }))

        setTimeout(() => {
          setSystemState(prev => ({
            ...prev,
            glitchLevel: 0,
          }))
        }, 200)
      }
    }, 5000)

    return () => clearInterval(glitchInterval)
  }, [])

  const handleIconDoubleClick = (icon: DesktopIconType) => {
    // Check if window already exists
    const existingWindow = windows.find(w => w.component === icon.application)
    
    if (existingWindow) {
      // Focus existing window
      playSound('windowOpen')
      setWindows(prev => prev.map(w => ({
        ...w,
        isFocused: w.id === existingWindow.id,
        isMinimized: w.id === existingWindow.id ? false : w.isMinimized,
        zIndex: w.id === existingWindow.id ? Math.max(...prev.map(win => win.zIndex)) + 1 : w.zIndex,
      })))
    } else {
      // Create new window
      playSound('windowOpen')
      const newWindow: WindowState = {
        id: `${icon.application}-${Date.now()}`,
        title: getWindowTitle(icon.application),
        component: icon.application,
        isMinimized: false,
        isMaximized: false,
        isFocused: true,
        position: getDefaultPosition(icon.application),
        zIndex: Math.max(...windows.map(w => w.zIndex), 0) + 1,
        props: icon.props,
      }

      setWindows(prev => [
        ...prev.map(w => ({ ...w, isFocused: false })),
        newWindow,
      ])
    }
  }

  const getWindowTitle = (application: string): string => {
    const titles: Record<string, string> = {
      CaseFileReader: 'The Film Window - Case Files',
      HeavensSmileGallery: "Heaven's Smile Gallery",
      CatherinesSuitcase: "Catherine's Suitcase",
      LostFoundGames: 'Lost & Found - Puzzle Archive',
      TransmittedConsciousness: 'Transmitted Consciousness v2.5',
    }
    return titles[application] || application
  }

  const getDefaultPosition = (application: string) => {
    const positions: Record<string, any> = {
      CaseFileReader: { x: 100, y: 100, width: 800, height: 600 },
      HeavensSmileGallery: { x: 200, y: 150, width: 900, height: 700 },
      CatherinesSuitcase: { x: 150, y: 100, width: 600, height: 500 },
      LostFoundGames: { x: 250, y: 200, width: 700, height: 550 },
      TransmittedConsciousness: { x: 300, y: 100, width: 650, height: 500 },
    }
    return positions[application] || { x: 100, y: 100, width: 600, height: 400 }
  }

  return (
    <div 
      ref={desktopRef}
      className={`desktop ${systemState.glitchLevel > 0 ? 'system-glitch' : ''}`}
      style={{
        filter: systemState.glitchLevel > 0 ? 
          `hue-rotate(${systemState.glitchLevel * 30}deg) saturate(${1 + systemState.glitchLevel})` : 
          'none',
      }}
    >
      {/* Desktop Background */}
      <div className="desktop-background" />

      {/* Cursor Trails */}
      {cursorTrails.map(trail => (
        <div
          key={trail.id}
          className="cursor-trail"
          style={{
            left: trail.x,
            top: trail.y,
          }}
        />
      ))}

      {/* Desktop Icons */}
      <div className="desktop-icons">
        {DESKTOP_ICONS.map(icon => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            onDoubleClick={() => handleIconDoubleClick(icon)}
          />
        ))}
      </div>

      {/* Window Manager */}
      <WindowManager
        windows={windows}
        setWindows={setWindows}
      />

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        systemState={systemState}
        onWindowToggle={(windowId) => {
          setWindows(prev => prev.map(w => ({
            ...w,
            isMinimized: w.id === windowId ? !w.isMinimized : w.isMinimized,
            isFocused: w.id === windowId && w.isMinimized ? true : w.isFocused,
          })))
        }}
      />

      {/* System Status Overlay */}
      {systemState.connectionStatus !== 'CONNECTED' && (
        <div className="system-alert">
          <div className="alert-content">
            CONNECTION STATUS: {systemState.connectionStatus}
            <br />
            {systemState.connectionStatus === 'UNSTABLE' && 'Signal interference detected...'}
            {systemState.connectionStatus === 'DISCONNECTED' && 'Re-establishing link to 25th Ward...'}
            {systemState.connectionStatus === 'CORRUPTED' && 'Data corruption in progress...'}
          </div>
        </div>
      )}

      <style jsx>{`
        .desktop {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--color-void);
        }

        .system-glitch {
          animation: system-glitch 0.1s ease-out;
        }

        @keyframes system-glitch {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }

        .desktop-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 20%, rgba(204, 0, 0, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 102, 204, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, rgba(255, 255, 255, 0.01) 50%, transparent 51%);
          background-size: 400px 400px, 300px 300px, 20px 20px;
          animation: background-drift 20s infinite linear;
        }

        @keyframes background-drift {
          0% { background-position: 0% 0%, 100% 100%, 0% 0%; }
          100% { background-position: 100% 100%, 0% 0%, 100% 100%; }
        }

        .desktop-icons {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .system-alert {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--color-void);
          border: 2px solid var(--color-blood);
          padding: var(--space-base);
          color: var(--color-blood);
          font-family: var(--font-system);
          text-align: center;
          z-index: 9999;
          animation: alert-pulse 1s infinite;
        }

        @keyframes alert-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .alert-content {
          font-size: var(--font-size-sm);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  )
}