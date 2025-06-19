import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, BufferGeometry, BufferAttribute, Vector3, Color, ShaderMaterial, DoubleSide } from 'three'
import { useBrainCamera } from '../../hooks/brain/useBrainCamera'
import { useBrainRaycastingNew as useBrainRaycasting, BrainRegionHit } from '../../hooks/brain/useBrainRaycastingNew'
import { useBrainRotation } from '../../hooks/brain/useBrainRotation'
/**
 * @interface BrainProps
 * @description Defines the props for the Brain component.
 * @property {number[]} [position=[0,0,0]] - The 3D position of the brain model.
 * @property {number} [scale=1] - The scale of the brain model.
 * @property {boolean} [isActive=true] - Controls the "energy" level of the brain's shader, affecting its brightness and pulse.
 * @property {boolean} [enableCameraControl=true] - Enables the state-based camera control system.
 * @property {boolean} [enableRaycasting=true] - Enables raycasting for detecting user interaction (clicks, hovers).
 * @property {(region: BrainRegionHit) => void} [onRegionClick] - Callback function triggered when a brain region is clicked.
 * @property {(region: BrainRegionHit | null) => void} [onRegionHover] - Callback function triggered when the mouse hovers over a brain region.
 * @property {boolean} [autoRotateInOverview=true] - Enables automatic rotation of the brain when the camera is in the 'overview' state.
 */
interface BrainProps {
  position?: [number, number, number]
  scale?: number
  isActive?: boolean
  enableCameraControl?: boolean
  enableRaycasting?: boolean
  enableManualRotation?: boolean
  onRegionClick?: (region: BrainRegionHit) => void
  onRegionHover?: (region: BrainRegionHit | null) => void
  autoRotateInOverview?: boolean
}

// Anatomical region color mapping - EXACT match with raycasting system
const BRAIN_COLORS = {
  frontal: new Color(0, 0.6, 1),      // #0099ff - Blue - UI modules (frontal lobe)
  temporal: new Color(0.6, 0.4, 1),   // #9966ff - Purple - Media modules (temporal lobe) 
  parietal: new Color(0, 0.8, 0.4),   // #00cc66 - Green - System modules (parietal lobe)
  occipital: new Color(1, 0.4, 0),    // #ff6600 - Orange - AI/Personality modules (occipital lobe)
  brainstem: new Color(1, 0.2, 0.4),  // #ff3366 - Pink - Core systems (brainstem/cerebellum)
}

// Simplified working shader for brain visibility
const brainVertexShader = `
  varying vec3 vColor;
  
  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const brainFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Enhance the colors and add some glow
    vec3 color = vColor * 1.2;
    float alpha = 0.8;
    
    // Add a subtle glow effect
    float glow = length(vColor) * 0.3;
    color += glow;
    
    gl_FragColor = vec4(color, alpha);
  }
`

/**
 * Renders a procedurally generated 3D brain model with interactive regions.
 *
 * This component forms the core of the 3D brain visualization. It handles:
 * - **Procedural Geometry:** Creates a brain-like shape using modified spherical coordinates and noise.
 * - **Vertex Coloring:** Assigns colors to vertices based on anatomical regions, enabling raycasting to identify regions.
 * - **Custom Shaders:** Implements a custom shader for visual effects like a "breathing" pulse, fresnel glow, and energy levels.
 * - **Interactivity:** Integrates `useBrainCamera` for animated camera movements and `useBrainRaycasting` for user interaction.
 * - **Controls:** Exposes a set of controls via `userData` for parent components to programmatically interact with the brain.
 *
 * @param {BrainProps} props - The component props.
 * @returns {React.ReactElement} A Three.js mesh element representing the brain.
 */
