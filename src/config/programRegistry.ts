import React from 'react'
import { getAllPersonalities } from '@/config/personalities'

// Dynamic imports for existing components
const AITerminal = React.lazy(() => import('@/components/AITerminal'))
const HackerAITerminal = React.lazy(() => import('@/components/AITerminalWrapper').then(module => ({ default: module.HackerAITerminal })))
const MusicPlayer = React.lazy(() => import('@/components/MusicPlayer'))
const BlogReader = React.lazy(() => import('@/components/BlogReader'))
const HitCounter = React.lazy(() => import('@/components/HitCounter'))
const VisitorGreeter = React.lazy(() => import('@/components/VisitorGreeter'))
const CursorTrail = React.lazy(() => import('@/components/CursorTrail'))
const ChaosMonitor = React.lazy(() => import('@/components/ChaosMonitor'))
const Notepad = React.lazy(() => import('@/components/Notepad'))
const Browser = React.lazy(() => import('@/components/Browser'))

// Interactive Programs and Games (newly created)
const SnakeGame = React.lazy(() => import('@/components/SnakeGame'))
const TetrisGame = React.lazy(() => import('@/components/TetrisGame'))
const BrokenCalculator = React.lazy(() => import('@/components/BrokenCalculator'))
const FakeBSOD = React.lazy(() => import('@/components/FakeBSOD'))
const DigitalLavaLamp = React.lazy(() => import('@/components/DigitalLavaLamp'))
const WeatherWidget = React.lazy(() => import('@/components/WeatherWidget'))

export interface ProgramConfig {
  id: string
  title: string
  component: React.ComponentType<any>
  icon: string
  size: { width: number; height: number }
  autoLaunch?: boolean
  autoLaunchDelay?: number
  position?: { x: number; y: number }
}

// Auto-launch programs configuration
export const AUTO_LAUNCH_PROGRAMS: ProgramConfig[] = [
  {
    id: 'terminal-ai',
    title: 'Terminal AI - HACKER_AI',
    component: React.lazy(() => import('@/components/AITerminalWrapper').then(module => ({ default: module.HackerAITerminal }))),
    icon: '💻',
    size: { width: 600, height: 500 },
    autoLaunch: true,
    autoLaunchDelay: 1000,
    position: { x: 50, y: 50 }
  }
]

// All available programs (including non-auto-launch)
export const PROGRAM_REGISTRY: { [key: string]: ProgramConfig } = {
  // Auto-launch programs
  ...AUTO_LAUNCH_PROGRAMS.reduce((acc, program) => {
    acc[program.id] = program
    return acc
  }, {} as { [key: string]: ProgramConfig }),

  // AI Personalities (not auto-launch) - using direct components with fallback handling
  ...getAllPersonalities().reduce((acc, personality) => {
    acc[`ai_${personality.id}`] = {
      id: `ai_${personality.id}`,
      title: `AI Terminal - ${personality.name}`,
      component: React.lazy(() => import('@/components/AITerminal').then(module => ({
        default: () => React.createElement(module.default, { personalityId: personality.id })
      }))),
      icon: personality.icon,
      size: { width: 600, height: 500 },
      autoLaunch: false
    }
    return acc
  }, {} as { [key: string]: ProgramConfig }),

  // Interactive Programs (newly implemented)
  'broken-calculator': {
    id: 'broken-calculator',
    title: 'Broken Calculator.exe',
    component: BrokenCalculator,
    icon: '🔢',
    size: { width: 280, height: 400 },
    autoLaunch: false
  },
  'fake-bsod': {
    id: 'fake-bsod',
    title: 'Fake BSOD.exe',
    component: FakeBSOD,
    icon: '💀',
    size: { width: 450, height: 350 },
    autoLaunch: false
  },
  'digital-lava-lamp': {
    id: 'digital-lava-lamp',
    title: 'Digital Lava Lamp.exe',
    component: DigitalLavaLamp,
    icon: '🌈',
    size: { width: 350, height: 550 },
    autoLaunch: false
  },
  'weather-widget': {
    id: 'weather-widget',
    title: 'Weather Widget.exe',
    component: WeatherWidget,
    icon: '🌤️',
    size: { width: 320, height: 450 },
    autoLaunch: false
  },

  // Mini-Games (newly implemented)
  'snake-game': {
    id: 'snake-game',
    title: 'Snake.exe',
    component: SnakeGame,
    icon: '🐍',
    size: { width: 550, height: 650 },
    autoLaunch: false
  },
  'tetris-game': {
    id: 'tetris-game',
    title: 'Tetris.exe', 
    component: TetrisGame,
    icon: '🧱',
    size: { width: 500, height: 600 },
    autoLaunch: false
  },

  // Additional desktop programs
  'music-player': {
    id: 'music-player',
    title: 'Winamp Clone v5.66',
    component: MusicPlayer,
    icon: '🎵',
    size: { width: 300, height: 400 },
    autoLaunch: false
  },
  'calculator': {
    id: 'calculator',
    title: 'Calculator.exe',
    component: BrokenCalculator,
    icon: '🔢',
    size: { width: 300, height: 400 },
    autoLaunch: false
  },
  'notepad': {
    id: 'notepad',
    title: 'Notepad.exe',
    component: Notepad,
    icon: '📝',
    size: { width: 500, height: 400 },
    autoLaunch: false
  },
  'browser': {
    id: 'browser',
    title: 'Chaos Browser',
    component: Browser,
    icon: '🌐',
    size: { width: 800, height: 600 },
    autoLaunch: false
  },
  
  // Additional programs from desktop
  'blog-reader': {
    id: 'blog-reader',
    title: 'Blog Reader',
    component: BlogReader,
    icon: '📖',
    size: { width: 700, height: 500 },
    autoLaunch: false
  },
  'hit-counter': {
    id: 'hit-counter',
    title: 'Hit Counter',
    component: HitCounter,
    icon: '👁️',
    size: { width: 300, height: 200 },
    autoLaunch: false
  },
  'visitor-greeter': {
    id: 'visitor-greeter',
    title: 'Visitor Greeter',
    component: VisitorGreeter,
    icon: '👋',
    size: { width: 400, height: 300 },
    autoLaunch: false
  },
  'cursor-trail': {
    id: 'cursor-trail',
    title: 'Cursor Trail FX',
    component: CursorTrail,
    icon: '✨',
    size: { width: 350, height: 250 },
    autoLaunch: false
  },
  'chaos-monitor': {
    id: 'chaos-monitor',
    title: 'Chaos Monitor',
    component: ChaosMonitor,
    icon: '📊',
    size: { width: 600, height: 400 },
    autoLaunch: false
  },
  'chaos-control': {
    id: 'chaos-control',
    title: 'Chaos Control Panel',
    component: React.lazy(() => import('@/components/ChaosControlPanel').then(module => ({ default: module.ChaosControlPanel }))),
    icon: '⚡',
    size: { width: 500, height: 400 },
    autoLaunch: false
  }
}

export const getProgram = (id: string): ProgramConfig | undefined => {
  return PROGRAM_REGISTRY[id]
}

export const getAutoLaunchPrograms = (): ProgramConfig[] => {
  return AUTO_LAUNCH_PROGRAMS.sort((a, b) => (a.autoLaunchDelay || 0) - (b.autoLaunchDelay || 0))
}

export const getAllPrograms = (): ProgramConfig[] => {
  return Object.values(PROGRAM_REGISTRY)
}