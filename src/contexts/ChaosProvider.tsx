'use client'

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { useWindowManager } from '@/hooks/useWindowManager'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useVisualEffects, CursorTrail } from '@/hooks/useVisualEffects'
import { useAIChatContext } from '@/contexts/AIChatContext'
import useStartupSequence from '@/hooks/useStartupSequence'

interface ChaosContextType {
  // Window Management
  windows: ReturnType<typeof useWindowManager>['windows']
  createWindow: ReturnType<typeof useWindowManager>['createWindow']
  closeWindow: ReturnType<typeof useWindowManager>['closeWindow']
  focusWindow: ReturnType<typeof useWindowManager>['focusWindow']
  
  // Audio System
  audio: ReturnType<typeof useAudioManager>
  
  // Visual Effects
  visual: ReturnType<typeof useVisualEffects>
  
  // AI Chat System
  aiChat: ReturnType<typeof useAIChatContext>
  
  // System State
  systemState: {
    isBootComplete: boolean
    performanceMode: 'low' | 'medium' | 'high'
    isMobile: boolean
    chaosLevel: number
    effectsEnabled: boolean
  }
  
  // Global Controls
  setChaosLevel: (level: number) => void
  setPerformanceMode: (mode: 'low' | 'medium' | 'high') => void
  toggleEffects: () => void
  triggerSystemWideEffect: (effectType: string) => void
  
  // Startup controls
  startupState: ReturnType<typeof useStartupSequence>
}

const ChaosContext = createContext<ChaosContextType | null>(null)

