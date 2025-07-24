/**
 * LoadingMusicManager - Atmospheric Music System for Loading States
 * 
 * This component provides seamless atmospheric music during loading sequences
 * that matches the digital consciousness theme. It automatically handles:
 * 
 * - Layered ambient soundscapes for different loading states
 * - Smooth fade transitions between states
 * - Procedural audio generation using Web Audio API
 * - Automatic cleanup and memory management
 * 
 * Music Mapping:
 * - 'initial': Base ambience layer
 * - 'loading_core': Ambience + ethereal drone
 * - 'loading_ocean': + ocean consciousness flow
 * - 'loading_atmosphere': + aurora-like atmospheric sounds  
 * - 'loading_objects': + neural network processing textures
 * - 'complete': Crystalline completion chord progression
 * 
 * Integration:
 * - FilmWindow: Scene loading music
 * - ConsciousnessEmergence: Boot sequence music
 * - Window components: Application loading music (if needed)
 * 
 * @component
 * @example
 * ```tsx
 * <LoadingMusicManager
 *   loadingState="loading_ocean"
 *   isLoading={true}
 *   progress={45}
 * />
 * ```
 */

'use client'

import { useEffect, useRef } from 'react'
import { useAudio } from '@/contexts/AudioContext'

interface LoadingMusicManagerProps {
  loadingState: string
  isLoading: boolean
  progress?: number
}

export default function LoadingMusicManager({ 
  loadingState, 
  isLoading, 
  progress = 0 
}: LoadingMusicManagerProps) {
  const { 
    startLoadingMusic, 
    stopLoadingMusic, 
    fadeInLoadingMusic, 
    fadeOutLoadingMusic,
    isLoadingMusicPlaying,
    currentLoadingState 
  } = useAudio()
  
  const previousLoadingState = useRef<string | null>(null)
  const previousIsLoading = useRef<boolean>(false)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any pending fade timeout
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }

    if (isLoading) {
      // Loading started or state changed
      if (!previousIsLoading.current) {
        // Loading just started
        console.log(`[LoadingMusic] Starting loading music for: ${loadingState}`)
        fadeInLoadingMusic(loadingState, 1500)
      } else if (previousLoadingState.current !== loadingState) {
        // Loading state changed, transition to new music
        console.log(`[LoadingMusic] Transitioning from ${previousLoadingState.current} to ${loadingState}`)
        
        // Fade out current, then fade in new
        fadeOutLoadingMusic(800)
        fadeTimeoutRef.current = setTimeout(() => {
          fadeInLoadingMusic(loadingState, 1200)
        }, 900)
      }
    } else {
      // Loading finished
      if (previousIsLoading.current && isLoadingMusicPlaying) {
        console.log(`[LoadingMusic] Loading complete, fading out music`)
        
        // Play completion sound then fade out
        if (loadingState === 'complete') {
          startLoadingMusic('complete')
          fadeTimeoutRef.current = setTimeout(() => {
            fadeOutLoadingMusic(2000)
          }, 2000)
        } else {
          fadeOutLoadingMusic(1500)
        }
      }
    }

    // Update previous state references
    previousLoadingState.current = loadingState
    previousIsLoading.current = isLoading

    // Cleanup timeout on unmount
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
    }
  }, [
    loadingState, 
    isLoading, 
    startLoadingMusic, 
    fadeInLoadingMusic, 
    fadeOutLoadingMusic,
    isLoadingMusicPlaying
  ])

  // Progress-based music intensity modulation (optional enhancement)
  useEffect(() => {
    if (isLoading && progress > 0) {
      // Could modulate music intensity based on progress
      // This is a placeholder for future enhancement
      console.log(`[LoadingMusic] Progress: ${progress}% for state: ${loadingState}`)
    }
  }, [progress, isLoading, loadingState])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (isLoadingMusicPlaying) {
        console.log(`[LoadingMusic] Component unmounting, stopping music`)
        stopLoadingMusic()
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
} 