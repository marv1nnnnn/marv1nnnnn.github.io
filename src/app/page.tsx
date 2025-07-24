'use client'

import { useState, useEffect } from 'react'
import ConsciousnessEmergence from '@/components/ConsciousnessEmergence'
import FilmWindow from '@/components/FilmWindow'
import PerformanceManager from '@/components/PerformanceManager'
import { AudioProvider } from '@/contexts/AudioContext'
import { PerformancePreset, preloadAllComponents } from '@/components/SceneLoader'
import { DEFAULT_PERSONA } from '@/config/personas'
import { AIPersona } from '@/types/personas'

export default function Home() {
  const [isBooting, setIsBooting] = useState(true)
  const [bootComplete, setBootComplete] = useState(false)
  const [scenePreloading, setScenePreloading] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [componentsPreloaded, setComponentsPreloaded] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const [performancePreset, setPerformancePreset] = useState<PerformancePreset>('medium')
  const [finalPersona, setFinalPersona] = useState<AIPersona>(DEFAULT_PERSONA)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Skip boot sequence in dev mode if needed
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('skip-boot')) {
      setIsBooting(false)
      setBootComplete(true)
      setSceneReady(true)
      setComponentsPreloaded(true)
      setPreloadProgress(100)
      return
    }

    // Start scene preloading immediately (parallel with boot)
    setScenePreloading(true)
    
    // Preload all 3D components during boot sequence with progress tracking
    preloadAllComponents((progress, componentName) => {
      setPreloadProgress(progress)
    }).then(() => {
      setComponentsPreloaded(true)
      setPreloadProgress(100)
    }).catch(error => {
      console.warn('Component preloading failed:', error)
      setComponentsPreloaded(true) // Still allow progression
      setPreloadProgress(100)
    })
  }, [])

  const handleBootComplete = (bootPersona?: AIPersona) => {
    if (bootPersona) {
      setFinalPersona(bootPersona)
    }
    
    setIsTransitioning(true)
    
    // Smooth transition with delay
    setTimeout(() => {
      setIsBooting(false)
      setBootComplete(true)
      
      setTimeout(() => {
        setIsTransitioning(false)
      }, 1000) // Additional delay for smooth transition
    }, 500) // Brief delay to show transition effect
  }

  const handleSceneReady = () => {
    setSceneReady(true)
  }

  // Show boot sequence while booting
  if (isBooting) {
    return (
      <AudioProvider>
        <ConsciousnessEmergence 
          onEmergenceComplete={handleBootComplete}
          isTransitioning={isTransitioning}
          preloadProgress={preloadProgress}
          componentsPreloaded={componentsPreloaded}
        />
        {/* Components preload without Canvas during boot - reduces WebGL conflicts */}
      </AudioProvider>
    )
  }

  // Show main scene after boot
  return (
    <AudioProvider>
      <div className={`main-transition ${isTransitioning ? 'transitioning' : ''}`}>
        <FilmWindow 
          isPreloading={false}
          onSceneReady={handleSceneReady}
          performancePreset={performancePreset}
          componentsPreloaded={componentsPreloaded}
        />
        <PerformanceManager 
          onPresetChange={setPerformancePreset}
          initialPreset={performancePreset}
        />
      </div>
      
      <style jsx>{`
        .main-transition {
          opacity: 1;
          transform: scale(1);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        
        .main-transition.transitioning {
          opacity: 0;
          transform: scale(0.98);
        }
      `}</style>
    </AudioProvider>
  )
}