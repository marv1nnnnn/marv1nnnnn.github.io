'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Box, Cylinder, Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface SuitcaseDisplayProps {
  position: [number, number, number]
  onSuitcaseClick: () => void
}

export default function SuitcaseDisplay({ position, onSuitcaseClick }: SuitcaseDisplayProps) {
  const meshRef = useRef<THREE.Group>(null!)
  const cassetteRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const lastClickTime = useRef<number>(0)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7) * 0.15
      
      // Subtle hover effect
      if (hovered) {
        meshRef.current.rotation.y += 0.004
      } else {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.03
      }

      // Click effect - properly reset scale
      if (clicked) {
        meshRef.current.scale.setScalar(2.5 * 1.05) // Apply click scale to base scale
      } else {
        meshRef.current.scale.setScalar(hovered ? 2.5 * 1.02 : 2.5) // Reset to base scale with hover effect
      }
    }

    // Animate cassette reels when hovered
    if (cassetteRef.current && hovered) {
      cassetteRef.current.rotation.z += 0.08
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
    onSuitcaseClick()
  }

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
      <group
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
        scale={1}
      >
        {/* Main suitcase body */}
        <RoundedBox args={[3, 2, 0.8]} radius={0.1} position={[0, 0, 0]}>
          <meshPhongMaterial 
            color={hovered ? "#8B4513" : "#654321"} 
            emissive={hovered ? "#221100" : "#000000"}
          />
        </RoundedBox>
        
        {/* Suitcase lid edge/rim */}
        <Box args={[3.1, 0.1, 0.9]} position={[0, 0.05, 0]}>
          <meshPhongMaterial color="#4B3C2A" />
        </Box>
        
        {/* Metal corners */}
        {[[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]].map((pos, i) => (
          <Box key={i} args={[0.2, 0.2, 0.15]} position={[pos[0], pos[1], 0.45]}>
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
          </Box>
        ))}
        
        {/* Handle */}
        <group position={[0, 1.1, 0]}>
          <Cylinder args={[0.05, 0.05, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#2F2F2F" />
          </Cylinder>
          {/* Handle grips */}
          <Box args={[0.4, 0.15, 0.15]} position={[0, 0, 0]}>
            <meshPhongMaterial color="#1C1C1C" />
          </Box>
        </group>
        
        {/* Metal latches */}
        <Box args={[0.3, 0.2, 0.1]} position={[-0.9, 0, 0.5]}>
          <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.3} />
        </Box>
        <Box args={[0.3, 0.2, 0.1]} position={[0.9, 0, 0.5]}>
          <meshStandardMaterial color="#FFD700" metalness={0.7} roughness={0.3} />
        </Box>
        
        {/* Cassette player window - integrated into suitcase */}
        <group position={[0, 0.3, 0.45]}>
          {/* Player window frame */}
          <Box args={[1.8, 1, 0.05]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#1C1C1C" />
          </Box>
          
          {/* Glass window */}
          <Box args={[1.6, 0.8, 0.02]} position={[0, 0, 0.02]}>
            <meshStandardMaterial color="#000000" transparent opacity={0.7} />
          </Box>
          
          {/* Cassette tape visible through window */}
          <group ref={cassetteRef} position={[0, 0, -0.05]}>
            <Box args={[1.2, 0.6, 0.1]} position={[0, 0, 0]}>
              <meshStandardMaterial color={hovered ? "#CC0000" : "#333333"} />
            </Box>
            
            {/* Cassette reels */}
            <Cylinder args={[0.15, 0.15, 0.05]} position={[-0.35, 0, 0.05]}>
              <meshStandardMaterial color="#222222" />
            </Cylinder>
            <Cylinder args={[0.15, 0.15, 0.05]} position={[0.35, 0, 0.05]}>
              <meshStandardMaterial color="#222222" />
            </Cylinder>
          </group>
        </group>
        
        {/* Control buttons panel */}
        <group position={[0, -0.5, 0.45]}>
          <Box args={[2, 0.4, 0.05]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#2C2C2C" />
          </Box>
          
          {/* Individual buttons */}
          {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
            <Cylinder key={i} args={[0.08, 0.08, 0.05]} position={[x, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial 
                color={i === 2 && hovered ? "#00FF00" : "#444444"} 
                emissive={i === 2 && hovered ? "#003300" : "#000000"}
              />
            </Cylinder>
          ))}
        </group>
        
        {/* Speaker grilles */}
        <group position={[-1.1, -0.5, 0.45]}>
          <Cylinder args={[0.25, 0.25, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1C1C1C" />
          </Cylinder>
          <Cylinder args={[0.2, 0.2, 0.06]} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <meshPhongMaterial color="#333333" />
          </Cylinder>
        </group>
        
        <group position={[1.1, -0.5, 0.45]}>
          <Cylinder args={[0.25, 0.25, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1C1C1C" />
          </Cylinder>
          <Cylinder args={[0.2, 0.2, 0.06]} position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <meshPhongMaterial color="#333333" />
          </Cylinder>
        </group>
        
        {/* Travel stickers/decals */}
        <Box args={[0.5, 0.3, 0.01]} position={[-0.8, 0.5, 0.41]} rotation={[0, 0, 0.1]}>
          <meshStandardMaterial color="#FF6B6B" />
        </Box>
        <Box args={[0.4, 0.4, 0.01]} position={[0.7, -0.3, 0.41]} rotation={[0, 0, -0.15]}>
          <meshStandardMaterial color="#4ECDC4" />
        </Box>
        
        {/* Labels */}
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.25}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          CATHERINE'S SUITCASE
        </Text>
        
        <Text
          position={[0, -1.3, 0]}
          fontSize={0.18}
          color={hovered ? "#FFD700" : "#999999"}
          anchorX="center"
          anchorY="middle"
        >
          {hovered ? "[CLICK TO PLAY]" : "MUSIC PLAYER"}
        </Text>

        {/* Musical note particles when hovered */}
        {hovered && (
          <>
            {['♪', '♫'].map((note, i) => (
              <Text
                key={i}
                position={[
                  Math.sin(Date.now() * 0.002 + i * 3) * 1.2,
                  Math.sin(Date.now() * 0.003 + i * 2) * 0.5 + 0.3,
                  0.5
                ]}
                fontSize={0.25}
                color="#FFD700"
                anchorX="center"
                anchorY="middle"
              >
                {note}
              </Text>
            ))}
          </>
        )}
        
        {/* Subtle hover lighting */}
        {hovered && (
          <pointLight
            position={[0, 0, 2]}
            color="#FFA500"
            intensity={1.2}
            distance={8}
            decay={2}
          />
        )}
      </group>
    </Float>
  )
}