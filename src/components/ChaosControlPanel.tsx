'use client'

import React from 'react'
import { useAudioVisual } from './AudioVisualManager'

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
          margin-bottom: 10px;
        }

        .control-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .chaos-slider {
          flex-grow: 1;
          margin: 0 10px;
        }

        .chaos-value {
          width: 40px;
          text-align: right;
        }

        .effect-toggles, .effect-triggers {
          margin-top: 15px;
          border-top: 1px solid #444;
          padding-top: 10px;
        }

        .effect-toggles {
          display: flex;
          justify-content: space-around;
          gap: 5px;
        }
        
        .toggle-btn {
          padding: 4px 8px;
          border: 1px solid #00ff00;
          background: #222;
          color: #00ff00;
          cursor: pointer;
          font-size: 10px;
        }

        .toggle-btn.active {
          background: #00ff00;
          color: #000;
          box-shadow: 0 0 5px #00ff00;
        }
        
        .trigger-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 8px;
        }

        .trigger-buttons button {
          padding: 5px;
          background-color: #333;
          border: 1px solid #555;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trigger-buttons button:hover {
          background-color: #444;
          border-color: #777;
        }

        .rainbow-text {
          animation: rainbow 2s linear infinite;
        }

        @keyframes rainbow {
          0% { color: red; }
          15% { color: orange; }
          30% { color: yellow; }
          45% { color: green; }
          60% { color: blue; }
          75% { color: indigo; }
          90% { color: violet; }
          100% { color: red; }
        }
      `}</style>
    </div>
  )
} 