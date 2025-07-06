'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Box, Float } from '@react-three/drei'
import * as THREE from 'three'

interface CaseFileDisplayProps {
  position: [number, number, number]
  onCaseFileClick: () => void
}

export default function CaseFileDisplay({ position, onCaseFileClick }: CaseFileDisplayProps) {
  const meshRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const lastClickTime = useRef<number>(0)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.2
      
      // Hover effect - slight rotation
      if (hovered) {
        meshRef.current.rotation.y += 0.003
      } else {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
      }

      // Click effect - properly reset scale
      if (clicked) {
        meshRef.current.scale.setScalar(2.0 * 1.05) // Apply click scale to base scale
      } else {
        meshRef.current.scale.setScalar(hovered ? 2.0 * 1.02 : 2.0) // Reset to base scale with hover effect
      }
    }
  })

  const handleClick = (e: any) => {
    // Prevent event bubbling
    e.stopPropagation()
    
    // Debounce rapid clicks (prevent multiple clicks within 500ms)
    const now = Date.now()
    if (now - lastClickTime.current < 500) {
      return
    }
    lastClickTime.current = now
    
    setClicked(true)
    setTimeout(() => setClicked(false), 200)
    onCaseFileClick()
  }

  // Book colors for variety
  const bookColors = ['#8B4513', '#A0522D', '#CD853F', '#2F4F4F', '#191970', '#8B0000', '#556B2F', '#483D8B']
  const bookHeights = [1.8, 1.6, 1.9, 1.7, 1.5, 1.8, 1.6, 1.9]

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
        scale={1}
      >
        {/* Bookshelf frame */}
        {/* Back panel */}
        <Box args={[4, 5, 0.2]} position={[0, 0, -0.4]}>
          <meshPhongMaterial color="#654321" />
        </Box>
        
        {/* Top shelf */}
        <Box args={[4, 0.2, 1]} position={[0, 2.5, 0]}>
          <meshPhongMaterial color="#654321" />
        </Box>
        
        {/* Middle shelf */}
        <Box args={[4, 0.2, 1]} position={[0, 0.5, 0]}>
          <meshPhongMaterial color="#654321" />
        </Box>
        
        {/* Bottom shelf */}
        <Box args={[4, 0.2, 1]} position={[0, -1.5, 0]}>
          <meshPhongMaterial color="#654321" />
        </Box>
        
        {/* Side panels */}
        <Box args={[0.2, 5, 1]} position={[-2, 0, 0]}>
          <meshPhongMaterial color="#654321" />
        </Box>
        <Box args={[0.2, 5, 1]} position={[2, 0, 0]}>
          <meshPhongMaterial color="#654321" />
        </Box>

        {/* Top row of books */}
        {bookColors.slice(0, 8).map((color, i) => (
          <Box 
            key={`top-${i}`} 
            args={[0.3, bookHeights[i], 0.8]} 
            position={[-1.7 + i * 0.45, 1.5, 0]}
          >
            <meshPhongMaterial 
              color={color} 
              emissive={hovered ? color : '#000000'}
              emissiveIntensity={hovered ? 0.2 : 0}
            />
          </Box>
        ))}

        {/* Middle row - case files */}
        <Box args={[1.2, 1.5, 0.8]} position={[-1, -0.5, 0]}>
          <meshPhongMaterial 
            color="#8B0000" 
            emissive={hovered ? '#440000' : '#000000'}
          />
        </Box>
        <Box args={[1.2, 1.5, 0.8]} position={[0.3, -0.5, 0]}>
          <meshPhongMaterial 
            color="#8B0000" 
            emissive={hovered ? '#440000' : '#000000'}
          />
        </Box>
        
        {/* Label on middle case file */}
        <Text
          position={[0.3, -0.5, 0.5]}
          fontSize={0.15}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
        >
          CLASSIFIED
        </Text>

        {/* Bottom row of books */}
        {bookColors.slice(0, 6).map((color, i) => (
          <Box 
            key={`bottom-${i}`} 
            args={[0.35, bookHeights[i] * 0.9, 0.8]} 
            position={[-1.5 + i * 0.5, -2.5, 0]}
          >
            <meshPhongMaterial 
              color={color} 
              emissive={hovered ? color : '#000000'}
              emissiveIntensity={hovered ? 0.2 : 0}
            />
          </Box>
        ))}

        {/* Main label */}
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.3}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          CASE FILES
        </Text>
        
        <Text
          position={[0, -3.2, 0]}
          fontSize={0.2}
          color={hovered ? "#FFD700" : "#999999"}
          anchorX="center"
          anchorY="middle"
        >
          {hovered ? "CLICK TO read" : "ARCHIVE"}
        </Text>

        {/* Subtle glow effect when hovered */}
        {hovered && (
          <pointLight
            position={[0, 0, 2]}
            color="#FFD700"
            intensity={1.5}
            distance={10}
            decay={2}
          />
        )}
      </group>
    </Float>
  )
}