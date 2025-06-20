// Core OS Types for The Transmitter-Receiver OS

export interface WindowPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState {
  id: string
  title: string
  isMinimized: boolean
  isMaximized: boolean
  isFocused: boolean
  position: WindowPosition
  zIndex: number
  component: string
  props?: Record<string, any>
}

export interface DesktopIcon {
  id: string
  name: string
  icon: string
  position: { x: number; y: number }
  application: string
  props?: Record<string, any>
}

// Application Types
export interface Application {
  id: string
  name: string
  component: string
  icon: string
  defaultPosition: WindowPosition
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  resizable?: boolean
  maximizable?: boolean
  minimizable?: boolean
}

// Blog/Case File System
export interface CaseFile {
  id: string
  slug: string
  title: string
  author: string
  date: string
  tags: string[]
  filename: string
  content?: string
  classification?: 'CLASSIFIED' | 'RESTRICTED' | 'PUBLIC' | 'REDACTED'
  glitchWords?: string[]
}

// Portfolio/Heaven's Smile Gallery
export interface ProjectTarget {
  id: string
  title: string
  description: string
  technologies: string[]
  links: {
    demo?: string
    github?: string
    live?: string
  }
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  color: string
  shape: 'cube' | 'sphere' | 'pyramid' | 'torus'
  isShattered?: boolean
}

// Music Player/Catherine's Suitcase
export interface Track {
  id: string
  title: string
  artist: string
  filename: string
  duration: number
}

export interface Playlist {
  id: string
  name: string
  tracks: Track[]
  currentTrack?: number
  isPlaying: boolean
  volume: number
  isLooping: boolean
}

// Mini-Games/Lost & Found Puzzles
export interface PuzzleGame {
  id: string
  name: string
  type: 'truth-search' | 'paradox-solver' | 'targeting'
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'NIGHTMARE'
  highScore?: number
  isCompleted: boolean
}

export interface TruthSearchKeyword {
  word: string
  fragment: string
  isFound: boolean
  category: 'LOCATION' | 'PERSON' | 'EVENT' | 'OBJECT'
}

export interface TargetingTarget {
  id: string
  x: number
  y: number
  speed: number
  value: number
  type: 'heaven-smile' | 'remnant' | 'phantom'
  isHit: boolean
}

// AI/Transmitted Consciousness
export interface AIPersonality {
  id: string
  name: string
  description: string
  systemPrompt: string
  characteristics: string[]
  responsePatterns: {
    cryptic: number
    philosophical: number
    unreliable: number
    technical: number
  }
}

export interface DialogueNode {
  id: string
  type: 'ai-response' | 'user-choice' | 'system-message'
  content: string
  choices?: DialogueChoice[]
  nextNode?: string
  conditions?: Record<string, any>
}

export interface DialogueChoice {
  id: string
  text: string
  nextNode: string
  conditions?: Record<string, any>
  effects?: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  isGlitched?: boolean
  isRedacted?: boolean
  classification?: string
}

// System State
export interface SystemState {
  bootSequence: {
    isComplete: boolean
    currentPhase: number
    errors: string[]
  }
  audio: {
    masterVolume: number
    effectsVolume: number
    musicVolume: number
    isMuted: boolean
  }
  windows: WindowState[]
  desktopIcons: DesktopIcon[]
  activeApplication?: string
  systemTime: Date
  glitchLevel: number
  connectionStatus: 'CONNECTED' | 'UNSTABLE' | 'DISCONNECTED' | 'CORRUPTED'
}

// Boot Sequence
export interface BootPhase {
  id: number
  name: string
  messages: string[]
  duration: number
  errorChance: number
  glitchEffect?: boolean
}

// Audio System
export interface SystemSound {
  id: string
  name: string
  file: string
  volume: number
  category: 'ui' | 'ambient' | 'effect' | 'voice'
}

// Visual Effects
export interface VisualEffect {
  id: string
  type: 'glitch' | 'static' | 'redaction' | 'flicker' | 'corruption'
  duration: number
  intensity: number
  target?: string
}

// Error/Glitch System
export interface SystemError {
  id: string
  type: 'MEMORY_LEAK' | 'SIGNAL_CORRUPTION' | 'CONSCIOUSNESS_FRAGMENT' | 'PARADOX_DETECTED'
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: Date
  isResolved: boolean
}

// Export utility types
export type WindowComponent = 
  | 'CaseFileReader'
  | 'HeavensSmileGallery' 
  | 'CatherinesSuitcase'
  | 'TruthSearchGame'
  | 'ParadoxSolver'
  | 'TargetingGame'
  | 'TransmittedConsciousness'
  | 'SystemMonitor'
  | 'ErrorLog'

export type ApplicationCategory = 
  | 'core'
  | 'games' 
  | 'utilities'
  | 'communication'