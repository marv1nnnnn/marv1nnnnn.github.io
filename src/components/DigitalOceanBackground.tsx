'use client'

import { useRef, useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'

interface DigitalOceanBackgroundProps {
  glitchLevel?: number
  breathingManager?: AtmosphericBreathingManager
}

export default function DigitalOceanBackground({ glitchLevel = 0, breathingManager }: DigitalOceanBackgroundProps) {
  const atmosphericRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  // EXTREME: Initialize with much steeper downward angle for dramatic flying perspective
  const [rotation, setRotation] = useState({ x: -35, y: 0 })
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })
  const [autoRotation, setAutoRotation] = useState({ x: 0, y: 0 })
  
  // Create a default breathing manager if not provided (for backward compatibility)
  const defaultBreathingManager = useMemo(() => new AtmosphericBreathingManager(), [])
  const activeBreathingManager = breathingManager || defaultBreathingManager

  // EXTREME: Enhanced auto-drift animation for dramatic flying feeling
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setAutoRotation(prev => ({
          x: prev.x + 0.08, // Much faster X drift
          y: prev.y + 0.05  // Much faster Y drift
        }))
      }
    }, 80) // Faster updates

    return () => clearInterval(interval)
  }, [isDragging])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setLastMousePosition({ x: e.clientX, y: e.clientY })
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - lastMousePosition.x
    const deltaY = e.clientY - lastMousePosition.y
    
    // EXTREME: Increased sensitivity for more dramatic control
    const sensitivity = 0.6
    
    setRotation(prev => {
      // EXTREME: Much wider rotation range for dramatic perspectives
      const newX = Math.max(-70, Math.min(25, prev.x + deltaY * sensitivity)) // Steep down to looking up
      const newY = prev.y + deltaX * sensitivity // Free horizontal rotation
      
      return { x: newX, y: newY }
    })
    
    setLastMousePosition({ x: e.clientX, y: e.clientY })
  }, [isDragging, lastMousePosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // EXTREME: Calculate final rotation with more pronounced auto-movement
  const finalRotation = {
    x: rotation.x + (autoRotation.x * 1.2), // Much more pronounced auto-movement
    y: rotation.y + (autoRotation.y * 0.8)
  }

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      className={`digital-ocean-background velvet-amethyst-base ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Ocean waves layers - repositioned for extreme flying perspective */}
      <div className="ocean-layer ocean-deep" />
      <div className="ocean-layer ocean-mid" />
      <div className="ocean-layer ocean-surface" />
      
      {/* Data streams */}
      <div className="data-streams" />
      
      {/* Phase 4: Mysterious Atmospheric Depths */}
      <div
        ref={atmosphericRef}
        className="atmospheric-depths"
        style={{
          transform: `perspective(800px) rotateX(${finalRotation.x}deg) rotateY(${finalRotation.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Distant geometric forms */}
        <div className="distant-geometrics geometry-1" />
        <div className="distant-geometrics geometry-2" />
        <div className="distant-geometrics geometry-3" />
        <div className="distant-geometrics geometry-4" />
        
        {/* Edge shadows */}
        <div className="edge-shadows shadow-1" />
        <div className="edge-shadows shadow-2" />
        <div className="edge-shadows shadow-3" />
        <div className="edge-shadows shadow-4" />
      </div>
      
      <style jsx>{`
        .digital-ocean-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          min-width: 100vw;
          min-height: 100vh;
          max-width: 100vw;
          max-height: 100vh;
          z-index: 0;
          pointer-events: auto;
          overflow: hidden;
          transition: transform 0.05s ease-out; /* Faster transitions for more responsive feel */
          margin: 0;
          padding: 0;
          border: none;
          outline: none;
          box-sizing: border-box;
          /* EXTREME: Enhanced perspective for dramatic flying feeling */
          perspective: 800px; /* Tighter perspective for more dramatic effect */
          perspective-origin: center 30%; /* Shifted even more up for extreme ocean/sky balance */
        }

        .digital-ocean-background.dragging {
          transition: none;
        }

        .digital-ocean-background:hover {
          cursor: grab;
        }

        .digital-ocean-background.dragging:hover {
          cursor: grabbing;
        }

        .velvet-amethyst-base {
          box-shadow:
            0 0 100px rgba(124, 58, 237, 0.4), /* Intensified */
            0 0 200px rgba(168, 85, 247, 0.3),
            0 0 300px rgba(196, 132, 252, 0.2);
          backdrop-filter: blur(25px) saturate(1.8); /* More intense */
          background: radial-gradient(ellipse at center,
            rgba(124, 58, 237, 0.25) 0%, /* More intense */
            rgba(26, 13, 46, 0.15) 70%,
            transparent 100%);
        }

        .ocean-layer {
          position: absolute;
          /* EXTREME: Repositioned for dramatic flying perspective */
          top: 50%; /* Moved even further down for more sky space */
          left: -40%;
          width: 180%; /* Expanded for wider coverage */
          height: 160%; 
          opacity: 0.9; /* Slightly more visible */
          box-sizing: border-box;
          transform-origin: center bottom;
        }

        .ocean-deep {
          background:
            radial-gradient(ellipse at 20% 30%, rgba(26, 13, 46, 0.9) 0%, transparent 60%), /* More intense */
            radial-gradient(ellipse at 80% 70%, rgba(45, 27, 78, 0.7) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(15, 11, 46, 0.8) 0%, transparent 40%);
          animation: wave-drift-slow 25s infinite linear; /* Faster for more dramatic movement */
        }

        .ocean-mid {
          background:
            radial-gradient(ellipse at 60% 20%, rgba(124, 58, 237, 0.7) 0%, transparent 70%), /* More intense */
            radial-gradient(ellipse at 10% 80%, rgba(124, 58, 237, 0.5) 0%, transparent 60%),
            radial-gradient(ellipse at 90% 50%, rgba(91, 33, 182, 0.6) 0%, transparent 50%);
          animation: wave-drift-medium 20s infinite linear reverse; /* Faster */
        }

        .ocean-surface {
          background:
            radial-gradient(ellipse at 40% 60%, rgba(196, 132, 252, 0.5) 0%, transparent 50%), /* More intense */
            radial-gradient(ellipse at 70% 10%, rgba(168, 85, 247, 0.4) 0%, transparent 40%),
            radial-gradient(ellipse at 20% 90%, rgba(196, 132, 252, 0.35) 0%, transparent 30%);
          animation: wave-drift-fast 15s infinite linear; /* Faster */
        }

        .data-streams {
          position: absolute;
          top: 50%; /* Aligned with extreme ocean positioning */
          left: 0;
          width: 100%;
          height: 50%; /* Reduced further for more sky space */
          background:
            linear-gradient(45deg, transparent 46%, rgba(196, 132, 252, 0.12) 49%, rgba(196, 132, 252, 0.3) 50%, rgba(196, 132, 252, 0.12) 51%, transparent 54%), /* More intense */
            linear-gradient(-45deg, transparent 46%, rgba(168, 85, 247, 0.12) 49%, rgba(168, 85, 247, 0.3) 50%, rgba(168, 85, 247, 0.12) 51%, transparent 54%);
          background-size: 60px 60px, 90px 90px; /* Tighter pattern for more detail */
          animation: data-flow 10s infinite linear; /* Much faster for dramatic effect */
          opacity: ${glitchLevel > 0 ? 0.4 + glitchLevel * 0.3 : 0.25}; /* More visible */
          box-sizing: border-box;
          overflow: hidden;
        }

        @keyframes wave-drift-slow {
          0% { transform: translate(-8%, -8%) rotate(0deg) scale(1.05); } /* More dramatic movement */
          100% { transform: translate(8%, 8%) rotate(360deg) scale(1.05); }
        }

        @keyframes wave-drift-medium {
          0% { transform: translate(6%, -6%) rotate(0deg) scale(1.08); }
          100% { transform: translate(-6%, 6%) rotate(-360deg) scale(1.08); }
        }

        @keyframes wave-drift-fast {
          0% { transform: translate(-6%, 6%) rotate(0deg) scale(0.92); }
          100% { transform: translate(6%, -6%) rotate(360deg) scale(0.92); }
        }

        @keyframes data-flow {
          0% { background-position: 0% 0%, 100% 100%; }
          100% { background-position: 200% 200%, -100% -100%; } /* More dramatic movement */
        }

        /* Phase 4: Mysterious Atmospheric Depths */
        .atmospheric-depths {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          transform-style: preserve-3d;
          transition: transform 0.1s ease-out; /* Faster for more responsive feel */
          overflow: hidden;
          box-sizing: border-box;
        }

        .digital-ocean-background.dragging .atmospheric-depths {
          transition: none;
        }

        .distant-geometrics, .pulsing-beacons, .edge-shadows {
          position: absolute;
          transform-style: preserve-3d;
          box-sizing: border-box;
        }

        .distant-geometrics {
          width: 250px; /* Larger for more presence */
          height: 250px;
          border-radius: 25%;
          border: 2px solid rgba(196, 132, 252, 0.2); /* More visible */
          background: radial-gradient(ellipse at center, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
          animation: float-geometry 20s infinite ease-in-out alternate; /* Faster floating */
        }
        
        /* EXTREME: Repositioned geometrics for dramatic flying perspective */
        .geometry-1 { top: 70%; left: 15%; transform: translateZ(-600px) scale(1.4); animation-delay: -5s; }
        .geometry-2 { top: 85%; left: 80%; transform: translateZ(-800px) scale(1.8); animation-delay: -10s; }
        .geometry-3 { top: 75%; left: 10%; transform: translateZ(-500px) scale(1.0); animation-delay: -15s; }
        .geometry-4 { top: 60%; left: 75%; transform: translateZ(-700px) scale(1.2); animation-delay: -2s; }
        
        .edge-shadows {
          width: 400px; /* Larger shadows */
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(10, 5, 20, 0.6) 0%, transparent 60%); /* More intense */
          animation: drift-shadow 28s infinite linear; /* Faster drift */
        }

        /* EXTREME: Repositioned shadows for dramatic ocean area */
        .shadow-1 { top: 60%; left: -10%; transform: translateZ(-900px); animation-delay: -2s; }
        .shadow-2 { bottom: -15%; right: -15%; transform: translateZ(-1200px); animation-delay: -10s; }
        .shadow-3 { top: 80%; left: 5%; transform: translateZ(-1000px); animation-delay: -20s; }
        .shadow-4 { top: 70%; right: 0%; transform: translateZ(-1300px); animation-delay: -15s; }

        @keyframes float-geometry {
          from { transform: translateZ(-600px) rotateY(0deg) translateX(0px) translateY(0px); }
          to { transform: translateZ(-600px) rotateY(360deg) translateX(50px) translateY(20px); } /* More dramatic movement */
        }

        @keyframes drift-shadow {
          from { transform: translate(-8%, -8%) rotate(0deg) scale(1.1); } /* More dramatic */
          to { transform: translate(8%, 8%) rotate(360deg) scale(1.1); }
        }

        /* EXTREME: Enhanced glitch effects */
        ${glitchLevel > 0 ? `
          .ocean-layer {
            animation-duration: ${Math.max(5, 20 - glitchLevel * 8)}s; /* Much faster during glitch */
            filter: hue-rotate(${glitchLevel * 45}deg) saturate(${1 + glitchLevel * 0.8}) contrast(${1 + glitchLevel * 0.3});
          }
          
          .data-streams {
            animation-duration: ${Math.max(3, 10 - glitchLevel * 4)}s; /* Much faster */
          }

          /* Atmospheric elements extreme glitch effects */
          .distant-geometrics {
            animation-duration: ${Math.max(25, 80 - glitchLevel * 20)}s;
            filter: blur(${20 + glitchLevel * 8}px) hue-rotate(${glitchLevel * 60}deg) saturate(${1 + glitchLevel * 0.6});
            opacity: ${0.35 + glitchLevel * 0.4};
          }

          .edge-shadows {
            animation-duration: ${Math.max(15, 40 - glitchLevel * 12)}s;
            filter: blur(${40 + glitchLevel * 15}px) contrast(${1 + glitchLevel * 0.4});
            opacity: ${0.25 + glitchLevel * 0.35};
          }

          /* EXTREME: Chaos mode intensification */
          ${glitchLevel > 0.7 ? `
            .atmospheric-depths {
              animation: extremeChaosDistortion 2s ease-in-out infinite;
            }
            
            @keyframes extremeChaosDistortion {
              0%, 100% { transform: scale(1) skew(0deg) rotateZ(0deg); }
              20% { transform: scale(1.05) skew(${glitchLevel * 3}deg) rotateZ(${glitchLevel * 2}deg); }
              40% { transform: scale(0.95) skew(-${glitchLevel * 2.5}deg) rotateZ(-${glitchLevel * 1.5}deg); }
              60% { transform: scale(1.02) skew(${glitchLevel * 2}deg) rotateZ(${glitchLevel * 1}deg); }
              80% { transform: scale(0.98) skew(-${glitchLevel * 1.5}deg) rotateZ(-${glitchLevel * 0.5}deg); }
            }
          ` : ''}
        ` : ''}

        /* Performance optimizations */
        .atmospheric-depths {
          will-change: transform, opacity;
          contain: layout style paint;
        }

        .distant-geometrics, .edge-shadows {
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        /* EXTREME: Enhanced 3D depth for dramatic flying perspective */
        .distant-geometrics {
          transform-origin: center center;
        }

        .geometry-1 { transform: rotate(35deg) translateZ(-600px); }
        .geometry-2 { transform: rotate(-60deg) translateZ(-800px); }
        .geometry-3 { transform: rotate(80deg) translateZ(-500px); }
        .geometry-4 { transform: rotate(-45deg) translateZ(-700px); }

        .edge-shadows {
          transform-origin: center center;
        }

        .shadow-1 { transform: translateZ(-900px); }
        .shadow-2 { transform: translateZ(-1200px); }
        .shadow-3 { transform: translateZ(-1000px); }
        .shadow-4 { transform: translateZ(-1300px); }

        /* EXTREME: Interactive visual enhancement during dragging */
        .digital-ocean-background.dragging .distant-geometrics {
          filter: blur(5px) saturate(1.3) contrast(1.2);
          animation-play-state: paused;
        }

        .digital-ocean-background.dragging .edge-shadows {
          filter: blur(20px) saturate(1.1) contrast(1.1);
          animation-play-state: paused;
        }

        /* EXTREME: Sky area preparation - much larger space for dramatic sky */
        .sky-area {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 50%; /* Much larger space for dramatic sky elements */
          pointer-events: none;
          z-index: 0;
        }

        /* Reduced motion accessibility */
        @media (prefers-reduced-motion: reduce) {
          .distant-geometrics,
          .edge-shadows,
          .ocean-layer {
            animation-duration: 200s !important; /* Slower for accessibility */
            animation-timing-function: linear !important;
          }
        }
      `}</style>
    </div>
  )
}