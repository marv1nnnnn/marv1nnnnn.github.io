'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'

interface Position {
  x: number
  y: number
}

const GRID_SIZE = 20
const CANVAS_SIZE = 400

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [glitchMode, setGlitchMode] = useState(false)
  const { triggerSystemWideEffect, audio, systemState } = useChaos()

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const maxPos = CANVAS_SIZE / GRID_SIZE
    return {
      x: Math.floor(Math.random() * maxPos),
      y: Math.floor(Math.random() * maxPos)
    }
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }])
    setFood(generateFood())
    setDirection({ x: 1, y: 0 })
    setGameOver(false)
    setScore(0)
    setIsPlaying(true)
    setGlitchMode(false)
  }, [generateFood])

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return

    const gameInterval = setInterval(() => {
      setSnake(currentSnake => {
        const newSnake = [...currentSnake]
        const head = { ...newSnake[0] }
        
        // Move head
        head.x += direction.x
        head.y += direction.y

        // Check wall collision (or glitch through walls sometimes)
        const maxPos = CANVAS_SIZE / GRID_SIZE
        if (glitchMode && Math.random() < 0.3) {
          // Glitch mode: wrap around sometimes
          if (head.x < 0) head.x = maxPos - 1
          if (head.x >= maxPos) head.x = 0
          if (head.y < 0) head.y = maxPos - 1
          if (head.y >= maxPos) head.y = 0
        } else {
          // Normal collision detection
          if (head.x < 0 || head.x >= maxPos || head.y < 0 || head.y >= maxPos) {
            setGameOver(true)
            audio.soundEffects.error()
            triggerSystemWideEffect('system-shock')
            return currentSnake
          }
        }

        // Check self collision
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          if (glitchMode && Math.random() < 0.4) {
            // Glitch mode: sometimes ignore self collision
            triggerSystemWideEffect('chaos-explosion')
          } else {
            setGameOver(true)
            audio.soundEffects.error()
            return currentSnake
          }
        }

        newSnake.unshift(head)

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + (glitchMode ? Math.floor(Math.random() * 50) + 1 : 10))
          setFood(generateFood())
          audio.soundEffects.success()
          
          // Random chance to enter glitch mode
          if (Math.random() < 0.1 * systemState.chaosLevel) {
            setGlitchMode(true)
            triggerSystemWideEffect('full-chaos')
            setTimeout(() => setGlitchMode(false), 3000)
          } else {
            triggerSystemWideEffect('rainbow-cascade')
          }
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, glitchMode ? 50 : 150) // Faster when glitching

    return () => clearInterval(gameInterval)
  }, [isPlaying, gameOver, direction, food, generateFood, glitchMode, audio, triggerSystemWideEffect, systemState.chaosLevel])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 })
          break
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 })
          break
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 })
          break
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction, isPlaying, gameOver])

  return (
    <div className="snake-game">
      <div className="game-header">
        <h2 className={`game-title ${glitchMode ? 'glitch-active' : ''}`}>
          🐍 {glitchMode ? 'GLITCH SNAKE' : 'SNAKE GAME'} 🐍
        </h2>
        <div className="score">Score: {score}</div>
      </div>

      <div className="game-canvas-container">
        <div 
          className={`game-canvas ${glitchMode ? 'glitch-mode' : ''}`}
          style={{ 
            width: CANVAS_SIZE, 
            height: CANVAS_SIZE,
            background: glitchMode 
              ? `hsl(${Math.random() * 360}, 100%, 10%)`
              : '#003300'
          }}
        >
          {/* Render snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`snake-segment ${index === 0 ? 'head' : ''} ${glitchMode ? 'glitching' : ''}`}
              style={{
                left: segment.x * GRID_SIZE,
                top: segment.y * GRID_SIZE,
                width: GRID_SIZE - 1,
                height: GRID_SIZE - 1,
                background: glitchMode 
                  ? `hsl(${Math.random() * 360}, 100%, 50%)`
                  : (index === 0 ? '#00ff00' : '#00cc00')
              }}
            />
          ))}

          {/* Render food */}
          <div
            className={`food ${glitchMode ? 'glitch-food' : ''}`}
            style={{
              left: food.x * GRID_SIZE,
              top: food.y * GRID_SIZE,
              width: GRID_SIZE - 1,
              height: GRID_SIZE - 1,
              background: glitchMode 
                ? `hsl(${Math.random() * 360}, 100%, 70%)`
                : '#ff0040'
            }}
          />
        </div>
      </div>

      <div className="game-controls">
        {!isPlaying && !gameOver && (
          <button className="game-button start-button" onClick={resetGame}>
            🎮 START GAME
          </button>
        )}
        
        {gameOver && (
          <div className="game-over">
            <div className="game-over-text blink error-text">GAME OVER!</div>
            <div className="final-score">Final Score: {score}</div>
            <button className="game-button restart-button" onClick={resetGame}>
              🔄 PLAY AGAIN
            </button>
          </div>
        )}

        {isPlaying && !gameOver && (
          <div className="instructions">
            <div>Use arrow keys to move</div>
            {glitchMode && (
              <div className="glitch-warning blink rainbow-text">
                ⚡ GLITCH MODE ACTIVE ⚡
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .snake-game {
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          border: 2px outset #666;
          padding: 15px;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          text-align: center;
        }

        .game-header {
          margin-bottom: 15px;
        }

        .game-title {
          font-size: 18px;
          margin-bottom: 10px;
          text-shadow: 0 0 10px #00ff00;
        }

        .score {
          font-size: 14px;
          color: #ffff00;
        }

        .game-canvas-container {
          display: flex;
          justify-content: center;
          margin-bottom: 15px;
        }

        .game-canvas {
          position: relative;
          border: 2px solid #00ff00;
          background: #003300;
        }

        .game-canvas.glitch-mode {
          border-color: #ff00ff;
          animation: borderGlitch 0.1s infinite;
        }

        @keyframes borderGlitch {
          0%, 100% { border-color: #ff00ff; }
          25% { border-color: #00ffff; }
          50% { border-color: #ffff00; }
          75% { border-color: #ff0040; }
        }

        .snake-segment {
          position: absolute;
          border-radius: 2px;
          transition: background 0.1s;
        }

        .snake-segment.head {
          border: 1px solid #ffffff;
          box-shadow: 0 0 5px #00ff00;
        }

        .snake-segment.glitching {
          animation: segmentGlitch 0.1s infinite;
        }

        @keyframes segmentGlitch {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }

        .food {
          position: absolute;
          border-radius: 50%;
          animation: foodPulse 1s ease-in-out infinite;
        }

        .food.glitch-food {
          animation: foodGlitch 0.2s infinite;
          border-radius: 0;
        }

        @keyframes foodPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes foodGlitch {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.3) rotate(90deg); }
          50% { transform: scale(0.8) rotate(180deg); }
          75% { transform: scale(1.1) rotate(270deg); }
        }

        .game-controls {
          min-height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .game-button {
          background: linear-gradient(135deg, #00aa00, #006600);
          border: 2px outset #00aa00;
          color: white;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          margin: 5px;
          font-family: inherit;
          border-radius: 5px;
        }

        .game-button:hover {
          background: linear-gradient(135deg, #00cc00, #008800);
          transform: scale(1.05);
        }

        .restart-button {
          background: linear-gradient(135deg, #ff6600, #cc4400);
          border-color: #ff6600;
        }

        .restart-button:hover {
          background: linear-gradient(135deg, #ff8800, #ee5500);
        }

        .game-over {
          text-align: center;
        }

        .game-over-text {
          font-size: 20px;
          margin-bottom: 10px;
          text-shadow: 0 0 10px #ff0040;
        }

        .final-score {
          font-size: 16px;
          color: #ffff00;
          margin-bottom: 15px;
        }

        .instructions {
          font-size: 12px;
          color: #cccccc;
        }

        .glitch-warning {
          margin-top: 5px;
          font-size: 14px;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .game-canvas {
            width: 300px !important;
            height: 300px !important;
          }
          
          .snake-segment, .food {
            width: 14px !important;
            height: 14px !important;
          }
          
          .game-title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default SnakeGame