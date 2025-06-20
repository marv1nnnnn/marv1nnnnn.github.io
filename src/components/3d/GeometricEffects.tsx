'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AIPersona } from '@/types/personas'
import * as THREE from 'three'

interface GeometricEffectsProps {
  persona: AIPersona
  hoverIntensity: number
  position?: [number, number, number]
}

// Acid Angel geometric effects - expanding crystalline shapes
function AcidAngelGeometry({ hoverIntensity, position = [0, 0, 0] }: { hoverIntensity: number, position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current && hoverIntensity > 0) {
      const time = state.clock.elapsedTime
      
      // Rotate the entire group
      groupRef.current.rotation.y = time * 0.5 * hoverIntensity
      groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.2 * hoverIntensity
      
      // Scale based on hover intensity
      const scale = 1 + hoverIntensity * 0.5
      groupRef.current.scale.setScalar(scale)
    }
  })

  if (hoverIntensity === 0) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Hexagonal rings */}
      {[...Array(3)].map((_, i) => (
        <mesh key={`hex-${i}`} position={[0, i * 2 - 2, 0]}>
          <ringGeometry args={[8 + i * 2, 9 + i * 2, 6]} />
          <meshBasicMaterial 
            color="#00ff41" 
            transparent 
            opacity={hoverIntensity * 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Triangular elements */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 12
        return (
          <mesh 
            key={`tri-${i}`}
            position={[
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius
            ]}
            rotation={[0, angle, 0]}
          >
            <coneGeometry args={[1, 3, 3]} />
            <meshBasicMaterial 
              color="#ff0080" 
              transparent 
              opacity={hoverIntensity * 0.8}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Ghost persona geometric effects - architectural decay
function GhostGeometry({ hoverIntensity, position = [0, 0, 0] }: { hoverIntensity: number, position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current && hoverIntensity > 0) {
      const time = state.clock.elapsedTime
      
      // Slow, haunting rotation
      groupRef.current.rotation.y = time * 0.1 * hoverIntensity
      
      // Subtle breathing effect
      const breathe = 1 + Math.sin(time * 0.5) * 0.1 * hoverIntensity
      groupRef.current.scale.setScalar(breathe)
    }
  })

  if (hoverIntensity === 0) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Monolithic pillars */}
      {[...Array(4)].map((_, i) => {
        const angle = (i / 4) * Math.PI * 2
        const radius = 15
        return (
          <mesh 
            key={`pillar-${i}`}
            position={[
              Math.cos(angle) * radius,
              0,
              Math.sin(angle) * radius
            ]}
          >
            <boxGeometry args={[0.5, 20, 0.5]} />
            <meshLambertMaterial 
              color="#f5f5f0" 
              transparent 
              opacity={hoverIntensity * 0.4}
              emissive="#00cccc"
              emissiveIntensity={hoverIntensity * 0.2}
            />
          </mesh>
        )
      })}
      
      {/* Floating geometric fragments */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 10 + Math.random() * 5
        return (
          <mesh 
            key={`fragment-${i}`}
            position={[
              Math.cos(angle) * radius,
              Math.sin(i * 0.5) * 3,
              Math.sin(angle) * radius
            ]}
          >
            <boxGeometry args={[0.3, 2, 0.3]} />
            <meshLambertMaterial 
              color="#2a2a28" 
              transparent 
              opacity={hoverIntensity * 0.6}
              emissive="#00cccc"
              emissiveIntensity={hoverIntensity * 0.1}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Floating Head geometric effects - gentle flowing shapes
function FloatingHeadGeometry({ hoverIntensity, position = [0, 0, 0] }: { hoverIntensity: number, position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current && hoverIntensity > 0) {
      const time = state.clock.elapsedTime
      
      // Gentle, artistic rotation
      groupRef.current.rotation.y = time * 0.2 * hoverIntensity
      groupRef.current.rotation.x = Math.sin(time * 0.4) * 0.1 * hoverIntensity
      
      // Soft scaling
      const scale = 1 + Math.sin(time * 0.6) * 0.1 * hoverIntensity
      groupRef.current.scale.setScalar(scale)
    }
  })

  if (hoverIntensity === 0) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Floating spheres */}
      {[...Array(5)].map((_, i) => {
        const angle = (i / 5) * Math.PI * 2
        const radius = 8 + i * 2
        return (
          <mesh 
            key={`sphere-${i}`}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle * 2) * 2,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshLambertMaterial 
              color="#ff6b47" 
              transparent 
              opacity={hoverIntensity * 0.7}
              emissive="#ff4500"
              emissiveIntensity={hoverIntensity * 0.3}
            />
          </mesh>
        )
      })}
      
      {/* Flowing ribbons */}
      {[...Array(3)].map((_, i) => (
        <mesh 
          key={`ribbon-${i}`} 
          position={[0, i * 2 - 2, 0]}
          rotation={[0, (i / 3) * Math.PI * 2, 0]}
        >
          <torusGeometry args={[6 + i, 0.1, 4, 20]} />
          <meshLambertMaterial 
            color="#ff6347" 
            transparent 
            opacity={hoverIntensity * 0.5}
            emissive="#ff4500"
            emissiveIntensity={hoverIntensity * 0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function GeometricEffects({ persona, hoverIntensity, position }: GeometricEffectsProps) {
  switch (persona.id) {
    case 'acid_angel':
      return <AcidAngelGeometry hoverIntensity={hoverIntensity} position={position} />
    case 'ghost':
      return <GhostGeometry hoverIntensity={hoverIntensity} position={position} />
    case 'floating_head':
      return <FloatingHeadGeometry hoverIntensity={hoverIntensity} position={position} />
    default:
      return null
  }
}