export const ChaosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize all core hooks
  const windowManager = useWindowManager()
  const audio = useAudioManager()
  const visual = useVisualEffects()
  const aiChat = useAIChatContext()
  const startupState = useStartupSequence()
  
  // System state management
  const [systemState, setSystemState] = useState({
    isBootComplete: false,
    performanceMode: 'high' as 'low' | 'medium' | 'high',
    isMobile: false,
    chaosLevel: 1.0,
    effectsEnabled: true
  })

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
      setSystemState(prev => ({ ...prev, isMobile }))
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Performance monitoring
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const monitorPerformance = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount
        frameCount = 0
        lastTime = currentTime
        
        // Adjust performance mode based on FPS
        if (fps < 20 && systemState.performanceMode !== 'low') {
          setSystemState(prev => ({ ...prev, performanceMode: 'low' }))
          visual.setEffectsIntensity(0.3)
        } else if (fps < 40 && systemState.performanceMode === 'high') {
          setSystemState(prev => ({ ...prev, performanceMode: 'medium' }))
          visual.setEffectsIntensity(0.7)
        } else if (fps > 50 && systemState.performanceMode !== 'high') {
          setSystemState(prev => ({ ...prev, performanceMode: 'high' }))
          visual.setEffectsIntensity(1.0)
        }
      }
      
      requestAnimationFrame(monitorPerformance)
    }
    
    const animationId = requestAnimationFrame(monitorPerformance)
    return () => cancelAnimationFrame(animationId)
  }, [systemState.performanceMode, visual])

  // Boot completion detection
  useEffect(() => {
    // Mark boot as complete after startup programs are defined
    if (startupState.autoLaunchPrograms.length > 0 && !systemState.isBootComplete) {
      const timer = setTimeout(() => {
        setSystemState(prev => ({ ...prev, isBootComplete: true }))
        
        // Trigger welcome effects
        setTimeout(() => {
          visual.triggerCursorExplosion()
          audio.soundEffects.success()
        }, 500)
      }, 4000) // Allow time for startup sequence to complete
      
      return () => clearTimeout(timer)
    }
  }, [startupState.autoLaunchPrograms, systemState.isBootComplete, visual, audio])

  // Chaos level control
  const setChaosLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(0, Math.min(2, level))
    setSystemState(prev => ({ ...prev, chaosLevel: clampedLevel }))
    visual.setEffectsIntensity(clampedLevel)
    
    // Adjust audio volume based on chaos level
    audio.setVolume(clampedLevel * 0.5)
  }, [visual, audio])

  // Performance mode control
  const setPerformanceMode = useCallback((mode: 'low' | 'medium' | 'high') => {
    setSystemState(prev => ({ ...prev, performanceMode: mode }))
    
    const intensityMap = { low: 0.3, medium: 0.7, high: 1.0 }
    visual.setEffectsIntensity(intensityMap[mode] * systemState.chaosLevel)
  }, [visual, systemState.chaosLevel])

  // Toggle all effects
  const toggleEffects = useCallback(() => {
    const newEffectsEnabled = !systemState.effectsEnabled
    setSystemState(prev => ({ ...prev, effectsEnabled: newEffectsEnabled }))
    
    if (newEffectsEnabled) {
      visual.setEffectsIntensity(systemState.chaosLevel)
    } else {
      visual.setEffectsIntensity(0)
    }
  }, [systemState.effectsEnabled, systemState.chaosLevel, visual])

  // System-wide effect trigger
  const triggerSystemWideEffect = useCallback((effectType: string) => {
    switch (effectType) {
      case 'chaos-explosion':
        visual.triggerCursorExplosion()
        visual.triggerMatrixRain(3000)
        visual.triggerGlitchEffect()
        audio.soundEffects.notification()
        break
        
      case 'system-shock':
        visual.triggerScreenFlash('#ff0040', 300)
        visual.triggerWindowShake()
        audio.soundEffects.error()
        break
        
      case 'rainbow-cascade':
        visual.triggerRainbowTrail()
        visual.triggerCursorExplosion()
        audio.soundEffects.success()
        break
        
      case 'full-chaos':
        visual.triggerMatrixRain(5000)
        visual.triggerGlitchEffect()
        visual.triggerScreenFlash('#00ffff', 500)
        setTimeout(() => visual.triggerCursorExplosion(), 200)
        setTimeout(() => visual.triggerWindowShake(), 400)
        audio.soundEffects.notification()
        break
    }
  }, [visual, audio])

  // Audio-reactive system integration
  useEffect(() => {
    if (!audio.isPlaying || !systemState.effectsEnabled) return

    const interval = setInterval(() => {
      const { visualizerData } = audio
      if (visualizerData.length === 0) return

      // Calculate energy levels
      const bassEnergy = visualizerData.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8
      const midEnergy = visualizerData.slice(8, 32).reduce((sum, val) => sum + val, 0) / 24
      const totalEnergy = (bassEnergy + midEnergy) / 2

      // Trigger effects based on audio and chaos level
      if (totalEnergy > 0.6 && Math.random() < 0.05 * systemState.chaosLevel) {
        const effects = ['chaos-explosion', 'rainbow-cascade', 'system-shock']
        const randomEffect = effects[Math.floor(Math.random() * effects.length)]
        triggerSystemWideEffect(randomEffect)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [audio, systemState.effectsEnabled, systemState.chaosLevel, triggerSystemWideEffect])

  // Responsive window management
  useEffect(() => {
    if (systemState.isMobile && typeof window !== 'undefined') {
      // Adjust window behavior for mobile
      windowManager.windows.forEach(winConfig => {
        if (winConfig.size.width > window.innerWidth * 0.9) {
          windowManager.updateWindow?.(winConfig.id, {
            size: { width: window.innerWidth * 0.9, height: window.innerHeight * 0.7 },
            position: { x: window.innerWidth * 0.05, y: window.innerHeight * 0.1 }
          })
        }
      })
    }
  }, [systemState.isMobile, windowManager])

  const contextValue: ChaosContextType = {
    // Window Management
    windows: windowManager.windows,
    createWindow: windowManager.createWindow,
    closeWindow: windowManager.closeWindow,
    focusWindow: windowManager.focusWindow,
    
    // Audio System
    audio,
    
    // Visual Effects
    visual,
    
    // AI Chat System
    aiChat,
    
    // System State
    systemState,
    
    // Global Controls
    setChaosLevel,
    setPerformanceMode,
    toggleEffects,
    triggerSystemWideEffect,
    
    // Startup controls
    startupState
  }

  return (
    <ChaosContext.Provider value={contextValue}>
      {children}
      
      {/* Global effects overlay */}
      <CursorTrail 
        trail={visual.cursorTrail} 
        enabled={visual.cursorTrailEnabled && systemState.effectsEnabled} 
      />
      
      {/* Screen effects - only render if effects enabled and performance allows */}
      {systemState.effectsEnabled && systemState.performanceMode !== 'low' && (
        <div className="screen-distortion" />
      )}
      
      {/* Performance indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.8)',
          color: '#00ff00',
          padding: '5px',
          fontSize: '10px',
          fontFamily: 'monospace',
          zIndex: 99999
        }}>
          Performance: {systemState.performanceMode} | 
          Chaos: {Math.round(systemState.chaosLevel * 100)}% |
          Mobile: {systemState.isMobile ? 'Yes' : 'No'}
        </div>
      )}
    </ChaosContext.Provider>
  )
}

export const useChaos = (): ChaosContextType => {
  const context = useContext(ChaosContext)
  if (!context) {
    throw new Error('useChaos must be used within a ChaosProvider')
  }
  return context
}