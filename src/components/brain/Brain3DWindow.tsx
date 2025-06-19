import React, { useRef, useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import ProgramErrorBoundary from './ProgramErrorBoundary'
import { ChaosProvider, useChaos } from '@/contexts/ChaosProvider'
import { AIChatProvider } from '@/contexts/AIChatContext'
import { WindowManagerProvider } from '@/hooks/useWindowManager'
import { AudioVisualProvider } from '@/components/AudioVisualManager'

/**
 * Context wrapper for programs launched from the brain interface.
 * This ensures that React contexts are available within the Html portal
 * created by @react-three/drei, which doesn't automatically inherit context.
 */
interface ProgramContextWrapperProps {
  children: React.ReactNode
}

const ProgramContextWrapper: React.FC<ProgramContextWrapperProps> = ({ children }) => {
  return (
    <AIChatProvider>
      <WindowManagerProvider>
        <ChaosProvider>
          <AudioVisualProvider>
            {children}
          </AudioVisualProvider>
        </ChaosProvider>
      </WindowManagerProvider>
    </AIChatProvider>
  )
}

export interface Brain3DWindow {
  id: string
  programId: string
  title: string
  component: React.ReactNode
  position: [number, number, number]
  size: { width: number; height: number }
  icon?: string
  isMinimized?: boolean
  isFullscreen?: boolean
  regionId?: string
}

interface Brain3DWindowProps {
  window: Brain3DWindow
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize?: (id: string) => void
  onFocus: (id: string) => void
  onUpdatePosition?: (id: string, position: [number, number, number]) => void
  isActive: boolean
  zIndex: number
}

export default function Brain3DWindow({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onUpdatePosition,
  isActive,
  zIndex
}: Brain3DWindowProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const htmlRef = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [dragOffset, setDragOffset] = useState<[number, number, number]>([0, 0, 0])
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(window.position)
  const [htmlPosition, setHtmlPosition] = useState<[number, number, number]>([0, 0, 0.15])
  
  const { camera, raycaster, pointer, gl, size } = useThree()
  
  // Calculate viewport-aware bounds to prevent windows going off-screen
  const getViewportBounds = () => {
    const aspect = size.width / size.height
    const fov = (camera as THREE.PerspectiveCamera).fov
    const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0))
    
    // Calculate visible area at the brain's position (z=0)
    const vFOV = (fov * Math.PI) / 180
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance
    const visibleWidth = visibleHeight * aspect
    
    // Conservative bounds to keep windows fully visible
    const margin = 2 // Extra margin to ensure windows stay on screen
    return {
      minX: -visibleWidth / 2 + margin,
      maxX: visibleWidth / 2 - margin,
      minY: -visibleHeight / 2 + margin,
      maxY: visibleHeight / 2 - margin - 1, // Extra margin at top to prevent going above screen
      minZ: -8,
      maxZ: 8
    }
  }

  // Update position when window.position changes
  useEffect(() => {
    setCurrentPosition(window.position)
    // Active windows get moved forward in Z space for better layering
    const zOffset = isActive ? 0.3 : 0.15
    setHtmlPosition([
      window.position[0],
      window.position[1],
      window.position[2] + zOffset
    ])
  }, [window.position, isActive])

  // Gentle floating animation for the window
  useFrame((state) => {
    if (meshRef.current && !isDragging) {
      const pos = currentPosition
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      meshRef.current.position.set(
        pos[0],
        pos[1] + floatOffset,
        pos[2]
      )
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02
      
      // Update glow effect position
      if (glowRef.current) {
        glowRef.current.position.set(
          pos[0],
          pos[1] + floatOffset,
          pos[2] - 0.1
        )
      }
      
      // Update HTML position to follow the mesh with active window layering
      const zOffset = isActive ? 0.3 : 0.15
      setHtmlPosition([
        pos[0],
        pos[1] + floatOffset,
        pos[2] + zOffset
      ])
    }
  })

  // Simplified drag functionality using mouse events
  const handleMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIsDragging(true)
    onFocus(window.id)
    
    const startX = event.clientX
    const startY = event.clientY
    const startPosition = [...currentPosition] as [number, number, number]
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) * 0.01
      const deltaY = -(moveEvent.clientY - startY) * 0.01 // Invert Y for 3D space
      
      const newPosition: [number, number, number] = [
        startPosition[0] + deltaX,
        startPosition[1] + deltaY,
        startPosition[2]
      ]
      
      // Apply viewport-aware boundary constraints
      const bounds = getViewportBounds()
      const constrainedPosition: [number, number, number] = [
        Math.max(bounds.minX, Math.min(bounds.maxX, newPosition[0])),
        Math.max(bounds.minY, Math.min(bounds.maxY, newPosition[1])),
        Math.max(bounds.minZ, Math.min(bounds.maxZ, newPosition[2]))
      ]
      
      setCurrentPosition(constrainedPosition)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      if (onUpdatePosition) {
        onUpdatePosition(window.id, currentPosition)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Optimized window scale for far camera - larger base scale for visibility
  const baseScale = Math.max(0.8, Math.min(1.8, (window.size.width + window.size.height) / 800))
  const scale = baseScale

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Window Frame */}
      <mesh
        ref={meshRef}
        scale={[scale * 1.1, scale * 1.1, 0.1]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onFocus(window.id)}
      >
        <boxGeometry args={[window.size.width / 100, window.size.height / 100, 0.2]} />
        <meshStandardMaterial
          color={isActive ? '#5ba3f5' : hovered ? '#4a90e2' : '#2a2a2a'}
          transparent
          opacity={isActive ? 0.15 : 0.1}
          emissive={isActive ? '#2a5a8e' : hovered ? '#1a4a6e' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0.2}
        />
      </mesh>

      {/* Floating glow effect */}
      <mesh ref={glowRef} scale={[scale * 1.2, scale * 1.2, 0.05]} position={[0, 0, -0.1]}>
        <boxGeometry args={[window.size.width / 100, window.size.height / 100, 0.1]} />
        <meshStandardMaterial
          color={isActive ? '#00ccff' : '#4a90e2'}
          transparent
          opacity={isActive ? 0.4 : 0.3}
          emissive={isActive ? '#0088cc' : '#1a4a6e'}
          emissiveIntensity={isActive ? 0.8 : 0.5}
        />
      </mesh>

      {/* HTML Content */}
      <Html
        transform
        position={htmlPosition}
        center
        occlude
        style={{
          pointerEvents: 'auto',
          zIndex: zIndex,
          userSelect: 'none'
        }}
      >
        <AnimatePresence>
          {!window.isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className={`
                relative bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95
                backdrop-blur-xl
                border rounded-2xl overflow-hidden
                shadow-2xl transition-all duration-300
                ${isActive 
                  ? 'border-cyan-400/60 ring-2 ring-cyan-400/50 shadow-cyan-500/20 shadow-2xl' 
                  : 'border-white/20 shadow-black/50'
                }
              `}
              style={{
                width: window.isFullscreen ? size.width * 0.9 : window.size.width,
                height: window.isFullscreen ? size.height * 0.9 : window.size.height,
                visibility: 'visible',
                display: 'block'
              }}
              onMouseDown={() => onFocus(window.id)}
            >
              {/* Window Title Bar */}
              <motion.div
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-b border-gray-600/50 cursor-move"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onMouseDown={handleMouseDown}
              >
                <div className="flex items-center space-x-3">
                  {window.icon && (
                    <motion.span
                      className="text-lg"
                      animate={{ rotate: hovered ? [0, -5, 5, 0] : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {window.icon}
                    </motion.span>
                  )}
                  <h3 className="text-white font-semibold text-sm truncate max-w-[200px]">
                    {window.title}
                  </h3>
                  {window.regionId && (
                    <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-lg">
                      {window.regionId.replace('-', ' ')}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Minimize Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: '#fbbf24' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMinimize(window.id)
                    }}
                    className="w-5 h-5 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center text-black text-xs font-bold transition-colors"
                    title="Minimize"
                  >
                    −
                  </motion.button>
                  
                  {/* Maximize/Fullscreen Button */}
                  {onMaximize && (
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: '#10b981' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onMaximize(window.id)
                      }}
                      className="w-5 h-5 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-white text-xs font-bold transition-colors"
                      title={window.isFullscreen ? "Restore" : "Fullscreen"}
                    >
                      {window.isFullscreen ? '⤢' : '⤡'}
                    </motion.button>
                  )}
                  
                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose(window.id)
                    }}
                    className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white text-xs font-bold transition-colors"
                    title="Close"
                  >
                    ×
                  </motion.button>
                </div>
              </motion.div>

              {/* Window Content */}
              <motion.div
                className="h-full overflow-hidden"
                style={{ height: (window.isFullscreen ? size.height * 0.9 : window.size.height) - 48 }} // Subtract title bar height
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-full h-full overflow-auto">
                  <ProgramErrorBoundary programId={window.id}>
                    <ProgramContextWrapper>
                      {window.component}
                    </ProgramContextWrapper>
                  </ProgramErrorBoundary>
                </div>
              </motion.div>

              {/* Window Border Glow */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 pointer-events-none"
                  style={{
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)'
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimized State */}
        {window.isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onMinimize(window.id)}
            className="
              cursor-pointer
              bg-gradient-to-br from-gray-800/90 to-gray-900/90
              backdrop-blur-xl
              border border-white/20
              rounded-xl p-3
              shadow-xl shadow-black/50
              hover:shadow-2xl hover:shadow-cyan-500/20
              transition-all duration-300
            "
          >
            <div className="flex items-center space-x-2">
              {window.icon && (
                <span className="text-base">{window.icon}</span>
              )}
              <span className="text-white text-xs font-medium truncate max-w-[100px]">
                {window.title}
              </span>
            </div>
          </motion.div>
        )}
      </Html>
    </group>
  )
}

