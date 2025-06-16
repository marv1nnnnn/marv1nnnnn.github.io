import React from 'react'
import BrainModuleInterface from './BrainModuleInterface'

interface BrainModuleDemoProps {
  className?: string
}

export default function BrainModuleDemo({ className = '' }: BrainModuleDemoProps) {
  // Handle module launch events
  const handleModuleLaunch = (moduleId: string, regionId: string) => {
    console.log(`Demo: Launching module "${moduleId}" from region "${regionId}"`)
    
    // In a real implementation, this would:
    // 1. Open the specific application/module
    // 2. Potentially switch to a different view/page
    // 3. Initialize the module with proper context
    // 4. Track analytics/usage
    
    // For demo purposes, show a notification
    alert(`🚀 Launching: ${moduleId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')}\n\nFrom: ${regionId.replace('-', ' ')}`)
  }

  return (
    <div className={`brain-module-demo w-full h-screen ${className}`}>
      {/* Full-screen brain interface */}
      <BrainModuleInterface
        onModuleLaunch={handleModuleLaunch}
        showInstructions={true}
        enableAutoRotation={true}
        className="w-full h-full"
      />
      
      {/* Optional overlay information */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <p className="text-white text-sm font-medium text-center">
            🧠 Brain Module Grid Demo - Click brain regions to explore modules
          </p>
        </div>
      </div>
    </div>
  )
}

// Export all related components for easy imports
export { default as ModuleCard } from './ModuleCard'
export { default as ModuleGrid } from './ModuleGrid'
export { default as BrainModuleInterface } from './BrainModuleInterface'
export type { ModuleCardData } from './ModuleCard'