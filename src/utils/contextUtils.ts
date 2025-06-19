// Utility functions for handling React contexts gracefully in 3D environment

export function useChaosContextSafely() {
  try {
    const { useChaos } = require('@/contexts/ChaosProvider')
    return useChaos()
  } catch (error) {
    console.warn('⚠️ [CONTEXT-UTILS] ChaosProvider not available, using fallback mode:', error)
    return null
  }
}

export function useAIChatContextSafely() {
  try {
    const { useAIChatContext } = require('@/contexts/AIChatContext')
    return useAIChatContext()
  } catch (error) {
    console.warn('⚠️ [CONTEXT-UTILS] AIChatContext not available, using fallback mode:', error)
    return null
  }
}

// Fallback chaos operations
export const fallbackChaosOperations = {
  triggerSystemWideEffect: (effect: string) => {
    console.log(`[FALLBACK] Would trigger system effect: ${effect}`)
  },
  audio: {
    soundEffects: {
      error: () => console.log('[FALLBACK] Would play error sound'),
      click: () => console.log('[FALLBACK] Would play click sound'),
      success: () => console.log('[FALLBACK] Would play success sound'),
    }
  },
  systemState: {
    chaosLevel: 0.5,
    performance: { fps: 60, quality: 'medium' }
  },
  visual: {
    triggerCursorExplosion: () => console.log('[FALLBACK] Would trigger cursor explosion'),
    triggerMatrixRain: () => console.log('[FALLBACK] Would trigger matrix rain'),
    triggerGlitchEffect: () => console.log('[FALLBACK] Would trigger glitch effect'),
  }
}