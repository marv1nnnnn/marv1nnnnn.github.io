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
    console.log('🧠 ModuleGrid: Generating module data for region:', selectedRegion)
    
    if (!selectedRegion) {
      console.log('🧠 ModuleGrid: No selected region, returning empty array')
      return []
    }

    // Try exact match first, then fallback to similar regions
    let regionConfig = BRAIN_REGION_MAPPING[selectedRegion]
    console.log('🧠 ModuleGrid: Found region config:', regionConfig)
    
    // Fallback logic for temporal lobe variants
    if (!regionConfig && selectedRegion.includes('temporal')) {
      regionConfig = BRAIN_REGION_MAPPING['temporal-lobe-left']
      console.log('🧠 ModuleGrid: Using temporal fallback config:', regionConfig)
    }
    
    if (!regionConfig) {
      console.warn(`🧠 ModuleGrid: Brain region '${selectedRegion}' not found in mapping`)
      return []
    }

    const category = REGION_TO_CATEGORY[selectedRegion] || 'ui'
    console.log('🧠 ModuleGrid: Using category:', category)
    console.log('🧠 ModuleGrid: Programs to create:', regionConfig.programs)
    
    const modules = regionConfig.programs.map(programId => {
      console.log('🧠 ModuleGrid: Creating module for program:', programId)
      const moduleData = createModuleData(programId, category, {
        isActive: false // Could track active programs here
      })
      console.log('🧠 ModuleGrid: Created module data:', moduleData)
      return moduleData
    })
    
    console.log('🧠 ModuleGrid: Final module data array:', modules)
    console.log('🧠 ModuleGrid: Module count:', modules.length)
    
    return modules
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
  console.log('🧠 ModuleGrid: Render check - selectedRegion:', selectedRegion, 'moduleData.length:', moduleData.length)
  
  if (!selectedRegion) {
    console.log('🧠 ModuleGrid: Not rendering - no selected region')
    return null
  }
  
  if (moduleData.length === 0) {
    console.log('🧠 ModuleGrid: Not rendering - no module data')
    return null
  }
  
  console.log('🧠 ModuleGrid: Rendering with', moduleData.length, 'modules')

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-blue-500/80 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
    >
      <div 
        className="bg-white p-8 rounded-lg max-w-4xl w-full mx-4"
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          maxWidth: '56rem',
          width: '100%',
          margin: '0 16px',
          pointerEvents: 'auto'
        }}
      >
        <h2 className="text-2xl font-bold text-black mb-4">
          Brain Region: {selectedRegion}
        </h2>
        <p className="text-black mb-4">
          Found {moduleData.length} modules
        </p>
        <button 
          onClick={handleClose}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Close
        </button>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleData.map((module, index) => (
            <div 
              key={module.id}
              className="bg-gray-100 p-4 rounded cursor-pointer hover:bg-gray-200"
              onClick={() => handleModuleLaunch(module.id)}
            >
              <div className="text-2xl mb-2">{module.icon}</div>
              <h3 className="font-bold text-black">{module.title}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
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