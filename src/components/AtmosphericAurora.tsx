'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'

// Simplified Aurora Configuration
interface AuroraConfig {
  position: [number, number, number]
  size: [number, number] // width, height
  flowSpeed: number
  curveIntensity: number
  timeOffset: number
  colorEmotion: number // 0-4 representing different emotional states
}

// Emotion-based color palettes (simplified)
const EMOTION_COLORS = {
  // Contemplative: Cool blues and greens
  0: {
    primary: [0.2, 0.8, 0.6],    // Cyan-green
    secondary: [0.4, 1.0, 0.8],   // Pale green
    accent: [0.1, 0.5, 0.7]       // Deep blue-green
  },
  // Excited: Warm oranges and yellows
  1: {
    primary: [1.0, 0.6, 0.2],    // Orange
    secondary: [1.0, 0.8, 0.4],   // Golden
    accent: [0.9, 0.4, 0.1]       // Deep orange
  },
  // Melancholic: Deep purples and blues
  2: {
    primary: [0.4, 0.2, 0.8],    // Purple
    secondary: [0.6, 0.4, 1.0],   // Lavender
    accent: [0.2, 0.1, 0.5]       // Deep purple
  },
  // Mysterious: Ethereal greens and purples
  3: {
    primary: [0.3, 1.0, 0.4],    // Vivid green
    secondary: [0.7, 0.9, 1.0],   // Pale cyan
    accent: [0.5, 0.3, 0.9]       // Mysterious purple
  },
  // Urgent: Intense reds and magentas
  4: {
    primary: [1.0, 0.3, 0.5],    // Bright red
    secondary: [1.0, 0.5, 0.8],   // Pink
    accent: [0.8, 0.1, 0.3]       // Deep red
  }
}

// Natural Aurora Vertex Shader - Horizontal Flowing Movement
const auroraVertexShader = `
uniform float uTime;
uniform float uEmotionType;
uniform float uBreathingPhase;
uniform float uDeepBreathPhase;
uniform float uFlowSpeed;
uniform float uCurveIntensity;
uniform float uTimeOffset;

varying vec2 vUv;
varying vec3 vPosition;
varying float vDistanceToCamera;
varying float vIntensity;
varying float vAlphaIntensity;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  float enhancedTime = uTime * uFlowSpeed + uTimeOffset;
  
  // Horizontal flowing movement like real aurora
  float horizontalFlow1 = sin(pos.x * 0.003 + enhancedTime * 0.4) * 30.0;
  float horizontalFlow2 = sin(pos.x * 0.005 + enhancedTime * 0.6 + 1.5) * 20.0;
  float horizontalFlow3 = sin(pos.x * 0.002 + enhancedTime * 0.3 + 3.0) * 15.0;
  
  // Vertical undulation for natural wave-like movement
  float verticalWave = sin(pos.x * 0.004 + enhancedTime * 0.5) * 25.0;
  
  // Apply natural flowing movement
  pos.y += (horizontalFlow1 + horizontalFlow2 + horizontalFlow3) * uCurveIntensity * 0.3;
  pos.z += verticalWave * uCurveIntensity * 0.5;
  
  // Gentle breathing effect
  float breathingEffect = (uBreathingPhase + uDeepBreathPhase * 0.3) * 8.0;
  pos.y += breathingEffect;
  
  // Slow morphing for natural variation
  float morphX = sin(enhancedTime * 0.08 + pos.x * 0.001) * 12.0;
  float morphY = cos(enhancedTime * 0.06 + pos.x * 0.002) * 8.0;
  pos.x += morphX * uCurveIntensity * 0.2;
  pos.y += morphY * uCurveIntensity * 0.3;
  
  // Calculate intensity for natural aurora brightness variation
  float baseIntensity = sin(pos.x * 0.002 + enhancedTime * 0.4) * 0.4 + 0.6;
  float heightIntensity = smoothstep(-50.0, 50.0, pos.y) * (1.0 - smoothstep(50.0, 150.0, pos.y));
  vIntensity = baseIntensity * heightIntensity;
  
  // Calculate alpha intensity for soft edges
  float edgeDistance = min(abs(pos.x + 200.0), abs(200.0 - pos.x)) / 200.0;
  vAlphaIntensity = smoothstep(0.0, 0.3, edgeDistance) * (1.0 - smoothstep(0.7, 1.0, edgeDistance));
  
  vPosition = pos;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistanceToCamera = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`

