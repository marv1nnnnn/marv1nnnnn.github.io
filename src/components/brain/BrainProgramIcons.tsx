import React, { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAIN_REGION_MAPPING } from '../../config/brainMapping'
import { getProgram } from '../../config/programRegistry'
import ModuleCard, { createModuleData } from './ModuleCard'

interface BrainProgramIconsProps {
  selectedRegion: string | null
  onProgramLaunch: (programId: string) => void
  onClose: () => void
  launchedPrograms?: Set<string>
}

// Region to category mapping
const REGION_CATEGORY_MAP = {
  'frontal-cortex': 'ui' as const,
  'temporal-lobe-left': 'media' as const,
  'temporal-lobe-right': 'media' as const,
  'occipital-lobe': 'ai' as const,
  'motor-cortex': 'system' as const,
  'brainstem': 'core' as const
}

// Region display names
const REGION_DISPLAY_NAMES = {
  'frontal-cortex': 'Frontal Cortex',
  'temporal-lobe-left': 'Left Temporal',
  'temporal-lobe-right': 'Right Temporal',
  'occipital-lobe': 'Occipital Lobe',
  'motor-cortex': 'Motor Cortex',
  'brainstem': 'Brain Stem'
}

// Region descriptions
const REGION_DESCRIPTIONS = {
  'frontal-cortex': 'Executive control and user interface systems',
  'temporal-lobe-left': 'Audio processing and media management',
  'temporal-lobe-right': 'Communication and social interaction',
  'occipital-lobe': 'Visual processing and AI intelligence',
  'motor-cortex': 'Action control and interactive gaming',
  'brainstem': 'Core systems and vital functions'
}

export default function BrainProgramIcons({
  selectedRegion,
  onProgramLaunch,
  onClose,
  launchedPrograms = new Set()
}: BrainProgramIconsProps) {
  
  // Generate module data for the selected region
  const moduleData = useMemo(() => {
    if (!selectedRegion) return []
    
    const regionConfig = BRAIN_REGION_MAPPING[selectedRegion]
    if (!regionConfig) return []
    
    const category = REGION_CATEGORY_MAP[selectedRegion as keyof typeof REGION_CATEGORY_MAP] || 'system'
    
    // Create module data for each program in this region
    return regionConfig.programs.map((programId) => {
      const program = getProgram(programId)
      if (!program) return null
      
      return createModuleData(programId, category, {
        title: program.title,
        icon: program.icon,
        isActive: launchedPrograms.has(programId)
      })
    }).filter(Boolean)
  }, [selectedRegion, launchedPrograms])
  
  if (!selectedRegion || moduleData.length === 0) {
    return null
  }

  const regionDisplayName = REGION_DISPLAY_NAMES[selectedRegion as keyof typeof REGION_DISPLAY_NAMES] || selectedRegion
  const regionDescription = REGION_DESCRIPTIONS[selectedRegion as keyof typeof REGION_DESCRIPTIONS] || 'Brain region modules'
  
  // Position the panel in a stable location (right side of screen)
  return (
    <Html
      position={[10, 0, 0]} // Fixed position to the right of the brain
      transform={false}
      center
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedRegion}
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="
            fixed right-4 top-1/2 transform -translate-y-1/2
            bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95
            backdrop-blur-2xl
            border border-white/20
            rounded-3xl p-8 
            w-[520px] max-h-[85vh]
            shadow-2xl shadow-black/50
            z-50
            overflow-hidden
          "
          style={{
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3)_1px,_transparent_1px)] bg-[size:24px_24px]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between mb-6">
            <div className="flex-1">
              <motion.h3 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white font-bold text-xl mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                {regionDisplayName}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 text-sm leading-relaxed mb-2"
              >
                {regionDescription}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center text-xs text-gray-500"
              >
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                {moduleData.length} Module{moduleData.length !== 1 ? 's' : ''} Available
              </motion.div>
            </div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="
                text-gray-500 hover:text-white
                w-10 h-10 rounded-xl
                border border-gray-700 hover:border-gray-500
                bg-gray-800/50 hover:bg-gray-700/50
                backdrop-blur-sm
                flex items-center justify-center
                transition-all duration-200
                shadow-lg
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </motion.button>
          </div>
          
          {/* Module Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-6 max-h-[55vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {moduleData.map((module, index) => {
              console.log('🎨 Rendering ModuleCard:', module.id, 'onLaunch:', typeof onProgramLaunch);
              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  index={index}
                  onLaunch={onProgramLaunch}
                />
              );
            })}
          </div>
          
          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 mt-6 pt-4 border-t border-gray-800"
          >
            <div className="flex items-center justify-center text-xs text-gray-500">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-1 rounded-full bg-cyan-400 mr-2"
              />
              Click any module to launch application
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Html>
  )
}

