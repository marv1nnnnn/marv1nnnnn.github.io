'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { oceanVertexShader, oceanFragmentShader } from '@/shaders/OceanShader'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'
import * as THREE from 'three'

interface OptimizedDigitalOceanProps {
  glitchLevel?: number
  breathingManager: AtmosphericBreathingManager
  atmosphericIntensity?: number
  lightingColor?: string
  lightingIntensity?: number
  ambientIntensity?: number
  performanceLevel?: 'low' | 'medium' | 'high'
  onReady?: () => void
}

export default function OptimizedDigitalOcean({ 
  glitchLevel = 0, 
  breathingManager, 
  atmosphericIntensity = 0.5,
  lightingColor = '#ffffff',
  lightingIntensity = 1.0,
  ambientIntensity = 0.3,
  performanceLevel = 'medium',
  onReady
}: OptimizedDigitalOceanProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  const [currentQuality, setCurrentQuality] = useState<'low' | 'medium' | 'high'>('low')
  const [isUpgrading, setIsUpgrading] = useState(false)

  // Get viewport and camera info for dynamic sizing
  const { viewport, camera } = useThree()
  
  // Progressive quality settings
  const getQualitySettings = (quality: 'low' | 'medium' | 'high') => {
    switch (quality) {
      case 'low':
        return { segments: 32, updateInterval: 3 }
      case 'medium':
        return { segments: 64, updateInterval: 2 }
      case 'high':
        return { segments: 128, updateInterval: 1 }
    }
  }
  
  const qualitySettings = getQualitySettings(currentQuality)
  
  // Create geometry with progressive enhancement
  const geometry = useMemo(() => {
    const distance = camera.position.length()
    const fov = (camera as any).fov || 75
    const height = 2 * Math.tan((fov * Math.PI) / 360) * distance
    const width = height * viewport.aspect
    
    // Scale factor for coverage
    const scale = 6
    const finalWidth = Math.max(width * scale, 1500)
    const finalHeight = Math.max(height * scale, 1500)
    
    // Use progressive quality
    return new THREE.PlaneGeometry(
      finalWidth, 
      finalHeight, 
      qualitySettings.segments, 
      qualitySettings.segments
    )
  }, [camera, viewport, qualitySettings.segments])

  // Optimized uniforms with lighting influence
  const uniforms = useMemo(() => {
    // Apply lighting color influence to ocean colors
    const lightingColorObj = new THREE.Color(lightingColor)
    const lightingInfluenceStrength = Math.min(lightingIntensity * 0.4, 1.0)
    
    // Create lighting-influenced ocean colors
    const baseSurfaceColor = new THREE.Color('#7c3aed')
    const baseFoamColor = new THREE.Color('#c084fc')
    
    // Blend base colors with lighting color
    const influencedSurfaceColor = baseSurfaceColor.clone().lerp(lightingColorObj, lightingInfluenceStrength)
    const influencedFoamColor = baseFoamColor.clone().lerp(lightingColorObj, lightingInfluenceStrength * 0.7)
    
    return {
      // Shared atmospheric uniforms (unified across all components)
      ...breathingManager.atmosphericUniforms,
      
      // Optimized wave parameters
      uBigWavesElevation: { value: (0.5 + atmosphericIntensity * 2.0) * (0.7 + lightingIntensity * 0.3) },
      uBigWavesFrequency: { value: 0.02 + atmosphericIntensity * 0.03 },
      uBigWavesSpeed: { value: (0.15 + atmosphericIntensity * 0.35) * (0.8 + lightingIntensity * 0.2) },
      uSmallWavesElevation: { value: (0.1 + atmosphericIntensity * 0.8) * (0.8 + lightingIntensity * 0.2) },
      uSmallWavesFrequency: { value: 0.06 + atmosphericIntensity * 0.12 },
      uSmallWavesSpeed: { value: 0.25 + atmosphericIntensity * 0.5 },
      
      // Natural swell progression
      uSwellElevation: { value: 0.8 + atmosphericIntensity * 2.2 },
      uSwellFrequency: { value: 0.01 + atmosphericIntensity * 0.02 },
      uSwellSpeed: { value: 0.08 + atmosphericIntensity * 0.2 },
      
      // Gentle tidal motion
      uTidalAmplitude: { value: 0.2 + atmosphericIntensity * 0.6 },
      uTidalFrequency: { value: 0.02 + atmosphericIntensity * 0.01 },
      
      // Storm effects with lighting enhancement
      uFlowSpeed: { value: (0.1 + (glitchLevel * 0.8 + atmosphericIntensity * 0.4)) * (0.5 + lightingIntensity * 0.5) },
      uDataIntensity: { value: (glitchLevel * 1.5 + atmosphericIntensity * 0.8) * (0.7 + lightingIntensity * 0.3) },
      uScatterIntensity: { value: glitchLevel * 0.8 + atmosphericIntensity * 0.6 },
      uDigitalNoise: { value: glitchLevel * 2.0 + atmosphericIntensity * 1.2 },
      uChaosLevel: { value: glitchLevel * 3.0 + atmosphericIntensity * 2.5 },
      
      // Visual effects with lighting
      uStormIntensity: { value: ((glitchLevel + atmosphericIntensity) * 0.5) * (0.8 + lightingIntensity * 0.2) },
      uFoamCoverage: { value: atmosphericIntensity * 1.2 * (0.7 + ambientIntensity) },
      uWhitecapIntensity: { value: atmosphericIntensity * 0.8 * (0.5 + lightingIntensity * 0.5) },
      uSprayIntensity: { value: atmosphericIntensity * atmosphericIntensity },
      uWaveComplexity: { value: 1.0 + atmosphericIntensity * 2.0 },
      
      // Lighting-influenced colors
      uColorSurface: { value: influencedSurfaceColor },
      uColorFoam: { value: influencedFoamColor },
      uLightingColor: { value: lightingColorObj },
      uLightingIntensity: { value: lightingIntensity },
      uAmbientIntensity: { value: ambientIntensity },
      
      // Performance quality indicator
      uQualityLevel: { value: currentQuality === 'low' ? 0 : currentQuality === 'medium' ? 1 : 2 }
    }
  }, [
    breathingManager, 
    atmosphericIntensity, 
    lightingColor, 
    lightingIntensity, 
    ambientIntensity, 
    glitchLevel, 
    currentQuality
  ])

  // Progressive quality enhancement
  useEffect(() => {
    const upgradeQuality = async () => {
      if (currentQuality === performanceLevel) return
      
      // Wait before upgrading to allow initial render
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (currentQuality === 'low' && performanceLevel !== 'low') {
        setIsUpgrading(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        setCurrentQuality('medium')
        setIsUpgrading(false)
        
        if (performanceLevel === 'high') {
          await new Promise(resolve => setTimeout(resolve, 1000))
          setIsUpgrading(true)
          await new Promise(resolve => setTimeout(resolve, 500))
          setCurrentQuality('high')
          setIsUpgrading(false)
        }
      } else if (currentQuality === 'medium' && performanceLevel === 'high') {
        setIsUpgrading(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        setCurrentQuality('high')
        setIsUpgrading(false)
      }
    }

    upgradeQuality()
  }, [performanceLevel, currentQuality])

  // Notify when ready
  useEffect(() => {
    if (currentQuality === performanceLevel) {
      onReady?.()
    }
  }, [currentQuality, performanceLevel, onReady])

  // Optimized animation frame with quality-based update intervals
  const frameCount = useRef(0)
  useFrame((state) => {
    frameCount.current++
    
    // Skip frames based on quality settings for performance
    if (frameCount.current % qualitySettings.updateInterval !== 0) return
    
    if (!meshRef.current || !materialRef.current) return

    const time = state.clock.elapsedTime

    // Update breathing manager (shared across all components)
    breathingManager.update(time)

    // Less frequent uniform updates for better performance
    if (frameCount.current % (qualitySettings.updateInterval * 2) === 0) {
      // Update only the most critical uniforms per frame
      materialRef.current.uniforms.uFlowSpeed.value = 
        (0.1 + (glitchLevel * 0.8 + atmosphericIntensity * 0.4)) * (0.5 + lightingIntensity * 0.5)
      
      materialRef.current.uniforms.uStormIntensity.value = 
        ((glitchLevel + atmosphericIntensity) * 0.5) * (0.8 + lightingIntensity * 0.2)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh 
        ref={meshRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -10, 0]}
      >
        <bufferGeometry {...geometry} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Quality upgrade indicator */}
      {isUpgrading && (
        <mesh position={[0, 5, 0]}>
          <sphereGeometry args={[2, 8, 8]} />
          <meshBasicMaterial 
            color="#c084fc" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
    </group>
  )
}