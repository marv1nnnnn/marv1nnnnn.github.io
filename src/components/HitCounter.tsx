'use client'

import React, { useState, useEffect } from 'react'

const HitCounter: React.FC = () => {
  const [visits, setVisits] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [displayedVisits, setDisplayedVisits] = useState('000000')

  // Generate random visitor count on mount
  useEffect(() => {
    const generateVisitorCount = () => {
      // Simulate loading
      setIsLoading(true)
      
      setTimeout(() => {
        // Generate a retro-feeling visitor count (like early 2000s sites)
        const baseCount = Math.floor(Math.random() * 50000) + 10000
        const sessionBonus = Math.floor(Math.random() * 10) + 1
        const finalCount = baseCount + sessionBonus
        
        setVisits(finalCount)
        setIsLoading(false)
      }, 1500)
    }

    generateVisitorCount()

    // Add visit on component mount
    const interval = setInterval(() => {
      setVisits(prev => prev + 1)
    }, 30000) // Add a visit every 30 seconds for chaos

    return () => clearInterval(interval)
  }, [])

  // Animated counter display
  useEffect(() => {
    if (isLoading) return

    const targetStr = visits.toString().padStart(6, '0')
    let currentIndex = 0
    
    const animateInterval = setInterval(() => {
      if (currentIndex < targetStr.length) {
        setDisplayedVisits(prev => {
          const newStr = prev.split('')
          newStr[currentIndex] = targetStr[currentIndex]
          return newStr.join('')
        })
        currentIndex++
      } else {
        clearInterval(animateInterval)
      }
    }, 100)

    return () => clearInterval(animateInterval)
  }, [visits, isLoading])

  return (
    <div className="hit-counter">
      {/* Header */}
      <div className="counter-header">
        <div className="counter-title">🔢 HIT COUNTER v1.0</div>
        <div className="counter-status">
          {isLoading ? '● LOADING...' : '● ACTIVE'}
        </div>
      </div>

      {/* Main Display */}
      <div className="counter-display">
        <div className="welcome-text">
          <div className="blink rainbow-text">✨ WELCOME TO MY HOMEPAGE! ✨</div>
        </div>
        
        <div className="visitor-counter">
          <div className="counter-label">TOTAL VISITORS:</div>
          <div className="counter-digits">
            {isLoading ? (
              <div className="loading-digits">
                <span className="loading-digit">?</span>
                <span className="loading-digit">?</span>
                <span className="loading-digit">?</span>
                <span className="loading-digit">?</span>
                <span className="loading-digit">?</span>
                <span className="loading-digit">?</span>
              </div>
            ) : (
              displayedVisits.split('').map((digit, index) => (
                <span key={index} className="digit">
                  {digit}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="visitor-messages">
          <div className="message-line">
            🎉 YOU ARE VISITOR #{visits}! 🎉
          </div>
          <div className="message-line blink">
            ⭐ THANKS FOR VISITING! ⭐
          </div>
        </div>

        <div className="counter-stats">
          <div className="stat-line">
            <span className="stat-label">TODAY:</span>
            <span className="stat-value">{Math.floor(visits * 0.1)} visits</span>
          </div>
          <div className="stat-line">
            <span className="stat-label">THIS WEEK:</span>
            <span className="stat-value">{Math.floor(visits * 0.7)} visits</span>
          </div>
          <div className="stat-line">
            <span className="stat-label">SINCE 1999:</span>
            <span className="stat-value">{visits} visits</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="counter-footer">
        <div className="footer-text">
          <span className="scroll-text">
            This counter is 100% accurate and definitely not made up! 
            Share this site with your friends on ICQ and AIM! 
            Best viewed in Internet Explorer 6.0!
          </span>
        </div>
      </div>

      <style jsx>{`
        .hit-counter {
          background: linear-gradient(135deg, #000080, #000040);
          border: 2px outset #666;
          color: #ffff00;
          font-family: 'Comic Sans MS', cursive, monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .counter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: linear-gradient(90deg, #ff0080, #8000ff);
          border-bottom: 2px solid gold;
          font-weight: bold;
          font-size: 11px;
          color: white;
          text-shadow: 1px 1px 2px black;
        }

        .counter-display {
          flex: 1;
          padding: 15px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 15px;
        }

        .welcome-text {
          font-size: 14px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }

        .rainbow-text {
          background: linear-gradient(45deg, 
            red, orange, yellow, green, blue, indigo, violet, red);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rainbow 3s ease-in-out infinite;
        }

        @keyframes rainbow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .blink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .visitor-counter {
          background: #000;
          border: 3px inset #333;
          padding: 15px;
          margin: 10px 0;
          border-radius: 10px;
          box-shadow: inset 0 0 20px rgba(0,255,0,0.3);
        }

        .counter-label {
          color: #00ff00;
          font-size: 12px;
          margin-bottom: 10px;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }

        .counter-digits {
          display: flex;
          justify-content: center;
          gap: 2px;
        }

        .digit, .loading-digit {
          background: linear-gradient(135deg, #00ff00, #008800);
          color: #000;
          font-size: 24px;
          font-weight: bold;
          padding: 8px 6px;
          border: 2px outset #00ff00;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 0 10px rgba(0,255,0,0.5);
        }

        .loading-digit {
          animation: flash 0.5s infinite alternate;
        }

        @keyframes flash {
          0% { background: linear-gradient(135deg, #ff0000, #880000); }
          100% { background: linear-gradient(135deg, #00ff00, #008800); }
        }

        .visitor-messages {
          font-size: 13px;
          color: #ffff00;
          text-shadow: 1px 1px 2px black;
        }

        .message-line {
          margin: 5px 0;
          font-weight: bold;
        }

        .counter-stats {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #666;
          padding: 10px;
          border-radius: 5px;
          font-size: 11px;
        }

        .stat-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }

        .stat-label {
          color: #cccccc;
        }

        .stat-value {
          color: #00ffff;
          font-weight: bold;
        }

        .counter-footer {
          background: linear-gradient(90deg, #800080, #400040);
          border-top: 2px solid gold;
          padding: 8px;
          overflow: hidden;
          white-space: nowrap;
        }

        .scroll-text {
          display: inline-block;
          color: #ffff00;
          font-size: 10px;
          animation: scroll 15s linear infinite;
        }

        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        /* Add some sparkle effects */
        .hit-counter::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 40px 70px, white, transparent),
            radial-gradient(1px 1px at 90px 40px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 160px 30px, white, transparent);
          background-repeat: repeat;
          background-size: 200px 100px;
          animation: sparkle 3s linear infinite;
          pointer-events: none;
          opacity: 0.6;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

export default HitCounter