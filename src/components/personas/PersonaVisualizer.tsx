'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Box, Sphere, Torus, Text } from '@react-three/drei'
import { useRef, useEffect, useState } from 'react'
import { Group } from 'three'
import { AIPersona } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import MysticalPersonaSelector from './MysticalPersonaSelector'
import CameraController from './CameraController'
import * as THREE from 'three'

interface PersonaVisualizerProps {
  persona: AIPersona
  isActive: boolean
  isTyping?: boolean
  showMysticalSelector?: boolean
  onPersonaSelect?: (persona: AIPersona) => void
  onCloseMysticalSelector?: () => void
}

function GhostModel({ 
  persona, 
  isActive, 
  isTyping, 
  onPersonaClick,
  showMysticalSelector,
  isHovered = false,
  onPersonaHover,
  onPersonaUnhover
}: { 
  persona: AIPersona
  isActive: boolean
  isTyping: boolean
  onPersonaClick?: () => void
  showMysticalSelector?: boolean
  isHovered?: boolean
  onPersonaHover?: () => void
  onPersonaUnhover?: () => void
}) {
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
        emissiveIntensity: isHovered ? 0.6 : 0.3
      }),
      ...(materialType === 'metallic' && {
        metalness: 0.8,
        roughness: 0.2
      }),
      ...(materialType === 'digital' && {
        wireframe: Math.random() < 0.3
      })
    }
    
    // Enhanced material for hover state
    const hoverMaterialProps = isHovered ? {
      ...materialProps,
      emissive: primaryColor,
      emissiveIntensity: 0.8,
      opacity: Math.min((materialProps.opacity || 0.8) + 0.3, 1)
    } : materialProps

    switch (model) {
      case 'ghost':
        return (
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
            <Sphere 
              args={[1.2, 16, 16]} 
              position={[0, 0.5, 0]}
              onPointerOver={onPersonaHover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaHover() } : undefined}
              onPointerOut={onPersonaUnhover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaUnhover() } : undefined}
              onClick={onPersonaClick && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaClick() } : undefined}
            >
              <meshStandardMaterial {...hoverMaterialProps} />
            </Sphere>
            <Sphere args={[0.8, 12, 12]} position={[0, -0.3, 0]}>
              <meshStandardMaterial {...hoverMaterialProps} opacity={(hoverMaterialProps.opacity || 0.5) * 0.6} />
            </Sphere>
            <Sphere args={[0.5, 8, 8]} position={[0, -1, 0]}>
              <meshStandardMaterial {...hoverMaterialProps} opacity={(hoverMaterialProps.opacity || 0.5) * 0.4} />
            </Sphere>
          </Float>
        )
      
      case 'figure':
        return (
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <Box 
              args={[0.8, 2, 0.4]} 
              position={[0, 0, 0]}
              onPointerOver={onPersonaHover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaHover() } : undefined}
              onPointerOut={onPersonaUnhover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaUnhover() } : undefined}
              onClick={onPersonaClick && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaClick() } : undefined}
            >
              <meshStandardMaterial {...hoverMaterialProps} />
            </Box>
            <Sphere args={[0.5, 12, 12]} position={[0, 1.2, 0]}>
              <meshStandardMaterial {...hoverMaterialProps} />
            </Sphere>
            <Box args={[1.2, 0.3, 0.5]} position={[0, 0.5, 0]}>
              <meshStandardMaterial color={secondaryColor} transparent opacity={hoverMaterialProps.opacity} />
            </Box>
          </Float>
        )
      
      case 'geometric':
        return (
          <Float speed={3} rotationIntensity={0.8} floatIntensity={0.3}>
            <Box 
              args={[1, 1, 1]} 
              position={[0, 0.5, 0]} 
              rotation={[0.5, 0.5, 0]}
              onPointerOver={onPersonaHover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaHover() } : undefined}
              onPointerOut={onPersonaUnhover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaUnhover() } : undefined}
              onClick={onPersonaClick && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaClick() } : undefined}
            >
              <meshStandardMaterial {...hoverMaterialProps} />
            </Box>
            <Torus args={[0.8, 0.2, 8, 16]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...hoverMaterialProps} color={secondaryColor} />
            </Torus>
            <Sphere args={[0.3, 8, 8]} position={[0, -0.8, 0]}>
              <meshStandardMaterial {...hoverMaterialProps} emissive={primaryColor} emissiveIntensity={0.5} />
            </Sphere>
          </Float>
        )
      
      case 'abstract':
        return (
          <Float speed={2.5} rotationIntensity={1} floatIntensity={0.6}>
            <group 
              rotation={[0, Math.sin(Date.now() * 0.001) * 0.5, 0]}
              onPointerOver={onPersonaHover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaHover() } : undefined}
              onPointerOut={onPersonaUnhover && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaUnhover() } : undefined}
              onClick={onPersonaClick && !showMysticalSelector ? (e) => { e.stopPropagation(); onPersonaClick() } : undefined}
            >
              <Torus args={[1, 0.3, 6, 12]} position={[0, 0.5, 0]}>
                <meshStandardMaterial {...hoverMaterialProps} />
              </Torus>
              <Torus args={[0.6, 0.2, 4, 8]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial {...hoverMaterialProps} color={secondaryColor} />
              </Torus>
              <Sphere args={[0.2, 6, 6]} position={[0, 0, 0]}>
                <meshStandardMaterial {...hoverMaterialProps} emissive={primaryColor} emissiveIntensity={0.8} />
              </Sphere>
            </group>
          </Float>
        )
      
      default:
        return null
    }
  }

  const scale = isTyping ? 1.1 : isHovered ? 1.05 : 1
  const glowIntensity = isHovered ? 0.8 : 0.3

  return (
    <group 
      ref={groupRef} 
      scale={[scale, scale, scale]}
      onClick={onPersonaClick}
      onPointerOver={(e) => e.stopPropagation()}
      onPointerOut={(e) => e.stopPropagation()}
    >
      {renderAvatar()}
      
      {/* Subtle hover effect - just enhanced lighting */}
      {isHovered && (
        <>
          <pointLight 
            position={[0, 2, 2]} 
            color={persona.avatar.accentColor}
            intensity={0.8}
            distance={3}
          />
          <pointLight 
            position={[0, -2, -2]} 
            color={persona.avatar.primaryColor}
            intensity={0.6}
            distance={3}
          />
        </>
      )}
      
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

export default function PersonaVisualizer({ 
  persona, 
  isActive, 
  isTyping = false, 
  showMysticalSelector = false,
  onPersonaSelect,
  onCloseMysticalSelector
}: PersonaVisualizerProps) {
  const { playSound } = useAudio()
  const [isPersonaHovered, setIsPersonaHovered] = useState(false)
  const [showPersonaSwitch, setShowPersonaSwitch] = useState(false)

  useEffect(() => {
    if (isActive) {
      playSound('windowOpen')
    }
  }, [isActive, playSound])

  const handlePersonaClick = () => {
    if (!showMysticalSelector && !showPersonaSwitch) {
      // Click on center persona shows the hexagon selector
      setShowPersonaSwitch(true)
      playSound('click')
    }
  }

  const handlePersonaHover = () => {
    if (!showMysticalSelector && !showPersonaSwitch) {
      setIsPersonaHovered(true)
      playSound('hover')
    }
  }

  const handlePersonaUnhover = () => {
    setIsPersonaHovered(false)
  }

  const handlePersonaSelect = (newPersona: AIPersona) => {
    if (onPersonaSelect && newPersona.id !== persona.id) {
      // Select new persona, close selector and zoom back to center
      onPersonaSelect(newPersona)
      setShowPersonaSwitch(false)
      playSound('targetHit')
    }
  }

  const handleCloseSelector = () => {
    setShowPersonaSwitch(false)
    if (onCloseMysticalSelector) {
      onCloseMysticalSelector()
    }
  }

  const cameraPosition = (showMysticalSelector || showPersonaSwitch) ? [0, 3, 10] : [0, 0, 8]
  const cameraFov = (showMysticalSelector || showPersonaSwitch) ? 75 : 60

  return (
    <div className="persona-visualizer">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ 
          background: `linear-gradient(45deg, ${persona.theme.backgroundColor}00, ${persona.theme.accentColor}20)` 
        }}
      >
        {/* Camera Controller for smooth transitions */}
        <CameraController 
          targetPosition={cameraPosition}
          targetFov={cameraFov}
          duration={1.2}
        />
        
        <ambientLight intensity={0.4} />
        <spotLight 
          position={[2, 4, 3]} 
          intensity={0.6} 
          color={persona.avatar.primaryColor}
          angle={Math.PI / 6}
          penumbra={0.8}
          castShadow={false}
        />
        
        <GhostModel 
          persona={persona} 
          isActive={isActive} 
          isTyping={isTyping}
          onPersonaClick={handlePersonaClick}
          showMysticalSelector={showMysticalSelector || showPersonaSwitch}
          isHovered={isPersonaHovered}
          onPersonaHover={handlePersonaHover}
          onPersonaUnhover={handlePersonaUnhover}
        />
        
        {/* Visual hover indicator */}
        {isPersonaHovered && !showMysticalSelector && !showPersonaSwitch && (
          <>
            {/* Pulsing ring indicator */}
            <Float speed={4} floatIntensity={0.1}>
              <Torus args={[2.5, 0.05, 8, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
                <meshStandardMaterial 
                  color={persona.avatar.accentColor}
                  emissive={persona.avatar.accentColor}
                  emissiveIntensity={0.8}
                  transparent
                  opacity={0.6}
                />
              </Torus>
            </Float>
            
            {/* Click hint text */}
            <Text
              position={[0, -3, 0]}
              fontSize={0.25}
              color={persona.avatar.accentColor}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              Click to Switch Consciousness
            </Text>
          </>
        )}
        
        {/* Mystical Persona Selector */}
        {(showMysticalSelector || showPersonaSwitch) && (
          <MysticalPersonaSelector
            currentPersona={persona}
            onPersonaSelect={handlePersonaSelect}
            isVisible={showMysticalSelector || showPersonaSwitch}
            onClose={handleCloseSelector}
          />
        )}
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={isActive && !showMysticalSelector && !showPersonaSwitch}
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
          cursor: ${isPersonaHovered && !showMysticalSelector && !showPersonaSwitch ? 'pointer' : 'default'};
        }
      `}</style>
    </div>
  )
}