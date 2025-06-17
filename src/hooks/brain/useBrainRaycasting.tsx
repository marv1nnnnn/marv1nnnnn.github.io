import { useCallback, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Raycaster, Vector2, Vector3, Intersection, Mesh, BufferAttribute } from 'three'

/**
 * @interface BrainRegionHit
 * @description Represents the data returned when a raycast intersects with a brain region.
 * @property {string} regionId - The unique identifier of the hit region (e.g., 'frontal-cortex').
 * @property {Vector3} position - The world-space position of the intersection point.
 * @property {string} color - The hex color code of the intersected vertex, used for region identification.
 * @property {number} distance - The distance from the camera to the intersection point.
 * @property {Vector3} point - The intersection point in world coordinates.
 * @property {Vector3} normal - The normal vector of the intersected face.
 */
export interface BrainRegionHit {
  regionId: string
  position: Vector3
  color: string
  distance: number
  point: Vector3
  normal: Vector3
}

/**
 * @interface RaycastingOptions
 * @description Defines the configuration options for the `useBrainRaycasting` hook.
 * @property {(region: BrainRegionHit) => void} [onRegionClick] - Callback function triggered when a brain region is clicked.
 * @property {(region: BrainRegionHit | null) => void} [onRegionHover] - Callback function triggered on mouse hover over a region.
 * @property {boolean} [enableHover=true] - Enables or disables the hover detection functionality.
 */
interface RaycastingOptions {
  onRegionClick?: (region: BrainRegionHit) => void
  onRegionHover?: (region: BrainRegionHit | null) => void
  enableHover?: boolean
}

// Brain region color to ID mapping - MUST match Brain.tsx exactly
const COLOR_TO_REGION: Record<string, string> = {
  '#0099ff': 'frontal-cortex',    // Blue - frontal lobe
  '#9966ff': 'temporal-lobe-left', // Purple - temporal lobe left
  '#00cc66': 'motor-cortex',      // Green - motor cortex  
  '#ff6600': 'occipital-lobe',    // Orange - occipital lobe
  '#ff3366': 'brainstem',         // Pink - brainstem
}

// Helper function to convert color values to hex string
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Find closest matching brain region based on color similarity
function findClosestRegion(color: { r: number, g: number, b: number }): string | null {
  const targetHex = rgbToHex(color.r, color.g, color.b)
  
  // Try exact match first
  if (COLOR_TO_REGION[targetHex]) {
    return COLOR_TO_REGION[targetHex]
  }
  
  // Find closest color match with some tolerance
  let closestRegion = null
  let minDistance = Infinity
  
  Object.entries(COLOR_TO_REGION).forEach(([hexColor, regionId]) => {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255
    const g = parseInt(hexColor.slice(3, 5), 16) / 255
    const b = parseInt(hexColor.slice(5, 7), 16) / 255
    
    const distance = Math.sqrt(
      Math.pow(color.r - r, 2) + 
      Math.pow(color.g - g, 2) + 
      Math.pow(color.b - b, 2)
    )
    
    if (distance < minDistance && distance < 0.1) { // Tolerance threshold
      minDistance = distance
      closestRegion = regionId
    }
  })
  
  return closestRegion
}

/**
 * A custom hook to handle raycasting against the 3D brain model for user interaction.
 *
 * This hook sets up a `Raycaster` that translates 2D mouse coordinates into the 3D scene.
 * It identifies which brain region is being pointed at by checking the vertex color of the
 * intersected face on the brain mesh. It manages event listeners for clicks and mouse
 * movements to provide hover and click feedback.
 *
 * @param {RaycastingOptions} options - Configuration callbacks and options for the raycasting behavior.
 * @returns An object containing methods to control raycasting, manage event listeners, and access the current state.
 */
