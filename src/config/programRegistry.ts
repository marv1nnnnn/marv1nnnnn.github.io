import React from 'react'
import { getAllPersonalities } from '@/config/personalities'

// Dynamic imports for existing components
const AITerminal = React.lazy(() => import('@/components/AITerminal'))
const MusicPlayer = React.lazy(() => import('@/components/MusicPlayer'))

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
    component: () => React.createElement(AITerminal, { personalityId: 'HACKER_AI' }),
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

  // AI Personalities (not auto-launch)
  ...getAllPersonalities().reduce((acc, personality) => {
    acc[`ai_${personality.id}`] = {
      id: `ai_${personality.id}`,
      title: `AI Terminal - ${personality.name}`,
      component: () => React.createElement(AITerminal, { personalityId: personality.id }),
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
    component: () => React.createElement('div', { style: { padding: '20px' } }, 'Standard Calculator Coming Soon...'),
    icon: '🔢',
    size: { width: 300, height: 400 },
    autoLaunch: false
  },
  'notepad': {
    id: 'notepad',
    title: 'Notepad.exe',
    component: () => React.createElement('div', { style: { padding: '20px' } }, 'Notepad Coming Soon...'),
    icon: '📝',
    size: { width: 500, height: 400 },
    autoLaunch: false
  },
  'browser': {
    id: 'browser',
    title: 'Chaos Browser',
    component: () => React.createElement('div', { style: { padding: '20px' } }, 'Browser Coming Soon...'),
    icon: '🌐',
    size: { width: 800, height: 600 },
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