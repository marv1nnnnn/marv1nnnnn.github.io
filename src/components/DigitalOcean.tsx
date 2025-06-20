'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { oceanVertexShader, oceanFragmentShader } from '@/shaders/OceanShader'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'
import * as THREE from 'three'

interface DigitalOceanProps {
  glitchLevel?: number
  breathingManager: AtmosphericBreathingManager
  atmosphericIntensity?: number
  lightingColor?: string
  lightingIntensity?: number
  ambientIntensity?: number
}

export default function DigitalOcean({ 
  glitchLevel = 0, 
  breathingManager, 
  atmosphericIntensity = 0.5,
  lightingColor = '#ffffff',
  lightingIntensity = 1.0,
  ambientIntensity = 0.3
}: DigitalOceanProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Get viewport and camera info for dynamic sizing
  const { viewport, camera } = useThree()
  
  // Create geometry with dynamic sizing based on viewport and camera
  const geometry = useMemo(() => {
    const distance = camera.position.length()
    const fov = (camera as any).fov || 75
    const height = 2 * Math.tan((fov * Math.PI) / 360) * distance
    const width = height * viewport.aspect
    
    // Apply 12x scale factor to ensure complete coverage without gaps for extreme camera angles
    const scale = 6
    const finalWidth = Math.max(width * scale, 1500)  // Increased minimum for extreme perspectives
    const finalHeight = Math.max(height * scale, 1500)
    
    return new THREE.PlaneGeometry(finalWidth, finalHeight, 256, 256)
  }, [camera, viewport])

  // Much slower, mysterious afterlife ocean parameters with lighting influence
  const uniforms = useMemo(() => {
    // Apply lighting color influence to ocean colors
    const lightingColorObj = new THREE.Color(lightingColor)
    const lightingInfluenceStrength = Math.min(lightingIntensity * 0.4, 1.0) // Cap influence
    
    // Create lighting-influenced ocean colors
    const baseSurfaceColor = new THREE.Color('#7c3aed')
    const baseFoamColor = new THREE.Color('#c084fc')
    
    // Blend base colors with lighting color
    const influencedSurfaceColor = baseSurfaceColor.clone().lerp(lightingColorObj, lightingInfluenceStrength)
    const influencedFoamColor = baseFoamColor.clone().lerp(lightingColorObj, lightingInfluenceStrength * 0.7)
    
    return {
      // Shared atmospheric uniforms (unified across all components)
      ...breathingManager.atmosphericUniforms,
      
      // Realistic wave progression - calm to storm, enhanced by lighting
      uBigWavesElevation: { value: (0.5 + atmosphericIntensity * 2.0) * (0.7 + lightingIntensity * 0.3) }, // Lighting affects wave size
      uBigWavesFrequency: { value: 0.02 + atmosphericIntensity * 0.03 }, // Gradual frequency increase
      uBigWavesSpeed: { value: (0.15 + atmosphericIntensity * 0.35) * (0.8 + lightingIntensity * 0.2) }, // Lighting affects speed
      uSmallWavesElevation: { value: (0.1 + atmosphericIntensity * 0.8) * (0.8 + lightingIntensity * 0.2) }, // Surface detail enhanced by lighting
      uSmallWavesFrequency: { value: 0.06 + atmosphericIntensity * 0.12 }, // Natural frequency progression
      uSmallWavesSpeed: { value: 0.25 + atmosphericIntensity * 0.5 }, // Natural speed increase
      
      // Natural swell progression
      uSwellElevation: { value: 0.8 + atmosphericIntensity * 2.2 }, // Calm 0.8 to storm 3.0
      uSwellFrequency: { value: 0.01 + atmosphericIntensity * 0.02 }, // Natural frequency increase
      uSwellSpeed: { value: 0.08 + atmosphericIntensity * 0.2 }, // Natural speed progression
      
      // Gentle tidal motion - realistic breathing
      uTidalAmplitude: { value: 0.2 + atmosphericIntensity * 0.6 }, // Calm 0.2 to storm 0.8
      uTidalFrequency: { value: 0.02 + atmosphericIntensity * 0.01 }, // Slight frequency increase
      
      // Calm default, storm effects only when needed, enhanced by lighting
      uFlowSpeed: { value: (0.1 + (glitchLevel * 0.8 + atmosphericIntensity * 0.4)) * (0.5 + lightingIntensity * 0.5) }, // Lighting affects flow
      uDataIntensity: { value: (glitchLevel * 1.5 + atmosphericIntensity * 0.8) * (0.7 + lightingIntensity * 0.3) }, // Lighting affects digital patterns
      uScatterIntensity: { value: glitchLevel * 0.8 + atmosphericIntensity * 0.6 }, // No base scattering
      uDigitalNoise: { value: glitchLevel * 2.0 + atmosphericIntensity * 1.2 }, // No base noise
      uChaosLevel: { value: glitchLevel * 3.0 + atmosphericIntensity * 2.5 }, // No base chaos
      
      // Natural storm visual effects - realistic foam and spray, enhanced by lighting
      uStormIntensity: { value: ((glitchLevel + atmosphericIntensity) * 0.5) * (0.8 + lightingIntensity * 0.2) }, // Lighting affects storm
      uFoamCoverage: { value: atmosphericIntensity * 1.2 * (0.7 + ambientIntensity) }, // Ambient affects foam visibility
      uWhitecapIntensity: { value: atmosphericIntensity * 0.8 * (0.5 + lightingIntensity * 0.5) }, // Lighting affects whitecaps
      uSprayIntensity: { value: atmosphericIntensity * atmosphericIntensity }, // Spray effects for heavy storms
      uWaveComplexity: { value: 1.0 + atmosphericIntensity * 2.0 }, // More complex wave patterns
      
      // Lighting-influenced colors
      uColorSurface: { value: influencedSurfaceColor },
      uColorFoam: { value: influencedFoamColor },
      uLightingColor: { value: lightingColorObj },
      uLightingIntensity: { value: lightingIntensity },
      uAmbientIntensity: { value: ambientIntensity },
      
      // Legacy compatibility
      u_glitchLevel: { value: glitchLevel }, // Dynamic glitch level
      uBreathingFrequency: { value: 0.2 }, // Legacy - breathing now unified
      uDeepBreathIntensity: { value: 0.8 } // Legacy - now uDeepBreathPhase
    }
  }, [breathingManager, atmosphericIntensity, glitchLevel, lightingColor, lightingIntensity, ambientIntensity])

  // Simple animation with minimal changes for stability
  useFrame((state) => {
    if (!materialRef.current || !groupRef.current) return

    // Update the breathing manager (this updates all shared uniforms)
    breathingManager.update(state.clock.elapsedTime)
    
    // Update glitch level in unified system
    breathingManager.setGlitchLevel(glitchLevel)
    
    // Update only the uniforms that actually exist in the shader
    const material = materialRef.current
    
    
    // Smooth wave controls that affect the ocean movement - gradual changes
    material.uniforms.uBigWavesElevation.value = 1.0 + atmosphericIntensity * 3.0  // 1.0 to 4.0 - noticeable but not jarring
    material.uniforms.uBigWavesFrequency.value = 0.02 + atmosphericIntensity * 0.03  // Gentle frequency change
    material.uniforms.uBigWavesSpeed.value = 0.3 + atmosphericIntensity * 0.8       // Moderate speed increase
    material.uniforms.uSmallWavesElevation.value = 0.5 + atmosphericIntensity * 1.5 // Moderate small waves
    material.uniforms.uSmallWavesFrequency.value = 0.1 + atmosphericIntensity * 0.15  // Gentle small wave frequency
    material.uniforms.uSmallWavesSpeed.value = 0.5 + atmosphericIntensity * 1.2     // Moderate small wave speed
    material.uniforms.uSwellElevation.value = 2.0 + atmosphericIntensity * 4.0     // Moderate swell changes
    material.uniforms.uSwellFrequency.value = 0.005 + atmosphericIntensity * 0.02   // Gentle swell frequency
    material.uniforms.uSwellSpeed.value = 0.1 + atmosphericIntensity * 0.5          // Moderate swell speed
    
    // Gentle effects - smooth and eye-friendly changes
    if (material.uniforms.uScatterIntensity) {
      material.uniforms.uScatterIntensity.value = glitchLevel * 0.8 + atmosphericIntensity * 0.6  // Gentle scattering
    }
    if (material.uniforms.u_glitchLevel) {
      material.uniforms.u_glitchLevel.value = glitchLevel * 1.0  // Keep glitch effect moderate
    }
    if (material.uniforms.uChaosLevel) {
      material.uniforms.uChaosLevel.value = glitchLevel * 2.0 + atmosphericIntensity * 1.5  // Controlled chaos
    }
    if (material.uniforms.uWaveComplexity) {
      material.uniforms.uWaveComplexity.value = 1.0 + atmosphericIntensity * 1.5  // Moderate complexity
    }
    if (material.uniforms.uFoamCoverage) {
      material.uniforms.uFoamCoverage.value = atmosphericIntensity * 1.2  // Moderate foam
    }
    if (material.uniforms.uStormIntensity) {
      material.uniforms.uStormIntensity.value = (glitchLevel + atmosphericIntensity) * 0.5  // Gentle storms
    }
    
    // Tidal movement with atmospheric intensity effects
    const time = state.clock.elapsedTime
    const tidalFreq = 0.02 + atmosphericIntensity * 0.01
    const tidalAmp = (0.2 + atmosphericIntensity * 0.6) * 0.1 // Scale down for subtlety
    const simpleTidal = Math.sin(time * tidalFreq) * tidalAmp
    
    // Natural ocean behavior - no position chaos, only realistic tidal movement
    // Ocean surface stays horizontal with gentle natural tidal breathing
    groupRef.current.position.set(0, simpleTidal, 0)
    groupRef.current.rotation.set(0, 0, 0)
    
    // All storm effects now happen through wave amplitude in shaders, not mesh movement
    // This keeps the ocean looking like a real ocean surface
    
    // Sync legacy uniforms with new unified system
    material.uniforms.uColorSurface.value.copy(breathingManager.atmosphericUniforms.uColorMid.value)
    material.uniforms.uColorFoam.value.copy(breathingManager.atmosphericUniforms.uColorLight.value)
    material.uniforms.u_glitchLevel.value = breathingManager.atmosphericUniforms.uGlitchLevel.value
  })

  return (
    <group ref={groupRef}>
      {/* Digital ocean positioned well below horizon to avoid aurora overlap */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -20, 0]} // Moved much lower to stay below horizon
      >
        <shaderMaterial
          ref={materialRef}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
          transparent={false}
        />
      </mesh>
    </group>
  )
}