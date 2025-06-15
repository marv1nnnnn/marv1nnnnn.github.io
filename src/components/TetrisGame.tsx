'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const COLORS = ['#ff0040', '#00ff80', '#0080ff', '#ff8000', '#8000ff', '#ffff00', '#00ffff']

interface Position {
  x: number
  y: number
}

const TetrisGame: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  )
  const [currentPiece, setCurrentPiece] = useState<Position[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [chaosMode, setChaosMode] = useState(false)
  const { triggerSystemWideEffect, audio, systemState } = useChaos()

  // Tetris pieces (simplified)
  const pieces = [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], // I-piece
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], // O-piece
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // T-piece
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // S-piece
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], // Z-piece
  ]

  const spawnPiece = useCallback(() => {
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
    const centered = randomPiece.map(pos => ({ x: pos.x + 3, y: pos.y }))
    setCurrentPiece(centered)
  }, [pieces])

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)))
    setScore(0)
    setGameOver(false)
    setIsPlaying(true)
    setChaosMode(false)
    spawnPiece()
  }

  const checkCollision = useCallback((piece: Position[], dx = 0, dy = 0): boolean => {
    return piece.some(pos => {
      const newX = pos.x + dx
      const newY = pos.y + dy
      return (
        newX < 0 || 
        newX >= BOARD_WIDTH || 
        newY >= BOARD_HEIGHT || 
        (newY >= 0 && board[newY] && board[newY][newX] !== 0)
      )
    })
  }, [board])

  const placePiece = useCallback(() => {
    const newBoard = [...board]
    currentPiece.forEach(pos => {
      if (pos.y >= 0) {
        newBoard[pos.y][pos.x] = Math.floor(Math.random() * COLORS.length) + 1
      }
    })

    // Check for completed lines
    let linesCleared = 0
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        newBoard.splice(y, 1)
        newBoard.unshift(Array(BOARD_WIDTH).fill(0))
        linesCleared++
        y++ // Check the same line again
      }
    }

    if (linesCleared > 0) {
      const points = linesCleared * 100 * (chaosMode ? Math.floor(Math.random() * 5) + 1 : 1)
      setScore(prev => prev + points)
      audio.soundEffects.success()
      triggerSystemWideEffect('rainbow-cascade')

      // Random chaos mode activation
      if (Math.random() < 0.15 * systemState.chaosLevel) {
        setChaosMode(true)
        triggerSystemWideEffect('full-chaos')
        setTimeout(() => setChaosMode(false), 5000)
      }
    }

    setBoard(newBoard)
    
    // Check game over
    if (checkCollision(currentPiece)) {
      setGameOver(true)
      setIsPlaying(false)
      audio.soundEffects.error()
      triggerSystemWideEffect('system-shock')
    } else {
      spawnPiece()
    }
  }, [board, currentPiece, checkCollision, spawnPiece, chaosMode, audio, triggerSystemWideEffect, systemState.chaosLevel])

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver || currentPiece.length === 0) return

    const interval = setInterval(() => {
      setCurrentPiece(prev => {
        if (checkCollision(prev, 0, 1)) {
          placePiece()
          return prev
        }
        return prev.map(pos => ({ ...pos, y: pos.y + 1 }))
      })
    }, chaosMode ? 200 : 1000)

    return () => clearInterval(interval)
  }, [isPlaying, gameOver, currentPiece, checkCollision, placePiece, chaosMode])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return

      switch (e.key) {
        case 'ArrowLeft':
          setCurrentPiece(prev => {
            if (!checkCollision(prev, -1, 0)) {
              return prev.map(pos => ({ ...pos, x: pos.x - 1 }))
            }
            return prev
          })
          break
        case 'ArrowRight':
          setCurrentPiece(prev => {
            if (!checkCollision(prev, 1, 0)) {
              return prev.map(pos => ({ ...pos, x: pos.x + 1 }))
            }
            return prev
          })
          break
        case 'ArrowDown':
          setCurrentPiece(prev => {
            if (!checkCollision(prev, 0, 1)) {
              return prev.map(pos => ({ ...pos, y: pos.y + 1 }))
            }
            return prev
          })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, gameOver, checkCollision])

  // Start with spawning a piece
  useEffect(() => {
    if (isPlaying && currentPiece.length === 0) {
      spawnPiece()
    }
  }, [isPlaying, currentPiece.length, spawnPiece])

  return (
    <div className="tetris-game">
      <div className="game-header">
        <h2 className={`game-title ${chaosMode ? 'glitch-active rainbow-text' : ''}`}>
          🧱 {chaosMode ? 'CHAOS TETRIS' : 'TETRIS GAME'} 🧱
        </h2>
        <div className="score">Score: {score}</div>
      </div>

      <div className="game-container">
        <div className={`game-board ${chaosMode ? 'chaos-mode' : ''}`}>
          {board.map((row, y) => (
            row.map((cell, x) => {
              const isPiece = currentPiece.some(pos => pos.x === x && pos.y === y)
              const colorIndex = isPiece ? Math.floor(Math.random() * COLORS.length) : cell - 1
              const cellColor = colorIndex >= 0 ? COLORS[colorIndex] : '#000'
              
              return (
                <div
                  key={`${x}-${y}`}
                  className={`tetris-cell ${isPiece ? 'current-piece' : ''} ${chaosMode ? 'glitching' : ''}`}
                  style={{
                    backgroundColor: chaosMode && (cell > 0 || isPiece) 
                      ? `hsl(${Math.random() * 360}, 100%, 50%)`
                      : cellColor,
                    border: (cell > 0 || isPiece) ? '1px solid #fff' : '1px solid #333'
                  }}
                />
              )
            })
          ))}
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
              <div>Arrow keys to move</div>
              <div>Down arrow to drop faster</div>
              {chaosMode && (
                <div className="chaos-warning blink rainbow-text">
                  ⚡ CHAOS MODE ⚡
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tetris-game {
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

        .game-container {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: flex-start;
        }

        .game-board {
          display: grid;
          grid-template-columns: repeat(${BOARD_WIDTH}, 20px);
          grid-template-rows: repeat(${BOARD_HEIGHT}, 20px);
          gap: 1px;
          background: #000;
          border: 2px solid #00ff00;
          padding: 5px;
        }

        .game-board.chaos-mode {
          border-color: #ff00ff;
          animation: boardGlitch 0.1s infinite;
        }

        @keyframes boardGlitch {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }

        .tetris-cell {
          width: 20px;
          height: 20px;
          transition: background-color 0.1s;
        }

        .tetris-cell.current-piece {
          box-shadow: 0 0 5px #fff;
        }

        .tetris-cell.glitching {
          animation: cellGlitch 0.1s infinite;
        }

        @keyframes cellGlitch {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .game-controls {
          min-width: 150px;
        }

        .game-button {
          background: linear-gradient(135deg, #00aa00, #006600);
          border: 2px outset #00aa00;
          color: white;
          padding: 10px 15px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          margin: 5px 0;
          font-family: inherit;
          border-radius: 5px;
          width: 100%;
        }

        .game-button:hover {
          background: linear-gradient(135deg, #00cc00, #008800);
        }

        .restart-button {
          background: linear-gradient(135deg, #ff6600, #cc4400);
          border-color: #ff6600;
        }

        .restart-button:hover {
          background: linear-gradient(135deg, #ff8800, #ee5500);
        }

        .game-over-text {
          font-size: 16px;
          margin-bottom: 10px;
          text-shadow: 0 0 10px #ff0040;
        }

        .final-score {
          font-size: 14px;
          color: #ffff00;
          margin-bottom: 15px;
        }

        .instructions {
          font-size: 10px;
          color: #cccccc;
          text-align: left;
        }

        .instructions div {
          margin-bottom: 5px;
        }

        .chaos-warning {
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          margin-top: 10px;
        }

        @media (max-width: 768px) {
          .game-container {
            flex-direction: column;
            align-items: center;
          }
          
          .tetris-cell {
            width: 15px;
            height: 15px;
          }
          
          .game-board {
            grid-template-columns: repeat(${BOARD_WIDTH}, 15px);
            grid-template-rows: repeat(${BOARD_HEIGHT}, 15px);
          }
        }
      `}</style>
    </div>
  )
}

export default TetrisGame