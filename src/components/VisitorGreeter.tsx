'use client'

import React, { useState, useEffect } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'
import AITerminal from '@/components/AITerminal'
import MusicPlayer from '@/components/MusicPlayer'
import BlogReader from '@/components/BlogReader'

const GREETING_MESSAGES = [
  "🌟 Welcome to my digital chaos! 🌟",
  "✨ Greetings, fellow netizen! ✨",
  "🎉 You've entered the matrix! 🎉",
  "🚀 Welcome to cyberspace! 🚀",
  "🌈 Step into the rainbow dimension! 🌈",
  "💫 Your journey begins here! 💫",
  "🎪 Welcome to the greatest show on Earth! 🎪",
  "🔮 The digital oracle welcomes you! 🔮"
]

const VISITOR_NAMES = [
  "Cool Visitor", "Cyber Surfer", "Digital Explorer", "Web Wanderer",
  "Internet Adventurer", "Code Warrior", "Pixel Pioneer", "Data Drifter",
  "Network Navigator", "Binary Buddy", "HTML Hero", "CSS Champion",
  "JavaScript Jedi", "Terminal Tourist", "Hacker Friend", "Script Kiddie"
]

const WELCOME_TIPS = [
  "💡 Try opening multiple AI terminals and watch them chat!",
  "🎵 The music player has some surprise tracks loaded!",
  "📖 Check out the blog for the full chaos experience!",
  "🎮 Mini-games are coming soon - stay tuned!",
  "✨ Click around and discover hidden features!",
  "🌈 This site works best with maximum volume!",
  "🔧 Built with early-web aesthetic and modern tech!",
  "👾 Every refresh brings new chaos and surprises!"
]