// Helper function to generate window positions around the brain
export function generateWindowPosition(
  regionId: string,
  index: number = 0,
  dragBias?: { x: number; y: number }
): [number, number, number] {
  // Balanced positions around brain - closer and better distributed
  const regionPositions: Record<string, [number, number, number]> = {
    'frontal-cortex': [3, 2, 5],           // Front-right, moderate distance
    'temporal-lobe-left': [-4, 0, 3],      // Left side, balanced
    'temporal-lobe-right': [4, 0, 3],      // Right side, balanced
    'occipital-lobe': [-2, 1, -3],         // Back-left, visible
    'motor-cortex': [0, 4, 3],             // Top center, elevated
    'brainstem': [0, -2, 4]                // Bottom center, forward
  }

  const basePosition = regionPositions[regionId] || [2, 1, 3]
  
  // Better stacking with more separation to prevent overlap
  const spiral = index * 1.2
  const offsetX = Math.cos(spiral) * 1.2
  const offsetY = Math.sin(spiral) * 1.0
  const offsetZ = index * 0.5

  // Apply drag bias if provided
  const dragOffsetX = dragBias ? dragBias.x * 0.005 : 0
  const dragOffsetY = dragBias ? -dragBias.y * 0.005 : 0
  
  // Calculate position with offsets
  const rawPosition: [number, number, number] = [
    basePosition[0] + offsetX + dragOffsetX,
    basePosition[1] + offsetY + dragOffsetY,
    basePosition[2] + offsetZ
  ]

  // Use more conservative bounds for initial positioning
  const constrainedPosition: [number, number, number] = [
    Math.max(-8, Math.min(8, rawPosition[0])),    // X bounds - reasonable range
    Math.max(-3, Math.min(4, rawPosition[1])),    // Y bounds - prevent going above screen
    Math.max(-6, Math.min(6, rawPosition[2]))     // Z bounds - moderate depth
  ]

  return constrainedPosition
}