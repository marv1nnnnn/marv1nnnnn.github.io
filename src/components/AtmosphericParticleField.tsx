'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ConversationEmotionManager } from './BeaconConstellationManager'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'

// Atmospheric layers configuration from brainstorming document
const atmosphericLayers = [
  {
    height: 100,
    density: 1.2,
    particleCount: 300,
    size: { min: 2.0, max: 4.0 },
    color: new THREE.Color('#c084fc'), // lightAmethyst
    behavior: 'gentle_drift',
    emotionResponse: 'density_variation'
  },
  {
    height: 200,
    density: 0.8,
    particleCount: 200,
    size: { min: 3.0, max: 6.0 },
    color: new THREE.Color('#a855f7'), // midAmethyst
    behavior: 'slow_circulation',
    emotionResponse: 'color_shift'
  },
  {
    height: 400,
    density: 0.4,
    particleCount: 150,
    size: { min: 4.0, max: 8.0 },
    color: new THREE.Color('#7c3aed'), // deepAmethyst
    behavior: 'cosmic_drift',
    emotionResponse: 'movement_pattern'
  }
]

// Emotion-responsive particle behaviors
const emotionalParticlePatterns = {
  contemplative: {
    movementSpeed: 0.3,
    verticalDrift: 0.1,
    densityMultiplier: 1.0,
    colorIntensity: 0.8,
    breathingSync: 0.9,
    behavior: 'gentle_synchronized_breathing'
  },
  excited: {
    movementSpeed: 2.0,
    verticalDrift: 0.5,
    densityMultiplier: 1.4,
    colorIntensity: 1.2,
    breathingSync: 0.3,
    behavior: 'rapid_chaotic_movement'
  },
  melancholic: {
    movementSpeed: 0.2,
    verticalDrift: -0.3, // Falling toward ocean
    densityMultiplier: 0.7,
    colorIntensity: 0.6,
    breathingSync: 0.7,
    behavior: 'slow_settling_drift'
  },
  mysterious: {
    movementSpeed: 1.2,
    verticalDrift: 0.0,
    densityMultiplier: 0.9,
    colorIntensity: 1.0,
    breathingSync: 0.5,
    behavior: 'unpredictable_clustering'
  },
  urgent: {
    movementSpeed: 3.0,
    verticalDrift: 0.8,
    densityMultiplier: 1.3,
    colorIntensity: 1.4,
    breathingSync: 0.1,
    behavior: 'sharp_directional_bursts'
  }
}

// Enhanced vertex shader for unified atmospheric particles
const particleVertexShader = `
// Unified atmospheric uniforms (shared across all components)
uniform float uTime;
uniform float uEmotionIntensity;
uniform float uEmotionType; // 0-4 mapped to emotion types
uniform float uBreathingPhase;
uniform float uBreathingAmplitude;
uniform float uDeepBreathPhase;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorLight;
uniform vec3 uColorEthereal;
uniform float uMysteryIntensity;
uniform float uCosmicDriftSpeed;

// Layer-specific uniforms
uniform float uLayerHeight;
uniform float uLayerDensity;

attribute float aSize;
attribute float aPhase;
attribute vec3 aOriginalPosition;

varying float vOpacity;
varying vec3 vColor;

void main() {
  vec3 pos = aOriginalPosition;
  
  // Unified breathing synchronization with ocean
  float breathingInfluence = uBreathingPhase * uBreathingAmplitude;
  float deepBreathBoost = uDeepBreathPhase * 0.8;
  float totalBreathing = breathingInfluence + deepBreathBoost;
  
  // Emotion-based displacement patterns using unified emotion system
  if (uEmotionType < 1.0) {
    // Contemplative: gentle synchronized breathing
    pos.y += totalBreathing * 2.0 * uEmotionIntensity;
    pos.x += sin(uTime * 0.1 * uCosmicDriftSpeed + aPhase) * 1.0 * uEmotionIntensity;
    pos.z += cos(uTime * 0.1 * uCosmicDriftSpeed + aPhase * 0.7) * 1.0 * uEmotionIntensity;
    
  } else if (uEmotionType < 2.0) {
    // Excited: rapid chaotic movement
    pos += sin(uTime * 2.0 * uCosmicDriftSpeed + aPhase * 10.0) * 3.0 * uEmotionIntensity;
    pos.y += totalBreathing * 0.5 * uEmotionIntensity;
    
  } else if (uEmotionType < 3.0) {
    // Melancholic: slow settling drift
    pos.y += totalBreathing * 1.5 * uEmotionIntensity;
    pos.y -= uTime * 0.2 * uCosmicDriftSpeed * uEmotionIntensity; // Falling effect
    pos.x += sin(uTime * 0.05 * uCosmicDriftSpeed + aPhase) * 0.5 * uEmotionIntensity;
    
  } else if (uEmotionType < 4.0) {
    // Mysterious: unpredictable clustering with mystery intensity
    float clusterPhase = sin(uTime * 0.3 * uCosmicDriftSpeed + aPhase * 5.0);
    pos += clusterPhase * sin(uTime * 1.5 * uCosmicDriftSpeed + aPhase * 3.0) * 2.0 * uEmotionIntensity * uMysteryIntensity;
    pos.y += totalBreathing * 1.0 * uEmotionIntensity;
    
  } else {
    // Urgent: sharp directional bursts
    float burstPhase = step(0.7, sin(uTime * 3.0 * uCosmicDriftSpeed + aPhase));
    pos += burstPhase * sin(uTime * 5.0 * uCosmicDriftSpeed + aPhase * 8.0) * 4.0 * uEmotionIntensity;
    pos.y += totalBreathing * 0.2 * uEmotionIntensity;
  }
  
  // Keep particles within reasonable bounds
  pos.y = max(pos.y, -50.0);
  pos.y = min(pos.y, uLayerHeight + 100.0);
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size calculation based on distance, emotion, and breathing
  float size = aSize * (1.0 + uEmotionIntensity * 0.5 + totalBreathing * 0.2);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  
  // Dynamic color selection based on emotion type using unified colors
  vec3 baseColor;
  if (uEmotionType < 1.0) {
    baseColor = mix(uColorMid, uColorDeep, 0.3); // Contemplative: deep colors
  } else if (uEmotionType < 2.0) {
    baseColor = mix(uColorLight, uColorEthereal, 0.5); // Excited: bright colors
  } else if (uEmotionType < 3.0) {
    baseColor = mix(uColorDeep, uColorMid, 0.4); // Melancholic: darker tones
  } else if (uEmotionType < 4.0) {
    baseColor = mix(uColorEthereal, uColorLight, uMysteryIntensity); // Mysterious: ethereal
  } else {
    baseColor = mix(uColorLight, uColorMid, 0.7); // Urgent: vibrant
  }
  
  // Opacity and color variations with unified breathing
  vOpacity = 0.6 + sin(uTime * 0.2 + aPhase) * 0.3;
  vOpacity *= uEmotionIntensity * (1.0 + totalBreathing * 0.3);
  vColor = baseColor;
}
`