const VisitorGreeter: React.FC = () => {
  const { createWindow, triggerSystemWideEffect } = useChaos()
  const [currentMessage, setCurrentMessage] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [currentTip, setCurrentTip] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [visitTime] = useState(new Date())

  // Initialize visitor data
  useEffect(() => {
    const randomMessage = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)]
    const randomName = VISITOR_NAMES[Math.floor(Math.random() * VISITOR_NAMES.length)]
    const randomTip = WELCOME_TIPS[Math.floor(Math.random() * WELCOME_TIPS.length)]

    setCurrentMessage(randomMessage)
    setVisitorName(randomName)
    setCurrentTip(randomTip)

    // Delayed welcome sequence
    setTimeout(() => setShowWelcome(true), 500)
  }, [])

  // Typewriter effect for tips
  useEffect(() => {
    if (!showWelcome || !currentTip) return

    setIsTyping(true)
    let displayText = ''
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex < currentTip.length) {
        displayText += currentTip[charIndex]
        charIndex++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
      }
    }, 50)

    return () => clearInterval(typeInterval)
  }, [showWelcome, currentTip])

  const getTimeGreeting = () => {
    const hour = visitTime.getHours()
    if (hour < 6) return "🌙 Good evening, night owl!"
    if (hour < 12) return "☀️ Good morning, early bird!"
    if (hour < 18) return "🌞 Good afternoon, sunshine!"
    return "🌆 Good evening, digital dweller!"
  }

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return '🌐 Chrome Explorer'
    if (userAgent.includes('Firefox')) return '🦊 Firefox Pioneer'
    if (userAgent.includes('Safari')) return '🧭 Safari Adventurer'
    if (userAgent.includes('Edge')) return '⚡ Edge Rider'
    return '🔍 Mystery Browser User'
  }

  // Window creation handlers for action buttons
  const handleOpenBlog = () => {
    triggerSystemWideEffect('rainbow-cascade')
    createWindow({
      title: 'Terminal Blog Reader v2.0',
      component: <BlogReader />,
      size: { width: 700, height: 600 },
      icon: '📖',
      position: { x: 100, y: 100 }
    })
  }

  const handleOpenAIChat = () => {
    triggerSystemWideEffect('rainbow-cascade')
    createWindow({
      title: 'Terminal AI - HACKER_AI',
      component: <AITerminal personalityId="HACKER_AI" />,
      size: { width: 600, height: 500 },
      icon: '🤖',
      position: { x: 150, y: 150 }
    })
  }

  const handleOpenMusic = () => {
    triggerSystemWideEffect('rainbow-cascade')
    createWindow({
      title: 'Winamp Clone v5.66',
      component: <MusicPlayer />,
      size: { width: 300, height: 400 },
      icon: '🎵',
      position: { x: 200, y: 200 }
    })
  }

  return (
    <div className="visitor-greeter">
      {/* Header */}
      <div className="greeter-header">
        <div className="greeter-title">👋 VISITOR GREETER v3.1</div>
        <div className="greeter-status">● WELCOMING</div>
      </div>

      {/* Main Welcome Area */}
      <div className="welcome-content">
        {showWelcome ? (
          <>
            {/* Animated Welcome Message */}
            <div className="welcome-banner">
              <div className="banner-text rainbow-text blink">
                {currentMessage}
              </div>
            </div>

            {/* Visitor Info */}
            <div className="visitor-info">
              <div className="info-box">
                <div className="info-line">
                  <span className="info-label">Hello there,</span>
                  <span className="visitor-name glitch">{visitorName}!</span>
                </div>
                <div className="info-line">
                  <span className="info-label">Time:</span>
                  <span className="info-value">{visitTime.toLocaleTimeString()}</span>
                </div>
                <div className="info-line">
                  <span className="info-label">Browser:</span>
                  <span className="info-value">{getBrowserInfo()}</span>
                </div>
                <div className="info-line">
                  <span className="info-label">Status:</span>
                  <span className="info-value rainbow-text">AWESOME!</span>
                </div>
              </div>
            </div>

            {/* Time-based Greeting */}
            <div className="time-greeting">
              <div className="greeting-text">
                {getTimeGreeting()}
              </div>
            </div>

            {/* Welcome Tip */}
            <div className="tip-section">
              <div className="tip-header">
                💡 PRO TIP:
              </div>
              <div className="tip-content">
                {currentTip}
                {isTyping && <span className="typing-cursor">█</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={handleOpenBlog}
              >
                📖 READ BLOG
              </button>
              <button 
                className="action-btn secondary"
                onClick={handleOpenAIChat}
              >
                🤖 CHAT WITH AI
              </button>
              <button 
                className="action-btn tertiary"
                onClick={handleOpenMusic}
              >
                🎵 PLAY MUSIC
              </button>
            </div>
          </>
        ) : (
          <div className="loading-welcome">
            <div className="loading-text">INITIALIZING WELCOME PROTOCOL...</div>
            <div className="loading-dots">
              <span className="dot">●</span>
              <span className="dot">●</span>
              <span className="dot">●</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="greeter-footer">
        <div className="footer-scroll">
          <span className="scroll-text">
            Welcome to the beautiful chaos of the early web! This site celebrates the 
            authentic jank and maximum expression of GeoCities era! Thanks for visiting! 
            Remember to bookmark this page and tell your friends on MSN Messenger!
          </span>
        </div>
      </div>

      <style jsx>{`
        .visitor-greeter {
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24, #f0932b);
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
          border: 3px outset #fff;
          color: #000;
          font-family: 'Comic Sans MS', cursive, sans-serif;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .greeter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: linear-gradient(90deg, #8e44ad, #3498db);
          border-bottom: 2px solid #fff;
          font-weight: bold;
          font-size: 11px;
          color: white;
          text-shadow: 1px 1px 2px black;
        }

        .welcome-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          text-align: center;
        }

        .welcome-banner {
          background: rgba(255, 255, 255, 0.9);
          border: 3px solid #fff;
          border-radius: 15px;
          padding: 15px;
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }

        .banner-text {
          font-size: 16px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
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
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .visitor-info {
          background: rgba(0, 0, 0, 0.8);
          color: #00ff00;
          border: 2px solid #00ff00;
          border-radius: 10px;
          padding: 15px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .info-line {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }

        .info-label {
          color: #888;
        }

        .info-value, .visitor-name {
          color: #00ff00;
          font-weight: bold;
        }

        .glitch {
          animation: glitch 2s infinite;
        }

        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-2px) skew(-5deg); }
          20% { transform: translateX(2px) skew(5deg); }
          30% { transform: translateX(-1px) skew(-3deg); }
          40% { transform: translateX(1px) skew(3deg); }
          50% { transform: translateX(-2px) skew(-2deg); }
          60% { transform: translateX(2px) skew(2deg); }
          70% { transform: translateX(-1px) skew(-1deg); }
          80% { transform: translateX(1px) skew(1deg); }
          90% { transform: translateX(-2px) skew(-5deg); }
        }

        .time-greeting {
          background: rgba(255, 255, 255, 0.8);
          border: 2px dashed #333;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }

        .tip-section {
          background: rgba(255, 255, 0, 0.9);
          border: 2px solid #ff6600;
          border-radius: 10px;
          padding: 12px;
          font-size: 12px;
          color: #333;
          max-width: 280px;
        }

        .tip-header {
          font-weight: bold;
          margin-bottom: 8px;
          color: #ff6600;
        }

        .tip-content {
          line-height: 1.4;
        }

        .typing-cursor {
          animation: blink 1s infinite;
          font-weight: bold;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .action-btn {
          padding: 8px 16px;
          border: 2px outset;
          border-radius: 5px;
          font-family: inherit;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border-color: #e74c3c;
        }

        .action-btn.secondary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border-color: #3498db;
        }

        .action-btn.tertiary {
          background: linear-gradient(135deg, #27ae60, #229954);
          color: white;
          border-color: #27ae60;
        }

        .action-btn:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }

        .action-btn:active {
          border-style: inset;
          transform: scale(0.98);
        }

        .loading-welcome {
          text-align: center;
          color: white;
          text-shadow: 2px 2px 4px black;
        }

        .loading-text {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          gap: 5px;
        }

        .dot {
          animation: loadingDots 1.5s infinite;
          font-size: 20px;
        }

        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.3s; }
        .dot:nth-child(3) { animation-delay: 0.6s; }

        @keyframes loadingDots {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }

        .greeter-footer {
          background: linear-gradient(90deg, #2c3e50, #34495e);
          border-top: 2px solid #fff;
          padding: 8px;
          overflow: hidden;
          white-space: nowrap;
        }

        .scroll-text {
          display: inline-block;
          color: #ecf0f1;
          font-size: 11px;
          animation: scroll 20s linear infinite;
        }

        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        /* Sparkle overlay */
        .visitor-greeter::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(3px 3px at 30px 40px, white, transparent),
            radial-gradient(2px 2px at 80px 20px, yellow, transparent),
            radial-gradient(2px 2px at 150px 60px, white, transparent),
            radial-gradient(1px 1px at 200px 30px, yellow, transparent),
            radial-gradient(2px 2px at 250px 80px, white, transparent);
          background-repeat: repeat;
          background-size: 300px 120px;
          animation: sparkle 4s linear infinite;
          pointer-events: none;
          opacity: 0.7;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

export default VisitorGreeter