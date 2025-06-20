'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, Box, Sphere, Torus } from '@react-three/drei'
import { AIPersona } from '@/types/personas'
import { AI_PERSONAS } from '@/config/personas'
import { useAudio } from '@/contexts/AudioContext'
import { Group, Vector3 } from 'three'
import gsap from 'gsap'

interface PersonaSelectorProps {
  currentPersona: AIPersona
  onPersonaSelect: (persona: AIPersona) => void
  isVisible: boolean
  onClose: () => void
}

function PersonaRing({ 
  personas, 
  currentPersona, 
  onPersonaSelect,
  hoveredIndex,
  setHoveredIndex 
}: {
  personas: AIPersona[]
  currentPersona: AIPersona
  onPersonaSelect: (persona: AIPersona) => void
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
}) {
  const groupRef = useRef<Group>(null)
  const { playSound } = useAudio()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  const handlePersonaClick = (persona: AIPersona, index: number) => {
    if (persona.id !== currentPersona.id) {
      onPersonaSelect(persona)
      playSound('targetHit')
    }
  }

  const handlePersonaHover = (index: number) => {
    setHoveredIndex(index)
    playSound('hover')
  }

  return (
    <group ref={groupRef}>
      {personas.map((persona, index) => {
        const angle = (index / personas.length) * Math.PI * 2
        const radius = 4
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const isSelected = persona.id === currentPersona.id
        const isHovered = hoveredIndex === index
        const scale = isSelected ? 1.5 : isHovered ? 1.2 : 1

        return (
          <group key={persona.id} position={[x, 0, z]}>
            {/* Persona Avatar */}
            <group
              scale={[scale, scale, scale]}
              onClick={() => handlePersonaClick(persona, index)}
              onPointerOver={() => handlePersonaHover(index)}
              onPointerOut={() => setHoveredIndex(null)}
            >
              {persona.avatar.model === 'ghost' && (
                <Sphere args={[0.5, 16, 16]}>
                  <meshStandardMaterial
                    color={persona.avatar.primaryColor}
                    transparent
                    opacity={isSelected ? 1 : 0.7}
                    emissive={persona.avatar.primaryColor}
                    emissiveIntensity={isSelected ? 0.3 : 0.1}
                  />
                </Sphere>
              )}
              
              {persona.avatar.model === 'figure' && (
                <>
                  <Box args={[0.4, 0.8, 0.2]}>
                    <meshStandardMaterial
                      color={persona.avatar.primaryColor}
                      transparent
                      opacity={isSelected ? 1 : 0.7}
                      metalness={0.6}
                      roughness={0.3}
                    />
                  </Box>
                  <Sphere args={[0.2, 12, 12]} position={[0, 0.6, 0]}>
                    <meshStandardMaterial
                      color={persona.avatar.secondaryColor}
                      transparent
                      opacity={isSelected ? 1 : 0.7}
                    />
                  </Sphere>
                </>
              )}
              
              {persona.avatar.model === 'geometric' && (
                <Box args={[0.5, 0.5, 0.5]} rotation={[0.5, 0.5, 0]}>
                  <meshStandardMaterial
                    color={persona.avatar.primaryColor}
                    transparent
                    opacity={isSelected ? 1 : 0.7}
                    wireframe={true}
                  />
                </Box>
              )}
              
              {persona.avatar.model === 'abstract' && (
                <Torus args={[0.4, 0.15, 6, 12]}>
                  <meshStandardMaterial
                    color={persona.avatar.primaryColor}
                    transparent
                    opacity={isSelected ? 1 : 0.7}
                    emissive={persona.avatar.accentColor}
                    emissiveIntensity={isSelected ? 0.4 : 0.2}
                  />
                </Torus>
              )}
            </group>

            {/* Persona Name */}
            <Text
              position={[0, -1.2, 0]}
              fontSize={0.3}
              color={isSelected ? persona.theme.accentColor : persona.theme.textColor}
              anchorX="center"
              anchorY="middle"
              fontWeight={isSelected ? "bold" : "normal"}
            >
              {persona.displayName}
            </Text>

            {/* Selection Indicator */}
            {isSelected && (
              <Torus args={[0.8, 0.05, 8, 16]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial
                  color={persona.theme.accentColor}
                  emissive={persona.theme.accentColor}
                  emissiveIntensity={0.5}
                />
              </Torus>
            )}
          </group>
        )
      })}
    </group>
  )
}

export default function PersonaSelector({ 
  currentPersona, 
  onPersonaSelect, 
  isVisible, 
  onClose 
}: PersonaSelectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { playSound } = useAudio()
  const selectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && selectorRef.current) {
      gsap.fromTo(selectorRef.current,
        { 
          opacity: 0,
          scale: 0.8,
          y: 100 
        },
        { 
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out"
        }
      )
      playSound('windowOpen')
    }
  }, [isVisible, playSound])

  const handleClose = () => {
    if (selectorRef.current) {
      gsap.to(selectorRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 100,
        duration: 0.5,
        ease: "power2.in",
        onComplete: onClose
      })
    }
    playSound('windowClose')
  }

  if (!isVisible) return null

  return (
    <div className="persona-selector-overlay" ref={selectorRef}>
      <div className="selector-container">
        <div className="selector-header">
          <h2>Select Consciousness</h2>
          <button className="close-button" onClick={handleClose}>
            ✕
          </button>
        </div>
        
        <div className="selector-canvas">
          <Canvas
            camera={{ position: [0, 2, 8], fov: 60 }}
            style={{ background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)' }}
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#666666" />
            
            <PersonaRing
              personas={AI_PERSONAS}
              currentPersona={currentPersona}
              onPersonaSelect={onPersonaSelect}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
            />
          </Canvas>
        </div>

        <div className="selector-info">
          {hoveredIndex !== null && (
            <div className="persona-details">
              <h3>{AI_PERSONAS[hoveredIndex].displayName}</h3>
              <p>{AI_PERSONAS[hoveredIndex].description}</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .persona-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .selector-container {
          width: 90vw;
          height: 80vh;
          max-width: 1200px;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 2px solid #cccc66;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #333;
          background: rgba(0, 0, 0, 0.5);
        }

        .selector-header h2 {
          color: #cccc66;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .close-button {
          background: none;
          border: 1px solid #cccc66;
          color: #cccc66;
          font-size: 18px;
          font-weight: bold;
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: #cccc66;
          color: #000000;
          transform: scale(1.1);
        }

        .selector-canvas {
          flex: 1;
          position: relative;
        }

        .selector-info {
          height: 80px;
          padding: 16px 24px;
          border-top: 1px solid #333;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .persona-details {
          text-align: center;
          color: #cccccc;
          font-family: 'Courier New', monospace;
        }

        .persona-details h3 {
          color: #cccc66;
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .persona-details p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }
      `}</style>
    </div>
  )
}