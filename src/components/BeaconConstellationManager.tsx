'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { AtmosphericParticleField } from './AtmosphericParticleField'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'

// Digital Grammar - conversation patterns based on emotion
const digitalGrammar = {
  contemplative: {
    userTrigger: "pause_and_reflect",
    aiResponse: "measured_wisdom",
    beaconDialogue: "slow_synchronous_breathing",
    pattern: "deep_ocean_rhythm"
  },
  excited: {
    userTrigger: "rapid_discovery",
    aiResponse: "enthusiastic_cascading",
    beaconDialogue: "quick_light_exchanges",
    pattern: "storm_surface_activity"
  },
  melancholic: {
    userTrigger: "longing_echo",
    aiResponse: "gentle_understanding",
    beaconDialogue: "fading_sympathy_waves",
    pattern: "gentle_current_flow"
  },
  mysterious: {
    userTrigger: "hidden_seeking",
    aiResponse: "cryptic_revelation",
    beaconDialogue: "unpredictable_clustering",
    pattern: "deep_current_secrets"
  },
  urgent: {
    userTrigger: "crisis_alert",
    aiResponse: "immediate_response",
    beaconDialogue: "network_wide_synchronization",
    pattern: "tsunami_formation"
  }
}

// Emotion management system
export class ConversationEmotionManager {
  private mode: 'random' | 'api' = 'api'
  private emotions: string[] = ['contemplative', 'excited', 'melancholic', 'mysterious', 'urgent']
  private currentEmotion: { type: string; intensity: number } = { type: 'contemplative', intensity: 0.6 }
  private beaconUpdateCallbacks: Array<(emotion: string, intensity: number) => void> = []
  private lastEmotionChange = 0
  private emotionCycleDuration = 8000 // Change emotion every 8 seconds

  // Keyword maps for emotion detection
  private emotionKeywords = {
    contemplative: ['remember', 'think', 'consider', 'reflect', 'ponder', 'wonder', 'meaning', 'purpose', 'existence', 'philosophy', 'deep', 'profound'],
    excited: ['amazing', 'wow', 'incredible', 'fantastic', 'brilliant', 'awesome', 'discovery', 'breakthrough', 'found', 'success', 'yes!', 'perfect'],
    melancholic: ['lost', 'gone', 'sad', 'miss', 'alone', 'empty', 'void', 'forgotten', 'regret', 'mourn', 'farewell', 'ending'],
    mysterious: ['secret', 'hidden', 'unknown', 'strange', 'mysterious', 'puzzle', 'enigma', 'whisper', 'shadow', 'riddle', 'cryptic', 'beyond'],
    urgent: ['help', 'emergency', 'urgent', 'quickly', 'now', 'immediately', 'crisis', 'danger', 'alert', 'warning', 'save', 'critical']
  }

  constructor() {
    if (this.mode === 'random') {
      this.startRandomCycling()
    }
  }

  private startRandomCycling() {
    const cycle = () => {
      if (this.mode === 'random') {
        const randomEmotion = this.emotions[Math.floor(Math.random() * this.emotions.length)]
        const randomIntensity = 0.4 + Math.random() * 0.6 // Between 0.4 and 1.0
        this.updateBeaconEmotion(randomEmotion, randomIntensity)
      }
      setTimeout(cycle, this.emotionCycleDuration + Math.random() * 4000) // Add some randomness
    }
    cycle()
  }

