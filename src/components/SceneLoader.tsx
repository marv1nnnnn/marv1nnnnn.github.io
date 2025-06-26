'use client'

import { useState, useEffect, Suspense, lazy, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

// Progressive loading components with lazy loading
const DigitalOcean = lazy(() => import('./DigitalOcean'))
const AtmosphericAurora = lazy(() => import('./AtmosphericAurora'))
const AtmosphericParticleField = lazy(() => import('./AtmosphericParticleField'))
const AtmosphericRain = lazy(() => import('./AtmosphericRain'))
const GamepadController = lazy(() => import('./3d/GamepadController'))
const CaseFileDisplay = lazy(() => import('./3d/CaseFileDisplay'))
const SuitcaseDisplay = lazy(() => import('./3d/SuitcaseDisplay'))
const Persona3D = lazy(() => import('./3d/Persona3D'))

// Enhanced component preloading and caching system
const PRELOADED_COMPONENTS = new Map()
const COMPONENT_CACHE = new Map()
let preloadingPromise: Promise<void> | null = null

async function preloadComponent(componentName: string, lazyComponent: () => Promise<any>) {
  if (PRELOADED_COMPONENTS.has(componentName)) {
    return PRELOADED_COMPONENTS.get(componentName)
  }
  
  try {
    console.log(`[DEBUG] Preloading component: ${componentName}`)
    const componentModule = await lazyComponent()
    const component = componentModule.default || componentModule
    
    // Cache both the module and the component
    PRELOADED_COMPONENTS.set(componentName, componentModule)
    COMPONENT_CACHE.set(componentName, component)
    
    console.log(`[DEBUG] Successfully preloaded: ${componentName}`)
    return componentModule
  } catch (error) {
    console.warn(`[DEBUG] Failed to preload component ${componentName}:`, error)
    return null
  }
}

// Get cached component (instant access)
export function getCachedComponent(componentName: string) {
  return COMPONENT_CACHE.get(componentName) || PRELOADED_COMPONENTS.get(componentName)?.default
}

// Check if component is preloaded
export function isComponentPreloaded(componentName: string) {
  return PRELOADED_COMPONENTS.has(componentName)
}

// Preload all components during boot with progress tracking
export async function preloadAllComponents(
  onProgress?: (progress: number, componentName: string) => void
): Promise<void> {
  // Return existing promise if already preloading
  if (preloadingPromise) {
    return preloadingPromise
  }
  
  preloadingPromise = (async () => {
    console.log('[DEBUG] Starting component preloading...')
    const startTime = performance.now()
    
    const componentList = [
      { name: 'DigitalOcean', loader: () => import('./DigitalOcean') },
      { name: 'AtmosphericAurora', loader: () => import('./AtmosphericAurora') },
      { name: 'AtmosphericParticleField', loader: () => import('./AtmosphericParticleField') },
      { name: 'AtmosphericRain', loader: () => import('./AtmosphericRain') },
      { name: 'GamepadController', loader: () => import('./3d/GamepadController') },
      { name: 'CaseFileDisplay', loader: () => import('./3d/CaseFileDisplay') },
      { name: 'SuitcaseDisplay', loader: () => import('./3d/SuitcaseDisplay') },
      { name: 'Persona3D', loader: () => import('./3d/Persona3D') }
    ]
    
    let completed = 0
    const total = componentList.length
    
    const preloadPromises = componentList.map(async ({ name, loader }) => {
      await preloadComponent(name, loader)
      completed++
      const progress = Math.round((completed / total) * 100)
      onProgress?.(progress, name)
      console.log(`[DEBUG] Preload progress: ${progress}% (${name})`)
    })
    
    await Promise.all(preloadPromises)
    
    const endTime = performance.now()
    console.log(`[DEBUG] All 3D components preloaded successfully in ${Math.round(endTime - startTime)}ms`)
    console.log(`[DEBUG] Cached components:`, Array.from(PRELOADED_COMPONENTS.keys()))
  })()
  
  return preloadingPromise
}

// Loading states
export type LoadingState = 
  | 'initial'
  | 'loading_core'
  | 'loading_ocean'
  | 'loading_atmosphere'
  | 'loading_objects'
  | 'complete'

// Performance preset types
export type PerformancePreset = 'low' | 'medium' | 'high'

interface SceneLoaderProps {
  children?: ReactNode
  onLoadingStateChange?: (state: LoadingState, progress: number) => void
  performancePreset?: PerformancePreset
  visualEffects?: {
    oceanWaves: boolean
    aurora: boolean
    particles: boolean
    rain: boolean
  }
  glitchLevel?: number
  breathingManager?: any
  emotionManager?: any
  atmosphericIntensity?: number
  auroraSettings?: any
  sceneLighting?: any
  handleCaseFileClick?: () => void
  handleSuitcaseClick?: () => void
  handleGamepadClick?: () => void
  handlePersonaClick?: () => void
  position?: {
    caseFile: [number, number, number]
    suitcase: [number, number, number]
    gamepad: [number, number, number]
  }
  persona?: any
  isTyping?: boolean
  personaPosition?: { x: number; y: number; z: number }
  personaScale?: number
  personaHoverEffects?: {
    enabled: boolean
    glitchMultiplier: number
    particleIntensity: number
    geometricIntensity: number
    emissiveBoost: number
  }
  componentsPreloaded?: boolean
}

// Simple placeholder components for instant loading
function BasicOcean() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <planeGeometry args={[500, 500, 32, 32]} />
      <meshBasicMaterial 
        color="#1a0d2e" 
        transparent 
        opacity={0.8}
        wireframe={false}
      />
    </mesh>
  )
}

function BasicLighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} />
    </>
  )
}

// 3D Loading indicator that works inside R3F Canvas
function LoadingIndicator3D({ state, progress }: { state: LoadingState; progress: number }) {
  return (
    <group position={[-50, 20, 0]}>
      {/* Progress bar as 3D geometry */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[20, 1, 0.5]} />
        <meshBasicMaterial color="#1a0d2e" transparent opacity={0.8} />
      </mesh>
      
      {/* Progress fill */}
      <mesh position={[-10 + (progress / 100) * 10, 0, 0.1]} scale={[progress / 100, 1, 1]}>
        <boxGeometry args={[20, 1, 0.5]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.9} />
      </mesh>
      
      {/* Glowing effect */}
      <pointLight 
        position={[0, 0, 2]} 
        color="#c084fc" 
        intensity={progress / 100} 
        distance={30}
      />
    </group>
  )
}

export function SceneLoader({
  children,
  onLoadingStateChange,
  performancePreset = 'medium',
  visualEffects = {
    oceanWaves: true,
    aurora: true,
    particles: false,
    rain: false
  },
  glitchLevel = 0,
  breathingManager,
  emotionManager,
  atmosphericIntensity = 0.5,
  auroraSettings,
  sceneLighting,
  handleCaseFileClick,
  handleSuitcaseClick,
  handleGamepadClick,
  handlePersonaClick,
  position,
  persona,
  isTyping = false,
  personaPosition = { x: 0, y: 30, z: -100 },
  personaScale = 50,
  personaHoverEffects = {
    enabled: true,
    glitchMultiplier: 1.0,
    particleIntensity: 1.0,
    geometricIntensity: 1.0,
    emissiveBoost: 0.5
  },
  componentsPreloaded = false
}: SceneLoaderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('initial')
  const [progress, setProgress] = useState(0)
  const [loadedComponents, setLoadedComponents] = useState({
    ocean: false,
    aurora: false,
    particles: false,
    rain: false,
    objects: false
  })

  // Performance-based settings
  const getPerformanceSettings = (preset: PerformancePreset) => {
    switch (preset) {
      case 'low':
        return {
          oceanSegments: 32,
          auroraLayers: 6,
          particleCount: 0.3,
          delayBetweenLoads: 100
        }
      case 'medium':
        return {
          oceanSegments: 64,
          auroraLayers: 8,
          particleCount: 0.7,
          delayBetweenLoads: 200
        }
      case 'high':
        return {
          oceanSegments: 128,
          auroraLayers: 12,
          particleCount: 1.0,
          delayBetweenLoads: 300
        }
    }
  }

  const settings = getPerformanceSettings(performancePreset)

  useEffect(() => {
    onLoadingStateChange?.(loadingState, progress)
  }, [loadingState, progress, onLoadingStateChange])

  // Optimized loading sequence - instant when preloaded
  useEffect(() => {
    const loadSequence = async () => {
      // If components are preloaded, skip loading sequence entirely
      if (componentsPreloaded) {
        console.log('[DEBUG] Components preloaded - instant scene activation')
        setLoadedComponents({
          ocean: visualEffects.oceanWaves,
          aurora: visualEffects.aurora,
          particles: visualEffects.particles,
          rain: visualEffects.rain,
          objects: true
        })
        setLoadingState('complete')
        setProgress(100)
        return
      }
      
      // Stage 1: Core systems (immediate)
      setLoadingState('loading_core')
      setProgress(10)
      
      // Immediate parallel loading instead of sequential delays
      const loadPromises: Promise<void>[] = []
      let completedCount = 0
      const totalComponents = Object.values(visualEffects).filter(Boolean).length + 1 // +1 for objects
      
      const updateProgress = () => {
        completedCount++
        const progressValue = 10 + (completedCount / totalComponents) * 80 // 10% base + 80% for components
        setProgress(Math.min(progressValue, 95))
      }
      
      // Stage 2: Ocean (essential) - load immediately
      if (visualEffects.oceanWaves) {
        setLoadingState('loading_ocean')
        loadPromises.push(
          Promise.resolve().then(() => {
            setLoadedComponents(prev => ({ ...prev, ocean: true }))
            updateProgress()
          })
        )
      }
      
      // Stage 3: Atmospheric effects (parallel loading)
      setLoadingState('loading_atmosphere')
      
      if (visualEffects.aurora) {
        loadPromises.push(
          Promise.resolve().then(() => {
            setLoadedComponents(prev => ({ ...prev, aurora: true }))
            updateProgress()
          })
        )
      }
      
      if (visualEffects.particles) {
        loadPromises.push(
          Promise.resolve().then(() => {
            setLoadedComponents(prev => ({ ...prev, particles: true }))
            updateProgress()
          })
        )
      }
      
      if (visualEffects.rain) {
        loadPromises.push(
          Promise.resolve().then(() => {
            setLoadedComponents(prev => ({ ...prev, rain: true }))
            updateProgress()
          })
        )
      }
      
      // Stage 4: Interactive objects (parallel)
      setLoadingState('loading_objects')
      loadPromises.push(
        Promise.resolve().then(() => {
          setLoadedComponents(prev => ({ ...prev, objects: true }))
          updateProgress()
        })
      )
      
      // Wait for all components to load in parallel
      await Promise.all(loadPromises)
      
      // Complete immediately
      setLoadingState('complete')
      setProgress(100)
    }

    loadSequence()
  }, [visualEffects, componentsPreloaded])

  return (
    <>
      {/* Show 3D loading indicator until complete */}
      {loadingState !== 'complete' && (
        <LoadingIndicator3D state={loadingState} progress={progress} />
      )}
      
      {/* Basic lighting always available */}
      <BasicLighting />
      
      {/* Basic ocean placeholder until real ocean loads */}
      {!loadedComponents.ocean && visualEffects.oceanWaves && <BasicOcean />}
      
      {/* Progressive component loading with Suspense */}
      {loadedComponents.ocean && visualEffects.oceanWaves && breathingManager && (
        <Suspense fallback={<BasicOcean />}>
          <DigitalOcean 
            glitchLevel={glitchLevel}
            breathingManager={breathingManager}
            atmosphericIntensity={atmosphericIntensity}
            lightingColor={sceneLighting?.color}
            lightingIntensity={sceneLighting?.directionalIntensity}
            ambientIntensity={sceneLighting?.ambientIntensity}
          />
        </Suspense>
      )}
      
      {loadedComponents.aurora && visualEffects.aurora && breathingManager && (
        <Suspense fallback={null}>
          <AtmosphericAurora 
            breathingManager={breathingManager}
            atmosphericIntensity={atmosphericIntensity}
            glitchLevel={glitchLevel}
            auroraCount={auroraSettings?.layerCount || settings.auroraLayers}
            densityMultiplier={auroraSettings?.density || 1.0}
            coverageMultiplier={auroraSettings?.coverage || 1.0}
            lightingColor={sceneLighting?.color}
            lightingIntensity={sceneLighting?.directionalIntensity}
          />
        </Suspense>
      )}
      
      {loadedComponents.particles && visualEffects.particles && emotionManager && breathingManager && (
        <Suspense fallback={null}>
          <AtmosphericParticleField
            emotionManager={emotionManager}
            breathingManager={breathingManager}
          />
        </Suspense>
      )}
      
      {loadedComponents.rain && visualEffects.rain && breathingManager && (
        <Suspense fallback={null}>
          <AtmosphericRain
            breathingManager={breathingManager}
            atmosphericIntensity={atmosphericIntensity}
            glitchLevel={glitchLevel}
            density={1.0}
          />
        </Suspense>
      )}
      
      {loadedComponents.objects && position && (
        <Suspense fallback={null}>
          {handleCaseFileClick && (
            <CaseFileDisplay
              position={position.caseFile}
              onCaseFileClick={handleCaseFileClick}
            />
          )}
          {handleSuitcaseClick && (
            <SuitcaseDisplay
              position={position.suitcase}
              onSuitcaseClick={handleSuitcaseClick}
            />
          )}
          {handleGamepadClick && (
            <GamepadController
              position={position.gamepad}
              onControllerClick={handleGamepadClick}
            />
          )}
        </Suspense>
      )}
      
      {/* Integrated Persona - loads with objects */}
      {loadedComponents.objects && persona && (
        <Suspense fallback={null}>
          <Persona3D
            persona={persona}
            position={[personaPosition.x, personaPosition.y, personaPosition.z]}
            scale={personaScale}
            onClick={() => {
              console.log('[DEBUG] SceneLoader persona click handler called')
              handlePersonaClick?.()
            }}
          />
        </Suspense>
      )}
      
      {children}
    </>
  )
}

export default SceneLoader