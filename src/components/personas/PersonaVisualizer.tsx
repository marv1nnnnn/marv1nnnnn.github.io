'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Box, Sphere, Torus } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import { Group } from 'three'
import { AIPersona } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import * as THREE from 'three'

interface PersonaVisualizerProps {
  persona: AIPersona
  isActive: boolean
  isTyping?: boolean
}

function GhostModel({ persona, isActive, isTyping }: { persona: AIPersona, isActive: boolean, isTyping: boolean }) {
  const groupRef = useRef<Group>(null)
  
  useEffect(() => {
    if (groupRef.current) {
      const intensity = isActive ? 1 : 0.3
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if ('opacity' in mat) mat.opacity = intensity
            })
          } else if ('opacity' in child.material) {
            child.material.opacity = intensity
          }
        }
      })
    }
  }, [isActive])

  const renderAvatar = () => {
    const { model, primaryColor, secondaryColor, materialType } = persona.avatar
    
    const materialProps = {
      color: primaryColor,
      transparent: true,
      opacity: isActive ? 0.8 : 0.3,
      ...(materialType === 'ethereal' && {
        emissive: primaryColor,
        emissiveIntensity: 0.3
      }),
      ...(materialType === 'metallic' && {
        metalness: 0.8,
        roughness: 0.2
      }),
      ...(materialType === 'digital' && {
        wireframe: Math.random() < 0.3
      })
    }

    switch (model) {
      case 'ghost':
        return (
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
            <Sphere args={[1.2, 16, 16]} position={[0, 0.5, 0]}>
              <meshStandardMaterial {...materialProps} />
            </Sphere>
            <Sphere args={[0.8, 12, 12]} position={[0, -0.3, 0]}>
              <meshStandardMaterial {...materialProps} opacity={(materialProps.opacity || 0.5) * 0.6} />
            </Sphere>
            <Sphere args={[0.5, 8, 8]} position={[0, -1, 0]}>
              <meshStandardMaterial {...materialProps} opacity={(materialProps.opacity || 0.5) * 0.4} />
            </Sphere>
          </Float>
        )
      
      case 'figure':
        return (
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <Box args={[0.8, 2, 0.4]} position={[0, 0, 0]}>
              <meshStandardMaterial {...materialProps} />
            </Box>
            <Sphere args={[0.5, 12, 12]} position={[0, 1.2, 0]}>
              <meshStandardMaterial {...materialProps} />
            </Sphere>
            <Box args={[1.2, 0.3, 0.5]} position={[0, 0.5, 0]}>
              <meshStandardMaterial color={secondaryColor} transparent opacity={materialProps.opacity} />
            </Box>
          </Float>
        )
      
      case 'geometric':
        return (
          <Float speed={3} rotationIntensity={0.8} floatIntensity={0.3}>
            <Box args={[1, 1, 1]} position={[0, 0.5, 0]} rotation={[0.5, 0.5, 0]}>
              <meshStandardMaterial {...materialProps} />
            </Box>
            <Torus args={[0.8, 0.2, 8, 16]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...materialProps} color={secondaryColor} />
            </Torus>
            <Sphere args={[0.3, 8, 8]} position={[0, -0.8, 0]}>
              <meshStandardMaterial {...materialProps} emissive={primaryColor} emissiveIntensity={0.5} />
            </Sphere>
          </Float>
        )
      
      case 'abstract':
        return (
          <Float speed={2.5} rotationIntensity={1} floatIntensity={0.6}>
            <group rotation={[0, Math.sin(Date.now() * 0.001) * 0.5, 0]}>
              <Torus args={[1, 0.3, 6, 12]} position={[0, 0.5, 0]}>
                <meshStandardMaterial {...materialProps} />
              </Torus>
              <Torus args={[0.6, 0.2, 4, 8]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial {...materialProps} color={secondaryColor} />
              </Torus>
              <Sphere args={[0.2, 6, 6]} position={[0, 0, 0]}>
                <meshStandardMaterial {...materialProps} emissive={primaryColor} emissiveIntensity={0.8} />
              </Sphere>
            </group>
          </Float>
        )
      
      default:
        return null
    }
  }

  return (
    <group ref={groupRef} scale={isTyping ? [1.1, 1.1, 1.1] : [1, 1, 1]}>
      {renderAvatar()}
      
      {/* Ambient lighting specific to persona */}
      <pointLight 
        position={[2, 2, 2]} 
        color={persona.avatar.accentColor}
        intensity={isActive ? 0.5 : 0.2}
      />
      <pointLight 
        position={[-2, -2, 2]} 
        color={persona.avatar.secondaryColor}
        intensity={isActive ? 0.3 : 0.1}
      />
    </group>
  )
}

export default function PersonaVisualizer({ persona, isActive, isTyping = false }: PersonaVisualizerProps) {
  const { playSound } = useAudio()

  useEffect(() => {
    if (isActive) {
      playSound('windowOpen')
    }
  }, [isActive, playSound])

  return (
    <div className="persona-visualizer">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ 
          background: `linear-gradient(45deg, ${persona.theme.backgroundColor}00, ${persona.theme.accentColor}20)` 
        }}
      >
        <ambientLight intensity={0.2} />
        <spotLight 
          position={[0, 5, 0]} 
          intensity={0.8} 
          color={persona.avatar.primaryColor}
          angle={Math.PI / 4}
          penumbra={0.5}
        />
        
        <GhostModel persona={persona} isActive={isActive} isTyping={isTyping} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={isActive}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      <style jsx>{`
        .persona-visualizer {
          width: 100%;
          height: 100%;
          position: relative;
          transition: filter 0.3s ease;
          filter: ${isActive ? 'none' : 'grayscale(0.7) opacity(0.6)'};
        }
      `}</style>
    </div>
  )
}