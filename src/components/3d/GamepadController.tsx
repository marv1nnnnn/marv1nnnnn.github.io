'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Box, Cylinder, Float, RoundedBox } from '@react-three/drei'
import { useAudio } from '@/contexts/AudioContext'
import * as THREE from 'three'

interface GamepadControllerProps {
  position?: [number, number, number]
  onControllerClick?: () => void
}

export default function GamepadController({ 
  position = [-25, 10, 15], 
  onControllerClick 
}: GamepadControllerProps) {
  const { playSound } = useAudio()
  const meshRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7) * 0.15
      
      // Subtle hover effect
      if (hovered) {
        meshRef.current.rotation.y += 0.003
      } else {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
      }

      // Click effect - properly reset scale
      if (clicked) {
        meshRef.current.scale.setScalar(2.2 * 1.05) // Apply click scale to base scale
      } else {
        meshRef.current.scale.setScalar(hovered ? 2.2 * 1.02 : 2.2) // Reset to base scale with hover effect
      }
    }
  })

  const handleClick = () => {
    setClicked(true)
    setTimeout(() => setClicked(false), 200)
    playSound('click')
    onControllerClick?.()
  }

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group
        ref={meshRef}
        position={position}
        onPointerOver={() => {
          setHovered(true)
          playSound('hover')
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
        scale={1}
      >
        {/* Main controller body */}
        <RoundedBox args={[4, 2, 1]} radius={0.2} position={[0, 0, 0]}>
          <meshPhongMaterial 
            color={hovered ? "#4A5568" : "#2D3748"} 
            emissive={hovered ? "#1A1A1A" : "#000000"}
          />
        </RoundedBox>
        
        {/* Controller grips */}
        <RoundedBox args={[1.2, 2.5, 0.8]} radius={0.15} position={[-1.8, -0.8, 0]}>
          <meshPhongMaterial color={hovered ? "#4A5568" : "#2D3748"} />
        </RoundedBox>
        
        <RoundedBox args={[1.2, 2.5, 0.8]} radius={0.15} position={[1.8, -0.8, 0]}>
          <meshPhongMaterial color={hovered ? "#4A5568" : "#2D3748"} />
        </RoundedBox>

        {/* Left analog stick */}
        <group position={[-1.2, 0.3, 0.6]}>
          <Cylinder args={[0.4, 0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1A202C" />
          </Cylinder>
          <Cylinder args={[0.25, 0.25, 0.3]} position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <meshPhongMaterial color="#4A5568" />
          </Cylinder>
        </group>

        {/* Right analog stick */}
        <group position={[1.2, -0.3, 0.6]}>
          <Cylinder args={[0.4, 0.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1A202C" />
          </Cylinder>
          <Cylinder args={[0.25, 0.25, 0.3]} position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <meshPhongMaterial color="#4A5568" />
          </Cylinder>
        </group>

        {/* D-pad */}
        <group position={[-1.2, 0.3, 0.6]}>
          <Box args={[0.8, 0.15, 0.1]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#718096" />
          </Box>
          <Box args={[0.15, 0.8, 0.1]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#718096" />
          </Box>
        </group>

        {/* Face buttons */}
        <group position={[1.2, 0.3, 0.6]}>
          {/* Y button (top) */}
          <Cylinder args={[0.15, 0.15, 0.1]} position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={clicked ? "#F6E05E" : "#ECC94B"} />
          </Cylinder>
          
          {/* B button (right) */}
          <Cylinder args={[0.15, 0.15, 0.1]} position={[0.35, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={clicked ? "#FC8181" : "#F56565"} />
          </Cylinder>
          
          {/* A button (bottom) */}
          <Cylinder args={[0.15, 0.15, 0.1]} position={[0, -0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={clicked ? "#68D391" : "#48BB78"} />
          </Cylinder>
          
          {/* X button (left) */}
          <Cylinder args={[0.15, 0.15, 0.1]} position={[-0.35, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={clicked ? "#63B3ED" : "#4299E1"} />
          </Cylinder>
        </group>

        {/* Shoulder buttons */}
        <Box args={[0.6, 0.3, 0.4]} position={[-1.8, 0.8, -0.2]}>
          <meshStandardMaterial color="#718096" metalness={0.3} roughness={0.7} />
        </Box>
        
        <Box args={[0.6, 0.3, 0.4]} position={[1.8, 0.8, -0.2]}>
          <meshStandardMaterial color="#718096" metalness={0.3} roughness={0.7} />
        </Box>

        {/* Center button/logo area */}
        <Cylinder args={[0.2, 0.2, 0.05]} position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color={hovered ? "#E2E8F0" : "#CBD5E0"} 
            metalness={0.5} 
            roughness={0.3} 
          />
        </Cylinder>

        {/* USB port detail */}
        <Box args={[0.4, 0.1, 0.05]} position={[0, -0.9, 0]}>
          <meshStandardMaterial color="#1A202C" />
        </Box>
        
        {/* Labels */}
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.25}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          GAME CONTROLLER
        </Text>
        
        <Text
          position={[0, -1.8, 0]}
          fontSize={0.18}
          color={hovered ? "#FFD700" : "#999999"}
          anchorX="center"
          anchorY="middle"
        >
          {hovered ? "[CLICK TO CONTROL]" : "WIRELESS"}
        </Text>

        {/* Connection indicator when hovered */}
        {hovered && (
          <>
            <Cylinder args={[0.05, 0.05, 0.3]} position={[0.8, 0.5, 0.6]} rotation={[0, 0, Math.PI / 4]}>
              <meshStandardMaterial color="#48BB78" emissive="#22543D" />
            </Cylinder>
            <Text
              position={[1.1, 0.7, 0.6]}
              fontSize={0.12}
              color="#FFD700"
              anchorX="center"
              anchorY="middle"
            >
              CONNECTED
            </Text>
          </>
        )}
        
        {/* Subtle hover lighting */}
        {hovered && (
          <pointLight
            position={[0, 0, 2]}
            color="#E2E8F0"
            intensity={1.0}
            distance={8}
            decay={2}
          />
        )}
      </group>
    </Float>
  )
}