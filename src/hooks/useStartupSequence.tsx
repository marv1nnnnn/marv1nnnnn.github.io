'use client'

import { useEffect, useRef } from 'react'
import { useWindowManager } from '@/hooks/useWindowManager'
import { useAudioManager } from '@/hooks/useAudioManager'
import AITerminal from '@/components/AITerminal'
import MusicPlayer from '@/components/MusicPlayer'
import BlogReader from '@/components/BlogReader'
import HitCounter from '@/components/HitCounter'
import VisitorGreeter from '@/components/VisitorGreeter'
import CursorTrail from '@/components/CursorTrail'
import ChaosMonitor from '@/components/ChaosMonitor'

interface AutoLaunchProgram {
  id: string
  title: string
  component: React.ReactNode
  icon: string
  size: { width: number; height: number }
  delay: number
  position: { x: number; y: number }
}

const AUTO_LAUNCH_PROGRAMS: AutoLaunchProgram[] = [
  {
    id: 'visitor-greeter',
    title: 'Visitor Greeter v3.1',
    component: <VisitorGreeter />,
    icon: '👋',
    size: { width: 400, height: 300 },
    delay: 500,
    position: { x: 50, y: 50 }
  },
  {
    id: 'terminal-ai',
    title: 'Terminal AI - HACKER_AI',
    component: <AITerminal personalityId="HACKER_AI" />,
    icon: '💻',
    size: { width: 600, height: 500 },
    delay: 1000,
    position: { x: 200, y: 100 }
  },
  {
    id: 'blog-reader',
    title: 'Blog Reader v2.0',
    component: <BlogReader />,
    icon: '📖',
    size: { width: 700, height: 600 },
    delay: 1500,
    position: { x: 350, y: 150 }
  },
  {
    id: 'music-player',
    title: 'Winamp Clone v5.66',
    component: <MusicPlayer />,
    icon: '🎵',
    size: { width: 300, height: 400 },
    delay: 2000,
    position: { x: 500, y: 250 }
  },
  {
    id: 'hit-counter',
    title: 'Hit Counter v1.0',
    component: <HitCounter />,
    icon: '🔢',
    size: { width: 250, height: 150 },
    delay: 2500,
    position: { x: 100, y: 400 }
  },
  {
    id: 'cursor-trail',
    title: 'Cursor Trail FX',
    component: <CursorTrail />,
    icon: '✨',
    size: { width: 200, height: 100 },
    delay: 3000,
    position: { x: 600, y: 400 }
  },
  {
    id: 'chaos-monitor',
    title: 'System Chaos Monitor',
    component: <ChaosMonitor />,
    icon: '⚠️',
    size: { width: 450, height: 350 },
    delay: 3500,
    position: { x: 250, y: 300 }
  }
]

const useStartupSequence = () => {
  const { createWindow } = useWindowManager()
  const { soundEffects } = useAudioManager()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const launchPrograms = async () => {
      // Play startup sound
      try {
        soundEffects.notification?.()
      } catch (error) {
        console.log('Startup sound not available')
      }

      // Launch programs in sequence
      AUTO_LAUNCH_PROGRAMS.forEach((program) => {
        setTimeout(() => {
          try {
            // Play launch sound
            soundEffects.click?.()
            
            // Create window
            createWindow({
              title: program.title,
              component: program.component,
              size: program.size,
              position: program.position,
              icon: program.icon
            })
          } catch (error) {
            console.error(`Failed to launch ${program.title}:`, error)
          }
        }, program.delay)
      })
    }

    // Start the sequence after a brief delay
    const startTimeout = setTimeout(launchPrograms, 1000)

    return () => {
      clearTimeout(startTimeout)
    }
  }, [createWindow, soundEffects])

  return {
    autoLaunchPrograms: AUTO_LAUNCH_PROGRAMS
  }
}

export default useStartupSequence