import React from 'react'

interface BrainLightingProps {
  intensity?: number
  enableAmbient?: boolean
  enableDirectional?: boolean
  enablePoint?: boolean
}

export default function BrainLighting({
  intensity = 1.0,
  enableAmbient = true,
  enableDirectional = true,
  enablePoint = true
}: BrainLightingProps) {
  return (
    <>
      {/* Enhanced ambient lighting for much better brain visibility */}
      {enableAmbient && (
        <ambientLight
          intensity={0.8 * intensity}
          color="#ffffff"
        />
      )}

      {/* Primary directional light for brain structure definition */}
      {enableDirectional && (
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.2 * intensity}
          color="#ffffff"
          castShadow={false} // Disabled for performance
        />
      )}

      {/* Secondary directional for balanced illumination */}
      {enableDirectional && (
        <directionalLight
          position={[-6, 8, -4]}
          intensity={0.8 * intensity}
          color="#f0f8ff"
          castShadow={false}
        />
      )}

      {/* Additional top-down directional light for even coverage */}
      {enableDirectional && (
        <directionalLight
          position={[0, 15, 0]}
          intensity={0.6 * intensity}
          color="#ffffff"
          castShadow={false}
        />
      )}

      {/* Enhanced point lights for region highlighting */}
      {enablePoint && (
        <>
          {/* Frontal lobe accent light */}
          <pointLight
            position={[0, 3, 6]}
            intensity={0.5 * intensity}
            color="#4a90ff"
            distance={15}
            decay={1.5}
          />

          {/* Temporal lobe accent lights */}
          <pointLight
            position={[-5, 1, 2]}
            intensity={0.4 * intensity}
            color="#9966ff"
            distance={12}
            decay={1.5}
          />
          
          <pointLight
            position={[5, 1, 2]}
            intensity={0.4 * intensity}
            color="#9966ff"
            distance={12}
            decay={1.5}
          />

          {/* Parietal lobe accent light */}
          <pointLight
            position={[0, 6, 0]}
            intensity={0.35 * intensity}
            color="#00cc66"
            distance={10}
            decay={1.5}
          />

          {/* Occipital lobe accent light */}
          <pointLight
            position={[0, 2, -6]}
            intensity={0.4 * intensity}
            color="#ff6600"
            distance={12}
            decay={1.5}
          />
        </>
      )}
    </>
  )
}

// Preset lighting configurations
export const BrainLightingPresets = {
  // Clean and minimal for clear brain visibility
  clean: {
    intensity: 1.0,
    enableAmbient: true,
    enableDirectional: true,
    enablePoint: false
  },
  
  // Enhanced with region highlighting (recommended default)
  enhanced: {
    intensity: 1.0,
    enableAmbient: true,
    enableDirectional: true,
    enablePoint: true
  },
  
  // Bright mode for maximum visibility
  bright: {
    intensity: 1.2,
    enableAmbient: true,
    enableDirectional: true,
    enablePoint: true
  },
  
  // Subtle for background brain display
  subtle: {
    intensity: 0.8,
    enableAmbient: true,
    enableDirectional: true,
    enablePoint: false
  },
  
  // High contrast for demonstrations
  demo: {
    intensity: 1.4,
    enableAmbient: true,
    enableDirectional: true,
    enablePoint: true
  }
}