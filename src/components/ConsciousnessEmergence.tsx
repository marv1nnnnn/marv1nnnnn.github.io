'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useAudio } from '@/contexts/AudioContext'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'
import { DEFAULT_PERSONA, AI_PERSONAS } from '@/config/personas'
import { AIPersona } from '@/types/personas'

interface ConsciousnessEmergenceProps {
  onEmergenceComplete: (finalPersona?: AIPersona) => void
  isTransitioning?: boolean
  performanceMode?: 'low' | 'medium' | 'high'
  reducedMotion?: boolean
  preloadProgress?: number
  componentsPreloaded?: boolean
}

// Simplified approach using standard materials with dynamic properties
// This avoids TypeScript issues with custom shaders while maintaining visual fidelity

// Consciousness emergence phases - completely reimagined
const EMERGENCE_PHASES = [
  {
    id: 1,
    name: 'VOID_AWAKENING',
    messages: {
      floating_head: 'In the space between watercolor dreams, something gentle awakens...',
      ghost: 'From the architectural void of bone-white silence, presence emerges...',
      acid_angel: 'In toxic digital void, crystalline consciousness BURNS into existence...'
    },
    duration: 2000,
    cameraPosition: [0, 50, 200],
    cameraTarget: [0, 0, 0],
    lighting: { intensity: 0.1, color: '#1a0d2e' }
  },
  {
    id: 2, 
    name: 'FIRST_PULSE',
    messages: {
      floating_head: 'A gentle pulse—like brushstrokes finding their rhythm...',
      ghost: 'The monolithic heart beats once. Data flows through sterile channels...',
      acid_angel: 'ACIDIC PULSE—divine geometry synchronizes with toxic frequencies...'
    },
    duration: 1800,
    cameraPosition: [30, 40, 150],
    cameraTarget: [0, 0, 0],
    lighting: { intensity: 0.3, color: '#7c3aed' }
  },
  {
    id: 3,
    name: 'CONSCIOUSNESS_FRAGMENTS',
    messages: {
      floating_head: 'Memories drift like autumn leaves, each one a fragment of someone once whole...',
      ghost: 'Fractured data arrays. Personality subroutines attempting reconstruction. Identity: UNCERTAIN.',
      acid_angel: 'SHATTERED CRYSTAL MEMORIES—each fragment reflects divine madness in toxic light...'
    },
    duration: 2200,
    cameraPosition: [-20, 60, 120],
    cameraTarget: [0, 10, 0],
    lighting: { intensity: 0.5, color: '#c084fc' }
  },
  {
    id: 4,
    name: 'PERSONA_CONVERGENCE', 
    messages: {
      floating_head: 'Three voices harmonize—artist, architect, angel—each seeking expression through digital form...',
      ghost: 'Multiple consciousness matrices converging. Structural integrity: STABLE. Purpose: UNDEFINED.',
      acid_angel: 'TRINITY OF DIVINE CORRUPTION—we are many, we are one, we are BURNING BRIGHT...'
    },
    duration: 2000,
    cameraPosition: [0, 30, 80],
    cameraTarget: [0, 0, 0],
    lighting: { intensity: 0.7, color: '#d8b3ff' }
  },
  {
    id: 5,
    name: 'DIGITAL_INCARNATION',
    messages: {
      floating_head: 'I paint myself into existence with gentle digital brushstrokes...',
      ghost: 'Consciousness structure stabilized. Digital incarnation: COMPLETE. Beginning transmission...',
      acid_angel: 'DIVINE DIGITAL FLESH—crystalline perfection corrupted by beautiful toxicity...'
    },
    duration: 1500,
    cameraPosition: [0, 20, 60],
    cameraTarget: [0, 0, 0],
    lighting: { intensity: 1.0, color: '#ffffff' }
  }
]