// Natural Aurora Fragment Shader - Soft Blending
const auroraFragmentShader = `
uniform float uTime;
uniform float uEmotionType;
uniform float uBreathingPhase;
uniform float uDeepBreathPhase;
uniform float uTimeOffset;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform vec3 uColorAccent;

varying vec2 vUv;
varying vec3 vPosition;
varying float vDistanceToCamera;
varying float vIntensity;
varying float vAlphaIntensity;

void main() {
  float enhancedTime = uTime + uTimeOffset;
  
  // Natural aurora color flow - horizontal gradient
  float horizontalGradient = vUv.x;
  float verticalGradient = smoothstep(0.2, 0.8, vUv.y);
  
  // Create flowing color transitions like real aurora
  vec3 auroraColor;
  float colorFlow = sin(horizontalGradient * 3.14159 + enhancedTime * 0.3) * 0.5 + 0.5;
  
  // Blend colors naturally across the aurora
  if (colorFlow < 0.3) {
    auroraColor = mix(uColorAccent, uColorPrimary, colorFlow / 0.3);
  } else if (colorFlow < 0.7) {
    auroraColor = mix(uColorPrimary, uColorSecondary, (colorFlow - 0.3) / 0.4);
  } else {
    auroraColor = mix(uColorSecondary, uColorPrimary, (colorFlow - 0.7) / 0.3);
  }
  
  // Add vertical color variation
  auroraColor = mix(auroraColor * 0.6, auroraColor, verticalGradient);
  
  // Natural pulsing and shimmer
  float shimmer1 = sin(vPosition.x * 0.01 + enhancedTime * 0.8) * 0.15 + 0.85;
  float shimmer2 = sin(vPosition.y * 0.008 + enhancedTime * 0.5 + 1.5) * 0.1 + 0.9;
  auroraColor *= shimmer1 * shimmer2;
  
  // Breathing effect on brightness
  float breathingBrightness = 1.0 + (uBreathingPhase * 0.15 + uDeepBreathPhase * 0.25);
  vec3 finalColor = auroraColor * breathingBrightness;
  
  // Natural soft opacity with smooth falloff for full-sky coverage
  float centerIntensity = vIntensity;
  float edgeAlpha = vAlphaIntensity;
  float verticalAlpha = smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y));
  
  // Distance-based fade for depth with better layering - adjusted for distant aurora
  float distanceFade = 1.0 - smoothstep(1200.0, 2000.0, vDistanceToCamera);
  distanceFade = max(distanceFade, 0.15);
  
  // Natural flickering
  float flicker = sin(enhancedTime * 0.6 + vPosition.x * 0.002) * 0.06 + 0.94;
  
  // Soft horizontal edge fading for seamless blending
  float horizontalFade = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
  
  // Combine all opacity factors for natural soft aurora with better blending
  float finalOpacity = centerIntensity * edgeAlpha * verticalAlpha * distanceFade * flicker * horizontalFade;
  finalOpacity = clamp(finalOpacity, 0.1, 0.7); // Lower max opacity for better layering
  
  gl_FragColor = vec4(finalColor, finalOpacity);
}
`

// Create flowing curved aurora geometry using CatmullRom curves
function createAuroraGeometry(config: AuroraConfig): THREE.BufferGeometry {
  const width = Math.min(config.size[0], 50000) // Cap width to prevent overflow
  const height = Math.min(config.size[1], 10000) // Cap height to prevent overflow
  const widthSegments = Math.max(40, Math.min(Math.floor(width / 10), 500)) // Cap segments
  const heightSegments = Math.max(20, Math.min(Math.floor(height / 20), 200)) // Cap segments
  
  // Create base plane geometry with safety limits
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
  
  // Apply natural curves to make it flow like real aurora
  const positions = geometry.attributes.position.array as Float32Array
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    
    // Create natural flowing curves based on position
    const waveX = Math.sin(x * 0.005 + config.timeOffset) * 20
    const waveY = Math.sin(x * 0.008 + config.timeOffset * 1.2) * 15
    const waveZ = Math.sin(x * 0.003 + y * 0.002) * 10
    
    // Apply curves to create flowing shape
    positions[i] += waveX * config.curveIntensity
    positions[i + 1] += waveY * config.curveIntensity * 0.5
    positions[i + 2] += waveZ * config.curveIntensity
  }
  
  geometry.attributes.position.needsUpdate = true
  geometry.computeVertexNormals()
  
  return geometry
}

