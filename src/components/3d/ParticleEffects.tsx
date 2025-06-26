'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points } from '@react-three/drei'
import { AIPersona } from '@/types/personas'
import * as THREE from 'three'

interface ParticleEffectsProps {
  persona: AIPersona
  hoverIntensity: number
  position?: [number, number, number]
}

// Acid Angel particle effects - crystalline and acidic
function AcidAngelParticles({ hoverIntensity, position = [0, 0, 0] }: { hoverIntensity: number, position?: [number, number, number] }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const particleCount = 200
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 15 + 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const isAcid = Math.random() > 0.5
      if (isAcid) {
        // Acid green
        cols[i * 3] = 0.0
        cols[i * 3 + 1] = 1.0
        cols[i * 3 + 2] = 0.25
      } else {
        // Electric magenta
        cols[i * 3] = 1.0
        cols[i * 3 + 1] = 0.0
        cols[i * 3 + 2] = 0.5
      }
    }
    return cols
  }, [])

  useFrame((state) => {
    if (pointsRef.current && hoverIntensity > 0) {
      const time = state.clock.elapsedTime
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Crystalline expansion effect
        const expansion = 1 + hoverIntensity * 2
        const rotation = time * 0.5 + i * 0.1
        
        const originalRadius = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2)
        positions[i3] = Math.cos(rotation) * originalRadius * expansion
        positions[i3 + 1] = Math.sin(rotation) * originalRadius * expansion
        positions[i3 + 2] += Math.sin(time * 2 + i * 0.2) * 0.1 * hoverIntensity
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (hoverIntensity === 0) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1 * hoverIntensity}
        vertexColors
        transparent
        opacity={hoverIntensity * 0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Ghost persona particles - ethereal mist and data streams
function GhostParticles({ hoverIntensity, position = [0, 0, 0] }: { hoverIntensity: number, position?: [number, number, number] }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const particleCount = 150
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 30 - 15
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  useFrame((state) => {
    if (pointsRef.current && hoverIntensity > 0) {
      const time = state.clock.elapsedTime
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Floating data stream effect
        positions[i3 + 1] += 0.05 * hoverIntensity
        if (positions[i3 + 1] > 15) {
          positions[i3 + 1] = -15
        }
        
        // Gentle drift
        positions[i3] += Math.sin(time * 0.5 + i * 0.1) * 0.01 * hoverIntensity
        positions[i3 + 2] += Math.cos(time * 0.3 + i * 0.15) * 0.01 * hoverIntensity
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (hoverIntensity === 0) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05 * hoverIntensity}
        color="#00cccc"
        transparent
        opacity={hoverIntensity * 0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Floating Head particles - warm, artistic orbs
function FloatingHeadParticles({ hoverIntensity, position = [0, 0, 0] }: { hoverIntensity: number, position?: [number, number, number] }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const particleCount = 100
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const radius = 8 + Math.random() * 12
      const theta = Math.random() * Math.PI * 2
      
      pos[i * 3] = radius * Math.cos(theta)
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = radius * Math.sin(theta)
    }
    return pos
  }, [])

  useFrame((state) => {
    if (pointsRef.current && hoverIntensity > 0) {
      const time = state.clock.elapsedTime
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Gentle orbital motion
        const radius = Math.sqrt(positions[i3] ** 2 + positions[i3 + 2] ** 2)
        const angle = Math.atan2(positions[i3 + 2], positions[i3]) + 0.01 * hoverIntensity
        
        positions[i3] = radius * Math.cos(angle)
        positions[i3 + 2] = radius * Math.sin(angle)
        positions[i3 + 1] += Math.sin(time + i * 0.3) * 0.02 * hoverIntensity
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (hoverIntensity === 0) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2 * hoverIntensity}
        color="#ff6b47"
        transparent
        opacity={hoverIntensity * 0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function ParticleEffects({ persona, hoverIntensity, position }: ParticleEffectsProps) {
  switch (persona.id) {
    case 'acid_angel':
      return <AcidAngelParticles hoverIntensity={hoverIntensity} position={position} />
    case 'ghost':
      return <GhostParticles hoverIntensity={hoverIntensity} position={position} />
    case 'floating_head':
      return <FloatingHeadParticles hoverIntensity={hoverIntensity} position={position} />
    default:
      return null
  }
}