  // Keyword-based message analysis
  analyzeMessage(message: string, isUserMessage: boolean = true): { emotion: string; intensity: number; confidence: number } {
    const lowerMessage = message.toLowerCase()
    const emotionScores: { [key: string]: number } = {}
    
    // Initialize scores
    this.emotions.forEach(emotion => {
      emotionScores[emotion] = 0
    })

    // Count keyword matches
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          emotionScores[emotion] += 1
        }
      }
    }

    // Find the emotion with highest score
    let maxEmotion = 'contemplative'
    let maxScore = 0
    
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score
        maxEmotion = emotion
      }
    }

    // Calculate intensity based on message length and keyword density
    const messageWords = message.split(' ').length
    const keywordDensity = maxScore / Math.max(messageWords, 1)
    let intensity = Math.min(0.3 + keywordDensity * 2, 1.0)
    
    // Boost intensity for user messages (they drive the conversation)
    if (isUserMessage) {
      intensity = Math.min(intensity * 1.3, 1.0)
    }

    // Calculate confidence
    const confidence = maxScore > 0 ? Math.min(maxScore * 0.3, 1.0) : 0.1

    return {
      emotion: maxEmotion,
      intensity: Math.max(intensity, 0.3), // Minimum intensity
      confidence
    }
  }

  // Process both user and AI messages for emotion
  processConversationTurn(userMessage: string, aiMessage?: string): void {
    console.log('[DEBUG] Processing conversation turn:', { userMessage, aiMessage })
    
    // Analyze user message first
    const userAnalysis = this.analyzeMessage(userMessage, true)
    console.log('[DEBUG] User message analysis:', userAnalysis)
    
    // Update emotion based on user input
    this.updateBeaconEmotion(userAnalysis.emotion, userAnalysis.intensity)
    
    // If AI message is provided, analyze it and potentially refine emotion
    if (aiMessage) {
      setTimeout(() => {
        const aiAnalysis = this.analyzeMessage(aiMessage, false)
        console.log('[DEBUG] AI message analysis:', aiAnalysis)
        
        // Blend user and AI emotions for final state
        const blendedIntensity = (userAnalysis.intensity * 0.7 + aiAnalysis.intensity * 0.3)
        const finalEmotion = aiAnalysis.confidence > userAnalysis.confidence ? aiAnalysis.emotion : userAnalysis.emotion
        
        this.updateBeaconEmotion(finalEmotion, blendedIntensity)
      }, 1500) // Delay to allow AI response to complete
    }
  }

  // Switch modes
  setMode(mode: 'random' | 'api') {
    this.mode = mode
    if (mode === 'random') {
      this.startRandomCycling()
    }
  }

  updateBeaconEmotion(emotion: string, intensity: number = 1.0) {
    this.currentEmotion = { type: emotion, intensity }
    this.lastEmotionChange = Date.now()
    console.log('[DEBUG] Beacon emotion updated:', { emotion, intensity })
    this.beaconUpdateCallbacks.forEach(callback => callback(emotion, intensity))
  }

  subscribeToEmotionUpdates(callback: (emotion: string, intensity: number) => void) {
    this.beaconUpdateCallbacks.push(callback)
    // Immediately call with current emotion
    callback(this.currentEmotion.type, this.currentEmotion.intensity)
  }

  getCurrentEmotion() {
    return this.currentEmotion
  }

  getDigitalGrammar() {
    return digitalGrammar
  }
}

// Beacon network architecture
const beaconNetwork = [
  // Surface beacons (enhanced from existing)
  { pos: [0, 50, 0], type: 'primary', conversationRole: 'facilitator', id: 0 },
  { pos: [-200, 80, -150], type: 'relay', conversationRole: 'questioner', id: 1 },
  { pos: [250, 60, 200], type: 'relay', conversationRole: 'responder', id: 2 },
  
  // New sky beacons (elevated consciousness)
  { pos: [100, 180, -100], type: 'skynode', conversationRole: 'observer', id: 3 },
  { pos: [-150, 220, 180], type: 'skynode', conversationRole: 'mediator', id: 4 },
  { pos: [50, 300, 50], type: 'deepsky', conversationRole: 'memory_keeper', id: 5 }
]

// Emotion-to-beacon pattern mapping
const emotionalBeaconPatterns = {
  contemplative: {
    pulseRhythm: "slow_breathing",
    intensity: 0.6,
    color: new THREE.Color('#7c3aed'), // deepAmethyst
    behavior: "gentle_synchronization",
    oceanSync: 0.9,
    speedMultiplier: 0.7
  },
  excited: {
    pulseRhythm: "rapid_exchanges",
    intensity: 0.9,
    color: new THREE.Color('#c084fc'), // lightAmethyst
    behavior: "cascading_responses",
    oceanSync: 0.3,
    speedMultiplier: 2.0
  },
  melancholic: {
    pulseRhythm: "irregular_sighs",
    intensity: 0.4,
    color: new THREE.Color('#a855f7'), // midAmethyst
    behavior: "fading_echoes",
    oceanSync: 0.7,
    speedMultiplier: 0.5
  },
  mysterious: {
    pulseRhythm: "unpredictable_clustering",
    intensity: 0.7,
    color: new THREE.Color('#d8b3ff'), // etherealAmethyst
    behavior: "hidden_patterns",
    oceanSync: 0.5,
    speedMultiplier: 1.2
  },
  urgent: {
    pulseRhythm: "staccato_bursts",
    intensity: 1.0,
    color: new THREE.Color('#c084fc'), // lightAmethyst
    behavior: "network_wide_alert",
    oceanSync: 0.1,
    speedMultiplier: 3.0
  }
}

