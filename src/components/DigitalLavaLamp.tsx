'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'

interface Bubble {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  opacity: number
}

const DigitalLavaLamp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [isActive, setIsActive] = useState(true)
  const { systemState, visual } = useChaos()
  const animationRef = useRef<number>()

  const colors = [
    '#ff0080', '#00ffff', '#ffff00', '#ff8000', 
    '#8000ff', '#00ff80', '#ff0040', '#0080ff'
  ]

  const createBubble = (canvas: HTMLCanvasElement): Bubble => {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 50,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 3 + 1),
      radius: Math.random() * 30 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.7 + 0.3
    }
  }

  const updateBubbles = (canvas: HTMLCanvasElement, bubbleArray: Bubble[]): Bubble[] => {
    return bubbleArray
      .map(bubble => {
        // Update position
        bubble.x += bubble.vx
        bubble.y += bubble.vy
        
        // Add some chaos effects
        if (systemState.chaosLevel > 1) {
          bubble.vx += (Math.random() - 0.5) * 0.5
          bubble.vy += (Math.random() - 0.5) * 0.5
          bubble.radius += (Math.random() - 0.5) * 2
        }
        
        // Bounce off walls
        if (bubble.x <= bubble.radius || bubble.x >= canvas.width - bubble.radius) {
          bubble.vx *= -0.8
        }
        
        // Slow rise effect
        if (bubble.y < canvas.height * 0.3) {
          bubble.vy *= 0.98
        }
        
        // Random color changes in chaos mode
        if (systemState.chaosLevel > 1.5 && Math.random() < 0.02) {
          bubble.color = colors[Math.floor(Math.random() * colors.length)]
        }
        
        return bubble
      })
      .filter(bubble => bubble.y > -100 && bubble.radius > 5) // Remove bubbles that are too far up or too small
  }

  const drawBubbles = (ctx: CanvasRenderingContext2D, bubbleArray: Bubble[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
    gradient.addColorStop(0, '#000040')
    gradient.addColorStop(0.5, '#000080')
    gradient.addColorStop(1, '#000020')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    // Draw bubbles
    bubbleArray.forEach(bubble => {
      ctx.save()
      ctx.globalAlpha = bubble.opacity
      
      // Bubble gradient
      const bubbleGradient = ctx.createRadialGradient(
        bubble.x, bubble.y, 0,
        bubble.x, bubble.y, bubble.radius
      )
      bubbleGradient.addColorStop(0, bubble.color + 'CC')
      bubbleGradient.addColorStop(0.7, bubble.color + '66')
      bubbleGradient.addColorStop(1, bubble.color + '00')
      
      ctx.fillStyle = bubbleGradient
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Add glow effect
      ctx.shadowColor = bubble.color
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, bubble.radius * 0.5, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    })
  }

  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !isActive) return
    
    setBubbles(prevBubbles => {
      let newBubbles = updateBubbles(canvas, prevBubbles)
      
      // Add new bubbles occasionally
      if (Math.random() < 0.03 * systemState.chaosLevel) {
        newBubbles.push(createBubble(canvas))
      }
      
      // Limit bubble count
      const maxBubbles = systemState.performanceMode === 'low' ? 15 : 30
      if (newBubbles.length > maxBubbles) {
        newBubbles = newBubbles.slice(-maxBubbles)
      }
      
      drawBubbles(ctx, newBubbles)
      return newBubbles
    })
    
    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Initialize bubbles
    const initialBubbles: Bubble[] = []
    for (let i = 0; i < 10; i++) {
      initialBubbles.push(createBubble(canvas))
    }
    setBubbles(initialBubbles)
    
    // Start animation
    if (isActive) {
      animate()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, systemState.chaosLevel, systemState.performanceMode])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Create explosion of bubbles at click point
    const newBubbles: Bubble[] = []
    for (let i = 0; i < 5; i++) {
      newBubbles.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: -(Math.random() * 2 + 1),
        radius: Math.random() * 20 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.8
      })
    }
    
    setBubbles(prev => [...prev, ...newBubbles])
    visual.triggerCursorExplosion(e.clientX, e.clientY)
  }

  return (
    <div className="digital-lava-lamp">
      <div className="lamp-header">
        <h2 className="rainbow-text">🌋 Digital Lava Lamp 🌋</h2>
        <div className="controls">
          <button 
            className={`control-btn ${isActive ? 'active' : ''}`}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <div className="chaos-indicator">
            Chaos: {Math.round(systemState.chaosLevel * 100)}%
          </div>
        </div>
      </div>
      
      <div className="lamp-container">
        <canvas
          ref={canvasRef}
          width={300}
          height={400}
          className="lamp-canvas"
          onClick={handleCanvasClick}
        />
        <div className="lamp-base">
          <div className="lamp-light blink" />
        </div>
      </div>
      
      <div className="instructions">
        Click anywhere to create bubble explosions!
      </div>

      <style jsx>{`
        .digital-lava-lamp {
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px outset #666;
          padding: 15px;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          text-align: center;
        }

        .lamp-header {
          margin-bottom: 15px;
        }

        .lamp-header h2 {
          font-size: 16px;
          margin-bottom: 10px;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .control-btn {
          background: linear-gradient(135deg, #333, #555);
          border: 1px outset #666;
          color: #ccc;
          padding: 5px 10px;
          font-size: 10px;
          cursor: pointer;
          font-family: inherit;
          border-radius: 3px;
        }

        .control-btn.active {
          background: linear-gradient(135deg, #00aa00, #006600);
          color: white;
        }

        .control-btn:hover {
          filter: brightness(1.2);
        }

        .chaos-indicator {
          font-size: 10px;
          color: #ffff00;
        }

        .lamp-container {
          position: relative;
          display: inline-block;
          margin-bottom: 10px;
        }

        .lamp-canvas {
          border: 3px solid #666;
          border-radius: 15px 15px 5px 5px;
          background: linear-gradient(180deg, #000040, #000080, #000020);
          cursor: pointer;
          display: block;
        }

        .lamp-canvas:hover {
          border-color: #00ff00;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .lamp-base {
          background: linear-gradient(135deg, #666, #333);
          border: 2px outset #666;
          height: 30px;
          width: 100px;
          margin: 0 auto;
          border-radius: 5px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lamp-light {
          width: 8px;
          height: 8px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 5px #00ff00;
        }

        .instructions {
          font-size: 10px;
          color: #cccccc;
          margin-top: 10px;
        }

        @media (max-width: 768px) {
          .lamp-canvas {
            width: 250px;
            height: 320px;
          }
          
          .controls {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  )
}

export default DigitalLavaLamp