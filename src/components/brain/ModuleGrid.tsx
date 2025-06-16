import React, { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ModuleCard, { ModuleCardData, createModuleData } from './ModuleCard'
import { BRAIN_REGION_MAPPING } from '../../config/brainMapping'

interface ModuleGridProps {
  selectedRegion: string | null
  onModuleLaunch?: (moduleId: string) => void
  onClose?: () => void
  className?: string
  showHeader?: boolean
}

// Map brain regions to module categories for consistent theming
const REGION_TO_CATEGORY: Record<string, ModuleCardData['category']> = {
  'frontal-cortex': 'ui',
  'temporal-lobe': 'media',
  'temporal-lobe-left': 'media', 
  'temporal-lobe-right': 'media',
  'parietal-lobe': 'system',
  'motor-cortex': 'system',
  'occipital-lobe': 'ai',
  'brainstem': 'core'
}

// Region display names and descriptions
const REGION_INFO: Record<string, {
  title: string
  subtitle: string
  description: string
  color: string
}> = {
  'frontal-cortex': {
    title: 'Frontal Cortex',
    subtitle: 'User Interface & Control',
    description: 'Interactive applications and system controls for user engagement',
    color: '#0099ff'
  },
  'temporal-lobe': {
    title: 'Temporal Lobe', 
    subtitle: 'Media & Communication',
    description: 'Audio, visual media, and communication modules',
    color: '#9966ff'
  },
  'temporal-lobe-left': {
    title: 'Left Temporal Lobe',
    subtitle: 'Media Processing',
    description: 'Audio processing and media management',
    color: '#9966ff'
  },
  'temporal-lobe-right': {
    title: 'Right Temporal Lobe', 
    subtitle: 'Communication',
    description: 'Visitor interaction and communication systems',
    color: '#9966ff'
  },
  'parietal-lobe': {
    title: 'Parietal Lobe',
    subtitle: 'System Awareness',
    description: 'System monitoring and spatial processing modules',
    color: '#00cc66'
  },
  'motor-cortex': {
    title: 'Motor Cortex',
    subtitle: 'Action & Games', 
    description: 'Interactive games and motor control applications',
    color: '#00cc66'
  },
  'occipital-lobe': {
    title: 'Occipital Lobe',
    subtitle: 'AI & Visual Processing',
    description: 'Artificial intelligence and visual effect modules',
    color: '#ff6600'
  },
  'brainstem': {
    title: 'Brainstem',
    subtitle: 'Core Systems',
    description: 'Essential system functions and chaos control',
    color: '#ff3366'
  }
}

export default function ModuleGrid({ 
  selectedRegion, 
  onModuleLaunch,
  onClose,
  className = '',
  showHeader = true 
}: ModuleGridProps) {
  
  // Generate module data from brain mapping configuration
  const moduleData = useMemo(() => {
    if (!selectedRegion || !BRAIN_REGION_MAPPING[selectedRegion]) {
      return []
    }

    const regionConfig = BRAIN_REGION_MAPPING[selectedRegion]
    const category = REGION_TO_CATEGORY[selectedRegion] || 'ui'
    
    return regionConfig.programs.map(programId => 
      createModuleData(programId, category, {
        isActive: false // Could track active programs here
      })
    )
  }, [selectedRegion])

  const regionInfo = selectedRegion && REGION_INFO[selectedRegion] ? REGION_INFO[selectedRegion] : null

  const handleModuleLaunch = useCallback((moduleId: string) => {
    console.log(`Launching module: ${moduleId} from region: ${selectedRegion}`)
    if (onModuleLaunch) {
      onModuleLaunch(moduleId)
    }
  }, [onModuleLaunch, selectedRegion])

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  // Don't render if no region selected
  if (!selectedRegion || moduleData.length === 0) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedRegion}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`module-grid-container ${className}`}
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={handleClose}
        />

        {/* Main grid container */}
        <div className="fixed inset-4 z-50 flex flex-col">
          {/* Header section */}
          {showHeader && regionInfo && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-black/80 backdrop-blur-md rounded-t-2xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Region color indicator */}
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ 
                      backgroundColor: regionInfo.color,
                      boxShadow: `0 0 20px ${regionInfo.color}60`
                    }}
                  />
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {regionInfo.title}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {regionInfo.subtitle}
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
                >
                  <svg 
                    className="w-6 h-6 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Region description */}
              <p className="text-gray-300 mt-3 leading-relaxed">
                {regionInfo.description}
              </p>

              {/* Module count */}
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {moduleData.length} modules available
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
              </div>
            </motion.div>
          )}

          {/* Grid container */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className={`
              flex-1 
              bg-black/80 backdrop-blur-md 
              ${showHeader ? 'rounded-b-2xl' : 'rounded-2xl'}
              p-6 
              border border-white/10 
              ${showHeader ? 'border-t-0' : ''}
              overflow-y-auto
            `}
          >
            {/* Responsive grid */}
            <div className={`
              grid gap-6 h-full
              grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-3 
              xl:grid-cols-4 
              2xl:grid-cols-5
              auto-rows-max
              content-start
            `}>
              {moduleData.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  index={index}
                  onLaunch={handleModuleLaunch}
                />
              ))}
            </div>

            {/* Empty state (shouldn't happen with current data but good fallback) */}
            {moduleData.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧠</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No modules found
                  </h3>
                  <p className="text-gray-400">
                    This brain region doesn't have any modules configured yet.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Footer with navigation hints */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-4 flex justify-center"
          >
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-sm text-gray-300 text-center">
                <span className="font-medium">Click</span> a module to launch • 
                <span className="font-medium"> ESC</span> or click outside to close
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for keyboard navigation
export function useModuleGridKeyboard(
  isOpen: boolean, 
  onClose: () => void
) {
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, onClose])
}