// Individual beacon component with unified breathing system
function Beacon({
  position,
  id,
  emotionManager,
  breathingManager,
  beaconStates,
  setBeaconStates
}: {
  position: [number, number, number]
  id: number
  emotionManager: ConversationEmotionManager
  breathingManager: AtmosphericBreathingManager
  beaconStates: any[]
  setBeaconStates: (states: any[]) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const [emotion, setEmotion] = useState(emotionManager.getCurrentEmotion())

  useEffect(() => {
    emotionManager.subscribeToEmotionUpdates((newEmotion, intensity) => {
      setEmotion({ type: newEmotion, intensity })
    })
  }, [emotionManager])

  useFrame((state) => {
    if (!meshRef.current || !lightRef.current) return

    const time = state.clock.elapsedTime
    const pattern = emotionalBeaconPatterns[emotion.type as keyof typeof emotionalBeaconPatterns]
    
    if (!pattern) return

    // Get unified breathing state from atmospheric manager
    const breathingState = breathingManager.getCurrentBreathingState()
    const emotionState = breathingManager.getCurrentEmotionState()
    
    // Organic behaviors implementation
    const beaconState = beaconStates[id] || {}
    
    // Unified breathing resonance - synchronized with ocean and particles
    const breathingPhase = breathingState.phase
    const deepBreathBoost = breathingState.deepBreath
    const breathingSync = pattern.oceanSync + (Math.sin(time * 0.02) * 0.1) // Slight variation for organic feel
    
    // Base pulse calculation using unified emotion state
    let pulseIntensity = pattern.intensity * emotionState.intensity
    
    // Deep breath events create network-wide responses
    if (deepBreathBoost > 0) {
      pulseIntensity *= (1 + deepBreathBoost * 0.5)
    }
    
    // Cascade Awakening - respond to other beacon pulses
    const cascadeInfluence = beaconStates.reduce((influence, otherState, otherIndex) => {
      if (otherIndex === id) return influence
      const distance = Math.abs(otherIndex - id)
      const delay = distance * 0.3
      const otherPulse = Math.sin(time * pattern.speedMultiplier - delay) * 0.5 + 0.5
      return influence + (otherPulse * 0.2 / distance)
    }, 0)
    
    // Spontaneous Clustering - occasionally sync with nearby beacons
    const clusteringPhase = Math.sin(time * 0.05) > 0.8 ? 1 : 0
    const clusterInfluence = clusteringPhase * Math.sin(time * 2.0) * 0.3
    
    // Memory Echo - remember previous patterns
    const memoryEcho = Math.sin(time * 0.1 + id * 0.5) * 0.15
    
    // Conversation Pairs - specific beacon dialogue patterns
    let conversationInfluence = 0
    if (emotion.type === 'mysterious' && (id % 2 === 0)) {
      conversationInfluence = Math.sin(time * 1.5 + id) * 0.2
    }
    
    // Combine all influences with unified breathing
    const finalPulse = breathingSync * breathingPhase +
                      cascadeInfluence +
                      clusterInfluence +
                      memoryEcho +
                      conversationInfluence
    
    pulseIntensity *= (0.7 + finalPulse * 0.3)
    
    // Apply visual effects
    const scale = 1 + pulseIntensity * 0.5
    meshRef.current.scale.setScalar(scale)
    
    // Use unified color system from atmospheric manager
    const unifiedColor = breathingManager.atmosphericUniforms.uColorMid.value
    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.color.copy(unifiedColor)
    material.opacity = 0.8 + pulseIntensity * 0.2
    
    // Light effects with unified colors
    lightRef.current.color.copy(unifiedColor)
    lightRef.current.intensity = pulseIntensity * 2
    lightRef.current.distance = 100 + pulseIntensity * 50
    
    // Update beacon state for cascade effects
    const newStates = [...beaconStates]
    newStates[id] = {
      pulseIntensity,
      lastUpdate: time,
      emotion: emotion.type,
      position: position,
      breathingPhase,
      deepBreathBoost
    }
    setBeaconStates(newStates)
  })

  // Use unified color system
  const unifiedColor = breathingManager.atmosphericUniforms.uColorMid.value

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial
          color={unifiedColor}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={unifiedColor}
        intensity={1}
        distance={100}
        decay={2}
      />
      {/* Outer glow sphere */}
      <mesh>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial
          color={unifiedColor}
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  )
}

// Main beacon constellation component
export function BeaconConstellation({
  emotionManager,
  breathingManager
}: {
  emotionManager: ConversationEmotionManager
  breathingManager: AtmosphericBreathingManager
}) {
  const [beaconStates, setBeaconStates] = useState<any[]>(new Array(6).fill({}))
  
  console.log('[DEBUG] BeaconConstellation initializing with', beaconNetwork.length, 'beacons')

  return (
    <group>
      {/* Atmospheric Particle Field - Phase 3 Implementation */}
      <AtmosphericParticleField emotionManager={emotionManager} breathingManager={breathingManager} />
      
      {/* Beacon Network */}
      {beaconNetwork.map((beacon) => (
        <Beacon
          key={beacon.id}
          position={beacon.pos as [number, number, number]}
          id={beacon.id}
          emotionManager={emotionManager}
          breathingManager={breathingManager}
          beaconStates={beaconStates}
          setBeaconStates={setBeaconStates}
        />
      ))}
    </group>
  )
}

// Three.js Canvas wrapper for the beacon system
export function BeaconCanvasOverlay({
  emotionManager,
  breathingManager
}: {
  emotionManager: ConversationEmotionManager
  breathingManager: AtmosphericBreathingManager
}) {
  return (
    <div className="beacon-canvas-overlay">
      <Canvas
        camera={{ position: [0, 150, 400], fov: 60 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
          background: 'transparent'
        }}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <BeaconConstellation emotionManager={emotionManager} breathingManager={breathingManager} />
      </Canvas>
    </div>
  )
}