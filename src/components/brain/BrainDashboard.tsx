import React, { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Brain from './Brain'
import BrainLighting from './BrainLighting'
import BrainProgramIcons from './BrainProgramIcons'
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
  const [launchedPrograms, setLaunchedPrograms] = useState<Set<string>>(new Set())
  const [lastLaunchedProgram, setLastLaunchedProgram] = useState<string | null>(null)
  

  // Handle brain region selection
  const handleRegionClick = useCallback((region: BrainRegionHit) => {
    console.log('🧠 Brain region clicked:', region.regionId)
    setSelectedRegion(region.regionId)
  }, [])

  // Handle brain region hover
  const handleRegionHover = useCallback((region: BrainRegionHit | null) => {
    setHoveredRegion(region?.regionId || null)
  }, [])

  // Handle program launch from 3D icons
  const handleModuleLaunch = useCallback((programId: string) => {
    console.log('🚀 Launching program:', programId, 'from region:', selectedRegion)
    
    // Add to launched programs set for visual feedback
    setLaunchedPrograms(prev => new Set([...prev, programId]))
    setLastLaunchedProgram(programId)
    
    // Clear the launch notification after 3 seconds
    setTimeout(() => setLastLaunchedProgram(null), 3000)
    
    if (selectedRegion && onModuleLaunch) {
      onModuleLaunch(programId, selectedRegion)
    }
    // Keep the panel open after launch for better UX
    // Users can manually close if they want to explore other regions
  }, [selectedRegion, onModuleLaunch])

  // Close program icons
  const handleCloseGrid = useCallback(() => {
    setSelectedRegion(null)
  }, [])

  return (
    <>
    <div className={`brain-dashboard relative w-full h-screen bg-gradient-to-b from-gray-900 to-black ${className}`}>
      {/* 3D Brain Canvas */}
      <Canvas
        dpr={[1, 2]}
        performance={{ min: 0.8 }}
        camera={{ position: [0, 5, 15], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: true,
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
          
          {/* 3D Floating Program Icons */}
          <BrainProgramIcons
            selectedRegion={selectedRegion}
            onProgramLaunch={(programId: string) => {
              console.log('🔗 BrainDashboard received launch request for:', programId);
              handleModuleLaunch(programId);
            }}
            onClose={handleCloseGrid}
            launchedPrograms={launchedPrograms}
          />
          
        </Suspense>
      </Canvas>

      {/* Enhanced Instructions overlay */}
      {showInstructions && !selectedRegion && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-6 left-6 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-6 text-white max-w-sm border border-white/10"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 rounded-full bg-cyan-400 mr-3 animate-pulse shadow-lg shadow-cyan-400/50" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Neural Interface
            </h3>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0" />
              <span><strong className="text-white">Click</strong> brain regions to access modules</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 mr-3 flex-shrink-0" />
              <span><strong className="text-white">Launch</strong> programs directly from panel</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2 mr-3 flex-shrink-0" />
              <span><strong className="text-white">Drag</strong> to rotate brain view</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced region info display */}
      {hoveredRegion && !selectedRegion && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute top-6 right-6 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-5 text-white border border-white/10 min-w-[280px]"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center mb-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 mr-3 animate-pulse shadow-lg shadow-yellow-400/50" />
            <h4 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent capitalize">
              {hoveredRegion.replace('-', ' ')}
            </h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            {getRegionDescription(hoveredRegion)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Neural Region</span>
            <span className="bg-gray-800/50 px-2 py-1 rounded-lg">
              Click to explore
            </span>
          </div>
        </motion.div>
      )}

      {/* Launch Success Notification */}
      <AnimatePresence>
        {lastLaunchedProgram && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 z-60"
          >
          <div className="bg-gradient-to-r from-green-600/90 via-green-500/90 to-emerald-500/90 backdrop-blur-xl rounded-2xl px-6 py-4 border border-green-400/40 shadow-2xl shadow-green-500/30">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
              >
                <span className="text-green-500 text-sm font-bold">✓</span>
              </motion.div>
              <div>
                <h4 className="text-white font-bold text-sm">Program Launched</h4>
                <p className="text-green-100 text-xs capitalize">
                  {lastLaunchedProgram.replace(/-/g, ' ')} is now running
                </p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced brain region color legend */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-6 right-6 bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center mb-4">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mr-3 animate-pulse shadow-lg shadow-cyan-400/50" />
          <h4 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Region Map
          </h4>
        </div>
        <div className="space-y-3 text-sm">
          <motion.div 
            whileHover={{ scale: 1.02, x: 4 }}
            className="flex items-center cursor-pointer group"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mr-3 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-200"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors">Frontal <span className="text-gray-500">(UI)</span></span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02, x: 4 }}
            className="flex items-center cursor-pointer group"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3 shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-200"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors">Temporal <span className="text-gray-500">(Media)</span></span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02, x: 4 }}
            className="flex items-center cursor-pointer group"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-200"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors">Motor <span className="text-gray-500">(Games)</span></span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02, x: 4 }}
            className="flex items-center cursor-pointer group"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-200"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors">Occipital <span className="text-gray-500">(AI)</span></span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02, x: 4 }}
            className="flex items-center cursor-pointer group"
          >
            <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg mr-3 shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-200"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors">Brainstem <span className="text-gray-500">(Core)</span></span>
          </motion.div>
        </div>
      </motion.div>


    </div>
  </>
  )
}

/**
 * Retrieves a human-readable description for a given brain region ID.
 * @param {string} regionId - The identifier of the brain region (e.g., 'frontal', 'temporal').
 * @returns {string} The corresponding description.
 */
function getRegionDescription(regionId: string): string {
  const descriptions: Record<string, string> = {
    'frontal-cortex': 'User interface and interaction modules',
    'temporal-lobe': 'Media processing and audio modules',
    'temporal-lobe-left': 'Media processing and audio modules', 
    'temporal-lobe-right': 'Media processing and audio modules',
    'parietal-lobe': 'System monitoring and spatial awareness',
    'motor-cortex': 'Interactive games and motor control',
    'occipital-lobe': 'AI processing and personality modules',
    'brainstem': 'Core system functions and vital processes'
  }
  
  return descriptions[regionId] || 'Brain region containing various modules'
}