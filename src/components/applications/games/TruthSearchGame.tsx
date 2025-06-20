'use client'

import { useState, useEffect } from 'react'
import { TruthSearchKeyword } from '@/types'
import { useAudio } from '@/contexts/AudioContext'

interface TruthSearchGameProps {
  onBack: () => void
}

const KEYWORDS: TruthSearchKeyword[] = [
  { word: 'KAMINO', fragment: 'The research facility where consciousness experiments began', isFound: false, category: 'LOCATION' },
  { word: 'SIGNAL', fragment: 'Digital transmission carrying fragmented memories', isFound: false, category: 'EVENT' },
  { word: 'CURTIS', fragment: 'The researcher who disappeared during the final test', isFound: false, category: 'PERSON' },
  { word: 'MIRROR', fragment: 'Reflective device used to trap digital consciousness', isFound: false, category: 'OBJECT' },
  { word: 'WARD', fragment: 'The 25th district - a liminal space between realities', isFound: false, category: 'LOCATION' },
  { word: 'GHOST', fragment: 'Residual data patterns of uploaded consciousness', isFound: false, category: 'EVENT' },
  { word: 'TERMINAL', fragment: 'Interface for communicating with trapped minds', isFound: false, category: 'OBJECT' },
  { word: 'CIRCUIT', fragment: 'Neural pathway reconstruction device', isFound: false, category: 'OBJECT' },
]

const FRAGMENTS = [
  "The research facility where consciousness experiments began",
  "Digital transmission carrying fragmented memories", 
  "The researcher who disappeared during the final test",
  "Reflective device used to trap digital consciousness",
  "The 25th district - a liminal space between realities",
  "Residual data patterns of uploaded consciousness",
  "Interface for communicating with trapped minds",
  "Neural pathway reconstruction device",
  "Encrypted data cache containing subject profiles",
  "Temporal distortion field generator",
  "Memory extraction protocol documentation",
  "Signal amplification matrix blueprints"
]

