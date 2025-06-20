'use client'

import { Suspense, useMemo, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { AIPersona } from '@/types/personas'
import Persona3D from '@/components/3d/Persona3D'
import * as THREE from 'three'

interface PersonaVisualizerProps {
  persona: AIPersona
  visible?: boolean
  className?: string
}

// Custom hook for hover effects
function useHoverEffects() {
  const [isHovered, setIsHovered] = useState(false)
  const [hoverIntensity, setHoverIntensity] = useState(0)

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  // Smooth transition for hover intensity
  useMemo(() => {
    let animationFrame: number
    
    const animate = () => {
      setHoverIntensity(prev => {
        const target = isHovered ? 1 : 0
        const diff = target - prev
        const step = diff * 0.1 // Smooth easing
        
        if (Math.abs(diff) > 0.01) {
          animationFrame = requestAnimationFrame(animate)
          return prev + step
        }
        return target
      })
    }
    
    animate()
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isHovered])

  return {
    isHovered,
    hoverIntensity,
    handlePointerEnter,
    handlePointerLeave
  }
}

// Cosmic starfield background component
function CosmicStarfield() {
  return (
    <>
      {/* Multiple star layers for depth */}
      <Stars
        radius={800}
        depth={100}
        count={2000}
        factor={6}
        saturation={0}
        fade
        speed={0.5}
      />
      <Stars
        radius={400}
        depth={50}
        count={1000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.3}
      />
      <Stars
        radius={200}
        depth={20}
        count={500}
        factor={2}
        saturation={0.4}
        fade
        speed={0.1}
      />
    </>
  )
}

// NGE-inspired dramatic lighting setup
function DramaticLighting({ persona }: { persona: AIPersona }) {
  const lightColor = useMemo(() => {
    const color = new THREE.Color(persona.avatar.primaryColor || '#ffffff')
    color.multiplyScalar(0.8)
    return color
  }, [persona.avatar.primaryColor])

  return (
    <>
      {/* Primary dramatic light - high contrast */}
      <directionalLight
        position={[-100, 200, 100]}
        intensity={2.0}
        color={lightColor}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0001}
      />
      
      {/* Secondary fill light - opposite angle */}
      <directionalLight
        position={[80, -150, -80]}
        intensity={0.3}
        color={persona.avatar.accentColor || '#ffffff'}
      />
      
      {/* Dramatic rim lighting */}
      <directionalLight
        position={[0, 0, -300]}
        intensity={0.8}
        color="#ffffff"
      />
      
      {/* Very minimal ambient for deep shadows */}
      <ambientLight intensity={0.02} color="#1a1a2e" />
      
      {/* Point light for persona accent */}
      <pointLight
        position={[0, 100, -100]}
        intensity={0.5}
        color={persona.avatar.accentColor || '#ffffff'}
        distance={400}
        decay={2}
      />
    </>
  )
}

// Loading fallback
function PersonaLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90">
      <div className="text-white text-sm font-mono animate-pulse">
        Materializing consciousness...
      </div>
    </div>
  )
}

export default function PersonaVisualizer({ 
  persona, 
  visible = true,
  className = ""
}: PersonaVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isHovered, hoverIntensity, handlePointerEnter, handlePointerLeave } = useHoverEffects()

  // Scale for prominent foreground presence
  const massiveScale = useMemo(() => {
    // Different scales based on persona type for variety - reduced for closer positioning
    switch (persona.id) {
      case 'ghost':
        return 3.5 // Pallid Monolith - prominent but not overwhelming
      case 'acid_angel':
        return 3.0 // Geometric Angel - crystalline presence
      case 'floating_head':
        return 4.0 // Crimson Drifter - most ethereal and large
      default:
        return 3.2
    }
  }, [persona.id])

  // Positioning for dramatic close-up presence
  const monumentalPosition: [number, number, number] = useMemo(() => [
    0, 
    0, // Centered on camera level
    -10 // Very close to camera for prominent foreground display
  ], [])

  if (!visible) {
    return null
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 0, 0],
          fov: 45,
          near: 0.1,
          far: 2000
        }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          shadowMapType: THREE.PCFSoftShadowMap,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        style={{
          background: 'transparent',
          pointerEvents: visible ? 'auto' : 'none'
        }}
      >
        <Suspense fallback={null}>
          {/* Cosmic background */}
          <CosmicStarfield />
          
          {/* NGE-inspired dramatic lighting */}
          <DramaticLighting persona={persona} />
          
          {/* Massive-scale persona */}
          <Persona3D
            persona={persona}
            position={monumentalPosition}
            scale={massiveScale}
            isHovered={isHovered}
            hoverIntensity={hoverIntensity}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          />
          
          {/* Subtle camera controls for immersion */}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.1}
            maxPolarAngle={Math.PI * 0.6}
            minPolarAngle={Math.PI * 0.4}
            rotateSpeed={0.2}
          />
        </Suspense>
      </Canvas>
      
      {/* Loading overlay */}
      <Suspense fallback={<PersonaLoader />}>
        <div />
      </Suspense>
      
      {/* Atmospheric overlay effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 20%, ${persona.theme.backgroundColor}40 100%)`,
          mixBlendMode: 'multiply'
        }}
      />
    </div>
  )
}

// Export for use in other components
export { PersonaVisualizer }