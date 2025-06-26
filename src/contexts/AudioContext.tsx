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

interface SoundDefinition {
  frequency: number
  duration: number
  type: OscillatorType
  harmonics?: number[]
  reverb?: number
  filter?: {
    frequency: number
    resonance: number
  }
  distortion?: number
  randomize?: boolean
  sweep?: {
    start: number
    end: number
  }
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

// System sound definitions - Atmospheric, mysterious tones
const SYSTEM_SOUNDS: Record<string, SoundDefinition> = {
  // Deep resonant boot - like ancient machinery awakening
  boot: { 
    frequency: 55, // Sub-bass A0
    duration: 2000, 
    type: 'sine' as OscillatorType,
    harmonics: [110, 165, 220], // Octave and fifth harmonics
    reverb: 0.8,
    filter: { frequency: 800, resonance: 5 }
  },
  
  // Soft ethereal click - like water drops in a cave
  click: { 
    frequency: 440, 
    duration: 80, 
    type: 'sine' as OscillatorType,
    harmonics: [880, 1320],
    reverb: 0.3,
    filter: { frequency: 2000, resonance: 2 }
  },
  
  // Ghostly hover - breathing digital whisper
  hover: { 
    frequency: 220, 
    duration: 150, 
    type: 'triangle' as OscillatorType,
    harmonics: [440, 660],
    reverb: 0.4,
    filter: { frequency: 1500, resonance: 3 }
  },
  
  // Dark error - distorted warning from the void
  error: { 
    frequency: 73.42, // Low D#
    duration: 600, 
    type: 'sawtooth' as OscillatorType,
    harmonics: [146.84, 220],
    reverb: 0.6,
    filter: { frequency: 400, resonance: 10 },
    distortion: 0.3
  },
  
  // Crystalline notification - ethereal chime
  notification: { 
    frequency: 523.25, // C5
    duration: 400, 
    type: 'sine' as OscillatorType,
    harmonics: [784.88, 1046.5, 1568],
    reverb: 0.7,
    filter: { frequency: 3000, resonance: 1 }
  },
  
  // Window open - spatial expansion
  windowOpen: { 
    frequency: 130.81, // C3
    duration: 350, 
    type: 'sine' as OscillatorType,
    harmonics: [261.63, 392, 523.25],
    reverb: 0.5,
    filter: { frequency: 1200, resonance: 2 },
    sweep: { start: 100, end: 200 }
  },
  
  // Window close - spatial contraction
  windowClose: { 
    frequency: 261.63, // C4
    duration: 350, 
    type: 'sine' as OscillatorType,
    harmonics: [130.81, 196, 261.63],
    reverb: 0.5,
    filter: { frequency: 1200, resonance: 2 },
    sweep: { start: 200, end: 100 }
  },
  
  // Typing - subtle mechanical texture
  typing: { 
    frequency: 800, 
    duration: 25, 
    type: 'sine' as OscillatorType,
    harmonics: [1600, 2400],
    reverb: 0.1,
    filter: { frequency: 4000, resonance: 1 }
  },
  
  // Glitch - digital corruption
  glitch: { 
    frequency: 55, 
    duration: 200, 
    type: 'sawtooth' as OscillatorType,
    harmonics: [110, 165, 220, 330],
    reverb: 0.2,
    filter: { frequency: 300, resonance: 15 },
    distortion: 0.5,
    randomize: true
  },
  
  // Target hit - resonant impact
  targetHit: { 
    frequency: 220, 
    duration: 150, 
    type: 'triangle' as OscillatorType,
    harmonics: [440, 660, 880],
    reverb: 0.4,
    filter: { frequency: 1000, resonance: 5 }
  },
  
  // Game start - mysterious awakening
  gameStart: { 
    frequency: 82.41, // E2
    duration: 800, 
    type: 'sine' as OscillatorType,
    harmonics: [164.82, 246, 329.64],
    reverb: 0.6,
    filter: { frequency: 600, resonance: 3 },
    sweep: { start: 60, end: 100 }
  },
  
  // Game over - descent into void
  gameOver: { 
    frequency: 110, // A2
    duration: 1200, 
    type: 'sawtooth' as OscillatorType,
    harmonics: [55, 82.5, 110],
    reverb: 0.8,
    filter: { frequency: 400, resonance: 8 },
    sweep: { start: 150, end: 50 }
  },
  
  // Success - ethereal achievement
  success: { 
    frequency: 329.63, // E4
    duration: 600, 
    type: 'sine' as OscillatorType,
    harmonics: [493.88, 659.26, 987.77],
    reverb: 0.6,
    filter: { frequency: 2000, resonance: 2 }
  },
  
  // Ambient atmosphere - deep ocean hum
  ambientOcean: {
    frequency: 27.5, // A0 - deepest piano note
    duration: 4000,
    type: 'sine' as OscillatorType,
    harmonics: [41.25, 55, 82.5],
    reverb: 0.9,
    filter: { frequency: 400, resonance: 1 }
  },
  
  // Consciousness pulse - living system heartbeat
  consciousnessPulse: {
    frequency: 60, // Between B1 and C2
    duration: 1500,
    type: 'sine' as OscillatorType,
    harmonics: [120, 180, 240],
    reverb: 0.7,
    filter: { frequency: 600, resonance: 4 },
    sweep: { start: 55, end: 65 }
  },
  
  // Data flow - information streaming
  dataFlow: {
    frequency: 440, // A4
    duration: 300,
    type: 'triangle' as OscillatorType,
    harmonics: [880, 1320, 1760],
    reverb: 0.4,
    filter: { frequency: 2500, resonance: 3 },
    randomize: true
  },
  
  // Persona shift - consciousness transformation
  personaShift: {
    frequency: 146.83, // D3
    duration: 1000,
    type: 'sine' as OscillatorType,
    harmonics: [293.66, 440, 587.32],
    reverb: 0.8,
    filter: { frequency: 1000, resonance: 6 },
    sweep: { start: 100, end: 200 }
  },
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

  // Create reverb effect using convolver
  const createReverb = (ctx: AudioContext, decay: number = 2) => {
    const convolver = ctx.createConvolver()
    const length = ctx.sampleRate * decay
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }
    }
    