export default function TruthSearchGame({ onBack }: TruthSearchGameProps) {
  const { playSound } = useAudio()
  const [keywords, setKeywords] = useState<TruthSearchKeyword[]>(KEYWORDS)
  const [input, setInput] = useState('')
  const [foundFragments, setFoundFragments] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
  const [gameOver, setGameOver] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameOver(true)
      playSound('gameOver')
    }
  }, [timeLeft, gameOver])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const keyword = input.toUpperCase().trim()
    
    const found = keywords.find(k => k.word === keyword && !k.isFound)
    if (found) {
      playSound('success')
      setKeywords(prev => prev.map(k => 
        k.word === keyword ? { ...k, isFound: true } : k
      ))
      setFoundFragments(prev => [...prev, found.fragment])
      setScore(prev => prev + 100)
      setInput('')
      setHint('')
      
      // Check if game is won
      if (keywords.filter(k => !k.isFound).length === 1) {
        setGameOver(true)
        playSound('success')
      }
    } else {
      playSound('error')
      setHint(`No truth fragment found for "${keyword}". Search deeper...`)
      setTimeout(() => setHint(''), 3000)
    }
  }

  const getHintForCategory = (category: string) => {
    const unfound = keywords.filter(k => k.category === category && !k.isFound)
    if (unfound.length > 0) {
      setHint(`Search for a ${category.toLowerCase()}...`)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const foundCount = keywords.filter(k => k.isFound).length
  const totalCount = keywords.length

  return (
    <div className="truth-search-game">
      <div className="game-header">
        <div className="game-title">SEARCH FOR THE TRUTH</div>
        <div className="game-stats">
          <div className="stat">FRAGMENTS: {foundCount}/{totalCount}</div>
          <div className="stat">SCORE: {score}</div>
          <div className="stat">TIME: {formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="game-content">
        <div className="search-area">
          <div className="instructions">
            Enter keywords to uncover truth fragments about the consciousness experiments.
            Each fragment reveals part of the hidden story.
          </div>

          <form onSubmit={handleSubmit} className="search-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ENTER KEYWORD..."
              className="search-input"
              disabled={gameOver}
              maxLength={20}
            />
            <button type="submit" disabled={gameOver || !input.trim()} className="search-btn">
              SEARCH
            </button>
          </form>

          {hint && (
            <div className="hint-display">
              {hint}
            </div>
          )}

          <div className="category-hints">
            <div className="hint-title">SEARCH CATEGORIES:</div>
            <div className="hint-buttons">
              <button onClick={() => getHintForCategory('LOCATION')} className="hint-btn">
                LOCATIONS
              </button>
              <button onClick={() => getHintForCategory('PERSON')} className="hint-btn">
                PERSONS
              </button>
              <button onClick={() => getHintForCategory('EVENT')} className="hint-btn">
                EVENTS
              </button>
              <button onClick={() => getHintForCategory('OBJECT')} className="hint-btn">
                OBJECTS
              </button>
            </div>
          </div>
        </div>

        <div className="fragments-area">
          <div className="fragments-title">RECOVERED TRUTH FRAGMENTS</div>
          <div className="fragments-list">
            {foundFragments.map((fragment, index) => (
              <div key={index} className="fragment-item">
                <div className="fragment-number">#{(index + 1).toString().padStart(2, '0')}</div>
                <div className="fragment-text">{fragment}</div>
              </div>
            ))}
            
            {foundFragments.length === 0 && (
              <div className="no-fragments">
                No fragments recovered yet. Search for keywords to uncover the truth.
              </div>
            )}
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <div className="game-over-title">
              {foundCount === totalCount ? 'TRUTH REVEALED' : 'TRANSMISSION ENDED'}
            </div>
            <div className="final-stats">
              <div>Fragments Found: {foundCount}/{totalCount}</div>
              <div>Final Score: {score}</div>
              <div>Completion: {Math.round((foundCount / totalCount) * 100)}%</div>
            </div>
            <div className="game-over-message">
              {foundCount === totalCount 
                ? 'You have uncovered all the truth fragments. The conspiracy is revealed.'
                : 'Some truths remain hidden in the digital void. Try again to uncover more.'}
            </div>
            <button onClick={onBack} className="back-btn">
              RETURN TO ARCHIVE
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .truth-search-game {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
          position: relative;
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
          overflow: hidden;
        }

        .search-area {
          width: 350px;
          padding: var(--space-base);
          border-right: 1px solid var(--color-light);
          background: var(--color-shadow);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .instructions {
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
          line-height: 1.4;
        }

        .search-form {
          display: flex;
          gap: var(--space-sm);
        }

        .search-input {
          flex: 1;
          padding: var(--space-sm);
          background: var(--color-void);
          border: 1px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
          text-transform: uppercase;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-info);
          box-shadow: 0 0 0 1px var(--color-info);
        }

        .search-btn {
          padding: var(--space-sm) var(--space-base);
          background: var(--color-info);
          border: 1px solid var(--color-light);
          color: var(--color-void);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          font-weight: bold;
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .search-btn:hover:not(:disabled) {
          background: var(--color-light);
          transform: translate(-1px, -1px);
          box-shadow: 2px 2px 0 var(--color-shadow);
        }

        .search-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hint-display {
          padding: var(--space-sm);
          background: var(--color-void);
          border: 1px solid var(--color-unease);
          color: var(--color-unease);
          font-size: var(--font-size-xs);
          text-align: center;
        }

        .category-hints {
          border-top: 1px solid var(--color-grey-dark);
          padding-top: var(--space-base);
        }

        .hint-title {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          margin-bottom: var(--space-sm);
          font-weight: bold;
        }

        .hint-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-xs);
        }

        .hint-btn {
          padding: var(--space-xs);
          background: var(--color-void);
          border: 1px solid var(--color-grey-dark);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .hint-btn:hover {
          background: var(--color-grey-dark);
          border-color: var(--color-light);
        }

        .fragments-area {
          flex: 1;
          padding: var(--space-base);
          display: flex;
          flex-direction: column;
        }

        .fragments-title {
          font-size: var(--font-size-sm);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-base);
          text-align: center;
        }

        .fragments-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .fragment-item {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-base);
          border: 1px solid var(--color-light);
          background: var(--color-shadow);
          animation: fragment-appear 0.5s ease-out;
        }

        @keyframes fragment-appear {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .fragment-number {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          font-weight: bold;
          min-width: 30px;
        }

        .fragment-text {
          font-size: var(--font-size-sm);
          line-height: 1.4;
          color: var(--color-light);
        }

        .no-fragments {
          text-align: center;
          color: var(--color-grey-light);
          font-style: italic;
          padding: var(--space-xl);
        }

        .game-over-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .game-over-content {
          background: var(--color-void);
          border: 2px solid var(--color-light);
          padding: var(--space-xl);
          text-align: center;
          max-width: 400px;
        }

        .game-over-title {
          font-size: var(--font-size-lg);
          font-weight: bold;
          color: var(--color-info);
          margin-bottom: var(--space-lg);
        }

        .final-stats {
          margin-bottom: var(--space-lg);
          font-size: var(--font-size-sm);
          color: var(--color-light);
        }

        .final-stats > div {
          margin-bottom: var(--space-xs);
        }

        .game-over-message {
          margin-bottom: var(--space-xl);
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
          line-height: 1.4;
        }

        .back-btn {
          padding: var(--space-base) var(--space-lg);
          background: var(--color-blood);
          border: 2px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
          font-weight: bold;
          cursor: crosshair;
          transition: all 0.1s ease;
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