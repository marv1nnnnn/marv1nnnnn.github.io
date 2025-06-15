'use client'

import React, { createContext, useContext, useEffect, useCallback } from 'react'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useVisualEffects, CursorTrail } from '@/hooks/useVisualEffects'

interface AudioVisualContextType {
  // Audio controls
  audio: ReturnType<typeof useAudioManager>
  // Visual effects controls  
  visual: ReturnType<typeof useVisualEffects>
  // Integrated controls
  chaosLevel: number
  setChaosLevel: (level: number) => void
  isReactiveMode: boolean
  setReactiveMode: (enabled: boolean) => void
  triggerAudioVisualSync: () => void
}

const AudioVisualContext = createContext<AudioVisualContextType | null>(null)

export const AudioVisualProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audio = useAudioManager()
  const visual = useVisualEffects()
  const [chaosLevel, setChaosLevelState] = React.useState(1.0)
  const [isReactiveMode, setReactiveMode] = React.useState(true)

  // Sync effects intensity with chaos level
  const setChaosLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(0, Math.min(2, level))
    setChaosLevelState(clampedLevel)
    visual.setEffectsIntensity(clampedLevel)
  }, [visual])

  // Audio-reactive visual effects
  useEffect(() => {
    if (!isReactiveMode || !audio.isPlaying) return

    const interval = setInterval(() => {
      const { visualizerData } = audio
      if (visualizerData.length === 0) return

      // Calculate audio energy (bass frequencies for better visual sync)
      const bassEnergy = visualizerData.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8
      const midEnergy = visualizerData.slice(8, 32).reduce((sum, val) => sum + val, 0) / 24
      const highEnergy = visualizerData.slice(32).reduce((sum, val) => sum + val, 0) / (visualizerData.length - 32)

      // Trigger effects based on audio intensity
      if (bassEnergy > 0.7) {
        visual.triggerScreenFlash('#ff0080', 150)
      }

      if (midEnergy > 0.6) {
        visual.triggerCursorExplosion()
      }

      if (highEnergy > 0.8) {
        visual.triggerGlitchEffect()
      }

      // Random chaos events based on overall energy
      const totalEnergy = (bassEnergy + midEnergy + highEnergy) / 3
      if (totalEnergy > 0.5 && Math.random() < 0.1 * chaosLevel) {
        const randomEffect = Math.floor(Math.random() * 4)
        switch (randomEffect) {
          case 0:
            visual.triggerWindowShake()
            break
          case 1:
            visual.triggerMatrixRain(1000)
            break
          case 2:
            visual.triggerRainbowTrail()
            break
          case 3:
            visual.triggerCursorExplosion()
            break
        }
      }
    }, 100) // Check every 100ms

    return () => clearInterval(interval)
  }, [audio, visual, isReactiveMode, chaosLevel])

  // Audio event handlers for visual feedback
  useEffect(() => {
    const handleAudioEvent = (eventType: string) => {
      switch (eventType) {
        case 'play':
          visual.triggerCursorExplosion()
          visual.triggerScreenFlash('#00ff00', 200)
          break
        case 'pause':
          visual.triggerScreenFlash('#ffff00', 150)
          break
        case 'stop':
          visual.triggerScreenFlash('#ff0040', 200)
          break
        case 'track-change':
          visual.triggerMatrixRain(2000)
          visual.triggerGlitchEffect()
          break
      }
    }

    // We'll trigger these manually since we can't easily hook into Howler events
    // This is a simplified integration
    return () => {}
  }, [visual])

  // Trigger synchronized audio-visual effect
  const triggerAudioVisualSync = useCallback(() => {
    audio.soundEffects.notification()
    visual.triggerCursorExplosion()
    visual.triggerScreenFlash('#00ffff', 300)
    visual.triggerGlitchEffect()
    
    setTimeout(() => {
      visual.triggerMatrixRain(1500)
    }, 200)
  }, [audio, visual])

  const contextValue: AudioVisualContextType = {
    audio,
    visual,
    chaosLevel,
    setChaosLevel,
    isReactiveMode,
    setReactiveMode,
    triggerAudioVisualSync
  }

  return (
    <AudioVisualContext.Provider value={contextValue}>
      {children}
      <CursorTrail 
        trail={visual.cursorTrail} 
        enabled={visual.cursorTrailEnabled} 
      />
      <ScreenEffects />
    </AudioVisualContext.Provider>
  )
}

