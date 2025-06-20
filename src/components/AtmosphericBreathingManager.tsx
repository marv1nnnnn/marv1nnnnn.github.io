'use client'

import * as THREE from 'three'

/**
 * AtmosphericBreathingManager - Phase 4 Implementation
 * 
 * Unifies breathing and state management across ocean, beacons, and particles.
 * Provides shared uniforms and synchronized breathing cycles for the entire
 * Lynchian Sky Beacon System.
 */
export class AtmosphericBreathingManager {
  // Core breathing parameters
  private primaryCycle: number = 0.15 // 8-12 second cycles (matches brainstorming)
  private deepBreathTimer: number = 0.07 // 45 second deep breaths
  private currentPhase: number = 0
  private deepBreathPhase: number = 0
  private lastDeepBreath: number = 0

  // Subscribers for breathing updates
  private breathingSubscribers: Array<(phase: number, deepBreath: number) => void> = []
  
  // Shared uniforms for all atmospheric components
  public atmosphericUniforms: { [key: string]: THREE.IUniform } = {
    // Time and breathing
    uTime: { value: 0 },
    uBreathingPhase: { value: 0 },
    uBreathingAmplitude: { value: 0.25 },
    uDeepBreathPhase: { value: 0 },
    uDeepBreathIntensity: { value: 0.8 },
    
    // Emotion state (unified across all components)
    uEmotionType: { value: 0 }, // 0-4 mapped to emotions
    uEmotionIntensity: { value: 0.6 },
    uEmotionTransition: { value: 0 }, // For smooth transitions
    
    // Shared amethyst color palette
    uColorDeep: { value: new THREE.Color('#1a0d2e') },    // Deep indigo
    uColorMid: { value: new THREE.Color('#7c3aed') },     // Purple/violet  
    uColorLight: { value: new THREE.Color('#c084fc') },   // Light purple
    uColorEthereal: { value: new THREE.Color('#d8b3ff') }, // Ethereal amethyst
    
    // Performance and effects
    uGlitchLevel: { value: 0 },
    uPerformanceMode: { value: 0 }, // 0=full, 1=reduced
    
    // Lynch-esque atmosphere controls
    uMysteryIntensity: { value: 0.7 },
    uCosmicDriftSpeed: { value: 1.0 },
    uResonanceSync: { value: 0.9 }
  }

  // Emotion type mapping
  private emotionTypeMap = {
    'contemplative': 0,
    'excited': 1, 
    'melancholic': 2,
    'mysterious': 3,
    'urgent': 4
  }

  constructor() {
    this.initializeUniforms()
  }

  private initializeUniforms(): void {
    // Set initial breathing state
    this.atmosphericUniforms.uBreathingPhase.value = 0
    this.atmosphericUniforms.uDeepBreathPhase.value = 0
    
    // Set default emotion (contemplative)
    this.updateEmotionState('contemplative', 0.6)
  }

  /**
   * Main update loop - call this from useFrame in the main component
   */
  update(time: number): void {
    // Update time uniform
    this.atmosphericUniforms.uTime.value = time

    // Calculate primary breathing cycle
    this.currentPhase = Math.sin(time * this.primaryCycle) * 0.5 + 0.5
    this.atmosphericUniforms.uBreathingPhase.value = this.currentPhase

    // Calculate deep breath events
    const deepBreathCycle = Math.sin(time * this.deepBreathTimer)
    const deepBreathTrigger = deepBreathCycle > 0.95 ? 1 : 0
    
    if (deepBreathTrigger > 0 && time - this.lastDeepBreath > 40) {
      this.lastDeepBreath = time
      this.deepBreathPhase = 1.0
    }
    
    // Decay deep breath phase
    this.deepBreathPhase = Math.max(0, this.deepBreathPhase - 0.02)
    this.atmosphericUniforms.uDeepBreathPhase.value = this.deepBreathPhase

    // Notify all breathing subscribers
    this.notifyBreathingSubscribers()
  }

  /**
   * Update emotion state across all components
   */
  updateEmotionState(emotion: string, intensity: number): void {
    const emotionType = this.emotionTypeMap[emotion as keyof typeof this.emotionTypeMap] || 0
    
    // Smooth transition to new emotion
    const currentType = this.atmosphericUniforms.uEmotionType.value
    const targetType = emotionType
    
    if (currentType !== targetType) {
      // Start transition
      this.atmosphericUniforms.uEmotionTransition.value = 1.0
      
      // Animate to new emotion over time
      const animateTransition = () => {
        const transition = this.atmosphericUniforms.uEmotionTransition.value
        if (transition > 0) {
          this.atmosphericUniforms.uEmotionTransition.value = Math.max(0, transition - 0.05)
          
          // Interpolate emotion type
          const t = 1 - transition
          this.atmosphericUniforms.uEmotionType.value = currentType + (targetType - currentType) * t
          
          requestAnimationFrame(animateTransition)
        } else {
          this.atmosphericUniforms.uEmotionType.value = targetType
        }
      }
      animateTransition()
    }
    
    this.atmosphericUniforms.uEmotionIntensity.value = intensity

    // Update color palette based on emotion
    this.updateEmotionColors(emotion, intensity)
  }

