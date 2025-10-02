'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { PROFILE } from '@/data/profile'

export default function HeroSection() {
  const glitchRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // GSAP glitch animation
    const element = glitchRef.current
    if (!element) return

    const glitchAnimation = () => {
      gsap.to(element, {
        textShadow: `
          -2px 2px 0 #FF00FF,
          2px -2px 0 #00FFFF,
          -2px -2px 0 #FF6B00
        `,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        onComplete: () => {
          gsap.to(element, {
            textShadow: '3px 3px 0 #FF00FF',
            duration: 0.1
          })
        }
      })
    }

    // Trigger glitch randomly every 3-7 seconds
    const triggerGlitch = () => {
      glitchAnimation()
      const nextTrigger = 3000 + Math.random() * 4000
      setTimeout(triggerGlitch, nextTrigger)
    }

    triggerGlitch()
  }, [])

  return (
    <section id="hero" className="hero">
      <motion.div
        className="hero-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
      >
        <div className="hero-border">
          <h1 ref={glitchRef} className="hero-title">
            {PROFILE.name.toUpperCase()}
          </h1>

          <div className="hero-subtitle">
            {PROFILE.title.toUpperCase()}
          </div>

          <div className="hero-location">
            {PROFILE.location}
          </div>

          <div className="status-bar">
            <span className="status-item">[{new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}:{new Date().getSeconds().toString().padStart(2, '0')}]</span>
            <span className="status-item online">[● ONLINE]</span>
            <span className="status-item">[V1.0]</span>
          </div>
        </div>

        <motion.div
          className="scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          ↓
        </motion.div>
      </motion.div>

      <style jsx>{`
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #000000;
          position: relative;
          padding: 40px 20px;
        }

        .hero-container {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }

        .hero-border {
          border: 4px solid #FF00FF;
          padding: 60px;
          width: 100%;
          box-shadow:
            0 0 20px rgba(255, 0, 255, 0.3),
            inset 0 0 20px rgba(255, 0, 255, 0.1);
          animation: borderPulse 3s ease-in-out infinite;
        }

        @keyframes borderPulse {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(255, 0, 255, 0.3),
              inset 0 0 20px rgba(255, 0, 255, 0.1);
          }
          50% {
            box-shadow:
              0 0 30px rgba(255, 0, 255, 0.5),
              inset 0 0 30px rgba(255, 0, 255, 0.15);
          }
        }

        .hero-title {
          font-size: 72px;
          font-family: 'Courier New', monospace;
          color: #FFFFFF;
          text-shadow: 3px 3px 0 #FF00FF;
          margin: 0 0 20px 0;
          letter-spacing: 4px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 24px;
          font-family: Arial, Helvetica, sans-serif;
          color: #00FFFF;
          margin: 0 0 10px 0;
          letter-spacing: 2px;
        }

        .hero-location {
          font-size: 18px;
          font-family: 'Courier New', monospace;
          color: #FF6B00;
          margin: 0 0 30px 0;
          letter-spacing: 1px;
        }

        .status-bar {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: flex-start;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          letter-spacing: 1px;
        }

        .status-item {
          color: rgba(255, 255, 255, 0.7);
          padding: 4px 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .status-item.online {
          color: #00FF00;
          border-color: #00FF00;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0.3;
          }
        }

        .scroll-indicator {
          font-size: 48px;
          color: #FF00FF;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .hero-border {
            padding: 30px 20px;
            border-width: 2px;
          }

          .hero-title {
            font-size: 36px;
            text-shadow: 2px 2px 0 #FF00FF;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .hero-location {
            font-size: 14px;
          }

          .status-bar {
            gap: 10px;
            font-size: 11px;
          }

          .scroll-indicator {
            font-size: 32px;
          }
        }
      `}</style>
    </section>
  )
}