const Brain = React.forwardRef<Mesh, BrainProps>(({
  position = [0, 0, 0],
  scale = 1,
  isActive = true,
  enableCameraControl = true,
  enableRaycasting = true,
  enableManualRotation = true,
  onRegionClick,
  onRegionHover,
  autoRotateInOverview = true
}, ref) => {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)

  // Initialize camera control system (disable auto-rotation when manual rotation is enabled)
  const brainCamera = useBrainCamera({
    enableAutoRotation: autoRotateInOverview && !enableManualRotation,
    autoRotationSpeed: 0.05,
    transitionDuration: 2000
  })

  // Expose camera controls via mesh userData for parent components
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.brainCamera = brainCamera
    }
    // Also set the ref if provided
    if (ref) {
      if (typeof ref === 'function') {
        ref(meshRef.current)
      } else {
        ref.current = meshRef.current
      }
    }
  }, [brainCamera, ref])

  // Initialize raycasting system
  const brainRaycasting = useBrainRaycasting({
    onRegionClick: onRegionClick,
    onRegionHover: onRegionHover,
    enableHover: !!onRegionHover
  })

  // Initialize manual rotation system
  const brainRotation = useBrainRotation({
    enabled: enableManualRotation,
    rotationSpeed: 0.01,
    targetRef: meshRef
  })

  // Procedurally generate brain geometry with vertex coloring
  const brainGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    
    // Brain parameters
    const segments = 64  // Higher resolution for smooth appearance
    const rings = 48
    const radius = 4
    
    const vertices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    
    // Generate brain-shaped vertices using modified spherical coordinates
    for (let ring = 0; ring <= rings; ring++) {
      const phi = (ring / rings) * Math.PI
      const y = Math.cos(phi)
      
      for (let segment = 0; segment <= segments; segment++) {
        const theta = (segment / segments) * Math.PI * 2
        
        // Basic spherical coordinates
        let x = Math.sin(phi) * Math.cos(theta)
        let z = Math.sin(phi) * Math.sin(theta)
        
        // Brain shape modifications for anatomical accuracy
        let brainRadius = radius
        
        // Frontal lobe expansion (front of brain)
        if (z > 0.2) {
          brainRadius *= 1.15 + Math.sin(phi * 2) * 0.1
        }
        
        // Occipital lobe (back of brain) - slightly smaller
        if (z < -0.3) {
          brainRadius *= 0.9 + Math.cos(phi * 1.5) * 0.05
        }
        
        // Temporal lobe bulges (sides)
        if (Math.abs(x) > 0.4 && y > -0.3 && y < 0.5) {
          brainRadius *= 1.1 + Math.sin(theta * 4) * 0.03
        }
        
        // Brainstem narrowing (bottom)
        if (y < -0.6) {
          brainRadius *= 0.7 - (y + 0.6) * 0.5
        }
        
        // Apply brain-like surface irregularities
        const surfaceNoise = Math.sin(x * 8) * Math.cos(y * 6) * Math.sin(z * 7) * 0.02
        brainRadius += surfaceNoise
        
        // Final vertex position
        const vertex = new Vector3(x * brainRadius, y * brainRadius, z * brainRadius)
        vertices.push(vertex.x, vertex.y, vertex.z)
        
        // Calculate normal for lighting
        const normal = vertex.clone().normalize()
        normals.push(normal.x, normal.y, normal.z)
        
        // Determine brain region color based on position
        let regionColor = BRAIN_COLORS.frontal // Default to frontal
        
        // Frontal lobe (front, upper)
        if (z > 0.1 && y > -0.2) {
          regionColor = BRAIN_COLORS.frontal
        }
        // Temporal lobes (sides, middle)
        else if (Math.abs(x) > 0.4 && y > -0.4 && y < 0.3) {
          regionColor = BRAIN_COLORS.temporal
        }
        // Parietal lobe (top, back-middle)
        else if (y > 0.2 && z < 0.1 && z > -0.3) {
          regionColor = BRAIN_COLORS.parietal
        }
        // Occipital lobe (back)
        else if (z < -0.2 && y > -0.3) {
          regionColor = BRAIN_COLORS.occipital
        }
        // Brainstem and lower regions
        else if (y < -0.3) {
          regionColor = BRAIN_COLORS.brainstem
        }
        
        // Add smooth color blending at boundaries
        const blendFactor = 0.8 // How much to blend colors
        const neighborInfluence = 1 - blendFactor
        
        // Blend with neighboring regions for smooth transitions
        let finalColor = regionColor.clone()
        
        // Smooth transition logic
        if (Math.abs(z) < 0.2 && Math.abs(x) < 0.5) {
          // Central transition area - blend multiple regions
          finalColor.lerp(BRAIN_COLORS.parietal, neighborInfluence * 0.3)
        }
        
        colors.push(finalColor.r, finalColor.g, finalColor.b)
      }
    }
    
    // Generate indices for triangulated mesh
    for (let ring = 0; ring < rings; ring++) {
      for (let segment = 0; segment < segments; segment++) {
        const a = ring * (segments + 1) + segment
        const b = ring * (segments + 1) + segment + 1
        const c = (ring + 1) * (segments + 1) + segment
        const d = (ring + 1) * (segments + 1) + segment + 1
        
        // Two triangles per quad
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }
    
    // Set geometry attributes
    geometry.setIndex(indices)
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    
    // CRITICAL: Compute vertex normals for proper lighting and raycasting
    geometry.computeVertexNormals()
    
    // CRITICAL: Explicitly compute bounding box and bounding sphere for raycasting
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
    // Mark geometry as needing updates
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.normal.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    
    console.log('Brain geometry created:', {
      vertices: vertices.length / 3,
      faces: indices.length / 3,
      boundingBox: geometry.boundingBox,
      boundingSphere: geometry.boundingSphere
    })
    
    return geometry
  }, [])

  // Update world matrix for raycasting (rotation is now handled by useBrainRotation)
  useFrame(() => {
    if (!meshRef.current) return
    
    // CRITICAL: Ensure world matrix is updated for raycasting
    meshRef.current.updateMatrixWorld(true)
  })

  // Set up event listeners for raycasting and rotation when component mounts
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = []
    
    if (enableRaycasting) {
      console.log('Brain: Setting up event listeners for raycasting')
      const raycastCleanup = brainRaycasting.attachEventListeners()
      if (raycastCleanup) cleanupFunctions.push(raycastCleanup)
    }
    
    if (enableManualRotation) {
      console.log('Brain: Setting up event listeners for manual rotation')
      const rotationCleanup = brainRotation.attachEventListeners()
      if (rotationCleanup) cleanupFunctions.push(rotationCleanup)
    }
    
    return () => {
      console.log('Brain: Cleaning up event listeners')
      cleanupFunctions.forEach(cleanup => cleanup())
      brainRaycasting.detachEventListeners()
      brainRotation.detachEventListeners()
    }
  }, [enableRaycasting, enableManualRotation, onRegionClick, onRegionHover, brainRaycasting, brainRotation])

  // Log mesh information for debugging
  useEffect(() => {
    if (meshRef.current) {
      console.log('Brain mesh mounted:', {
        geometry: !!meshRef.current.geometry,
        material: !!meshRef.current.material,
        visible: meshRef.current.visible,
        position: meshRef.current.position,
        scale: meshRef.current.scale,
        boundingBox: meshRef.current.geometry?.boundingBox,
        hasColorAttribute: !!meshRef.current.geometry?.attributes.color
      })
    }
  }, [])

  // Expose camera and raycasting functionality via ref (optional)
  /**
   * @description A control object exposed via the mesh's `userData` property.
   * Allows parent components to programmatically control the brain's camera and raycasting.
   * @type {BrainControls}
   */
  const brainControls = {
    // Camera controls
    transitionToState: brainCamera.transitionToState,
    focusOnRegion: brainCamera.focusOnRegion,
    returnToOverview: brainCamera.returnToOverview,
    getCurrentCameraState: brainCamera.getCameraInfo,
    
    // Raycasting controls
    raycastAtPosition: brainRaycasting.castRay,
    getCurrentHoveredRegion: brainRaycasting.getCurrentHoveredRegion,
    clearHover: brainRaycasting.clearHover,
    
    // Combined functionality
    clickRegionAt: (x: number, y: number) => {
      const hit = brainRaycasting.castRay(x, y)
      if (hit && enableCameraControl) {
        brainCamera.focusOnRegion(hit.regionId)
      }
      return hit
    }
  }

  return (
    <mesh
      ref={meshRef}
      geometry={brainGeometry}
      position={position}
      scale={scale}
      userData={{ brainControls }} // Expose controls via userData for parent access
      castShadow={false}
      receiveShadow={false}
      name="brainMesh" // Add name for debugging
    >
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={brainVertexShader}
        fragmentShader={brainFragmentShader}
        transparent={true}
        vertexColors={true}
        side={DoubleSide} // DoubleSide to ensure faces are visible from both sides
        depthWrite={true} // Enable depth writing for proper raycasting
        blending={1} // NormalBlending instead of AdditiveBlending
      />
    </mesh>
  )
})

Brain.displayName = 'Brain'

export default Brain

/**
 * @interface BrainControls
 * @description Defines the control functions exposed by the Brain component.
 * This allows parent components to interact with the brain's camera and raycasting systems.
 */
export interface BrainControls {
  /** Transitions the camera smoothly to a predefined state (e.g., 'overview', 'frontal-zoom'). */
  transitionToState: (state: import('../../hooks/brain/useBrainCamera').CameraState) => void
  /** Focuses the camera on a specific brain region, triggering a transition to the appropriate state. */
  focusOnRegion: (regionId: string) => void
  /** Returns the camera to the default 'overview' state. */
  returnToOverview: () => void
  /** Gets the current state and position information of the camera. */
  getCurrentCameraState: () => any
  /** Programmatically performs a raycast at given screen coordinates to identify a brain region. */
  raycastAtPosition: (x: number, y: number) => BrainRegionHit | null
  /** Retrieves the currently hovered brain region, if any. */
  getCurrentHoveredRegion: () => BrainRegionHit | null
  /** Clears the current hover state. */
  clearHover: () => void
  /** Simulates a click at a screen position, identifying the region and focusing the camera on it. */
  clickRegionAt: (x: number, y: number) => BrainRegionHit | null
}