  private updateEmotionColors(emotion: string, intensity: number): void {
    const colors = this.getEmotionColorPalette(emotion)
    
    // Blend with base colors based on intensity
    this.atmosphericUniforms.uColorDeep.value.lerpColors(
      new THREE.Color('#1a0d2e'), 
      colors.deep, 
      intensity * 0.6
    )
    
    this.atmosphericUniforms.uColorMid.value.lerpColors(
      new THREE.Color('#7c3aed'), 
      colors.mid, 
      intensity * 0.8
    )
    
    this.atmosphericUniforms.uColorLight.value.lerpColors(
      new THREE.Color('#c084fc'), 
      colors.light, 
      intensity * 0.7
    )
    
    this.atmosphericUniforms.uColorEthereal.value.lerpColors(
      new THREE.Color('#d8b3ff'), 
      colors.ethereal, 
      intensity * 0.5
    )
  }

  private getEmotionColorPalette(emotion: string) {
    const palettes = {
      contemplative: {
        deep: new THREE.Color('#2d1b4e'),
        mid: new THREE.Color('#7c3aed'),
        light: new THREE.Color('#a855f7'),
        ethereal: new THREE.Color('#c4b5fd')
      },
      excited: {
        deep: new THREE.Color('#4c1d95'),
        mid: new THREE.Color('#8b5cf6'),
        light: new THREE.Color('#c084fc'),
        ethereal: new THREE.Color('#e9d5ff')
      },
      melancholic: {
        deep: new THREE.Color('#1e1b4b'),
        mid: new THREE.Color('#6366f1'),
        light: new THREE.Color('#8b96f6'),
        ethereal: new THREE.Color('#c7d2fe')
      },
      mysterious: {
        deep: new THREE.Color('#312e81'),
        mid: new THREE.Color('#7c3aed'),
        light: new THREE.Color('#d8b3ff'),
        ethereal: new THREE.Color('#f3e8ff')
      },
      urgent: {
        deep: new THREE.Color('#7c2d12'),
        mid: new THREE.Color('#dc2626'),
        light: new THREE.Color('#f87171'),
        ethereal: new THREE.Color('#fecaca')
      }
    }
    
    return palettes[emotion as keyof typeof palettes] || palettes.contemplative
  }

  /**
   * Subscribe to breathing updates
   */
  subscribeToBreathing(callback: (phase: number, deepBreath: number) => void): void {
    this.breathingSubscribers.push(callback)
  }

  private notifyBreathingSubscribers(): void {
    this.breathingSubscribers.forEach(callback => {
      callback(this.currentPhase, this.deepBreathPhase)
    })
  }

  /**
   * Performance optimization controls
   */
  setPerformanceMode(mode: 'full' | 'reduced'): void {
    this.atmosphericUniforms.uPerformanceMode.value = mode === 'reduced' ? 1 : 0
  }

  setGlitchLevel(level: number): void {
    this.atmosphericUniforms.uGlitchLevel.value = Math.max(0, Math.min(1, level))
  }

  /**
   * Lynch-esque atmosphere controls
   */
  setMysteryIntensity(intensity: number): void {
    this.atmosphericUniforms.uMysteryIntensity.value = intensity
  }

  setCosmicDriftSpeed(speed: number): void {
    this.atmosphericUniforms.uCosmicDriftSpeed.value = speed
  }

  setResonanceSync(sync: number): void {
    this.atmosphericUniforms.uResonanceSync.value = sync
  }

  /**
   * Get current breathing state
   */
  getCurrentBreathingState() {
    return {
      phase: this.currentPhase,
      deepBreath: this.deepBreathPhase,
      amplitude: this.atmosphericUniforms.uBreathingAmplitude.value
    }
  }

  /**
   * Get current emotion state
   */
  getCurrentEmotionState() {
    return {
      type: this.atmosphericUniforms.uEmotionType.value,
      intensity: this.atmosphericUniforms.uEmotionIntensity.value,
      transition: this.atmosphericUniforms.uEmotionTransition.value,
      breathingPhase: this.currentPhase
    }
  }

  /**
   * Advanced breathing pattern for Lynch-esque effects
   */
  setAdvancedBreathingPattern(pattern: 'normal' | 'deep_meditation' | 'anxious' | 'cosmic'): void {
    switch (pattern) {
      case 'deep_meditation':
        this.primaryCycle = 0.08 // Slower, deeper breaths
        this.atmosphericUniforms.uBreathingAmplitude.value = 0.4
        break
      case 'anxious':
        this.primaryCycle = 0.25 // Faster, shallower breaths
        this.atmosphericUniforms.uBreathingAmplitude.value = 0.15
        break
      case 'cosmic':
        this.primaryCycle = 0.05 // Very slow, cosmic breathing
        this.atmosphericUniforms.uBreathingAmplitude.value = 0.6
        break
      default:
        this.primaryCycle = 0.15
        this.atmosphericUniforms.uBreathingAmplitude.value = 0.25
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.breathingSubscribers = []
  }
}

/**
 * React hook for accessing the breathing manager
 */
export function useAtmosphericBreathing() {
  // This will be implemented when we integrate with the main component
  return null
}