import React, { useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import Brain, { BrainControls } from './Brain'
import BrainLighting from './BrainLighting'
import ModuleGrid, { useModuleGridKeyboard } from './ModuleGrid'
import { BrainRegionHit } from '../../hooks/brain/useBrainRaycasting'

interface BrainModuleInterfaceProps {
  className?: string
  onModuleLaunch?: (moduleId: string, regionId: string) => void
  showInstructions?: boolean
  enableAutoRotation?: boolean
}

export default function BrainModuleInterface({
  className = '',
  onModuleLaunch,
  showInstructions = true,
  enableAutoRotation = true
}: BrainModuleInterfaceProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [isGridOpen, setIsGridOpen] = useState(false)
  const [brainMeshRef, setBrainMeshRef] = useState<any>(null)

  // Handle brain region clicks
  const handleRegionClick = useCallback((region: BrainRegionHit) => {
    console.log('Brain region clicked:', region.regionId)
    setSelectedRegion(region.regionId)
    setIsGridOpen(true)
    
    // Optional: Focus camera on the clicked region
    // The brain's camera system should handle this automatically
  }, [])

  // Handle brain region hover
  const handleRegionHover = useCallback((region: BrainRegionHit | null) => {
    setHoveredRegion(region?.regionId || null)
  }, [])

  // Handle module launch from grid
  const handleModuleLaunch = useCallback((moduleId: string) => {
    console.log(`Launching module: ${moduleId} from region: ${selectedRegion}`)
    
    if (onModuleLaunch && selectedRegion) {
      onModuleLaunch(moduleId, selectedRegion)
    }
    
    // Close the grid after launching a module
    setIsGridOpen(false)
    setSelectedRegion(null)
  }, [onModuleLaunch, selectedRegion])

  // Handle grid close
  const handleGridClose = useCallback(() => {
    setIsGridOpen(false)
    setSelectedRegion(null)
    
    // Return camera to overview
    if (brainMeshRef?.userData?.brainControls) {
      brainMeshRef.userData.brainControls.returnToOverview()
    }
  }, [brainMeshRef])

  // Keyboard navigation for grid
  useModuleGridKeyboard(isGridOpen, handleGridClose)

  return (
    <div className={`brain-module-interface relative ${className}`}>
      {/* 3D Brain Canvas */}
      <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black">
        <Canvas
          style={{
            width: '100%',
            height: '100vh',
            display: 'block'
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 5, 15]} />
          
          {/* Enhanced lighting system using dedicated BrainLighting component */}
          <BrainLighting intensity={1.2} />
          
          {/* Brain component with full interaction */}
          <Brain
            isActive={true}
            enableCameraControl={true}
            enableRaycasting={true}
            autoRotateInOverview={enableAutoRotation && !isGridOpen}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
          />
        </Canvas>

        {/* Module Grid Overlay */}
        {isGridOpen && (
          <ModuleGrid
            selectedRegion={selectedRegion}
            onModuleLaunch={handleModuleLaunch}
            onClose={handleGridClose}
            showHeader={true}
          />
        )}

        {/* Instructions Overlay */}
        {showInstructions && !isGridOpen && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                  🧠 Interactive Brain Module Explorer
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  Click on different brain regions to explore available modules
                </p>
                
                {hoveredRegion && (
                  <div className="inline-flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1 text-sm">
                    <span className="text-yellow-400">Hovering:</span>
                    <span className="text-white font-medium capitalize">
                      {hoveredRegion.replace('-', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Brain Region Legend */}
        <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-3">Brain Regions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              <span className="text-gray-300">Frontal Cortex</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-xs">UI & Control</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
              <span className="text-gray-300">Temporal Lobe</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-xs">Media</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
              <span className="text-gray-300">Parietal/Motor</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-xs">System</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
              <span className="text-gray-300">Occipital Lobe</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-xs">AI & Visual</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
              <span className="text-gray-300">Brainstem</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-xs">Core</span>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-6 left-6">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isGridOpen ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
              <span className="text-sm text-white font-medium">
                {isGridOpen ? 'Module Grid Active' : 'Brain Explorer Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export region mapping for external use
export { BRAIN_REGION_MAPPING } from '../../config/brainMapping'

// Export types for external use
export type { BrainRegionHit } from '../../hooks/brain/useBrainRaycasting'
export type { ModuleCardData } from './ModuleCard'