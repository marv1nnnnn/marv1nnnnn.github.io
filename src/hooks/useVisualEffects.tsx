'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'

export interface VisualEffectsState {
  cursorTrailEnabled: boolean
  glitchEffectsEnabled: boolean
  particleEffectsEnabled: boolean
  effectsIntensity: number
}

export interface CursorPosition {
  x: number
  y: number
}

export const useVisualEffects = () => {
  const [state, setState] = useState<VisualEffectsState>({
    cursorTrailEnabled: true,
    glitchEffectsEnabled: true,
    particleEffectsEnabled: true,
    effectsIntensity: 1.0
  })

  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ x: 0, y: 0 })
  const [cursorTrail, setCursorTrail] = useState<CursorPosition[]>([])
  const trailTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const glitchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update cursor position and trail
  const updateCursorPosition = useCallback((e: MouseEvent) => {
    const newPosition = { x: e.clientX, y: e.clientY }
    setCursorPosition(newPosition)

    if (state.cursorTrailEnabled) {
      setCursorTrail(prev => {
        const newTrail = [newPosition, ...prev.slice(0, 10 * state.effectsIntensity)]
        return newTrail
      })

      // Clear old trail points
      if (trailTimeoutRef.current) {
        clearTimeout(trailTimeoutRef.current)
      }
      
      trailTimeoutRef.current = setTimeout(() => {
        setCursorTrail(prev => prev.slice(1))
      }, 100)
    }
  }, [state.cursorTrailEnabled, state.effectsIntensity])

  // Initialize cursor tracking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', updateCursorPosition)
      return () => window.removeEventListener('mousemove', updateCursorPosition)
    }
  }, [updateCursorPosition])

  // Trigger cursor explosion effect
  const triggerCursorExplosion = useCallback((x?: number, y?: number) => {
    if (!state.particleEffectsEnabled) return

    const targetX = x ?? cursorPosition.x
    const targetY = y ?? cursorPosition.y

    confetti({
      particleCount: Math.floor(30 * state.effectsIntensity),
      spread: 60,
      origin: {
        x: targetX / window.innerWidth,
        y: targetY / window.innerHeight
      },
      colors: ['#ff0080', '#00ffff', '#ffff00', '#ff00ff', '#00ff00'],
      gravity: 0.8,
      scalar: 0.8
    })
  }, [cursorPosition, state.particleEffectsEnabled, state.effectsIntensity])

  // Trigger rainbow cursor trail
  const triggerRainbowTrail = useCallback(() => {
    if (!state.cursorTrailEnabled) return

    setState(prev => ({ ...prev, cursorTrailEnabled: true }))
    
    // Auto-disable after 5 seconds
    setTimeout(() => {
      setState(prev => ({ ...prev, cursorTrailEnabled: false }))
    }, 5000)
  }, [state.cursorTrailEnabled])

  // Trigger glitch effect on element
  const triggerGlitchEffect = useCallback((elementId?: string) => {
    if (!state.glitchEffectsEnabled) return

    const targetElement = elementId 
      ? document.getElementById(elementId)
      : document.querySelector('.window.active') || document.body

    if (!targetElement) return

    // Add glitch class
    targetElement.classList.add('glitch-active')

    // Remove glitch class after duration
    const duration = 1000 * state.effectsIntensity
    
    if (glitchTimeoutRef.current) {
      clearTimeout(glitchTimeoutRef.current)
    }

    glitchTimeoutRef.current = setTimeout(() => {
      targetElement.classList.remove('glitch-active')
    }, duration)
  }, [state.glitchEffectsEnabled, state.effectsIntensity])

  // Trigger window shake effect
  const triggerWindowShake = useCallback((windowId?: string) => {
    const targetWindow = windowId 
      ? document.querySelector(`[data-window-id="${windowId}"]`)
      : document.querySelector('.window.active')

    if (!targetWindow) return

    const element = targetWindow as HTMLElement
    const originalTransform = element.style.transform

    // Apply shake animation
    element.style.animation = `windowShake 0.5s ease-in-out`

    setTimeout(() => {
      element.style.animation = ''
      element.style.transform = originalTransform
    }, 500)
  }, [])

  // Trigger screen flash effect
  const triggerScreenFlash = useCallback((color: string = '#ffffff', duration: number = 200) => {
    if (!state.particleEffectsEnabled) return

    const flashOverlay = document.createElement('div')
    flashOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: ${color};
      opacity: 0.8;
      z-index: 99999;
      pointer-events: none;
      animation: flashFade ${duration}ms ease-out forwards;
    `

    // Add keyframe animation if not exists
    if (!document.querySelector('#flash-keyframes')) {
      const style = document.createElement('style')
      style.id = 'flash-keyframes'
      style.textContent = `
        @keyframes flashFade {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(flashOverlay)

    setTimeout(() => {
      if (flashOverlay.parentNode) {
        flashOverlay.parentNode.removeChild(flashOverlay)
      }
    }, duration)
  }, [state.particleEffectsEnabled])

  // Trigger matrix rain effect
  const triggerMatrixRain = useCallback((duration: number = 3000) => {
    if (!state.particleEffectsEnabled) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99998;
      pointer-events: none;
    `
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    document.body.appendChild(canvas)

    // Matrix rain animation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()'.split('')
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00ff00'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(animate, 50)

    setTimeout(() => {
      clearInterval(interval)
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    }, duration)
  }, [state.particleEffectsEnabled])

  // Toggle effects
  const toggleCursorTrail = useCallback(() => {
    setState(prev => ({ ...prev, cursorTrailEnabled: !prev.cursorTrailEnabled }))
  }, [])

  const toggleGlitchEffects = useCallback(() => {
    setState(prev => ({ ...prev, glitchEffectsEnabled: !prev.glitchEffectsEnabled }))
  }, [])

  const toggleParticleEffects = useCallback(() => {
    setState(prev => ({ ...prev, particleEffectsEnabled: !prev.particleEffectsEnabled }))
  }, [])

  const setEffectsIntensity = useCallback((intensity: number) => {
    setState(prev => ({ ...prev, effectsIntensity: Math.max(0, Math.min(2, intensity)) }))
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (trailTimeoutRef.current) {
        clearTimeout(trailTimeoutRef.current)
      }
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    cursorPosition,
    cursorTrail,
    triggerCursorExplosion,
    triggerRainbowTrail,
    triggerGlitchEffect,
    triggerWindowShake,
    triggerScreenFlash,
    triggerMatrixRain,
    toggleCursorTrail,
    toggleGlitchEffects,
    toggleParticleEffects,
    setEffectsIntensity
  }
}

// Cursor Trail Component
export const CursorTrail: React.FC<{ trail: CursorPosition[], enabled: boolean }> = ({ 
  trail, 
  enabled 
}) => {
  if (!enabled || trail.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {trail.map((position, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: position.x - 4,
            top: position.y - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: `hsl(${(index * 30) % 360}, 100%, 50%)`,
            opacity: 1 - (index / trail.length),
            transform: `scale(${1 - (index / trail.length) * 0.5})`,
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  )
}