'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

interface AudioContextType {
  playSound: (soundId: string, volume?: number) => void
  setMasterVolume: (volume: number) => void
  setEffectsVolume: (volume: number) => void
  masterVolume: number
  effectsVolume: number
  isMuted: boolean
  toggleMute: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

// System sound definitions
const SYSTEM_SOUNDS = {
  boot: { frequency: 220, duration: 500, type: 'square' as OscillatorType },
  click: { frequency: 800, duration: 50, type: 'sine' as OscillatorType },
  hover: { frequency: 600, duration: 30, type: 'sine' as OscillatorType },
  error: { frequency: 150, duration: 300, type: 'sawtooth' as OscillatorType },
  notification: { frequency: 440, duration: 200, type: 'triangle' as OscillatorType },
  windowOpen: { frequency: 523, duration: 150, type: 'sine' as OscillatorType },
  windowClose: { frequency: 261, duration: 150, type: 'sine' as OscillatorType },
  typing: { frequency: 1000, duration: 20, type: 'square' as OscillatorType },
  glitch: { frequency: 100, duration: 100, type: 'sawtooth' as OscillatorType },
  targetHit: { frequency: 880, duration: 100, type: 'square' as OscillatorType },
  gameStart: { frequency: 330, duration: 300, type: 'triangle' as OscillatorType },
  gameOver: { frequency: 220, duration: 500, type: 'sawtooth' as OscillatorType },
  success: { frequency: 659, duration: 200, type: 'sine' as OscillatorType },
}

interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [masterVolume, setMasterVolumeState] = useState(0.3)
  const [effectsVolume, setEffectsVolumeState] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Initialize Web Audio API context
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('Web Audio API not supported:', error)
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playSound = (soundId: string, customVolume?: number) => {
    if (!audioContextRef.current || isMuted) return

    const sound = SYSTEM_SOUNDS[soundId as keyof typeof SYSTEM_SOUNDS]
    if (!sound) return

    try {
      const ctx = audioContextRef.current
      
      // Resume context if suspended (required for user interaction)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = sound.type
      oscillator.frequency.setValueAtTime(sound.frequency, ctx.currentTime)

      const volume = (customVolume ?? effectsVolume) * masterVolume
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume * 0.1, ctx.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + sound.duration / 1000)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + sound.duration / 1000)

      // Add some digital distortion for certain sounds
      if (['glitch', 'error', 'gameOver'].includes(soundId)) {
        // Add subtle noise for glitch effect
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate)
        const noiseData = noiseBuffer.getChannelData(0)
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * 0.1
        }
        
        const noiseSource = ctx.createBufferSource()
        const noiseGain = ctx.createGain()
        noiseSource.buffer = noiseBuffer
        noiseSource.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        noiseGain.gain.setValueAtTime(volume * 0.05, ctx.currentTime)
        noiseSource.start(ctx.currentTime)
        noiseSource.stop(ctx.currentTime + sound.duration / 1000)
      }
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }

  const setMasterVolume = (volume: number) => {
    setMasterVolumeState(Math.max(0, Math.min(1, volume)))
  }

  const setEffectsVolume = (volume: number) => {
    setEffectsVolumeState(Math.max(0, Math.min(1, volume)))
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <AudioContext.Provider
      value={{
        playSound,
        setMasterVolume,
        setEffectsVolume,
        masterVolume,
        effectsVolume,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}