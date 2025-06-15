'use client'

import React, { useState, useEffect } from 'react'
import { useChaos } from '@/contexts/ChaosProvider'

const FakeBSOD: React.FC = () => {
  const [isActivated, setIsActivated] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [errorCode, setErrorCode] = useState('0x000000DE')
  const { triggerSystemWideEffect, audio } = useChaos()

  const errorCodes = [
    '0x000000DE', '0x0000007E', '0x000000A5', '0x000000D1',
    '0x000000F4', '0x000000EA', '0x000000C2', '0x000000BE',
    '0xDEADBEEF', '0xCAFEBABE', '0x8BADF00D', '0xFEEDFACE'
  ]

  const handleActivate = () => {
    setIsActivated(true)
    setErrorCode(errorCodes[Math.floor(Math.random() * errorCodes.length)])
    setCountdown(10)
    
    // Trigger system-wide effects
    triggerSystemWideEffect('system-shock')
    audio.soundEffects.error()
    
    // Fake restart countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsActivated(false)
          triggerSystemWideEffect('rainbow-cascade')
          return 10
        }
        return prev - 1
      })
    }, 1000)
  }

  const generateRandomHex = () => {
    return Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(8, '0')
  }

  const [memoryDump, setMemoryDump] = useState<string[]>([])

  useEffect(() => {
    // Generate fake memory dump
    const dump = Array(8).fill(0).map(() => 
      `0x${generateRandomHex()}: ${generateRandomHex()} ${generateRandomHex()} ${generateRandomHex()} ${generateRandomHex()}`
    )
    setMemoryDump(dump)
  }, [isActivated])

  if (!isActivated) {
    return (
      <div className="bsod-launcher">
        <div className="launcher-content">
          <h2 className="rainbow-text">💀 Fake BSOD Simulator 💀</h2>
          <p>Experience the nostalgia of Windows crashes!</p>
          <button className="activate-button" onClick={handleActivate}>
            🔥 CRASH SYSTEM 🔥
          </button>
          <div className="warning">
            <div className="blink">⚠️ THIS IS COMPLETELY FAKE ⚠️</div>
            <div>No actual harm will be done to your computer!</div>
          </div>
        </div>

        <style jsx>{`
          .bsod-launcher {
            background: linear-gradient(135deg, #000080, #000040);
            color: white;
            padding: 30px;
            text-align: center;
            font-family: 'Courier New', monospace;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .launcher-content h2 {
            margin-bottom: 20px;
            font-size: 20px;
          }

          .launcher-content p {
            margin-bottom: 30px;
            font-size: 14px;
            color: #cccccc;
          }

          .activate-button {
            background: linear-gradient(135deg, #ff0040, #800020);
            border: 2px outset #ff0040;
            color: white;
            padding: 15px 30px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 20px;
            font-family: inherit;
            border-radius: 5px;
            animation: dangerPulse 2s ease-in-out infinite;
          }

          @keyframes dangerPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 5px #ff0040; }
            50% { transform: scale(1.05); box-shadow: 0 0 20px #ff0040; }
          }

          .activate-button:hover {
            background: linear-gradient(135deg, #ff2060, #a00030);
            transform: scale(1.1);
          }

          .warning {
            font-size: 12px;
            color: #ffff00;
            margin-top: 20px;
          }

          .warning div:last-child {
            margin-top: 5px;
            color: #00ff00;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="fake-bsod">
      <div className="bsod-content">
        <div className="bsod-header">
          <div className="bsod-face">:(</div>
          <h1>Your PC ran into a problem and needs to restart.</h1>
          <p>We're just collecting some error info, and then we'll restart for you.</p>
        </div>

        <div className="bsod-progress">
          <div className="progress-text">{Math.floor((10 - countdown) * 10)}% complete</div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(10 - countdown) * 10}%` }}
            />
          </div>
        </div>

        <div className="bsod-details">
          <div className="error-info">
            <p>For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p>
            <p>If you call a support person, give them this info:</p>
            <p className="stop-code">Stop code: CHAOS_OS_FAKE_ERROR</p>
            <p className="error-code">What failed: {errorCode}</p>
          </div>

          <div className="memory-dump">
            <div className="dump-title">Memory Dump:</div>
            {memoryDump.map((line, index) => (
              <div key={index} className="dump-line">{line}</div>
            ))}
          </div>
        </div>

        <div className="bsod-countdown">
          <div className="countdown-text">
            Restarting in {countdown} seconds...
          </div>
          <button 
            className="cancel-button" 
            onClick={() => setIsActivated(false)}
          >
            Cancel (It's fake anyway!)
          </button>
        </div>
      </div>

      <style jsx>{`
        .fake-bsod {
          background: #0078d4;
          color: white;
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          height: 100%;
          overflow-y: auto;
          position: relative;
        }

        .bsod-header {
          margin-bottom: 40px;
        }

        .bsod-face {
          font-size: 120px;
          font-weight: 300;
          margin-bottom: 20px;
          color: white;
        }

        .bsod-header h1 {
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 15px;
          line-height: 1.3;
        }

        .bsod-header p {
          font-size: 16px;
          font-weight: 300;
          margin-bottom: 10px;
          opacity: 0.9;
        }

        .bsod-progress {
          margin-bottom: 30px;
        }

        .progress-text {
          font-size: 16px;
          margin-bottom: 10px;
        }

        .progress-bar {
          width: 200px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: white;
          transition: width 1s ease;
          border-radius: 2px;
        }

        .bsod-details {
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.5;
        }

        .error-info p {
          margin-bottom: 10px;
          opacity: 0.9;
        }

        .stop-code {
          font-weight: bold;
          color: #ffff00 !important;
        }

        .error-code {
          font-family: 'Courier New', monospace !important;
          color: #ff8080 !important;
        }

        .memory-dump {
          margin-top: 20px;
          background: rgba(0, 0, 0, 0.2);
          padding: 15px;
          border-radius: 5px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }

        .dump-title {
          color: #ffff00;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .dump-line {
          opacity: 0.8;
          margin-bottom: 2px;
        }

        .bsod-countdown {
          position: absolute;
          bottom: 20px;
          left: 40px;
          right: 40px;
        }

        .countdown-text {
          font-size: 18px;
          margin-bottom: 15px;
          color: #ffff00;
          font-weight: bold;
        }

        .cancel-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid white;
          color: white;
          padding: 10px 20px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 3px;
          font-family: inherit;
        }

        .cancel-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 768px) {
          .fake-bsod {
            padding: 20px;
          }
          
          .bsod-face {
            font-size: 80px;
          }
          
          .bsod-header h1 {
            font-size: 20px;
          }
          
          .memory-dump {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default FakeBSOD