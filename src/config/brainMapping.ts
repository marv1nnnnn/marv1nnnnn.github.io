import { Vector3 } from 'three'

export interface BrainRegionConfig {
  position: [number, number, number]
  color: string
  shape: 'geometric' | 'organic' | 'flowing' | 'dynamic' | 'vital'
  programs: string[]
  size: number
  activationRadius: number
}

export const BRAIN_REGION_MAPPING: Record<string, BrainRegionConfig> = {
  'frontal-cortex': {
    position: [0, 2.5, 4],
    color: '#00ffff',
    shape: 'geometric',
    programs: ['broken-calculator', 'terminal-ai', 'multi-personality-terminal', 'chaos-monitor', 'notepad'],
    size: 3.0,
    activationRadius: 5
  },
  'temporal-lobe-left': {
    position: [-4.5, 0.5, 0],
    color: '#ffff00',
    shape: 'flowing',
    programs: ['music-player', 'blog-reader', 'hit-counter'],
    size: 2.5,
    activationRadius: 4
  },
  'temporal-lobe-right': {
    position: [4.5, 0.5, 0],
    color: '#ffaa00',
    shape: 'flowing',
    programs: ['visitor-greeter'],
    size: 2.5,
    activationRadius: 4
  },
  'occipital-lobe': {
    position: [0, 1, -4.5],
    color: '#80ff00',
    shape: 'organic',
    programs: ['digital-lava-lamp', 'cursor-trail', 'weather-widget', 'browser'],
    size: 2.8,
    activationRadius: 4.5
  },
  'motor-cortex': {
    position: [0, 4.5, 0],
    color: '#ff0080',
    shape: 'dynamic',
    programs: ['snake-game', 'tetris-game'],
    size: 2.2,
    activationRadius: 3.5
  },
  'brainstem': {
    position: [0, -3, 0],
    color: '#ff8000',
    shape: 'vital',
    programs: ['fake-bsod', 'chaos-control'],
    size: 2.0,
    activationRadius: 3
  }
}

// Program to brain region reverse mapping for quick lookups
export const PROGRAM_TO_REGION: Record<string, string> = {}
Object.entries(BRAIN_REGION_MAPPING).forEach(([regionId, config]) => {
  config.programs.forEach(programId => {
    PROGRAM_TO_REGION[programId] = regionId
  })
})

// Brain region visual themes with enhanced chaotic Y2K aesthetics
export const BRAIN_VISUAL_THEMES = {
  'frontal-cortex': {
    primaryColor: '#00ffff',
    secondaryColor: '#0080ff',
    tertiaryColor: '#80ffff',
    glowIntensity: 1.4,
    patternType: 'geometric',
    animationSpeed: 1.0,
    chaosLevel: 0.3,
    pulseFrequency: 2.0,
    effectType: 'matrix'
  },
  'temporal-lobe-left': {
    primaryColor: '#ffff00',
    secondaryColor: '#ffaa00',
    tertiaryColor: '#ffff80',
    glowIntensity: 1.1,
    patternType: 'waves',
    animationSpeed: 0.8,
    chaosLevel: 0.5,
    pulseFrequency: 1.5,
    effectType: 'sound-waves'
  },
  'temporal-lobe-right': {
    primaryColor: '#ffaa00',
    secondaryColor: '#ff8800',
    tertiaryColor: '#ffcc80',
    glowIntensity: 1.1,
    patternType: 'waves',
    animationSpeed: 0.8,
    chaosLevel: 0.5,
    pulseFrequency: 1.5,
    effectType: 'memory-flow'
  },
  'occipital-lobe': {
    primaryColor: '#80ff00',
    secondaryColor: '#40aa00',
    tertiaryColor: '#a0ff80',
    glowIntensity: 1.3,
    patternType: 'swirls',
    animationSpeed: 1.3,
    chaosLevel: 0.7,
    pulseFrequency: 2.5,
    effectType: 'visual-burst'
  },
  'motor-cortex': {
    primaryColor: '#ff0080',
    secondaryColor: '#ff4080',
    tertiaryColor: '#ff80c0',
    glowIntensity: 1.6,
    patternType: 'lightning',
    animationSpeed: 1.8,
    chaosLevel: 0.9,
    pulseFrequency: 3.0,
    effectType: 'motion-blur'
  },
  'brainstem': {
    primaryColor: '#ff8000',
    secondaryColor: '#ff4000',
    tertiaryColor: '#ffaa80',
    glowIntensity: 1.8,
    patternType: 'pulse',
    animationSpeed: 2.2,
    chaosLevel: 1.0,
    pulseFrequency: 4.0,
    effectType: 'vital-signs'
  }
} as const

// Enhanced pattern definitions for different brain regions
export const BRAIN_PATTERN_EFFECTS = {
  'matrix': {
    particleCount: 20,
    trailLength: 8,
    speed: 'fast'
  },
  'sound-waves': {
    particleCount: 15,
    trailLength: 12,
    speed: 'medium'
  },
  'memory-flow': {
    particleCount: 18,
    trailLength: 10,
    speed: 'medium'
  },
  'visual-burst': {
    particleCount: 25,
    trailLength: 6,
    speed: 'fast'
  },
  'motion-blur': {
    particleCount: 30,
    trailLength: 4,
    speed: 'very-fast'
  },
  'vital-signs': {
    particleCount: 12,
    trailLength: 15,
    speed: 'slow'
  }
} as const

export type BrainRegionId = keyof typeof BRAIN_REGION_MAPPING
export type BrainVisualTheme = keyof typeof BRAIN_VISUAL_THEMES