    convolver.buffer = impulse
    return convolver
  }

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

      const volume = (customVolume ?? effectsVolume) * masterVolume
      const endTime = ctx.currentTime + sound.duration / 1000

      // Create main oscillator and its chain
      const mainOsc = ctx.createOscillator()
      const mainGain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      
      // Set up filter if specified
      if (sound.filter) {
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(sound.filter.frequency, ctx.currentTime)
        filter.Q.setValueAtTime(sound.filter.resonance || 1, ctx.currentTime)
      } else {
        filter.frequency.setValueAtTime(20000, ctx.currentTime) // Bypass
      }
      
      // Create reverb if specified
      let reverbSend: GainNode | null = null
      let reverb: ConvolverNode | null = null
      if (sound.reverb && sound.reverb > 0) {
        reverb = createReverb(ctx, 2)
        reverbSend = ctx.createGain()
        reverbSend.gain.setValueAtTime(sound.reverb * volume * 0.3, ctx.currentTime)
      }
      
      // Set up main oscillator
      mainOsc.type = sound.type
      
      // Handle frequency sweeps
      if (sound.sweep) {
        mainOsc.frequency.setValueAtTime(sound.sweep.start, ctx.currentTime)
        mainOsc.frequency.exponentialRampToValueAtTime(sound.sweep.end, endTime)
      } else if (sound.randomize) {
        // Random frequency modulation for glitch effects
        const baseFreq = sound.frequency
        const modAmount = baseFreq * 0.5
        mainOsc.frequency.setValueAtTime(baseFreq + (Math.random() - 0.5) * modAmount, ctx.currentTime)
        // Add random jumps
        for (let i = 0; i < 5; i++) {
          const time = ctx.currentTime + (i / 5) * (sound.duration / 1000)
          mainOsc.frequency.setValueAtTime(baseFreq + (Math.random() - 0.5) * modAmount, time)
        }
      } else {
        mainOsc.frequency.setValueAtTime(sound.frequency, ctx.currentTime)
      }
      
      // Connect main chain
      mainOsc.connect(filter)
      filter.connect(mainGain)
      mainGain.connect(ctx.destination)
      
      // Connect reverb send if exists
      if (reverb && reverbSend) {
        filter.connect(reverbSend)
        reverbSend.connect(reverb)
        reverb.connect(ctx.destination)
      }
      
      // Set up envelope
      mainGain.gain.setValueAtTime(0, ctx.currentTime)
      mainGain.gain.linearRampToValueAtTime(volume * 0.15, ctx.currentTime + 0.02)
      mainGain.gain.exponentialRampToValueAtTime(0.001, endTime)
      
      // Start main oscillator
      mainOsc.start(ctx.currentTime)
      mainOsc.stop(endTime)
      
      // Add harmonics if specified
      if (sound.harmonics && sound.harmonics.length > 0) {
        sound.harmonics.forEach((freq, index) => {
          const harmOsc = ctx.createOscillator()
          const harmGain = ctx.createGain()
          
          harmOsc.type = sound.type
          harmOsc.frequency.setValueAtTime(freq, ctx.currentTime)
          
          // Handle sweeps for harmonics
          if (sound.sweep) {
            const ratio = freq / sound.frequency
            harmOsc.frequency.setValueAtTime(sound.sweep.start * ratio, ctx.currentTime)
            harmOsc.frequency.exponentialRampToValueAtTime(sound.sweep.end * ratio, endTime)
          }
          
          harmOsc.connect(harmGain)
          harmGain.connect(filter) // Route through same filter
          
          // Harmonics get progressively quieter
          const harmVolume = volume * 0.1 / (index + 2)
          harmGain.gain.setValueAtTime(0, ctx.currentTime)
          harmGain.gain.linearRampToValueAtTime(harmVolume, ctx.currentTime + 0.02)
          harmGain.gain.exponentialRampToValueAtTime(0.001, endTime)
          
          harmOsc.start(ctx.currentTime)
          harmOsc.stop(endTime)
        })
      }
      
      // Add distortion/noise for certain sounds
      if (sound.distortion && sound.distortion > 0) {
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * sound.duration / 1000, ctx.sampleRate)
        const noiseData = noiseBuffer.getChannelData(0)
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * sound.distortion
        }
        
        const noiseSource = ctx.createBufferSource()
        const noiseGain = ctx.createGain()
        const noiseFilter = ctx.createBiquadFilter()
        
        noiseFilter.type = 'bandpass'
        noiseFilter.frequency.setValueAtTime(sound.frequency * 2, ctx.currentTime)
        noiseFilter.Q.setValueAtTime(10, ctx.currentTime)
        
        noiseSource.buffer = noiseBuffer
        noiseSource.connect(noiseFilter)
        noiseFilter.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        
        noiseGain.gain.setValueAtTime(volume * 0.05, ctx.currentTime)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, endTime)
        
        noiseSource.start(ctx.currentTime)
        noiseSource.stop(endTime)
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