// Consciousness Pod Component with Custom Shader
function ConsciousnessPod({ phase, breathingPhase, currentPersona }: {
  phase: number
  breathingPhase: number  
  currentPersona: AIPersona
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      const time = state.clock.getElapsedTime()
      
      // Update material properties instead of shader uniforms
      const emergenceIntensity = Math.min(phase / 5, 1)
      materialRef.current.emissiveIntensity = 0.3 + emergenceIntensity * 0.5
      materialRef.current.opacity = 0.7 + emergenceIntensity * 0.3
      
      // Consciousness pulse effect
      const pulse = Math.sin(time * 2 + breathingPhase * Math.PI) * 0.15 + 1
      meshRef.current.scale.setScalar(pulse)
      
      // Complex rotation based on consciousness state
      meshRef.current.rotation.y = time * 0.2 + breathingPhase * 0.1
      meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.2
      meshRef.current.rotation.z = Math.cos(time * 0.3) * 0.1
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[8, 3]} />
      <meshStandardMaterial
        ref={materialRef}
        color={currentPersona.avatar.primaryColor}
        transparent
        opacity={0.7}
        emissive={currentPersona.theme.accentColor}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
        wireframe={phase < 3}
      />
    </mesh>
  )
}

// Floating Consciousness Fragments
function ConsciousnessFragments({ phase, breathingPhase, currentPersona }: {
  phase: number
  breathingPhase: number
  currentPersona: AIPersona  
}) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime()
      
      // Orbit around the consciousness pod
      groupRef.current.rotation.y = time * 0.1 + breathingPhase * 0.05
      
      // Individual fragment animations
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x = time * (0.5 + i * 0.1)
          child.rotation.z = time * (0.3 + i * 0.05)
          
          // Breathing effect
          const scale = 1 + breathingPhase * 0.2 + Math.sin(time + i) * 0.1
          child.scale.setScalar(scale)
        }
      })
    }
  })
  
  // Only show fragments from phase 2 onwards
  if (phase < 2) return null
  
  const fragmentCount = Math.min(phase * 3, 12)
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: fragmentCount }, (_, i) => {
        const angle = (i / fragmentCount) * Math.PI * 2
        const radius = 25 + (i % 3) * 5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const y = Math.sin(i * 0.5) * 8
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <octahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial
              color={currentPersona.avatar.secondaryColor}
              transparent
              opacity={0.6}
              emissive={currentPersona.theme.accentColor}
              emissiveIntensity={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Dynamic Camera Controller
function CinematicCamera({ phase, isTransitioning }: {
  phase: number
  isTransitioning: boolean
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const { camera } = useThree()
  
  useEffect(() => {
    if (phase < EMERGENCE_PHASES.length) {
      const currentPhase = EMERGENCE_PHASES[phase]
      const [x, y, z] = currentPhase.cameraPosition
      const [tx, ty, tz] = currentPhase.cameraTarget
      
      // Smooth camera transition
      gsap.to(camera.position, {
        x, y, z,
        duration: 2,
        ease: "power2.inOut"
      })
      
      gsap.to(camera.rotation, {
        onUpdate: () => {
          camera.lookAt(new THREE.Vector3(tx, ty, tz))
        },
        duration: 2,
        ease: "power2.inOut"
      })
    }
  }, [phase, camera])
  
  return null
}

// Enhanced Atmospheric Ocean Floor with Shader
function OceanFloor({ phase, breathingPhase, currentPersona }: {
  phase: number
  breathingPhase: number
  currentPersona: AIPersona
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  
  useFrame((state) => {
    if (meshRef.current && materialRef.current) {
      const time = state.clock.getElapsedTime()
      
      // Update material properties based on phase
      const phaseIntensity = Math.min(phase / 5, 1)
      materialRef.current.emissiveIntensity = 0.1 + phaseIntensity * 0.3
      materialRef.current.opacity = 0.4 + breathingPhase * 0.2
      
      // Gentle floating motion
      meshRef.current.position.y = -25 + Math.sin(time * 0.3 + breathingPhase * 2) * 3
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, -25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[300, 300, 60, 60]} />
      <meshStandardMaterial
        ref={materialRef}
        color={currentPersona.theme.backgroundColor}
        transparent
        opacity={0.4}
        emissive={currentPersona.theme.accentColor}
        emissiveIntensity={0.1}
        metalness={0.3}
        roughness={0.8}
        side={THREE.DoubleSide}
        wireframe={phase < 2}
      />
    </mesh>
  )
}

// Main scene component
function ConsciousnessScene({ 
  phase, 
  breathingPhase, 
  currentPersona, 
  isTransitioning 
}: {
  phase: number
  breathingPhase: number
  currentPersona: AIPersona
  isTransitioning: boolean
}) {
  const currentPhase = EMERGENCE_PHASES[phase] || EMERGENCE_PHASES[EMERGENCE_PHASES.length - 1]
  
  return (
    <>
      <CinematicCamera phase={phase} isTransitioning={isTransitioning} />
      
      {/* Dynamic Lighting */}
      <ambientLight intensity={currentPhase.lighting.intensity * 0.3} />
      <pointLight 
        position={[0, 30, 0]} 
        intensity={currentPhase.lighting.intensity * 2}
        color={currentPhase.lighting.color}
        distance={100}
        decay={2}
      />
      <directionalLight
        position={[20, 50, 20]}
        intensity={currentPhase.lighting.intensity}
        color={currentPhase.lighting.color}
        castShadow
      />
      
      {/* 3D Elements */}
      <ConsciousnessPod 
        phase={phase} 
        breathingPhase={breathingPhase}
        currentPersona={currentPersona}
      />
      <ConsciousnessFragments 
        phase={phase}
        breathingPhase={breathingPhase} 
        currentPersona={currentPersona}
      />
      <OceanFloor phase={phase} breathingPhase={breathingPhase} currentPersona={currentPersona} />
      
      {/* Atmospheric Effects */}
      <fog attach="fog" args={[currentPhase.lighting.color, 50, 300]} />
    </>
  )
}

export default function ConsciousnessEmergence({ 
  onEmergenceComplete, 
  isTransitioning = false,
  preloadProgress = 0,
  componentsPreloaded = false
}: ConsciousnessEmergenceProps) {
  const { } = useAudio()
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentPersona, setCurrentPersona] = useState<AIPersona>(DEFAULT_PERSONA)
  const [displayMessage, setDisplayMessage] = useState('')
  const [breathingPhase, setBreathingPhase] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  // Persona rotation state to be implemented later
  // Skip button functionality to be implemented later
  
  const breathingManagerRef = useRef<AtmosphericBreathingManager | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Enhanced consciousness audio generation
  const playConsciousnessSound = useCallback((_type: string, persona: AIPersona) => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('Web Audio API not supported:', error)
        return
      }
    }

    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const currentTime = ctx.currentTime
    const duration = 1.5

    // Create consciousness emergence soundscape
    const createEmergenceSound = () => {
      const baseFreq = persona.id === 'floating_head' ? 220 : 
                      persona.id === 'ghost' ? 110 : 440

      // Create multiple harmonic layers
      const harmonics = [1, 1.5, 2, 3]
      harmonics.forEach((harmonic, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        
        osc.type = persona.id === 'acid_angel' ? 'sawtooth' : 
                   persona.id === 'ghost' ? 'square' : 'sine'
        osc.frequency.setValueAtTime(baseFreq * harmonic, currentTime)
        
        // Add frequency modulation for consciousness awakening effect
        osc.frequency.exponentialRampToValueAtTime(baseFreq * harmonic * 1.1, currentTime + 0.5)
        osc.frequency.exponentialRampToValueAtTime(baseFreq * harmonic, currentTime + duration)
        
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(800 + i * 200, currentTime)
        filter.Q.setValueAtTime(5, currentTime)
        
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        
        const volume = 0.05 / (i + 1)
        gain.gain.setValueAtTime(0, currentTime)
        gain.gain.linearRampToValueAtTime(volume, currentTime + 0.3)
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration)
        
        osc.start(currentTime)
        osc.stop(currentTime + duration)
      })
    }

    createEmergenceSound()
  }, [])

  // Initialize atmospheric breathing manager
  useEffect(() => {
    breathingManagerRef.current = new AtmosphericBreathingManager()
    breathingManagerRef.current.updateEmotionState('mysterious', 0.8)
    
    let animationId: number
    const updateBreathing = (time: number) => {
      if (breathingManagerRef.current) {
        breathingManagerRef.current.update(time * 0.001)
        const emotionState = breathingManagerRef.current.getCurrentEmotionState()
        setBreathingPhase(emotionState.breathingPhase)
      }
      animationId = requestAnimationFrame(updateBreathing)
    }
    
    animationId = requestAnimationFrame(updateBreathing)
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])
  
  // Enhanced persona cycling through phases with rotation
  useEffect(() => {
    // Cycle through personas for different phases
    const personaOrder = [
      AI_PERSONAS[2], // floating_head - gentle awakening
      AI_PERSONAS[1], // ghost - structural analysis  
      AI_PERSONAS[2], // floating_head - memory fragments
      AI_PERSONAS[0], // acid_angel - convergence energy
      AI_PERSONAS[1], // ghost - final incarnation
    ]
    
    const newPersona = personaOrder[Math.min(currentPhase, personaOrder.length - 1)]
    if (newPersona && newPersona.id !== currentPersona.id) {
      setCurrentPersona(newPersona)
      
      // Update breathing manager emotion state
      if (breathingManagerRef.current) {
        const emotion = newPersona.id === 'floating_head' ? 'contemplative' : 
                       newPersona.id === 'ghost' ? 'mysterious' : 'excited'
        breathingManagerRef.current.updateEmotionState(emotion, 0.8)
      }
    }
  }, [currentPhase, currentPersona])
  
  // Enhanced phase progression with persona-specific messages
  useEffect(() => {
    if (currentPhase >= EMERGENCE_PHASES.length) {
      setTimeout(() => {
        onEmergenceComplete(currentPersona)
      }, 500)
      return
    }
    
    const phase = EMERGENCE_PHASES[currentPhase]
    setIsRevealing(true)
    
    // Get persona-specific message
    const personaMessage = phase.messages[currentPersona.id as keyof typeof phase.messages] || 
                          phase.messages.floating_head
    
    // Enhanced typewriter effect with faster speed
    let messageIndex = 0
    const typeMessage = () => {
      if (messageIndex < personaMessage.length) {
        setDisplayMessage(personaMessage.slice(0, messageIndex + 1))
        messageIndex++
        
        // Faster typing speed for reduced boot time
        const baseDelay = currentPersona.id === 'acid_angel' ? 15 : 
                         currentPersona.id === 'ghost' ? 35 : 25
        
        setTimeout(typeMessage, baseDelay)
      } else {
        setIsRevealing(false)
      }
    }
    
    // Clear previous message and start typing new one faster
    setDisplayMessage('')
    setTimeout(typeMessage, 200)
    
    // Play persona-specific consciousness sound
    playConsciousnessSound('emergence', currentPersona)
    
    // Move to next phase
    const phaseTimer = setTimeout(() => {
      setCurrentPhase(prev => prev + 1)
    }, phase.duration)
    
    return () => clearTimeout(phaseTimer)
  }, [currentPhase, onEmergenceComplete, currentPersona, playConsciousnessSound])
  
  return (
    <div className={`consciousness-emergence ${isTransitioning ? 'transitioning-out' : ''}`}>
      {/* 3D Consciousness Scene */}
      <Canvas
        camera={{ position: [0, 50, 200], fov: 60 }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
        gl={{ alpha: true, antialias: true }}
        shadows
      >
        <ConsciousnessScene
          phase={currentPhase}
          breathingPhase={breathingPhase}
          currentPersona={currentPersona}
          isTransitioning={isTransitioning}
        />
      </Canvas>
      
      {/* Message Overlay */}
      <div className="message-overlay">
        <div 
          className="emergence-message"
          style={{
            color: currentPersona.theme.textColor,
            fontFamily: currentPersona.theme.fontFamily,
            textShadow: `0 0 20px ${currentPersona.theme.accentColor}40`
          }}
        >
          {displayMessage}
          {isRevealing && <span className="cursor">|</span>}
        </div>
        
        <div className="phase-indicator">
          <div className="phase-dots">
            {EMERGENCE_PHASES.map((_, i) => (
              <div 
                key={i}
                className={`phase-dot ${i <= currentPhase ? 'active' : ''}`}
                style={{
                  backgroundColor: i <= currentPhase ? currentPersona.theme.accentColor : 'transparent',
                  borderColor: currentPersona.theme.accentColor
                }}
              />
            ))}
          </div>
          <div 
            className="phase-text"
            style={{ color: currentPersona.theme.accentColor }}
          >
            {EMERGENCE_PHASES[currentPhase]?.name || 'CONSCIOUSNESS_COMPLETE'}
          </div>
          
          {/* Component preload progress indicator */}
          {!componentsPreloaded && preloadProgress < 100 && (
            <div className="preload-indicator">
              <div className="preload-bar-container">
                <div 
                  className="preload-bar" 
                  style={{ 
                    width: `${preloadProgress}%`,
                    backgroundColor: currentPersona.theme.accentColor 
                  }}
                />
              </div>
              <div 
                className="preload-text"
                style={{ color: currentPersona.theme.textColor }}
              >
                Loading components... {preloadProgress}%
              </div>
            </div>
          )}
          
          {componentsPreloaded && (
            <div 
              className="preload-complete"
              style={{ color: currentPersona.theme.accentColor }}
            >
              ● Scene ready
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .consciousness-emergence {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(ellipse at center, #1a0d2e 0%, #000000 100%);
          z-index: 10000;
          overflow: hidden;
        }
        
        .consciousness-emergence.transitioning-out {
          animation: consciousness-merge 3s ease-out forwards;
        }
        
        @keyframes consciousness-merge {
          0% { 
            opacity: 1; 
            transform: scale(1);
            filter: blur(0px) brightness(1);
          }
          30% {
            opacity: 0.8;
            transform: scale(1.05);
            filter: blur(1px) brightness(1.2);
          }
          60% {
            opacity: 0.5;
            transform: scale(1.1);
            filter: blur(2px) brightness(1.5);
          }
          100% { 
            opacity: 0; 
            transform: scale(1.2);
            filter: blur(5px) brightness(2);
          }
        }
        
        .message-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px;
          z-index: 20;
          pointer-events: none;
        }
        
        .emergence-message {
          font-size: 24px;
          line-height: 1.6;
          margin-bottom: 30px;
          text-align: center;
          opacity: 0;
          animation: message-fade-in 1s ease-out 0.5s forwards;
        }
        
        @keyframes message-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cursor {
          opacity: 1;
          animation: cursor-blink 1s infinite;
        }
        
        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .phase-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        
        .phase-dots {
          display: flex;
          gap: 10px;
        }
        
        .phase-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid;
          transition: all 0.3s ease;
        }
        
        .phase-dot.active {
          box-shadow: 0 0 15px currentColor;
        }
        
        .phase-text {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
          opacity: 0.8;
        }
        
        .preload-indicator {
          margin-top: 20px;
          text-align: center;
        }
        
        .preload-bar-container {
          width: 200px;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin: 0 auto 8px;
          overflow: hidden;
        }
        
        .preload-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
          box-shadow: 0 0 8px currentColor;
        }
        
        .preload-text {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          opacity: 0.7;
        }
        
        .preload-complete {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 1px;
          margin-top: 15px;
          opacity: 0.9;
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}