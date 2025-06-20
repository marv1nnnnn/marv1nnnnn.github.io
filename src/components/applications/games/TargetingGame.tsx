'use client'

import { useState, useEffect, useRef } from 'react'
import { TargetingTarget } from '@/types'
import { useAudio } from '@/contexts/AudioContext'
import { gsap } from 'gsap'

interface TargetingGameProps {
  onBack: () => void
}

export default function TargetingGame({ onBack }: TargetingGameProps) {
  const { playSound } = useAudio()
  const [targets, setTargets] = useState<TargetingTarget[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60) // 1 minute
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [accuracy, setAccuracy] = useState(100)
  const [shots, setShots] = useState(0)
  const [hits, setHits] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const targetTypes = {
    'heaven-smile': { points: 50, color: '#cc0000', size: 40 },
    'remnant': { points: 100, color: '#0066cc', size: 30 },
    'phantom': { points: 200, color: '#cccc66', size: 20 },
  }

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameActive(false)
      setGameOver(true)
      playSound('gameOver')
    }
  }, [gameActive, timeLeft])

  useEffect(() => {
    if (gameActive) {
      const spawnInterval = setInterval(spawnTarget, 1500)
      return () => clearInterval(spawnInterval)
    }
  }, [gameActive])

  useEffect(() => {
    if (gameActive) {
      const moveInterval = setInterval(moveTargets, 50)
      return () => clearInterval(moveInterval)
    }
  }, [gameActive])

  const spawnTarget = () => {
    if (!gameAreaRef.current) return

    const types = Object.keys(targetTypes) as Array<keyof typeof targetTypes>
    const type = types[Math.floor(Math.random() * types.length)]
    const rect = gameAreaRef.current.getBoundingClientRect()

    const newTarget: TargetingTarget = {
      id: Date.now().toString(),
      x: Math.random() * (rect.width - 50),
      y: Math.random() * (rect.height - 50),
      speed: Math.random() * 3 + 1,
      value: targetTypes[type].points,
      type,
      isHit: false,
    }

    setTargets(prev => [...prev, newTarget])

    // Animate target entrance
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-target-id="${newTarget.id}"]`)
      if (targetElement) {
        gsap.fromTo(targetElement,
          { scale: 0, opacity: 0, rotation: 180 },
          { 
            scale: 1, 
            opacity: 1, 
            rotation: 0,
            duration: 0.3,
            ease: "back.out(1.7)"
          }
        )
      }
    }, 10)

    // Remove target after 5 seconds if not hit
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== newTarget.id))
    }, 5000)
  }

  const moveTargets = () => {
    setTargets(prev => prev.map(target => {
      if (target.isHit) return target

      const angle = Math.random() * Math.PI * 2
      let newX = target.x + Math.cos(angle) * target.speed
      let newY = target.y + Math.sin(angle) * target.speed

      // Bounce off walls
      if (newX < 0 || newX > (gameAreaRef.current?.clientWidth || 800) - 50) {
        newX = Math.max(0, Math.min(newX, (gameAreaRef.current?.clientWidth || 800) - 50))
      }
      if (newY < 0 || newY > (gameAreaRef.current?.clientHeight || 600) - 50) {
        newY = Math.max(0, Math.min(newY, (gameAreaRef.current?.clientHeight || 600) - 50))
      }

      return { ...target, x: newX, y: newY }
    }))
  }

  const handleTargetClick = (targetId: string) => {
    const target = targets.find(t => t.id === targetId)
    if (!target || target.isHit) return

    playSound('targetHit')
    setTargets(prev => prev.map(t => 
      t.id === targetId ? { ...t, isHit: true } : t
    ))

    setScore(prev => prev + target.value)
    setHits(prev => prev + 1)

    // Animate target hit
    const targetElement = document.querySelector(`[data-target-id="${targetId}"]`)
    if (targetElement) {
      gsap.to(targetElement, {
        scale: 1.5,
        rotation: 360,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out"
      })
    }

    // Remove hit target after animation
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== targetId))
    }, 500)
  }

  const handleGameAreaClick = () => {
    setShots(prev => prev + 1)
    setAccuracy(shots + 1 > 0 ? Math.round((hits / (shots + 1)) * 100) : 100)
  }

  const startGame = () => {
    playSound('gameStart')
    setGameActive(true)
    setGameOver(false)
    setScore(0)
    setTimeLeft(60)
    setTargets([])
    setShots(0)
    setHits(0)
    setAccuracy(100)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="targeting-game">
      <div className="game-header">
        <div className="game-title">ON-RAILS TARGETING</div>
        <div className="game-stats">
          <div className="stat">SCORE: {score}</div>
          <div className="stat">TIME: {formatTime(timeLeft)}</div>
          <div className="stat">ACCURACY: {accuracy}%</div>
          <div className="stat">HITS: {hits}/{shots}</div>
        </div>
      </div>

      <div className="game-content">
        {!gameActive && !gameOver && (
          <div className="start-screen">
            <div className="start-title">TARGETING RANGE INITIALIZED</div>
            <div className="instructions">
              <div className="instruction-title">MISSION BRIEFING:</div>
              <div className="instruction-list">
                <div>• Eliminate targets as they appear</div>
                <div>• Heaven Smiles: 50 points (Red)</div>
                <div>• Remnants: 100 points (Blue)</div>
                <div>• Phantoms: 200 points (Yellow)</div>
                <div>• Higher accuracy = better performance rating</div>
              </div>
            </div>
            <button onClick={startGame} className="start-btn">
              BEGIN TARGETING SEQUENCE
            </button>
          </div>
        )}

        {gameActive && (
          <div 
            ref={gameAreaRef}
            className="game-area"
            onClick={handleGameAreaClick}
          >
            <div className="crosshair">
              <div className="crosshair-h"></div>
              <div className="crosshair-v"></div>
            </div>

            {targets.map(target => (
              <div
                key={target.id}
                data-target-id={target.id}
                className={`target target-${target.type} ${target.isHit ? 'hit' : ''}`}
                style={{
                  left: target.x,
                  top: target.y,
                  backgroundColor: targetTypes[target.type].color,
                  width: targetTypes[target.type].size,
                  height: targetTypes[target.type].size,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTargetClick(target.id)
                }}
              >
                <div className="target-value">+{target.value}</div>
              </div>
            ))}

            <div className="targeting-hud">
              <div className="hud-corners">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="game-over-screen">
            <div className="game-over-title">TARGETING SEQUENCE COMPLETE</div>
            <div className="final-stats">
              <div className="final-stat">
                <span className="stat-label">FINAL SCORE:</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="final-stat">
                <span className="stat-label">ACCURACY:</span>
                <span className="stat-value">{accuracy}%</span>
              </div>
              <div className="final-stat">
                <span className="stat-label">TARGETS HIT:</span>
                <span className="stat-value">{hits}</span>
              </div>
              <div className="final-stat">
                <span className="stat-label">PERFORMANCE:</span>
                <span className="stat-value">
                  {accuracy >= 90 ? 'EXCELLENT' : 
                   accuracy >= 70 ? 'GOOD' : 
                   accuracy >= 50 ? 'AVERAGE' : 'POOR'}
                </span>
              </div>
            </div>
            <div className="game-over-actions">
              <button onClick={startGame} className="restart-btn">
                RESTART SEQUENCE
              </button>
              <button onClick={onBack} className="back-btn">
                RETURN TO ARCHIVE
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .targeting-game {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
        }

        .game-header {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-light);
          background: var(--color-shadow);
        }

        .game-title {
          font-size: var(--font-size-base);
          font-weight: bold;
          color: var(--color-info);
          margin-bottom: var(--space-sm);
          text-align: center;
        }

        .game-stats {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
        }

        .stat {
          color: var(--color-grey-light);
        }

        .game-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .start-screen {
          text-align: center;
          max-width: 500px;
          padding: var(--space-xl);
        }

        .start-title {
          font-size: var(--font-size-lg);
          font-weight: bold;
          color: var(--color-info);
          margin-bottom: var(--space-xl);
        }

        .instructions {
          margin-bottom: var(--space-xl);
        }

        .instruction-title {
          font-size: var(--font-size-base);
          color: var(--color-light);
          font-weight: bold;
          margin-bottom: var(--space-base);
        }

        .instruction-list {
          text-align: left;
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
          line-height: 1.6;
        }

        .instruction-list > div {
          margin-bottom: var(--space-xs);
        }

        .start-btn {
          padding: var(--space-base) var(--space-xl);
          background: var(--color-blood);
          border: 2px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
          font-weight: bold;
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .start-btn:hover {
          background: var(--color-light);
          color: var(--color-blood);
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--color-blood);
        }

        .game-area {
          width: 100%;
          height: 100%;
          position: relative;
          cursor: crosshair;
          background: linear-gradient(45deg, #0a0a0a 0%, #1a1a1a 100%);
        }

        .crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 10;
        }

        .crosshair-h, .crosshair-v {
          position: absolute;
          background: var(--color-blood);
          opacity: 0.7;
        }

        .crosshair-h {
          width: 20px;
          height: 2px;
          top: -1px;
          left: -10px;
        }

        .crosshair-v {
          width: 2px;
          height: 20px;
          top: -10px;
          left: -1px;
        }

        .target {
          position: absolute;
          border-radius: 50%;
          cursor: crosshair;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xs);
          font-weight: bold;
          color: white;
          transition: all 0.2s ease;
          z-index: 5;
          animation: target-pulse 2s infinite;
        }

        @keyframes target-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        .target:hover {
          transform: scale(1.2);
          box-shadow: 0 0 10px currentColor;
        }

        .target.hit {
          animation: target-hit 0.5s ease-out forwards;
        }

        @keyframes target-hit {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(0.5); }
        }

        .target-value {
          font-size: var(--font-size-xs);
          font-weight: bold;
        }

        .targeting-hud {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .hud-corners {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .corner {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 2px solid var(--color-blood);
          opacity: 0.5;
        }

        .corner.top-left {
          top: 20px;
          left: 20px;
          border-right: none;
          border-bottom: none;
        }

        .corner.top-right {
          top: 20px;
          right: 20px;
          border-left: none;
          border-bottom: none;
        }

        .corner.bottom-left {
          bottom: 20px;
          left: 20px;
          border-right: none;
          border-top: none;
        }

        .corner.bottom-right {
          bottom: 20px;
          right: 20px;
          border-left: none;
          border-top: none;
        }

        .game-over-screen {
          text-align: center;
          max-width: 500px;
          padding: var(--space-xl);
        }

        .game-over-title {
          font-size: var(--font-size-lg);
          font-weight: bold;
          color: var(--color-info);
          margin-bottom: var(--space-xl);
        }

        .final-stats {
          margin-bottom: var(--space-xl);
        }

        .final-stat {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-sm);
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--color-grey-dark);
        }

        .stat-label {
          color: var(--color-grey-light);
        }

        .stat-value {
          color: var(--color-light);
          font-weight: bold;
        }

        .game-over-actions {
          display: flex;
          gap: var(--space-base);
          justify-content: center;
        }

        .restart-btn, .back-btn {
          padding: var(--space-base) var(--space-lg);
          border: 2px solid var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
          font-weight: bold;
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .restart-btn {
          background: var(--color-info);
          color: var(--color-void);
        }

        .restart-btn:hover {
          background: var(--color-light);
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--color-info);
        }

        .back-btn {
          background: var(--color-blood);
          color: var(--color-light);
        }

        .back-btn:hover {
          background: var(--color-light);
          color: var(--color-blood);
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--color-blood);
        }
      `}</style>
    </div>
  )
}