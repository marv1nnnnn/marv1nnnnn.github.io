import { useCallback, useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Raycaster, Vector2, Vector3, Intersection, Mesh } from 'three'

export interface BrainRegionHit {
  regionId: string
  position: Vector3
  color: string
  distance: number
  point: Vector3
  normal: Vector3
}

interface RaycastingOptions {
  onRegionClick?: (region: BrainRegionHit) => void
  onRegionHover?: (region: BrainRegionHit | null) => void
  enableHover?: boolean
}

// Simplified color mapping - exact match with Brain.tsx colors
const BRAIN_COLORS = {
  frontal: { r: 0, g: 0.6, b: 1 },      // #0099ff - Blue
  temporal: { r: 0.6, g: 0.4, b: 1 },   // #9966ff - Purple  
  parietal: { r: 0, g: 0.8, b: 0.4 },   // #00cc66 - Green
  occipital: { r: 1, g: 0.4, b: 0 },    // #ff6600 - Orange
  brainstem: { r: 1, g: 0.2, b: 0.4 },  // #ff3366 - Pink
}

// Map colors to region IDs
function getRegionFromColor(r: number, g: number, b: number): string | null {
  const tolerance = 0.1
  
  // Check each brain region color
  for (const [regionKey, color] of Object.entries(BRAIN_COLORS)) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) + 
      Math.pow(g - color.g, 2) + 
      Math.pow(b - color.b, 2)
    )
    
    if (distance < tolerance) {
      // Map to proper region IDs
      switch (regionKey) {
        case 'frontal': return 'frontal-cortex'
        case 'temporal': return 'temporal-lobe-left'
        case 'parietal': return 'motor-cortex'
        case 'occipital': return 'occipital-lobe'
        case 'brainstem': return 'brainstem'
        default: return null
      }
    }
  }
  
  return null
}

export function useBrainRaycastingNew(options: RaycastingOptions = {}) {
  const { onRegionClick, onRegionHover, enableHover = true } = options
  const { camera, gl, scene } = useThree()
  
  const raycaster = useRef(new Raycaster())
  const mouse = useRef(new Vector2())
  const hoveredRegion = useRef<BrainRegionHit | null>(null)
  const isDragging = useRef(false)
  const dragStartTime = useRef(0)
  
  // Cast ray and detect brain region
  const castRay = useCallback((clientX: number, clientY: number): BrainRegionHit | null => {
    if (!camera || !gl.domElement) {
      console.log('Missing camera or domElement for raycasting')
      return null
    }
    
    const rect = gl.domElement.getBoundingClientRect()
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
    
    console.log('Mouse NDC:', mouse.current.x, mouse.current.y)
    
    raycaster.current.setFromCamera(mouse.current, camera)
    
    // Find brain meshes only
    const brainMeshes = scene.children.filter(child => 
      child.type === 'Mesh' && 
      child.name === 'brainMesh'
    ) as Mesh[]
    
    console.log('Brain meshes found:', brainMeshes.length)
    
    if (brainMeshes.length === 0) {
      console.log('No brain meshes found in scene')
      return null
    }
    
    // Update matrices
    brainMeshes.forEach(mesh => mesh.updateMatrixWorld(true))
    
    // Raycast
    const intersects = raycaster.current.intersectObjects(brainMeshes, false)
    
    for (const intersect of intersects) {
      const mesh = intersect.object as Mesh
      const geometry = mesh.geometry
      
      if (!geometry?.attributes?.color || intersect.faceIndex === undefined) continue
      
      const colorAttribute = geometry.attributes.color
      const face = intersect.face
      if (!face) continue
      
      // Get color from first vertex of face
      const vertexIndex = face.a
      const r = colorAttribute.getX(vertexIndex)
      const g = colorAttribute.getY(vertexIndex)
      const b = colorAttribute.getZ(vertexIndex)
      
      const regionId = getRegionFromColor(r, g, b)
      
      if (regionId) {
        return {
          regionId,
          position: intersect.point.clone(),
          color: `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`,
          distance: intersect.distance,
          point: intersect.point.clone(),
          normal: face.normal.clone()
        }
      }
    }
    
    return null
  }, [camera, gl, scene])
  
  // Handle mouse down - track for drag detection
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0) return // Only left mouse button
    
    isDragging.current = false
    dragStartTime.current = Date.now()
  }, [])
  
  // Handle mouse move - track dragging
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const moveTime = Date.now() - dragStartTime.current
    if (moveTime > 100) { // If moving for more than 100ms, consider it dragging
      isDragging.current = true
    }
    
    if (!enableHover || isDragging.current) return
    
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
  
  // Handle click - only if not dragging
  const handleClick = useCallback((event: MouseEvent) => {
    console.log('Click detected - isDragging:', isDragging.current)
    
    // Don't process clicks if we were dragging
    if (isDragging.current) {
      console.log('Ignoring click because was dragging')
      isDragging.current = false
      return
    }
    
    console.log('Processing click for brain region detection')
    const hit = castRay(event.clientX, event.clientY)
    console.log('Raycast result:', hit)
    
    if (hit && onRegionClick) {
      console.log('Brain region clicked:', hit.regionId)
      onRegionClick(hit)
    } else {
      console.log('No hit detected or no onRegionClick callback')
    }
    
    isDragging.current = false
  }, [castRay, onRegionClick])
  
  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Reset dragging state after a short delay to allow click to process
    setTimeout(() => {
      isDragging.current = false
    }, 50)
  }, [])
  
  // Setup event listeners
  const attachEventListeners = useCallback(() => {
    if (!gl.domElement) return
    
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('click', handleClick)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      if (gl.domElement) {
        gl.domElement.removeEventListener('mousedown', handleMouseDown)
        gl.domElement.removeEventListener('mousemove', handleMouseMove)
        gl.domElement.removeEventListener('click', handleClick)
        gl.domElement.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [gl.domElement, handleMouseDown, handleMouseMove, handleClick, handleMouseUp])
  
  // Remove event listeners
  const detachEventListeners = useCallback(() => {
    if (!gl.domElement) return
    
    gl.domElement.removeEventListener('mousedown', handleMouseDown)
    gl.domElement.removeEventListener('mousemove', handleMouseMove)
    gl.domElement.removeEventListener('click', handleClick)
    gl.domElement.removeEventListener('mouseup', handleMouseUp)
  }, [gl.domElement, handleMouseDown, handleMouseMove, handleClick, handleMouseUp])
  
  return {
    castRay,
    attachEventListeners,
    detachEventListeners,
    getCurrentHoveredRegion: () => hoveredRegion.current,
    clearHover: () => {
      hoveredRegion.current = null
      if (onRegionHover) onRegionHover(null)
    }
  }
}