export function useBrainRaycasting(options: RaycastingOptions = {}) {
  const { onRegionClick, onRegionHover, enableHover = true } = options
  
  const { camera, gl, scene } = useThree()
  const raycaster = useRef(new Raycaster())
  const mouse = useRef(new Vector2())
  const hoveredRegion = useRef<BrainRegionHit | null>(null)
  
  // Cast ray and detect brain region
  const castRay = useCallback((clientX: number, clientY: number): BrainRegionHit | null => {
    if (!camera || !gl.domElement) {
      console.log('Missing camera or domElement:', { camera: !!camera, domElement: !!gl.domElement })
      return null
    }
    
    const rect = gl.domElement.getBoundingClientRect()
    
    // Convert mouse coordinates to normalized device coordinates (-1 to +1)
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
    
    console.log('Mouse NDC:', mouse.current.x, mouse.current.y)
    
    // Configure raycaster with better settings for brain mesh intersection
    raycaster.current.setFromCamera(mouse.current, camera)
    
    // Set raycaster parameters for better detection
    raycaster.current.near = 0.1
    raycaster.current.far = 1000
    raycaster.current.params.Points = { threshold: 0.1 }
    raycaster.current.params.Line = { threshold: 0.1 }
    
    // Find only the brain mesh specifically
    const brainMeshes = scene.children.filter(child => 
      child.type === 'Mesh' && 
      (child.name === 'brainMesh' || (child as Mesh).geometry?.attributes?.color)
    )
    
    console.log('Brain meshes found:', brainMeshes.length)
    
    if (brainMeshes.length === 0) {
      console.log('No brain mesh found in scene')
      return null
    }
    
    // Update world matrices for all brain meshes
    brainMeshes.forEach(mesh => {
      mesh.updateMatrixWorld(true)
    })
    
    // Find intersections with brain mesh only
    const intersects = raycaster.current.intersectObjects(brainMeshes, false)
    console.log('Brain intersects found:', intersects.length)
    
    // DEBUG: Log all intersections found
    intersects.forEach((intersect, i) => {
      const mesh = intersect.object as Mesh
      console.log(`Intersect ${i}:`, {
        type: intersect.object.type,
        name: intersect.object.name,
        hasGeometry: !!mesh.geometry,
        hasColorAttribute: !!mesh.geometry?.attributes.color,
        distance: intersect.distance,
        faceIndex: intersect.faceIndex,
        point: intersect.point,
        face: intersect.face,
        uv: intersect.uv
      })
    })

    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[i]
      const mesh = intersect.object as Mesh
      
      console.log(`Processing intersect ${i}:`, {
        hasGeometry: !!mesh.geometry,
        hasColorAttribute: !!mesh.geometry?.attributes.color,
        distance: intersect.distance,
        faceIndex: intersect.faceIndex
      })
      
      // Check if this is a brain mesh (has vertex colors)
      if (mesh.geometry && mesh.geometry.attributes.color) {
        const colorAttribute = mesh.geometry.attributes.color as BufferAttribute
        const faceIndex = intersect.faceIndex
        
        if (faceIndex !== undefined) {
          // Get vertex colors for the intersected face
          const face = intersect.face
          if (!face) {
            console.log('No face data for intersect')
            continue
          }
          
          // Get color from the first vertex of the face
          const vertexIndex = face.a
          const r = colorAttribute.getX(vertexIndex)
          const g = colorAttribute.getY(vertexIndex)
          const b = colorAttribute.getZ(vertexIndex)
          
          console.log('Vertex color:', { r, g, b })
          
          // Find corresponding brain region
          const regionId = findClosestRegion({ r, g, b })
          console.log('Found region:', regionId)
          
          if (regionId) {
            const colorHex = rgbToHex(r, g, b)
            
            return {
              regionId,
              position: intersect.point.clone(),
              color: colorHex,
              distance: intersect.distance,
              point: intersect.point.clone(),
              normal: intersect.face?.normal.clone() || new Vector3(0, 1, 0)
            }
          }
        }
      }
    }
    
    console.log('No brain mesh intersection found')
    return null
  }, [camera, gl, scene])
  
  // Handle click events
  const handleClick = useCallback((event: MouseEvent) => {
    console.log('Brain click detected at:', event.clientX, event.clientY)
    const hit = castRay(event.clientX, event.clientY)
    console.log('Raycast hit result:', hit)
    if (hit && onRegionClick) {
      console.log('Calling onRegionClick with:', hit)
      onRegionClick(hit)
    } else {
      console.log('No hit detected or no onRegionClick callback')
    }
  }, [castRay, onRegionClick])
  
  // Handle hover events
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enableHover) return
    
    const hit = castRay(event.clientX, event.clientY)
    
    // Check if hover state changed
    const prevRegion = hoveredRegion.current?.regionId
    const currentRegion = hit?.regionId
    
    if (prevRegion !== currentRegion) {
      hoveredRegion.current = hit
      if (onRegionHover) {
        onRegionHover(hit)
      }
    }
  }, [castRay, onRegionHover, enableHover])
  
  // Setup event listeners
  const attachEventListeners = useCallback(() => {
    if (!gl.domElement) return
    
    gl.domElement.addEventListener('click', handleClick)
    if (enableHover) {
      gl.domElement.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => {
      gl.domElement?.removeEventListener('click', handleClick)
      gl.domElement?.removeEventListener('mousemove', handleMouseMove)
    }
  }, [gl.domElement, handleClick, handleMouseMove, enableHover])
  
  // Remove event listeners
  const detachEventListeners = useCallback(() => {
    if (!gl.domElement) return
    
    gl.domElement.removeEventListener('click', handleClick)
    gl.domElement.removeEventListener('mousemove', handleMouseMove)
  }, [gl.domElement, handleClick, handleMouseMove])
  
  // Manual ray casting (for programmatic use)
  const raycastAtPosition = useCallback((x: number, y: number): BrainRegionHit | null => {
    return castRay(x, y)
  }, [castRay])
  
  // Get current hovered region
  const getCurrentHoveredRegion = useCallback((): BrainRegionHit | null => {
    return hoveredRegion.current
  }, [])
  
  // Clear hover state
  const clearHover = useCallback(() => {
    if (hoveredRegion.current) {
      hoveredRegion.current = null
      if (onRegionHover) {
        onRegionHover(null)
      }
    }
  }, [onRegionHover])
  
  return {
    // Core functionality
    castRay,
    raycastAtPosition,
    
    // Event handling
    attachEventListeners,
    detachEventListeners,
    
    // State management
    getCurrentHoveredRegion,
    clearHover,
    
    // Utilities
    mouse: mouse.current,
    raycaster: raycaster.current
  }
}