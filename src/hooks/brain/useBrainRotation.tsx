import { useCallback, useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector2, Euler, Object3D } from 'three'

interface BrainRotationOptions {
  enabled?: boolean
  rotationSpeed?: number
  targetRef?: React.RefObject<Object3D>
}

/**
 * Custom hook for handling mouse drag rotation of the brain
 */
export function useBrainRotation(options: BrainRotationOptions = {}) {
  const { enabled = true, rotationSpeed = 0.01, targetRef } = options
  const { gl } = useThree()
  
  const isDragging = useRef(false)
  const hasMovedEnough = useRef(false)
  const previousMousePosition = useRef(new Vector2())
  const currentRotation = useRef(new Euler())
  const dragThreshold = 10 // Pixels to move before considering it a drag
  const initialMousePosition = useRef(new Vector2())
  const mouseDownTime = useRef(0)
  
  // Handle mouse down - prepare for potential drag
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!enabled) return
    
    // Only handle left mouse button
    if (event.button !== 0) return
    
    initialMousePosition.current.set(event.clientX, event.clientY)
    previousMousePosition.current.set(event.clientX, event.clientY)
    mouseDownTime.current = Date.now()
    
    // Don't set dragging immediately - wait for movement
    isDragging.current = false
    hasMovedEnough.current = false
    gl.domElement.style.cursor = 'grabbing'
    
    event.preventDefault()
  }, [enabled, gl.domElement])
  
  // Handle mouse move - check for drag threshold
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled || mouseDownTime.current === 0) return
    
    // Check if we've moved enough to consider this a drag
    if (!hasMovedEnough.current) {
      const deltaX = event.clientX - initialMousePosition.current.x
      const deltaY = event.clientY - initialMousePosition.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance > dragThreshold) {
        hasMovedEnough.current = true
        isDragging.current = true
        event.stopPropagation() // Prevent click events
      } else {
        return // Not dragging yet
      }
    }
    
    // Only rotate if we're actually dragging
    if (!isDragging.current) return
    
    const deltaX = event.clientX - previousMousePosition.current.x
    const deltaY = event.clientY - previousMousePosition.current.y
    
    // Update rotation based on mouse movement
    if (targetRef?.current) {
      // Horizontal movement rotates around Y axis
      currentRotation.current.y += deltaX * rotationSpeed
      // Vertical movement rotates around X axis  
      currentRotation.current.x += deltaY * rotationSpeed
      
      // Clamp X rotation to prevent flipping
      currentRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentRotation.current.x))
      
      // Apply rotation
      targetRef.current.rotation.copy(currentRotation.current)
    }
    
    previousMousePosition.current.set(event.clientX, event.clientY)
    event.preventDefault()
    event.stopPropagation()
  }, [enabled, rotationSpeed, targetRef])
  
  // Handle mouse up - stop dragging when mouse button is released
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!enabled) return
    
    // If we were dragging, prevent click event
    if (isDragging.current) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // Reset all states
    isDragging.current = false
    hasMovedEnough.current = false
    mouseDownTime.current = 0
    gl.domElement.style.cursor = 'grab'
  }, [enabled, gl.domElement])
  
  // Handle mouse leave (stop dragging if mouse leaves the canvas)
  const handleMouseLeave = useCallback(() => {
    if (!enabled) return
    
    isDragging.current = false
    gl.domElement.style.cursor = 'default'
  }, [enabled, gl.domElement])
  
  // Setup event listeners
  const attachEventListeners = useCallback(() => {
    if (!gl.domElement || !enabled) return
    
    gl.domElement.style.cursor = 'grab'
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    gl.domElement.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      if (gl.domElement) {
        gl.domElement.style.cursor = 'default'
        gl.domElement.removeEventListener('mousedown', handleMouseDown)
        gl.domElement.removeEventListener('mousemove', handleMouseMove)
        gl.domElement.removeEventListener('mouseup', handleMouseUp)
        gl.domElement.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [gl.domElement, enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave])
  
  // Remove event listeners
  const detachEventListeners = useCallback(() => {
    if (!gl.domElement) return
    
    gl.domElement.style.cursor = 'default'
    gl.domElement.removeEventListener('mousedown', handleMouseDown)
    gl.domElement.removeEventListener('mousemove', handleMouseMove)
    gl.domElement.removeEventListener('mouseup', handleMouseUp)
    gl.domElement.removeEventListener('mouseleave', handleMouseLeave)
  }, [gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave])
  
  // Reset rotation
  const resetRotation = useCallback(() => {
    if (targetRef?.current) {
      currentRotation.current.set(0, 0, 0)
      targetRef.current.rotation.copy(currentRotation.current)
    }
  }, [targetRef])
  
  // Get current dragging state
  const getDraggingState = useCallback(() => isDragging.current, [])
  
  // Automatically attach/detach based on enabled state
  useEffect(() => {
    if (enabled) {
      attachEventListeners()
    } else {
      detachEventListeners()
      // Reset any active drag state when disabled
      isDragging.current = false
      hasMovedEnough.current = false
      mouseDownTime.current = 0
    }
    
    // Cleanup on unmount
    return () => {
      detachEventListeners()
    }
  }, [enabled, attachEventListeners, detachEventListeners])
  
  return {
    attachEventListeners,
    detachEventListeners,
    resetRotation,
    getDraggingState
  }
}