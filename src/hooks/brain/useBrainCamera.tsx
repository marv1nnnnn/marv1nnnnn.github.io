import { useState, useCallback, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Euler, Camera } from 'three'
import { useSpring, config } from 'react-spring'

/**
 * Defines the possible states for the brain camera. Each state corresponds to a
 * predefined position, target, and field-of-view, allowing for controlled
 * animated transitions between different views of the brain model.
 */
export type CameraState = 'overview' | 'frontal-zoom' | 'temporal-zoom' | 'parietal-zoom' | 'occipital-zoom'

interface CameraPosition {
  position: Vector3
  target: Vector3
  rotation?: Euler
  fov?: number
}

// Define camera states based on brain anatomy and technical specification
const CAMERA_STATES: Record<CameraState, CameraPosition> = {
  overview: {
    position: new Vector3(0, 8, 25), // Moved farther for better viewport
    target: new Vector3(0, 0, 0),
    fov: 60
  },
  'frontal-zoom': {
    position: new Vector3(0, 6, 16),
    target: new Vector3(0, 2.5, 4), // Focus on frontal cortex
    fov: 45
  },
  'temporal-zoom': {
    position: new Vector3(-12, 4, 6),
    target: new Vector3(-4.5, 0.5, 0), // Focus on temporal lobe
    fov: 50
  },
  'parietal-zoom': {
    position: new Vector3(0, 16, 4),
    target: new Vector3(0, 4.5, 0), // Focus on motor cortex/parietal
    fov: 45
  },
  'occipital-zoom': {
    position: new Vector3(0, 4, -16),
    target: new Vector3(0, 1, -4.5), // Focus on occipital lobe
    fov: 50
  }
}

/**
 * @interface BrainCameraOptions
 * @description Defines the configuration options for the `useBrainCamera` hook.
 * @property {number} [transitionDuration=2000] - The duration of the camera transition animation in milliseconds.
 * @property {boolean} [enableAutoRotation=false] - Enables automatic rotation when the camera is in the 'overview' state.
 * @property {number} [autoRotationSpeed=0.1] - The speed of the automatic rotation.
 */
interface BrainCameraOptions {
  transitionDuration?: number
  enableAutoRotation?: boolean
  autoRotationSpeed?: number
}

/**
 * A custom hook for managing the state and movement of the camera in the 3D brain scene.
 *
 * This hook provides a state-based system for controlling the camera's position, target, and FOV.
 * It uses `react-spring` to create smooth, interruptible transitions between predefined states
 * (e.g., a wide 'overview' shot, a 'frontal-zoom'). It also handles automatic rotation in
 * the overview state.
 *
 * @param {BrainCameraOptions} options - Configuration options for the camera behavior.
 * @returns An object containing the current camera state, control methods, and utility functions.
 */
