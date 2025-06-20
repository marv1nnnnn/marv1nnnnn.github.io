'use client'

import { useState } from 'react'
import TruthSearchGame from './games/TruthSearchGame'
import TargetingGame from './games/TargetingGame'
import { useAudio } from '@/contexts/AudioContext'

interface LostFoundGamesProps {
  windowId: string
}

export default function LostFoundGames({ }: LostFoundGamesProps) {
  const { playSound } = useAudio()
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [soulShells, setSoulShells] = useState(0)

  const games = [
    {
      id: 'truth-search',
      name: 'Search for the Truth',
      description: 'Enter keywords to unlock fragmented truth files about the consciousness experiments',
      difficulty: 'NORMAL',
      status: 'AVAILABLE',
      soulReward: 10,
    },
    {
      id: 'targeting',
      name: 'On-Rails Targeting',
      description: 'Eliminate targets in this fast-paced shooting gallery',
      difficulty: 'EASY',
      status: 'AVAILABLE',
      soulReward: 5,
    },
    {
      id: 'paradox-solver',
      name: 'Paradox Solver',
      description: 'Break the rules to find the hidden solution - coming soon',
      difficulty: 'HARD',
      status: 'LOCKED',
      soulReward: 25,
    },
  ]

  const handleGameComplete = (gameId: string, score: number) => {
    const game = games.find(g => g.id === gameId)
    if (game) {
      const reward = Math.floor(score / 100) + game.soulReward
      setSoulShells(prev => prev + reward)
    }
    setSelectedGame(null)
  }

  const renderGame = () => {
    switch (selectedGame) {
      case 'truth-search':
        return <TruthSearchGame onBack={() => setSelectedGame(null)} />
      case 'targeting':
        return <TargetingGame onBack={() => setSelectedGame(null)} />
      case 'paradox-solver':
        return (
          <div className="game-locked">
            <div className="locked-title">PARADOX SOLVER</div>
            <div className="locked-message">
              This puzzle archive is currently locked.
              <br />
              <br />
              [CLASSIFICATION: OMEGA-LEVEL]
              <br />
              [SECURITY CLEARANCE REQUIRED]
              <br />
              <br />
              Some paradoxes are too dangerous to solve.
            </div>
            <button 
              className="btn"
              onClick={() => setSelectedGame(null)}
            >
              RETURN TO ARCHIVE
            </button>
          </div>
        )
      default:
        return null
    }
  }

  const availableGames = games.filter(g => g.status === 'AVAILABLE').length
  const completionRate = Math.round((soulShells / (games.reduce((acc, g) => acc + g.soulReward, 0))) * 100)

  return (
    <div className="lost-found-games">
      <div className="games-header">
        <div className="system-title">LOST & FOUND - PUZZLE ARCHIVE</div>
        <div className="system-info">
          <div>AVAILABLE: {availableGames}/{games.length}</div>
          <div>SOUL SHELLS: {soulShells.toString().padStart(3, '0')}</div>
          <div>COMPLETION: {completionRate}%</div>
        </div>
      </div>

      {selectedGame ? (
        <div className="game-area">
          {renderGame()}
        </div>
      ) : (
        <div className="games-list">
          {games.map(game => (
            <div
              key={game.id}
              className={`game-card ${game.status === 'LOCKED' ? 'locked' : ''}`}
              onClick={() => {
                if (game.status === 'AVAILABLE') {
                  playSound('gameStart')
                  setSelectedGame(game.id)
                }
              }}
            >
              <div className="game-header">
                <div className="game-name">{game.name}</div>
                <div className={`game-difficulty ${game.difficulty.toLowerCase()}`}>
                  [{game.difficulty}]
                </div>
              </div>
              
              <div className="game-description">
                {game.description}
              </div>
              
              <div className="game-footer">
                <div className="game-status">
                  STATUS: {game.status}
                </div>
                <div className="soul-reward">
                  REWARD: {game.soulReward} SOULS
                </div>
              </div>

              {game.status === 'LOCKED' && (
                <div className="lock-overlay">
                  <div className="lock-icon">🔒</div>
                </div>
              )}
            </div>
          ))}

          <div className="archive-info">
            <div className="info-title">ARCHIVE INFORMATION</div>
            <div className="info-content">
              <div className="info-section">
                <div className="info-label">SOUL SHELLS:</div>
                <div className="info-text">
                  Currency earned by completing puzzles. Used to unlock classified archives and enhance system capabilities.
                </div>
              </div>
              
              <div className="info-section">
                <div className="info-label">DIFFICULTY RATINGS:</div>
                <div className="info-text">
                  <div className="difficulty-legend">
                    <div><span className="easy">EASY</span> - Basic training simulations</div>
                    <div><span className="normal">NORMAL</span> - Standard operation protocols</div>
                    <div><span className="hard">HARD</span> - Advanced consciousness manipulation</div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <div className="info-label">WARNING:</div>
                <div className="info-text warning">
                  Some archived puzzles contain fragments of real memories from consciousness transfer experiments. 
                  Psychological effects may persist after gameplay.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .lost-found-games {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
        }

        .games-header {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-light);
          background: var(--color-shadow);
        }

        .system-title {
          font-size: var(--font-size-base);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-sm);
        }

        .system-info {
          display: flex;
          gap: var(--space-lg);
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
        }

        .games-list {
          flex: 1;
          padding: var(--space-base);
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
          overflow-y: auto;
        }

        .game-card {
          padding: var(--space-base);
          border: 1px solid var(--color-light);
          background: var(--color-shadow);
          cursor: crosshair;
          transition: all 0.1s ease;
          position: relative;
        }

        .game-card:not(.locked):hover {
          background: var(--color-grey-dark);
          border-color: var(--color-info);
          transform: translate(-1px, -1px);
          box-shadow: 2px 2px 0 var(--color-shadow);
        }

        .game-card.locked {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--color-void);
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .game-name {
          font-weight: bold;
          font-size: var(--font-size-sm);
        }

        .game-difficulty {
          font-size: var(--font-size-xs);
          font-weight: bold;
        }

        .game-difficulty.easy { color: var(--color-info); }
        .game-difficulty.normal { color: var(--color-unease); }
        .game-difficulty.hard { color: var(--color-blood); }

        .game-description {
          font-size: var(--font-size-sm);
          margin-bottom: var(--space-sm);
          line-height: 1.4;
        }

        .game-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .game-status {
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
        }

        .soul-reward {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          font-weight: bold;
        }

        .lock-overlay {
          position: absolute;
          top: var(--space-sm);
          right: var(--space-sm);
          font-size: var(--font-size-lg);
          color: var(--color-blood);
        }

        .game-area {
          flex: 1;
          overflow: hidden;
        }

        .game-locked {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-xl);
          background: var(--color-void);
        }

        .locked-title {
          font-size: var(--font-size-lg);
          font-weight: bold;
          color: var(--color-blood);
          margin-bottom: var(--space-lg);
        }

        .locked-message {
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
          line-height: 1.6;
          margin-bottom: var(--space-xl);
          max-width: 400px;
        }

        .archive-info {
          margin-top: var(--space-lg);
          padding: var(--space-base);
          border: 1px solid var(--color-grey-dark);
          background: var(--color-void);
        }

        .info-title {
          font-size: var(--font-size-sm);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-base);
          text-align: center;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .info-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .info-label {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          font-weight: bold;
        }

        .info-text {
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
          line-height: 1.4;
        }

        .info-text.warning {
          color: var(--color-blood);
          font-style: italic;
        }

        .difficulty-legend {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .difficulty-legend .easy { color: var(--color-info); }
        .difficulty-legend .normal { color: var(--color-unease); }
        .difficulty-legend .hard { color: var(--color-blood); }
      `}</style>
    </div>
  )
}