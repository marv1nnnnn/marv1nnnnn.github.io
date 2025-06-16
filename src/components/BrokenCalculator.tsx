'use client'

import React, { useState, useEffect } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'

const BrokenCalculator: React.FC = () => {
  const [display, setDisplay] = useState('0')
  const [isGlitching, setIsGlitching] = useState(false)
  const { triggerSystemWideEffect, audio } = useChaos()

  const glitchyNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', '?', '!', '#', '@']

  const handleButtonClick = (value: string) => {
    // Random chance to glitch
    if (Math.random() < 0.3) {
      setIsGlitching(true)
      audio.soundEffects.error()
      triggerSystemWideEffect('system-shock')
      
      // Show random glitchy numbers
      const glitchInterval = setInterval(() => {
        setDisplay(prev => {
          const randomLength = Math.floor(Math.random() * 8) + 1
          return Array(randomLength).fill(0).map(() => 
            glitchyNumbers[Math.floor(Math.random() * glitchyNumbers.length)]
          ).join('')
        })
      }, 100)

      setTimeout(() => {
        clearInterval(glitchInterval)
        setIsGlitching(false)
        
        // Sometimes return to normal, sometimes stay broken
        if (Math.random() < 0.7) {
          if (value === '=') {
            // Give a wrong answer
            const wrongAnswers = ['42', '69', '404', 'ERROR', 'UNDEFINED', '∞', '-∞', 'CHAOS']
            setDisplay(wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)])
          } else {
            setDisplay(prev => prev === '0' ? value : prev + value)
          }
        } else {
          setDisplay('BROKEN')
        }
      }, 1000)
    } else {
      // Normal operation (sometimes)
      audio.soundEffects.click()
      
      if (value === 'C') {
        setDisplay('0')
      } else if (value === '=') {
        try {
          // Sometimes give correct answer, sometimes not
          if (Math.random() < 0.6) {
            const result = eval(display.replace(/[^0-9+\-*/.]/g, ''))
            setDisplay(String(result))
          } else {
            // Wrong calculation
            const num = parseFloat(display) || 0
            const wrongResult = num + Math.floor(Math.random() * 100) - 50
            setDisplay(String(wrongResult))
          }
        } catch {
          setDisplay('ERROR')
        }
      } else {
        setDisplay(prev => prev === '0' ? value : prev + value)
      }
    }
  }

  // Random spontaneous glitches
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1 && !isGlitching) {
        setDisplay(prev => {
          const chars = prev.split('')
          if (chars.length > 0) {
            const randomIndex = Math.floor(Math.random() * chars.length)
            chars[randomIndex] = glitchyNumbers[Math.floor(Math.random() * glitchyNumbers.length)]
            return chars.join('')
          }
          return prev
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isGlitching])

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '=']
  ]

  return (
    <div className="broken-calculator">
      <div className={`calculator-display ${isGlitching ? 'glitch-active' : ''}`}>
        <div className="display-text">{display}</div>
      </div>
      
      <div className="calculator-buttons">
        {buttons.map((row, rowIndex) => (
          <div key={rowIndex} className="button-row">
            {row.map((btn, btnIndex) => (
              <button
                key={`${rowIndex}-${btnIndex}`}
                className={`calc-button ${isGlitching ? 'glitching' : ''}`}
                onClick={() => handleButtonClick(btn)}
                style={{
                  background: isGlitching 
                    ? `hsl(${Math.random() * 360}, 100%, 50%)`
                    : undefined
                }}
              >
                {isGlitching ? glitchyNumbers[Math.floor(Math.random() * glitchyNumbers.length)] : btn}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="calculator-warning">
        <div className="blink error-text">⚠️ CALCULATIONS MAY BE INACCURATE ⚠️</div>
      </div>

      <style jsx>{`
        .broken-calculator {
          background: linear-gradient(135deg, #e0e0e0, #a0a0a0);
          border: 2px outset #c0c0c0;
          padding: 15px;
          font-family: 'Courier New', monospace;
          width: 100%;
          max-width: 300px;
        }

        .calculator-display {
          background: #000;
          color: #00ff00;
          padding: 10px;
          margin-bottom: 10px;
          border: 2px inset #c0c0c0;
          text-align: right;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
        }

        .display-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calculator-buttons {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .button-row {
          display: flex;
          gap: 2px;
        }

        .calc-button {
          flex: 1;
          background: linear-gradient(135deg, #f0f0f0, #d0d0d0);
          border: 2px outset #e0e0e0;
          color: #000;
          padding: 12px 8px;
          font-family: inherit;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.1s;
          min-height: 45px;
        }

        .calc-button:hover {
          background: linear-gradient(135deg, #ffffff, #e0e0e0);
          filter: brightness(1.1);
        }

        .calc-button:active {
          border: 2px inset #e0e0e0;
          background: linear-gradient(135deg, #d0d0d0, #f0f0f0);
        }

        .calc-button.glitching {
          animation: buttonGlitch 0.1s infinite;
          color: #fff !important;
          border-color: #ff0040 !important;
        }

        @keyframes buttonGlitch {
          0%, 100% { transform: translate(0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }

        .calculator-warning {
          margin-top: 10px;
          text-align: center;
          font-size: 10px;
          color: #ff0040;
        }

        .error-text {
          text-shadow: 0 0 3px #ff0040;
        }

        @media (max-width: 768px) {
          .calc-button {
            padding: 15px 8px;
            font-size: 16px;
            min-height: 50px;
          }
          
          .calculator-display {
            font-size: 20px;
            min-height: 50px;
          }
        }
      `}</style>
    </div>
  )
}

export default BrokenCalculator