// Screen effects overlay component
const ScreenEffects: React.FC = () => {
  return (
    <>
      {/* Scan lines overlay */}
      <div className="screen-distortion" />
      
      {/* Additional visual overlays can be added here */}
    </>
  )
}

export const useAudioVisual = (): AudioVisualContextType => {
  const context = useContext(AudioVisualContext)
  if (!context) {
    throw new Error('useAudioVisual must be used within an AudioVisualProvider')
  }
  return context
}

// Chaos Control Panel Component
export const ChaosControlPanel: React.FC = () => {
  const { 
    chaosLevel, 
    setChaosLevel, 
    isReactiveMode, 
    setReactiveMode,
    triggerAudioVisualSync,
    visual,
    audio
  } = useAudioVisual()

  return (
    <div className="chaos-control-panel">
      <div className="control-section">
        <h3 className="rainbow-text">🎪 CHAOS CONTROL 🎪</h3>
        
        <div className="control-group">
          <label>Chaos Level:</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={chaosLevel}
            onChange={(e) => setChaosLevel(parseFloat(e.target.value))}
            className="chaos-slider"
          />
          <span className="chaos-value">{Math.round(chaosLevel * 100)}%</span>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={isReactiveMode}
              onChange={(e) => setReactiveMode(e.target.checked)}
            />
            Audio-Reactive Mode
          </label>
        </div>

        <div className="effect-toggles">
          <button
            className={`toggle-btn ${visual.cursorTrailEnabled ? 'active' : ''}`}
            onClick={visual.toggleCursorTrail}
          >
            Cursor Trail
          </button>
          
          <button
            className={`toggle-btn ${visual.glitchEffectsEnabled ? 'active' : ''}`}
            onClick={visual.toggleGlitchEffects}
          >
            Glitch FX
          </button>
          
          <button
            className={`toggle-btn ${visual.particleEffectsEnabled ? 'active' : ''}`}
            onClick={visual.toggleParticleEffects}
          >
            Particles
          </button>
        </div>

        <div className="effect-triggers">
          <h4>Manual Triggers:</h4>
          <div className="trigger-buttons">
            <button onClick={() => visual.triggerCursorExplosion()}>
              💥 Explosion
            </button>
            <button onClick={() => visual.triggerMatrixRain(3000)}>
              🌧️ Matrix Rain
            </button>
            <button onClick={() => visual.triggerGlitchEffect()}>
              📺 Glitch
            </button>
            <button onClick={() => visual.triggerScreenFlash('#ff00ff', 500)}>
              ⚡ Flash
            </button>
            <button onClick={() => audio.soundEffects.click()}>
              🔊 Click Sound
            </button>
            <button onClick={triggerAudioVisualSync}>
              🎭 SYNC CHAOS
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .chaos-control-panel {
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px outset #666;
          padding: 12px;
          color: #00ff00;
          font-family: 'Courier New', monospace;
        }

        .control-section h3 {
          text-align: center;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .control-group label {
          font-size: 11px;
          min-width: 80px;
        }

        .chaos-slider {
          flex: 1;
          height: 16px;
          background: #333;
          border: 1px inset #666;
          appearance: none;
        }

        .chaos-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 14px;
          background: linear-gradient(135deg, #ff0080, #800040);
          border: 1px outset #ff0080;
          cursor: pointer;
        }

        .chaos-value {
          font-size: 10px;
          color: #ff0080;
          min-width: 30px;
          text-align: right;
        }

        .effect-toggles {
          display: flex;
          gap: 4px;
          margin: 8px 0;
        }

        .toggle-btn {
          background: linear-gradient(135deg, #333, #555);
          border: 1px outset #666;
          color: #ccc;
          padding: 4px 8px;
          font-size: 9px;
          cursor: pointer;
          font-family: inherit;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #00ff00, #008800);
          color: #000;
          border: 1px inset #666;
        }

        .toggle-btn:hover {
          filter: brightness(1.2);
        }

        .effect-triggers h4 {
          font-size: 10px;
          margin: 8px 0 4px 0;
          color: #ffff00;
        }

        .trigger-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .trigger-buttons button {
          background: linear-gradient(135deg, #666, #333);
          border: 1px outset #666;
          color: #00ffff;
          padding: 3px 6px;
          font-size: 8px;
          cursor: pointer;
          font-family: inherit;
        }

        .trigger-buttons button:hover {
          background: linear-gradient(135deg, #777, #444);
        }

        .trigger-buttons button:active {
          border: 1px inset #666;
        }

        input[type="checkbox"] {
          margin-right: 4px;
        }
      `}</style>
    </div>
  )
}