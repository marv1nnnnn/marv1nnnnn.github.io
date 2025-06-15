'use client'

import React, { useEffect, useState, useRef } from 'react'

interface TrailParticle {
  id: number
  x: number
  y: number
  timestamp: number
  color: string
  size: number
}

const TRAIL_COLORS = [
  '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
  '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff',
  '#ff00ff', '#ff0080'
]

const CursorTrail: React.FC = () => {
  const [particles, setParticles] = useState<TrailParticle[]>([])
  const [isActive, setIsActive] = useState(true)
  const [trailMode, setTrailMode] = useState<'rainbow' | 'sparkles' | 'fire' | 'matrix'>('rainbow')
  const particleIdRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const handleMouseMove = (e: MouseEvent) => {
      const newParticle: TrailParticle = {
        id: particleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        color: TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)],
        size: Math.random() * 8 + 4
      }

      setParticles(prev => {
        // Add new particle and remove old ones
        const filtered = prev.filter(p => Date.now() - p.timestamp < 1000)
        return [...filtered, newParticle]
      })
    }

    document.addEventListener('mousemove', handleMouseMove)

    // Cleanup old particles
    const cleanupInterval = setInterval(() => {
      setParticles(prev => prev.filter(p => Date.now() - p.timestamp < 1000))
    }, 100)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      clearInterval(cleanupInterval)
    }
  }, [isActive])

  const toggleActive = () => {
    setIsActive(!isActive)
    if (!isActive) {
      setParticles([]) // Clear particles when deactivating
    }
  }

  const switchMode = () => {
    const modes: (typeof trailMode)[] = ['rainbow', 'sparkles', 'fire', 'matrix']
    const currentIndex = modes.indexOf(trailMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setTrailMode(modes[nextIndex])
  }

  const getParticleStyle = (particle: TrailParticle) => {
    const age = Date.now() - particle.timestamp
    const opacity = Math.max(0, 1 - (age / 1000))
    
    let baseStyle = {
      position: 'fixed' as const,
      left: particle.x - particle.size / 2,
      top: particle.y - particle.size / 2,
      width: particle.size,
      height: particle.size,
      pointerEvents: 'none' as const,
      zIndex: 9999,
      opacity
    }

    switch (trailMode) {
      case 'rainbow':
        return {
          ...baseStyle,
          background: `radial-gradient(circle, ${particle.color}, transparent)`,
          borderRadius: '50%',
          boxShadow: `0 0 ${particle.size}px ${particle.color}`
        }
      
      case 'sparkles':
        return {
          ...baseStyle,
          background: 'white',
          borderRadius: '50%',
          boxShadow: `0 0 ${particle.size * 2}px white`,
          animation: 'sparkle 0.5s ease-out'
        }
      
      case 'fire':
        return {
          ...baseStyle,
          background: `radial-gradient(circle, orange, red, transparent)`,
          borderRadius: '50%',
          transform: `scale(${1 + Math.sin(age / 100) * 0.3})`
        }
      
      case 'matrix':
        return {
          ...baseStyle,
          background: '#00ff00',
          borderRadius: '2px',
          fontFamily: 'monospace',
          fontSize: particle.size,
          color: '#00ff00',
          textShadow: '0 0 10px #00ff00'
        }
      
      default:
        return baseStyle
    }
  }

  return (
    <div className="cursor-trail" ref={containerRef}>
      {/* Control Panel */}
      <div className="trail-controls">
        <div className="control-header">
          <div className="control-title">✨ CURSOR TRAIL FX</div>
          <div className="control-status">
            {isActive ? '● ACTIVE' : '● DISABLED'}
          </div>
        </div>
        
        <div className="control-buttons">
          <button 
            className={`control-btn ${isActive ? 'active' : 'inactive'}`}
            onClick={toggleActive}
          >
            {isActive ? 'DISABLE' : 'ENABLE'}
          </button>
          
          <button 
            className="control-btn mode-btn"
            onClick={switchMode}
            disabled={!isActive}
          >
            MODE: {trailMode.toUpperCase()}
          </button>
        </div>

        <div className="trail-info">
          <div className="info-line">
            <span className="info-label">Particles:</span>
            <span className="info-value">{particles.length}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Mode:</span>
            <span className="info-value">{trailMode}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Status:</span>
            <span className="info-value rainbow-text">
              {isActive ? 'TRAILING' : 'IDLE'}
            </span>
          </div>
        </div>

        <div className="mode-description">
          {trailMode === 'rainbow' && (
            <div className="mode-desc">🌈 Rainbow sparkles follow your cursor</div>
          )}
          {trailMode === 'sparkles' && (
            <div className="mode-desc">✨ White sparkle trail effect</div>
          )}
          {trailMode === 'fire' && (
            <div className="mode-desc">🔥 Fiery particle explosion trail</div>
          )}
          {trailMode === 'matrix' && (
            <div className="mode-desc">💚 Green matrix-style digital trail</div>
          )}
        </div>
      </div>

      {/* Render trail particles */}
      {isActive && particles.map(particle => (
        <div
          key={particle.id}
          style={getParticleStyle(particle)}
        >
          {trailMode === 'matrix' && (
            String.fromCharCode(Math.floor(Math.random() * 94) + 33)
          )}
        </div>
      ))}

      <style jsx global>{`
        @keyframes sparkle {
          0% { 
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.8;
          }
          100% { 
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      
      <style jsx>{`
        .cursor-trail {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px outset #333;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          padding: 12px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .trail-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          border-radius: 4px;
        }

        .control-title {
          font-weight: bold;
          font-size: 11px;
        }

        .control-status {
          font-size: 10px;
          color: #888;
        }

        .control-buttons {
          display: flex;
          gap: 6px;
        }

        .control-btn {
          background: linear-gradient(135deg, #003300, #001100);
          border: 1px outset #00ff00;
          color: #00ff00;
          padding: 6px 12px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
          border-radius: 3px;
          flex: 1;
        }

        .control-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #004400, #002200);
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .control-btn.active {
          background: linear-gradient(135deg, #00aa00, #006600);
          border-color: #00ff00;
        }

        .control-btn.inactive {
          background: linear-gradient(135deg, #660000, #440000);
          border-color: #ff6666;
          color: #ff6666;
        }

        .trail-info {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          padding: 8px;
          border-radius: 3px;
          font-size: 10px;
        }

        .info-line {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }

        .info-label {
          color: #888;
        }

        .info-value {
          color: #00ff00;
        }

        .rainbow-text {
          background: linear-gradient(45deg, 
            red, orange, yellow, green, blue, indigo, violet, red);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rainbow 2s ease-in-out infinite;
        }

        @keyframes rainbow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .mode-description {
          background: rgba(255, 255, 0, 0.1);
          border: 1px dashed #ffff00;
          padding: 6px;
          border-radius: 3px;
          font-size: 9px;
          color: #ffff00;
          text-align: center;
        }

        .mode-desc {
          line-height: 1.3;
        }

        /* Window glass effect */
        .cursor-trail::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          );
          pointer-events: none;
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default CursorTrail