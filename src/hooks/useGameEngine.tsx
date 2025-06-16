'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver'

export interface GameEngineConfig {
  initialScore?: number
  frameRate?: number
  autoStart?: boolean
}

export interface GameEngineReturn {
  gameState: GameState
  score: number
  level: number
  lives: number
  isRunning: boolean
  frameCount: number
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  resetGame: () => void
  updateScore: (points: number) => void
  setLevel: (newLevel: number) => void
  setLives: (newLives: number) => void
  onGameFrame: (callback: () => void) => void
  removeGameFrame: (callback: () => void) => void
}

export const useGameEngine = (config: GameEngineConfig = {}): GameEngineReturn => {
  const {
    initialScore = 0,
    frameRate = 60,
    autoStart = false
  } = config

  const [gameState, setGameState] = useState<GameState>(autoStart ? 'playing' : 'menu')
  const [score, setScore] = useState(initialScore)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [frameCount, setFrameCount] = useState(0)
  
  const gameLoopRef = useRef<number>()
  const frameCallbacksRef = useRef<Set<() => void>>(new Set())
  const lastFrameTime = useRef<number>(0)
  const frameInterval = 1000 / frameRate

  const isRunning = gameState === 'playing'

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = (currentTime: number) => {
        if (currentTime - lastFrameTime.current >= frameInterval) {
          setFrameCount(prev => prev + 1)
          
          // Execute all frame callbacks
          frameCallbacksRef.current.forEach(callback => {
            try {
              callback()
            } catch (error) {
              console.error('Game frame callback error:', error)
            }
          })
          
          lastFrameTime.current = currentTime
        }
        
        if (gameState === 'playing') {
          gameLoopRef.current = requestAnimationFrame(gameLoop)
        }
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, frameInterval])

  const startGame = useCallback(() => {
    setGameState('playing')
    setFrameCount(0)
  }, [])

  const pauseGame = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused')
    }
  }, [gameState])

  const resumeGame = useCallback(() => {
    if (gameState === 'paused') {
      setGameState('playing')
    }
  }, [gameState])

  const endGame = useCallback(() => {
    setGameState('gameOver')
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  const resetGame = useCallback(() => {
    setGameState('menu')
    setScore(initialScore)
    setLevel(1)
    setLives(3)
    setFrameCount(0)
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [initialScore])

  const updateScore = useCallback((points: number) => {
    setScore(prev => Math.max(0, prev + points))
  }, [])

  const onGameFrame = useCallback((callback: () => void) => {
    frameCallbacksRef.current.add(callback)
  }, [])

  const removeGameFrame = useCallback((callback: () => void) => {
    frameCallbacksRef.current.delete(callback)
  }, [])

  return {
    gameState,
    score,
    level,
    lives,
    isRunning,
    frameCount,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    resetGame,
    updateScore,
    setLevel,
    setLives,
    onGameFrame,
    removeGameFrame
  }
}