export function useBrainCamera(options: BrainCameraOptions = {}) {
  const {
    transitionDuration = 2000,
    enableAutoRotation = false,
    autoRotationSpeed = 0.1
  } = options

  const [currentState, setCurrentState] = useState<CameraState>('overview')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1.0) // 1.0 = normal, < 1.0 = zoom in, > 1.0 = zoom out
  const { camera } = useThree()
  
  // Track current target for camera to look at
  const currentTarget = useRef(new Vector3(0, 0, 0))
  const targetRef = useRef(new Vector3(0, 0, 0))
  
  // Auto-rotation state
  const autoRotationAngle = useRef(0)
  const lastStateChange = useRef(Date.now())

  // Spring animation for smooth camera transitions
  const [{ position, target, fov }, springApi] = useSpring(() => ({
    position: CAMERA_STATES.overview.position.toArray(),
    target: CAMERA_STATES.overview.target.toArray(),
    fov: CAMERA_STATES.overview.fov || 60,
    config: config.gentle,
    onStart: () => setIsTransitioning(true),
    onRest: () => setIsTransitioning(false)
  }))

  // Transition to a new camera state
  const transitionToState = useCallback((newState: CameraState) => {
    if (newState === currentState && !isTransitioning) return

    const targetState = CAMERA_STATES[newState]
    if (!targetState) {
      console.warn(`Invalid camera state: ${newState}`)
      return
    }

    setCurrentState(newState)
    lastStateChange.current = Date.now()

    springApi.start({
      position: targetState.position.toArray(),
      target: targetState.target.toArray(),
      fov: targetState.fov || 60,
      config: {
        ...config.gentle,
        duration: transitionDuration
      }
    })

  }, [currentState, isTransitioning, springApi, transitionDuration])

  // Get camera state for a specific brain region
  const getCameraStateForRegion = useCallback((regionId: string): CameraState => {
    const regionToStateMap: Record<string, CameraState> = {
      'frontal-cortex': 'frontal-zoom',
      'temporal-lobe': 'temporal-zoom',
      'temporal-lobe-left': 'temporal-zoom',
      'temporal-lobe-right': 'temporal-zoom',
      'motor-cortex': 'parietal-zoom',
      'parietal-lobe': 'parietal-zoom',
      'occipital-lobe': 'occipital-zoom',
      'brainstem': 'overview' // Stay in overview for brainstem
    }

    return regionToStateMap[regionId] || 'overview'
  }, [])

  // Focus on a specific brain region
  const focusOnRegion = useCallback((regionId: string) => {
    const targetState = getCameraStateForRegion(regionId)
    transitionToState(targetState)
  }, [getCameraStateForRegion, transitionToState])

  // Return to overview
  const returnToOverview = useCallback(() => {
    transitionToState('overview')
  }, [transitionToState])

  // Manual camera position control (for debugging/testing)
  const setCameraPosition = useCallback((position: Vector3, target: Vector3, fov: number = 60) => {
    springApi.start({
      position: position.toArray(),
      target: target.toArray(),
      fov,
      config: config.gentle
    })
  }, [springApi])

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.max(0.3, prev - 0.2)) // Min zoom: 0.3 (very close)
  }, [])

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.min(3.0, prev + 0.2)) // Max zoom: 3.0 (far away)
  }, [])

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0)
  }, [])

  // Get current camera information
  const getCameraInfo = useCallback(() => ({
    state: currentState,
    isTransitioning,
    position: new Vector3(...position.get()),
    target: new Vector3(...target.get()),
    fov: fov.get(),
    zoomLevel
  }), [currentState, isTransitioning, position, target, fov, zoomLevel])

  // Auto-rotation logic for overview state
  useFrame((state, delta) => {
    if (!camera) return

    // Update camera position and target from spring animation
    const basePosition = new Vector3(...position.get())
    const currentTargetPos = new Vector3(...target.get())
    
    // Apply zoom by scaling the distance from target to camera
    const directionToCamera = basePosition.clone().sub(currentTargetPos)
    const zoomedPosition = currentTargetPos.clone().add(directionToCamera.multiplyScalar(zoomLevel))
    
    // Apply auto-rotation when in overview and not transitioning
    if (enableAutoRotation && currentState === 'overview' && !isTransitioning) {
      const timeSinceStateChange = Date.now() - lastStateChange.current
      
      // Wait 3 seconds after state change before starting auto-rotation
      if (timeSinceStateChange > 3000) {
        autoRotationAngle.current += autoRotationSpeed * delta
        
        // Rotate around the brain with zoom applied
        const radius = zoomedPosition.length()
        const rotatedPosition = new Vector3(
          Math.cos(autoRotationAngle.current) * radius,
          zoomedPosition.y,
          Math.sin(autoRotationAngle.current) * radius
        )
        
        camera.position.copy(rotatedPosition)
      } else {
        camera.position.copy(zoomedPosition)
      }
    } else {
      camera.position.copy(zoomedPosition)
      autoRotationAngle.current = Math.atan2(zoomedPosition.z, zoomedPosition.x)
    }

    // Update camera target and FOV
    currentTarget.current.copy(currentTargetPos)
    targetRef.current.copy(currentTargetPos)
    camera.lookAt(currentTargetPos)
    
    if ('fov' in camera) {
      camera.fov = fov.get()
      camera.updateProjectionMatrix()
    }
  })

  // Preset camera states for quick access
  const presetStates = {
    overview: () => transitionToState('overview'),
    frontalZoom: () => transitionToState('frontal-zoom'),
    temporalZoom: () => transitionToState('temporal-zoom'),
    parietalZoom: () => transitionToState('parietal-zoom'),
    occipitalZoom: () => transitionToState('occipital-zoom')
  }

  return {
    // Current state
    currentState,
    isTransitioning,
    zoomLevel,
    
    // Control methods
    transitionToState,
    focusOnRegion,
    returnToOverview,
    setCameraPosition,
    
    // Zoom controls
    zoomIn,
    zoomOut,
    resetZoom,
    
    // Utilities
    getCameraInfo,
    getCameraStateForRegion,
    
    // Preset shortcuts
    ...presetStates,
    
    // Internal references (for debugging)
    currentTarget: currentTarget.current,
    springValues: { position, target, fov }
  }
}