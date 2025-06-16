import React, { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Brain from './Brain'
import BrainLighting from './BrainLighting'
import ModuleGrid from './ModuleGrid'
import { BrainRegionHit } from '../../hooks/brain/useBrainRaycasting'

/**
 * @interface BrainDashboardProps
 * @description Defines the props for the BrainDashboard component.
 * @property {string} [className] - Optional CSS class for custom styling of the container.
 * @property {(moduleId: string, regionId:string) => void} [onModuleLaunch] - Callback function triggered when a user launches a module from the grid.
 * @property {boolean} [showInstructions=true] - Toggles the visibility of the initial instructions overlay.
 * @property {boolean} [enableAutoRotation=true] - Toggles the auto-rotation feature of the brain in its overview state.
 */
interface BrainDashboardProps {
  className?: string
  onModuleLaunch?: (moduleId: string, regionId: string) => void
  showInstructions?: boolean
  enableAutoRotation?: boolean
}

/**
 * A comprehensive dashboard for interacting with the 3D brain model.
 *
 * This component serves as the main user interface for the brain visualization. It integrates
 * the `Brain` component with UI overlays to create a complete interactive experience.
 *
 * Key functionalities include:
 * - Hosting the main `<Canvas>` for the 3D scene.
 * - Managing the state of selected and hovered brain regions.
 * - Displaying informational overlays like instructions, region descriptions, and a color legend.
 * - Rendering the `ModuleGrid` when a brain region is selected.
 * - Handling the logic for launching modules associated with brain regions.
 *
 * @param {BrainDashboardProps} props - The component props.
 * @returns {React.ReactElement} A full-screen container with the 3D brain and UI overlays.
 */
export default function BrainDashboard({
  className = '',
  onModuleLaunch,
  showInstructions = true,
  enableAutoRotation = true
}: BrainDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  // Handle brain region selection
  const handleRegionClick = useCallback((region: BrainRegionHit) => {
    setSelectedRegion(region.regionId)
  }, [])

  // Handle brain region hover
  const handleRegionHover = useCallback((region: BrainRegionHit | null) => {
    setHoveredRegion(region?.regionId || null)
  }, [])

  // Handle module launch from grid
  const handleModuleLaunch = useCallback((moduleId: string) => {
    if (selectedRegion && onModuleLaunch) {
      onModuleLaunch(moduleId, selectedRegion)
    }
    setSelectedRegion(null) // Close grid after launch
  }, [selectedRegion, onModuleLaunch])

  // Close module grid
  const handleCloseGrid = useCallback(() => {
    setSelectedRegion(null)
  }, [])

  return (
    <div className={`brain-dashboard relative w-full h-screen bg-gradient-to-b from-gray-900 to-black ${className}`}>
      {/* 3D Brain Canvas */}
      <Canvas
        dpr={[1, 2]}
        performance={{ min: 0.8 }}
        camera={{ position: [0, 5, 15], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
        style={{
          width: '100%',
          height: '100vh',
          display: 'block'
        }}
      >
        <Suspense fallback={null}>
          {/* Enhanced lighting system for maximum brain visibility */}
          <BrainLighting intensity={1.2} />
          
          {/* Clean brain component */}
          <Brain
            isActive={true}
            enableCameraControl={true}
            enableRaycasting={true}
            autoRotateInOverview={enableAutoRotation}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
          />
        </Suspense>
      </Canvas>

      {/* Instructions overlay */}
      {showInstructions && !selectedRegion && (
        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white max-w-md">
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Brain Module Dashboard</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Click</strong> brain regions to view modules</li>
            <li>• <strong>Hover</strong> regions for region information</li>
            <li>• <strong>Auto-rotation</strong> in overview mode</li>
            <li>• <strong>60fps</strong> smooth transitions</li>
          </ul>
        </div>
      )}

      {/* Region info display */}
      {hoveredRegion && !selectedRegion && (
        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white">
          <h4 className="text-lg font-bold text-cyan-400 capitalize mb-1">
            {hoveredRegion.replace('-', ' ')}
          </h4>
          <p className="text-sm text-gray-300">
            {getRegionDescription(hoveredRegion)}
          </p>
        </div>
      )}

      {/* Brain region color legend */}
      <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-sm rounded-lg p-4">
        <h4 className="text-lg font-bold text-cyan-400 mb-2">Brain Regions</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-white">Frontal (UI Modules)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
            <span className="text-white">Temporal (Media)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-white">Parietal (System)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span className="text-white">Occipital (AI)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-pink-500 rounded mr-2"></div>
            <span className="text-white">Brainstem (Core)</span>
          </div>
        </div>
      </div>

      {/* Module grid overlay */}
      {selectedRegion && (
        <ModuleGrid
          selectedRegion={selectedRegion}
          onModuleLaunch={handleModuleLaunch}
          onClose={handleCloseGrid}
        />
      )}
    </div>
  )
}

/**
 * Retrieves a human-readable description for a given brain region ID.
 * @param {string} regionId - The identifier of the brain region (e.g., 'frontal', 'temporal').
 * @returns {string} The corresponding description.
 */
function getRegionDescription(regionId: string): string {
  const descriptions: Record<string, string> = {
    'frontal': 'User interface and interaction modules',
    'temporal': 'Media processing and audio modules', 
    'parietal': 'System monitoring and spatial awareness',
    'occipital': 'AI processing and personality modules',
    'brainstem': 'Core system functions and vital processes'
  }
  
  return descriptions[regionId] || 'Brain region containing various modules'
}