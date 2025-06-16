import React, { useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Brain, { BrainControls } from './Brain'
import BrainLighting from './BrainLighting'
import { BrainRegionHit } from '../../hooks/brain/useBrainRaycasting'
import { CameraState } from '../../hooks/brain/useBrainCamera'

interface BrainWithControlsProps {
  className?: string
  showControls?: boolean
  enableAutoRotation?: boolean
  onRegionSelect?: (regionId: string) => void
}

export default function BrainWithControls({
  className = '',
  showControls = true,
  enableAutoRotation = true,
  onRegionSelect
}: BrainWithControlsProps) {
  const [currentRegion, setCurrentRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('overview')
  const [clickedPosition, setClickedPosition] = useState<{ x: number, y: number, z: number } | null>(null)

  // Handle brain region clicks
  const handleRegionClick = useCallback((region: BrainRegionHit) => {
    console.log('Brain region clicked:', region)
    setCurrentRegion(region.regionId)
    setClickedPosition({
      x: Math.round(region.point.x * 100) / 100,
      y: Math.round(region.point.y * 100) / 100,
      z: Math.round(region.point.z * 100) / 100
    })
    
    if (onRegionSelect) {
      onRegionSelect(region.regionId)
    }
  }, [onRegionSelect])

  // Handle brain region hover
  const handleRegionHover = useCallback((region: BrainRegionHit | null) => {
    setHoveredRegion(region?.regionId || null)
  }, [])

  // Camera control handlers
  const handleCameraStateChange = (state: CameraState) => {
    setCameraState(state)
    // In a real implementation, you'd get the brain controls from a ref
    // brainRef.current?.userData?.brainControls?.transitionToState(state)
  }

  const resetView = () => {
    setCameraState('overview')
    setCurrentRegion(null)
    setHoveredRegion(null)
    setClickedPosition(null)
    // brainRef.current?.userData?.brainControls?.returnToOverview()
  }

  return (
    <div className={`brain-with-controls ${className}`}>
      {/* 3D Canvas */}
      <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-black">
        <Canvas
          dpr={[1, 2]}
          performance={{ min: 0.8 }}
          frameloop="demand"
          style={{
            width: '100%',
            height: '100vh',
            display: 'block'
          }}
        <PerspectiveCamera makeDefault position={[0, 5, 15]} />
        
        {/* Enhanced lighting system using dedicated BrainLighting component */}
        <BrainLighting intensity={1.2} />
          />
          
          {/* Brain component with enhanced performance */}
          <Brain
            isActive={true}
            enableCameraControl={true}
            enableRaycasting={true}
            autoRotateInOverview={enableAutoRotation}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
          />
          
          {/* Disabled orbit controls for brain camera control */}
          <OrbitControls
            enabled={false}
          />
        </Canvas>

        {/* UI Controls Overlay */}
        {showControls && (
          <div className="absolute top-4 left-4 space-y-4 text-white">
            {/* Camera State Controls */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <h3 className="text-lg font-bold text-cyan-400">Camera Views</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCameraStateChange('overview')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    cameraState === 'overview' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => handleCameraStateChange('frontal-zoom')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    cameraState === 'frontal-zoom' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Frontal
                </button>
                <button
                  onClick={() => handleCameraStateChange('temporal-zoom')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    cameraState === 'temporal-zoom' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Temporal
                </button>
                <button
                  onClick={() => handleCameraStateChange('parietal-zoom')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    cameraState === 'parietal-zoom' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Parietal
                </button>
                <button
                  onClick={() => handleCameraStateChange('occipital-zoom')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    cameraState === 'occipital-zoom' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Occipital
                </button>
                <button
                  onClick={resetView}
                  className="px-3 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Brain Region Information */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">Brain Info</h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Current View:</span>
                  <span className="ml-2 font-medium text-white capitalize">
                    {cameraState.replace('-', ' ')}
                  </span>
                </div>
                
                {hoveredRegion && (
                  <div>
                    <span className="text-gray-400">Hovering:</span>
                    <span className="ml-2 font-medium text-yellow-400 capitalize">
                      {hoveredRegion.replace('-', ' ')}
                    </span>
                  </div>
                )}
                
                {currentRegion && (
                  <div>
                    <span className="text-gray-400">Selected:</span>
                    <span className="ml-2 font-medium text-cyan-400 capitalize">
                      {currentRegion.replace('-', ' ')}
                    </span>
                  </div>
                )}
                
                {clickedPosition && (
                  <div>
                    <span className="text-gray-400">Click Position:</span>
                    <div className="ml-2 font-mono text-xs text-green-400">
                      x: {clickedPosition.x}<br/>
                      y: {clickedPosition.y}<br/>
                      z: {clickedPosition.z}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• <strong>Click</strong> brain regions to focus camera</li>
                <li>• <strong>Hover</strong> regions for information</li>
                <li>• <strong>Use buttons</strong> for manual camera control</li>
                <li>• <strong>Auto-rotation</strong> in overview mode</li>
              </ul>
            </div>
          </div>
        )}

        {/* Region Color Legend */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-lg font-bold text-cyan-400 mb-2">Brain Regions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-white">Frontal (UI)</span>
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
      </div>
    </div>
  )
}