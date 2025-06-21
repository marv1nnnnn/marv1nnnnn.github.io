'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Ring, Torus, Octahedron, Tetrahedron, Cylinder, Sphere, Line } from '@react-three/drei'
import { AIPersona } from '@/types/personas'
import { AI_PERSONAS } from '@/config/personas'
import { useAudio } from '@/contexts/AudioContext'
import { Group, Vector3 } from 'three'
import * as THREE from 'three'

interface MysticalPersonaSelectorProps {
  currentPersona: AIPersona
  onPersonaSelect: (persona: AIPersona) => void
  isVisible: boolean
  onClose: () => void
}

interface MysticalSymbolProps {
  persona: AIPersona
  position: [number, number, number]
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onHover: () => void
  onUnhover: () => void
}

function MysticalSymbol({ 
  persona, 
  position, 
  isSelected, 
  isHovered, 
  onClick, 
  onHover, 
  onUnhover 
}: MysticalSymbolProps) {
  const groupRef = useRef<Group>(null)
  const particlesRef = useRef<Group>(null)
  
  const scale = isSelected ? 1.5 : isHovered ? 1.2 : 1
  const intensity = isSelected ? 0.8 : isHovered ? 0.6 : 0.4
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle floating rotation
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.3
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
    
    if (particlesRef.current) {
      // Particle effects rotation
      particlesRef.current.rotation.x = clock.getElapsedTime() * 0.1
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.15
    }
  })

  const renderPersonaSymbol = () => {
    const commonMaterial = {
      color: persona.avatar.primaryColor,
      transparent: true,
      opacity: intensity,
      emissive: persona.avatar.primaryColor,
      emissiveIntensity: intensity * 0.5
    }

    switch (persona.id) {
      case 'ghost':
        // Ethereal floating rings
        return (
          <>
            <Ring args={[0.8, 1.2, 32]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Ring>
            <Ring args={[0.5, 0.7, 16]} rotation={[0, 0, 0]} position={[0, 0, 0.2]}>
              <meshStandardMaterial {...commonMaterial} opacity={intensity * 0.7} />
            </Ring>
            <Ring args={[0.3, 0.4, 8]} rotation={[Math.PI / 4, 0, 0]} position={[0, 0, -0.2]}>
              <meshStandardMaterial {...commonMaterial} opacity={intensity * 0.5} />
            </Ring>
          </>
        )
      
      case 'goth':
        // Gothic cross with thorns
        return (
          <>
            <Cylinder args={[0.05, 0.05, 2]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>
            <Cylinder args={[0.05, 0.05, 1.2]} rotation={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>
            {/* Thorn decorations */}
            {[0, 1, 2, 3].map(i => (
              <Tetrahedron key={i} args={[0.1]} position={[
                Math.cos(i * Math.PI / 2) * 0.8,
                Math.sin(i * Math.PI / 2) * 0.8,
                0
              ]}>
                <meshStandardMaterial color={persona.avatar.accentColor} {...commonMaterial} />
              </Tetrahedron>
            ))}
          </>
        )
      
      case 'nerd':
        // Digital hexagon matrix
        return (
          <>
            <Ring args={[0.6, 0.8, 6]} rotation={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} wireframe />
            </Ring>
            <Ring args={[0.3, 0.5, 6]} rotation={[0, 0, Math.PI / 6]} position={[0, 0, 0.1]}>
              <meshStandardMaterial {...commonMaterial} />
            </Ring>
            <Octahedron args={[0.15]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} emissiveIntensity={0.8} />
            </Octahedron>
          </>
        )
      
      case 'poet':
        // Flowing spiral of inspiration
        return (
          <>
            <Torus args={[0.8, 0.08, 8, 32]} rotation={[Math.PI / 4, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Torus>
            <Torus args={[0.5, 0.05, 6, 24]} rotation={[-Math.PI / 4, 0, Math.PI / 3]} position={[0, 0, 0.2]}>
              <meshStandardMaterial {...commonMaterial} opacity={intensity * 0.8} />
            </Torus>
            <Sphere args={[0.1]} position={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} emissiveIntensity={1} />
            </Sphere>
          </>
        )
      
      case 'conspiracy':
        // All-seeing eye pyramid
        return (
          <>
            <Tetrahedron args={[0.8]} rotation={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} wireframe />
            </Tetrahedron>
            <Ring args={[0.2, 0.3, 16]} rotation={[0, 0, 0]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color={persona.avatar.accentColor} {...commonMaterial} />
            </Ring>
            <Sphere args={[0.1]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color={persona.avatar.accentColor} emissive={persona.avatar.accentColor} emissiveIntensity={1} />
            </Sphere>
          </>
        )
      
      case 'assassin':
        // Menacing blade configuration
        return (
          <>
            {/* Cross blades */}
            <Cylinder args={[0.02, 0.08, 1.5]} rotation={[0, 0, Math.PI / 4]}>
              <meshStandardMaterial {...commonMaterial} metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.02, 0.08, 1.5]} rotation={[0, 0, -Math.PI / 4]}>
              <meshStandardMaterial {...commonMaterial} metalness={0.8} roughness={0.2} />
            </Cylinder>
            <Ring args={[0.4, 0.6, 8]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color={persona.avatar.accentColor} {...commonMaterial} />
            </Ring>
          </>
        )
      
      case 'detective':
        // Magnifying glass and deduction symbols
        return (
          <>
            <Ring args={[0.6, 0.8, 32]} rotation={[0, 0, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Ring>
            <Cylinder args={[0.03, 0.03, 0.8]} rotation={[0, 0, Math.PI / 4]} position={[0.5, -0.5, 0]}>
              <meshStandardMaterial {...commonMaterial} />
            </Cylinder>
            {/* Evidence markers */}
            {[0, 1, 2].map(i => (
              <Sphere key={i} args={[0.05]} position={[
                Math.cos(i * Math.PI * 2 / 3) * 0.4,
                Math.sin(i * Math.PI * 2 / 3) * 0.4,
                0
              ]}>
                <meshStandardMaterial color={persona.avatar.accentColor} emissive={persona.avatar.accentColor} emissiveIntensity={0.8} />
              </Sphere>
            ))}
          </>
        )
      
      default:
        return null
    }
  }

  const renderParticleEffects = () => {
    if (!isHovered && !isSelected) return null
    
    return (
      <group ref={particlesRef}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const radius = 1.5 + Math.sin(Date.now() * 0.001 + i) * 0.3
          return (
            <Sphere
              key={i}
              args={[0.02]}
              position={[
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                Math.sin(Date.now() * 0.002 + i) * 0.5
              ]}
            >
              <meshStandardMaterial
                color={persona.avatar.accentColor}
                emissive={persona.avatar.accentColor}
                emissiveIntensity={0.8}
                transparent
                opacity={0.7}
              />
            </Sphere>
          )
        })}
      </group>
    )
  }

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group
        ref={groupRef}
        position={position}
        scale={[scale, scale, scale]}
        onClick={onClick}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        {renderPersonaSymbol()}
        {renderParticleEffects()}
        
        {/* Persona name label */}
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.2}
          color={isSelected ? persona.avatar.accentColor : persona.avatar.primaryColor}
          anchorX="center"
          anchorY="middle"
          fontWeight={isSelected ? "bold" : "normal"}
        >
          {persona.displayName}
        </Text>
        
        {/* Selection aura */}
        {isSelected && (
          <Ring args={[1.2, 1.5, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <meshStandardMaterial
              color={persona.avatar.accentColor}
              emissive={persona.avatar.accentColor}
              emissiveIntensity={0.6}
              transparent
              opacity={0.4}
            />
          </Ring>
        )}
      </group>
    </Float>
  )
}

export default function MysticalPersonaSelector({
  currentPersona,
  onPersonaSelect,
  isVisible,
  onClose
}: MysticalPersonaSelectorProps) {
  const [hoveredPersona, setHoveredPersona] = useState<string | null>(null)
  const { playSound } = useAudio()
  const selectorRef = useRef<Group>(null)

  useEffect(() => {
    if (isVisible) {
      playSound('windowOpen')
    }
  }, [isVisible, playSound])

  const handlePersonaClick = (persona: AIPersona) => {
    if (persona.id === currentPersona.id) {
      // Click on center persona - go back to solo view
      onClose()
      playSound('click')
    } else {
      // Click on outer persona - select it
      onPersonaSelect(persona)
      playSound('targetHit')
      onClose()
    }
  }

  const handlePersonaHover = (personaId: string) => {
    setHoveredPersona(personaId)
    playSound('hover')
  }

  const handlePersonaUnhover = () => {
    setHoveredPersona(null)
  }

  // Position personas in a hexagon with current persona in center
  const getPersonaPosition = (persona: AIPersona, index: number): [number, number, number] => {
    if (persona.id === currentPersona.id) {
      // Current persona in center
      return [0, 0, 0]
    }
    
    // Other personas in hexagon around center
    const otherPersonas = AI_PERSONAS.filter(p => p.id !== currentPersona.id)
    const personaIndex = otherPersonas.findIndex(p => p.id === persona.id)
    const angle = (personaIndex / otherPersonas.length) * Math.PI * 2
    const radius = 4
    
    return [
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    ]
  }

  if (!isVisible) return null

  return (
    <group ref={selectorRef}>
      {/* Mystical ambient lighting */}
      <pointLight
        position={[0, 5, 0]}
        intensity={0.5}
        color={currentPersona.avatar.primaryColor}
        distance={15}
      />
      <pointLight
        position={[0, -5, 0]}
        intensity={0.3}
        color={currentPersona.avatar.accentColor}
        distance={10}
      />
      
      {/* All persona symbols in hexagon arrangement */}
      {AI_PERSONAS.map((persona, index) => (
        <MysticalSymbol
          key={persona.id}
          persona={persona}
          position={getPersonaPosition(persona, index)}
          isSelected={persona.id === currentPersona.id}
          isHovered={hoveredPersona === persona.id}
          onClick={() => handlePersonaClick(persona)}
          onHover={() => handlePersonaHover(persona.id)}
          onUnhover={handlePersonaUnhover}
        />
      ))}
      
      {/* Hexagon connection lines between outer personas */}
      {isVisible && AI_PERSONAS.filter(p => p.id !== currentPersona.id).map((persona, index, otherPersonas) => {
        const currentPos = getPersonaPosition(persona, index)
        const nextIndex = (index + 1) % otherPersonas.length
        const nextPersona = otherPersonas[nextIndex]
        const nextPos = getPersonaPosition(nextPersona, nextIndex)
        
        return (
          <Line
            key={`hexagon-line-${index}`}
            points={[currentPos, nextPos]}
            color={currentPersona.avatar.primaryColor}
            transparent
            opacity={0.3}
            lineWidth={1}
          />
        )
      })}
      
      {/* Lines from center to each outer persona */}
      {isVisible && AI_PERSONAS.filter(p => p.id !== currentPersona.id).map((persona, index) => {
        const personaPos = getPersonaPosition(persona, index)
        
        return (
          <Line
            key={`center-line-${index}`}
            points={[[0, 0, 0], personaPos]}
            color={currentPersona.avatar.accentColor}
            transparent
            opacity={0.2}
            lineWidth={1}
          />
        )
      })}
    </group>
  )
}