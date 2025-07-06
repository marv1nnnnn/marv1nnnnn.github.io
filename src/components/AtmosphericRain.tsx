'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'

interface AtmosphericRainProps {
  breathingManager: AtmosphericBreathingManager
  atmosphericIntensity?: number
  glitchLevel?: number
  density?: number
}

export default function AtmosphericRain({
  breathingManager,
  atmosphericIntensity = 0.5,
  glitchLevel = 0.0,
  density = 1.0
}: AtmosphericRainProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)
  // Macondo-style heavier raindrops - varied sizes for natural feeling
  const raindropGeometry = useMemo(() => {
    // Create multiple geometries for size variation
    const geometries = [
      new THREE.CylinderGeometry(0.04, 0.06, 3.5, 4), // Heavier standard drops
      new THREE.CylinderGeometry(0.06, 0.08, 4.2, 4), // Large drops
      new THREE.CylinderGeometry(0.03, 0.04, 2.8, 4)  // Smaller persistent drops
    ]
    return geometries[Math.floor(Math.random() * geometries.length)]
  }, [])
  
  // Macondo rain density - persistent, wall-of-water feeling
  const raindropCount = Math.floor(density * (0.8 + atmosphericIntensity * 1.5) * 2000 * (1 + glitchLevel * 0.5))
  
  // Silvery-grey Macondo rain material with melancholic tones
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#c0c0c8'), // Silvery-grey instead of blue
    transparent: true,
    opacity: 0.6 + atmosphericIntensity * 0.3, // More visible, persistent feeling
  }), [atmosphericIntensity])
  
  // Macondo rain data - slower, more persistent, memory-like
  const raindrops = useMemo(() => {
    const drops = []
    const spread = 300 // Wider spread for enveloping feeling
    
    for (let i = 0; i < raindropCount; i++) {
      drops.push({
        x: (Math.random() - 0.5) * spread,
        y: Math.random() * 120 + 60, // Higher starting point
        z: (Math.random() - 0.5) * spread,
        speed: 0.2 + Math.random() * 0.4, // Much slower, persistent falling
        initialY: Math.random() * 120 + 60,
        size: 0.8 + Math.random() * 0.4, // Size variation for natural feeling
        persistence: Math.random() * 0.5 + 0.5, // How long drops linger
        swayPhase: Math.random() * Math.PI * 2, // Individual sway patterns
        memoryTrace: Math.random() * 0.3 // Ghostly trail effect
      })
    }
    return drops
  }, [raindropCount])
  
  // Initialize instance matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return
    
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Euler()
    const scale = new THREE.Vector3(1, 1, 1)
    
    for (let i = 0; i < raindropCount; i++) {
      const drop = raindrops[i]
      position.set(drop.x, drop.y, drop.z)
      rotation.set(0, 0, Math.random() * 0.2 - 0.1) // Slight random rotation
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
      instancedMeshRef.current.setMatrixAt(i, matrix)
    }
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true
  }, [raindrops, raindropCount])
  
  // Animation loop
  useFrame((state) => {
    if (!instancedMeshRef.current) return
    
    const time = state.clock.elapsedTime
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Euler()
    const scale = new THREE.Vector3(1, 1, 1)
    
    // Update breathing manager
    breathingManager.update(time)
    
    for (let i = 0; i < raindropCount; i++) {
      const drop = raindrops[i]
      
      // Macondo-style slow, persistent falling
      drop.y -= drop.speed * drop.persistence * (0.8 + atmosphericIntensity * 0.4)
      
      // Gentle memory-like swaying - like thoughts drifting
      const swayX = Math.sin(time * 0.2 + drop.swayPhase) * 0.3 * drop.memoryTrace
      const swayZ = Math.cos(time * 0.15 + drop.swayPhase + 1) * 0.2 * drop.memoryTrace
      
      // Melancholic wind patterns - soft, sighing movement
      let windX = Math.sin(time * 0.3 + drop.z * 0.005) * 0.05
      let windZ = Math.cos(time * 0.2 + drop.x * 0.003) * 0.03
      
      // Subtle glitch effects - less chaotic, more melancholic
      if (glitchLevel > 0.01) {
        const melancholicGlitch = glitchLevel * 0.8
        windX += Math.sin(time * 5 + drop.swayPhase) * melancholicGlitch * 0.1
        windZ += Math.cos(time * 3 + drop.swayPhase) * melancholicGlitch * 0.1
        
        // Gentle speed variations - like sighs
        drop.speed *= (1 + Math.sin(time * 2 + drop.swayPhase) * glitchLevel * 0.2)
      }
      
      // Apply gentle movements
      drop.x += windX + swayX
      drop.z += windZ + swayZ
      
      // Persistent reset - drops linger longer, return gradually
      if (drop.y < -15 - drop.persistence * 10 || Math.abs(drop.x) > 200 || Math.abs(drop.z) > 200) {
        drop.y = drop.initialY + Math.random() * 30
        drop.x = (Math.random() - 0.5) * 300
        drop.z = (Math.random() - 0.5) * 300
        drop.speed = 0.2 + Math.random() * 0.4 // Reset to slow speed
        drop.swayPhase = Math.random() * Math.PI * 2 // New sway pattern
      }
      
      // Update instance matrix with size variation
      position.set(drop.x, drop.y, drop.z)
      rotation.set(0, 0, windX * 0.5) // Gentle tilt
      scale.set(drop.size, drop.size, drop.size) // Size variation
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
      instancedMeshRef.current.setMatrixAt(i, matrix)
    }
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    
    // Macondo emotional breathing - rain responds to atmospheric mood
    const breathingState = breathingManager.getCurrentBreathingState()
    const emotionState = breathingManager.getCurrentEmotionState()
    
    // Base opacity is higher for persistent Macondo feeling
    const baseOpacity = 0.6 + atmosphericIntensity * 0.3
    
    // Gentle breathing modulation - like sighs
    const breathingModulation = 1 + breathingState.phase * 0.15 + breathingState.deepBreath * 0.2
    
    // Emotional color tinting - rain reflects inner emotions
    const emotionIntensity = emotionState.intensity
    if (emotionIntensity > 0.5) {
      // Shift toward more melancholic tones when emotions are intense
      const melancholicTint = new THREE.Color('#b8b8c0').lerp(new THREE.Color('#a0a0a8'), emotionIntensity - 0.5)
      material.color.copy(melancholicTint)
    } else {
      // Return to silvery-grey
      material.color.setHex(0xc0c0c8)
    }
    
    // Gentle glitch effects - more like memory fluctuations
    const memoryFlicker = glitchLevel > 0.01 ? 
      1 + Math.sin(time * 8 + Math.cos(time * 3)) * glitchLevel * 0.2 : 1
    
    material.opacity = baseOpacity * breathingModulation * Math.max(0.3, memoryFlicker)
  })
  
  useEffect(() => {
  }, [raindropCount])
  
  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[raindropGeometry, material, raindropCount]}
      frustumCulled={false}
    />
  )
}