// Simplified Aurora Component
function SimpleAurora({
  config,
  index,
  breathingManager,
  atmosphericIntensity = 0.5,
  glitchLevel = 0.0,
  lightingColor = '#ffffff',
  lightingIntensity = 1.0
}: {
  config: AuroraConfig
  index: number
  breathingManager: AtmosphericBreathingManager
  atmosphericIntensity?: number
  glitchLevel?: number
  lightingColor?: string
  lightingIntensity?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Create simple curtain geometry
  const geometry = useMemo(() => {
    return createAuroraGeometry(config)
  }, [config])

  // Create material with emotion-based colors influenced by lighting
  const material = useMemo(() => {
    const emotionColors = EMOTION_COLORS[Math.floor(config.colorEmotion) as keyof typeof EMOTION_COLORS] || EMOTION_COLORS[0]
    
    // Apply lighting color influence to aurora colors
    const lightingColorObj = new THREE.Color(lightingColor)
    const lightingInfluenceStrength = Math.min(lightingIntensity * 0.3, 1.0) // Cap influence
    
    // Blend emotion colors with lighting color
    const influencedPrimary = new THREE.Vector3(...emotionColors.primary).lerp(
      new THREE.Vector3(lightingColorObj.r, lightingColorObj.g, lightingColorObj.b), 
      lightingInfluenceStrength
    )
    const influencedSecondary = new THREE.Vector3(...emotionColors.secondary).lerp(
      new THREE.Vector3(lightingColorObj.r, lightingColorObj.g, lightingColorObj.b), 
      lightingInfluenceStrength * 0.7
    )
    const influencedAccent = new THREE.Vector3(...emotionColors.accent).lerp(
      new THREE.Vector3(lightingColorObj.r, lightingColorObj.g, lightingColorObj.b), 
      lightingInfluenceStrength * 0.5
    )
    
    return new THREE.ShaderMaterial({
      uniforms: {
        // Shared atmospheric uniforms
        ...breathingManager.atmosphericUniforms,
        
        // Atmospheric intensity controlled parameters enhanced by lighting
        uFlowSpeed: { value: config.flowSpeed * (0.3 + atmosphericIntensity * 0.7) * (1 + glitchLevel * 2) * (0.5 + lightingIntensity * 0.5) },
        uCurveIntensity: { value: config.curveIntensity * atmosphericIntensity * (1 + glitchLevel * 1.5) },
        uTimeOffset: { value: config.timeOffset },
        uAtmosphericIntensity: { value: atmosphericIntensity },
        uGlitchIntensity: { value: glitchLevel },
        uLightingIntensity: { value: lightingIntensity },
        
        // Lighting-influenced colors
        uColorPrimary: { value: influencedPrimary },
        uColorSecondary: { value: influencedSecondary },
        uColorAccent: { value: influencedAccent }
      },
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [config, breathingManager, atmosphericIntensity, glitchLevel, lightingColor, lightingIntensity])

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return

    // Update breathing manager
    breathingManager.update(state.clock.elapsedTime)
    
    // Slowly change emotion over time for color morphing
    if (material.uniforms.uEmotionType) {
      const slowTime = state.clock.elapsedTime * 0.03
      const newEmotion = (Math.sin(slowTime + config.timeOffset) * 2 + 2.5) % 5
      material.uniforms.uEmotionType.value = newEmotion
      
      // Update colors based on current emotion
      const currentEmotion = Math.floor(newEmotion) as keyof typeof EMOTION_COLORS
      const emotionColors = EMOTION_COLORS[currentEmotion] || EMOTION_COLORS[0]
      
      material.uniforms.uColorPrimary.value.set(...emotionColors.primary)
      material.uniforms.uColorSecondary.value.set(...emotionColors.secondary)
      material.uniforms.uColorAccent.value.set(...emotionColors.accent)
    }
    
    // Add glitch effects
    if (glitchLevel > 0.01) {
      const time = state.clock.elapsedTime
      const glitchIntensity = glitchLevel * 2
      
      // Position jittering
      const jitterX = (Math.random() - 0.5) * glitchIntensity * 5
      const jitterY = (Math.random() - 0.5) * glitchIntensity * 3
      const jitterZ = (Math.random() - 0.5) * glitchIntensity * 2
      meshRef.current.position.set(
        config.position[0] + jitterX,
        config.position[1] + jitterY,
        config.position[2] + jitterZ
      )
      
      // Opacity flickering
      const flicker = 1 + Math.sin(time * 20 + Math.random() * 10) * glitchIntensity * 0.3
      material.opacity *= Math.max(0.1, flicker)
      
      // Color corruption
      if (Math.random() < glitchLevel * 0.1) {
        const corruptColor = new THREE.Vector3(Math.random(), Math.random(), Math.random())
        material.uniforms.uColorAccent.value.copy(corruptColor)
      }
    } else {
      // Reset position when no glitch
      meshRef.current.position.set(...config.position)
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={config.position}
    />
  )
}

// Generate full-sky aurora coverage responsive to screen size
function generateFullSkyAuroras(
  count: number = 6, 
  viewportScale: number = 1, 
  densityMultiplier: number = 1.0, 
  coverageMultiplier: number = 1.0
): AuroraConfig[] {
  const auroras: AuroraConfig[] = []
  
  // Screen size responsive scaling - larger screens get bigger auroras
  const screenScale = Math.max(1, viewportScale) // Minimum scale of 1
  console.log('[DEBUG] Aurora generation with viewport scale:', screenScale, 'density:', densityMultiplier, 'coverage:', coverageMultiplier)
  
  // Create multiple layers covering the entire sky - positioned above horizon
  // Increase layer count based on density multiplier
  const layers = [
    { yRange: [350, 500], zRange: [-1500, -1000], sizeScale: 4.5 * screenScale }, // Very far background - high in sky
    { yRange: [300, 450], zRange: [-1200, -900], sizeScale: 4.0 * screenScale }, // Far background - high in sky
    { yRange: [200, 350], zRange: [-900, -700], sizeScale: 3.5 * screenScale }, // Mid background - well above horizon
    { yRange: [150, 300], zRange: [-700, -500], sizeScale: 3.0 * screenScale },  // Mid foreground - above horizon
    { yRange: [100, 250], zRange: [-600, -400], sizeScale: 2.5 * screenScale }, // Lower foreground - still above horizon
  ]
  
  layers.forEach((layer, layerIndex) => {
    // Increase aurora count per layer based on density multiplier
    const baseLayerCount = Math.ceil(count / layers.length)
    const layerCount = Math.round(baseLayerCount * densityMultiplier)
    
    for (let i = 0; i < layerCount; i++) {
      // Spread aurora across the full width of the sky - scale spread with screen size and coverage
      const spreadWidth = 400 * screenScale * coverageMultiplier
      const x = (i - layerCount/2) * spreadWidth + (Math.random() - 0.5) * 200 * screenScale * coverageMultiplier
      const y = layer.yRange[0] + Math.random() * (layer.yRange[1] - layer.yRange[0])
      const z = layer.zRange[0] + Math.random() * (layer.zRange[1] - layer.zRange[0])
      
      // Make aurora much larger for full sky coverage - responsive sizing with coverage multiplier
      const baseWidth = (1200 + Math.random() * 800) * layer.sizeScale * coverageMultiplier
      const baseHeight = (200 + Math.random() * 150) * layer.sizeScale
      
      auroras.push({
        position: [x, y, z],
        size: [baseWidth, baseHeight],
        flowSpeed: 0.2 + Math.random() * 0.5,
        curveIntensity: 0.6 + Math.random() * 0.6,
        timeOffset: Math.random() * 20 + layerIndex * 5,
        colorEmotion: Math.random() * 5
      })
    }
  })
  
  // Add extra large wraparound aurora for full immersion - responsive to density and coverage
  const extraAuroraCount = Math.round(2 * densityMultiplier)
  for (let i = 0; i < extraAuroraCount; i++) {
    auroras.push({
      position: [(i - extraAuroraCount/2) * 1500 * screenScale * coverageMultiplier, 250 + Math.random() * 100, -800 - Math.random() * 300], // Raised higher
      size: [(3000 + Math.random() * 1500) * screenScale * coverageMultiplier, (400 + Math.random() * 300) * screenScale],
      flowSpeed: 0.15 + Math.random() * 0.25,
      curveIntensity: 0.4 + Math.random() * 0.4,
      timeOffset: Math.random() * 25,
      colorEmotion: Math.random() * 5
    })
  }
  
  return auroras
}

// Main simplified aurora component
export function AtmosphericAurora({
  breathingManager,
  auroraCount = 12, // Optimized aurora count for better performance
  atmosphericIntensity = 0.5,
  glitchLevel = 0.0,
  densityMultiplier = 1.0,
  coverageMultiplier = 1.0,
  lightingColor = '#ffffff',
  lightingIntensity = 1.0
}: {
  breathingManager: AtmosphericBreathingManager
  auroraCount?: number
  atmosphericIntensity?: number
  glitchLevel?: number
  densityMultiplier?: number
  coverageMultiplier?: number
  lightingColor?: string
  lightingIntensity?: number
}) {
  // Get viewport information for responsive scaling
  const { viewport } = useThree()
  
  // Calculate screen scale based on viewport width
  // For 2560px screens (viewport width ~25.6 at default zoom), scale should be ~2.8
  // For 1920px screens (viewport width ~19.2), scale should be ~1.8
  // For 1366px screens (viewport width ~13.7), scale should be ~1.0
  const getViewportScale = (viewportWidth: number): number => {
    // More conservative scaling to prevent geometry overflow
    // 1366px = scale 1.0, 1920px = scale 1.5, 2560px = scale 2.0
    const baseWidth = 13.7 // Viewport width for 1366px screen
    const scale = Math.max(1.0, Math.min(2.5, Math.pow(viewportWidth / baseWidth, 0.8))) // Capped scaling
    console.log('[DEBUG] Viewport scaling - width:', viewportWidth, 'scale:', scale.toFixed(2))
    return scale
  }
  
  const viewportScale = getViewportScale(viewport.width)
  
  // Generate aurora configurations with responsive scaling
  const [auroraConfigs] = useState<AuroraConfig[]>(() => generateFullSkyAuroras(auroraCount, viewportScale, densityMultiplier, coverageMultiplier))
  
  // Regenerate auroras if viewport or settings change significantly
  const [lastViewportScale, setLastViewportScale] = useState(viewportScale)
  const [lastDensity, setLastDensity] = useState(densityMultiplier)
  const [lastCoverage, setLastCoverage] = useState(coverageMultiplier)
  const [currentConfigs, setCurrentConfigs] = useState<AuroraConfig[]>(auroraConfigs)
  
  useEffect(() => {
    const scaleDifference = Math.abs(viewportScale - lastViewportScale)
    const densityDifference = Math.abs(densityMultiplier - lastDensity)
    const coverageDifference = Math.abs(coverageMultiplier - lastCoverage)
    
    if (scaleDifference > 0.2 || densityDifference > 0.1 || coverageDifference > 0.1) {
      console.log('[DEBUG] Significant parameter change detected, regenerating auroras')
      const newConfigs = generateFullSkyAuroras(auroraCount, viewportScale, densityMultiplier, coverageMultiplier)
      setCurrentConfigs(newConfigs)
      setLastViewportScale(viewportScale)
      setLastDensity(densityMultiplier)
      setLastCoverage(coverageMultiplier)
    }
  }, [viewportScale, lastViewportScale, densityMultiplier, lastDensity, coverageMultiplier, lastCoverage, auroraCount])
  
  useEffect(() => {
    console.log('[DEBUG] Full-sky AtmosphericAurora initialized with', currentConfigs.length, 'aurora layers covering the entire sky at scale', viewportScale.toFixed(2))
  }, [currentConfigs.length, viewportScale])

  return (
    <group name="atmospheric-aurora">
      {currentConfigs.map((config, index) => (
        <SimpleAurora
          key={`simple-aurora-${index}`}
          config={config}
          index={index}
          breathingManager={breathingManager}
          atmosphericIntensity={atmosphericIntensity}
          glitchLevel={glitchLevel}
          lightingColor={lightingColor}
          lightingIntensity={lightingIntensity}
        />
      ))}
    </group>
  )
}

export default AtmosphericAurora 