// Custom fragment shader for atmospheric particles
const particleFragmentShader = `
uniform sampler2D uTexture;
varying float vOpacity;
varying vec3 vColor;

void main() {
  // Create soft circular particles
  vec2 uv = gl_PointCoord;
  float distance = length(uv - 0.5);
  float alpha = 1.0 - smoothstep(0.3, 0.5, distance);
  
  // Apply amethyst color with emotion-based intensity
  vec3 finalColor = vColor * (0.8 + sin(gl_FragCoord.x * 0.01) * 0.2);
  
  gl_FragColor = vec4(finalColor, alpha * vOpacity);
}
`

// Individual particle layer component with unified breathing system
function ParticleLayer({
  layerConfig,
  layerIndex,
  emotionManager,
  breathingManager
}: {
  layerConfig: typeof atmosphericLayers[0]
  layerIndex: number
  emotionManager: ConversationEmotionManager
  breathingManager: AtmosphericBreathingManager
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const [emotion, setEmotion] = useState(emotionManager.getCurrentEmotion())

  // Subscribe to emotion updates
  useEffect(() => {
    emotionManager.subscribeToEmotionUpdates((newEmotion, intensity) => {
      setEmotion({ type: newEmotion, intensity })
    })
  }, [emotionManager, layerIndex, layerConfig])

  // Generate particle positions and attributes
  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(layerConfig.particleCount * 3)
    const sizes = new Float32Array(layerConfig.particleCount)
    const phases = new Float32Array(layerConfig.particleCount)

    for (let i = 0; i < layerConfig.particleCount; i++) {
      const i3 = i * 3
      
      // Distribute particles in a wide area above the ocean
      positions[i3] = (Math.random() - 0.5) * 800     // X: -400 to 400
      positions[i3 + 1] = Math.random() * layerConfig.height + layerIndex * 50 // Y: layer height
      positions[i3 + 2] = (Math.random() - 0.5) * 800 // Z: -400 to 400
      
      // Random size within layer bounds
      sizes[i] = layerConfig.size.min + Math.random() * (layerConfig.size.max - layerConfig.size.min)
      
      // Random phase for animation variation
      phases[i] = Math.random() * Math.PI * 2
    }

    return { positions, sizes, phases }
  }, [layerConfig, layerIndex])

  // Use shared atmospheric uniforms + layer-specific uniforms
  const uniforms = useMemo(() => ({
    // Shared atmospheric uniforms (unified across all components)
    ...breathingManager.atmosphericUniforms,
    
    // Layer-specific uniforms
    uLayerHeight: { value: layerConfig.height },
    uLayerDensity: { value: layerConfig.density }
  }), [layerConfig, breathingManager])

  // Animation loop with unified breathing system
  useFrame((state) => {
    if (!pointsRef.current) return

    const time = state.clock.elapsedTime
    const pattern = emotionalParticlePatterns[emotion.type as keyof typeof emotionalParticlePatterns]
    
    if (!pattern) return

    // Update breathing manager (this updates all shared uniforms)
    breathingManager.update(time)

    // Get unified emotion and breathing state
    const emotionState = breathingManager.getCurrentEmotionState()
    const breathingState = breathingManager.getCurrentBreathingState()

    // Update material opacity based on unified emotion and breathing
    const material = pointsRef.current.material as THREE.ShaderMaterial
    const baseOpacity = layerConfig.density * pattern.densityMultiplier * emotionState.intensity
    const breathingModulation = 1 + breathingState.phase * 0.2 + breathingState.deepBreath * 0.3
    material.opacity = baseOpacity * breathingModulation
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aOriginalPosition"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        depthTest={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Main atmospheric particle field component
export function AtmosphericParticleField({
  emotionManager,
  breathingManager
}: {
  emotionManager: ConversationEmotionManager
  breathingManager: AtmosphericBreathingManager
}) {
  
  return (
    <group name="atmospheric-particle-field">
      {atmosphericLayers.map((layerConfig, index) => (
        <ParticleLayer
          key={`particle-layer-${index}`}
          layerConfig={layerConfig}
          layerIndex={index}
          emotionManager={emotionManager}
          breathingManager={breathingManager}
        />
      ))}
    </group>
  )
}

// Export for integration with main background component
export default AtmosphericParticleField