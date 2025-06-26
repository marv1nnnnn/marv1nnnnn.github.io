'use client'

import { useState, useEffect } from 'react'
import { PerformancePreset } from './SceneLoader'

interface PerformanceManagerProps {
  onPresetChange: (preset: PerformancePreset) => void
  initialPreset?: PerformancePreset
}

// Device capability detection
function detectDeviceCapability(): PerformancePreset {
  if (typeof window === 'undefined') return 'medium'
  
  // Check for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  if (isMobile) return 'low'
  
  // Check GPU capabilities
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  
  if (!gl) return 'low'
  
  // Type guard to ensure we have WebGLRenderingContext
  if (gl instanceof WebGLRenderingContext) {
    // Check renderer info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL).toLowerCase()
      
      // Check for integrated vs dedicated GPU
      if (renderer.includes('intel') || renderer.includes('mali') || renderer.includes('adreno')) {
        return 'low'
      }
      
      if (renderer.includes('nvidia') || renderer.includes('amd') || renderer.includes('radeon')) {
        return 'high'
      }
    }
    
    // Check memory info
    const memoryInfo = gl.getExtension('WEBGL_lose_context')
    if (memoryInfo) {
      // If we can get memory info, assume decent hardware
      return 'medium'
    }
  }
  
  return 'medium' // Default fallback
}

export function PerformanceManager({ onPresetChange, initialPreset }: PerformanceManagerProps) {
  const [currentPreset, setCurrentPreset] = useState<PerformancePreset>(initialPreset || 'medium')
  const [autoDetected, setAutoDetected] = useState<PerformancePreset>('medium')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Auto-detect device capabilities
    const detected = detectDeviceCapability()
    setAutoDetected(detected)
    
    // Use auto-detected if no initial preset provided
    if (!initialPreset) {
      setCurrentPreset(detected)
      onPresetChange(detected)
    }
  }, [initialPreset, onPresetChange])

  const handlePresetChange = (preset: PerformancePreset) => {
    setCurrentPreset(preset)
    onPresetChange(preset)
    
    // Store preference
    localStorage.setItem('scene-performance-preset', preset)
  }

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('scene-performance-preset') as PerformancePreset
    if (saved && ['low', 'medium', 'high'].includes(saved)) {
      setCurrentPreset(saved)
      onPresetChange(saved)
    }
  }, [onPresetChange])

  if (!showSettings) {
    return (
      <button 
        onClick={() => setShowSettings(true)}
        className="performance-toggle"
        title={`Performance: ${currentPreset.toUpperCase()}`}
      >
        ⚙️ {currentPreset.toUpperCase()}
        
        <style jsx>{`
          .performance-toggle {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #c084fc;
            border: 1px solid #7c3aed;
            padding: 8px 12px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            cursor: pointer;
            z-index: 1001;
            border-radius: 4px;
          }
          
          .performance-toggle:hover {
            background: rgba(124, 58, 237, 0.2);
          }
        `}</style>
      </button>
    )
  }

  return (
    <div className="performance-settings">
      <div className="settings-header">
        <h3>Performance Settings</h3>
        <button onClick={() => setShowSettings(false)}>×</button>
      </div>
      
      <div className="auto-detect">
        <p>Auto-detected: <strong>{autoDetected.toUpperCase()}</strong></p>
      </div>
      
      <div className="preset-options">
        {(['low', 'medium', 'high'] as PerformancePreset[]).map(preset => (
          <label key={preset} className={`preset-option ${currentPreset === preset ? 'active' : ''}`}>
            <input
              type="radio"
              name="performance"
              value={preset}
              checked={currentPreset === preset}
              onChange={() => handlePresetChange(preset)}
            />
            <div className="preset-info">
              <div className="preset-name">{preset.toUpperCase()}</div>
              <div className="preset-desc">
                {preset === 'low' && 'Basic ocean (32x32), minimal effects'}
                {preset === 'medium' && 'Standard ocean (64x64), most effects'}
                {preset === 'high' && 'Full ocean (128x128), all effects'}
              </div>
            </div>
          </label>
        ))}
      </div>
      
      <style jsx>{`
        .performance-settings {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.95);
          color: #c084fc;
          border: 1px solid #7c3aed;
          padding: 20px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          z-index: 1001;
          border-radius: 4px;
          min-width: 300px;
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #7c3aed;
          padding-bottom: 10px;
        }
        
        .settings-header h3 {
          margin: 0;
          color: #a855f7;
        }
        
        .settings-header button {
          background: none;
          border: none;
          color: #c084fc;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
        }
        
        .auto-detect {
          margin-bottom: 15px;
          color: #a855f7;
        }
        
        .preset-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .preset-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #4c1d95;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .preset-option:hover {
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.1);
        }
        
        .preset-option.active {
          border-color: #c084fc;
          background: rgba(192, 132, 252, 0.1);
        }
        
        .preset-option input {
          accent-color: #c084fc;
        }
        
        .preset-info {
          flex: 1;
        }
        
        .preset-name {
          font-weight: bold;
          color: #c084fc;
          margin-bottom: 2px;
        }
        
        .preset-desc {
          font-size: 10px;
          color: #a855f7;
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}

export default PerformanceManager