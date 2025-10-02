'use client'

import { useState, useEffect } from 'react'

export default function Y2KOverlay() {
  const [visitors, setVisitors] = useState<number>(0)
  const [timestamp, setTimestamp] = useState<string>('')

  useEffect(() => {
    // Initialize visitor counter
    const storedVisitors = localStorage.getItem('y2k-visitors')
    if (storedVisitors) {
      setVisitors(parseInt(storedVisitors, 10))
    } else {
      const randomVisitors = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
      setVisitors(randomVisitors)
      localStorage.setItem('y2k-visitors', randomVisitors.toString())
    }

    // Update timestamp every second
    const updateTimestamp = () => {
      const now = new Date()
      const formatted = now.toISOString().replace('T', ' ').split('.')[0]
      setTimestamp(formatted)
    }

    updateTimestamp()
    const interval = setInterval(updateTimestamp, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Visitor Counter - Bottom Left */}
      <div className="visitor-counter">
        <div className="counter-label">[VISITORS]</div>
        <div className="counter-value">{visitors.toString().padStart(6, '0')}</div>
      </div>

      {/* Last Updated - Bottom Right */}
      <div className="last-updated">
        <div className="timestamp-label">[LAST UPDATED]</div>
        <div className="timestamp-value">{timestamp}</div>
      </div>

      <style jsx>{`
        .visitor-counter,
        .last-updated {
          position: fixed;
          bottom: 20px;
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #00FF00;
          padding: 8px 12px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          z-index: 10000;
          backdrop-filter: blur(5px);
        }

        .visitor-counter {
          left: 20px;
          border-color: #FF00FF;
        }

        .last-updated {
          right: 20px;
          border-color: #00FFFF;
        }

        .counter-label,
        .timestamp-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 9px;
          letter-spacing: 1px;
          margin-bottom: 2px;
        }

        .counter-value {
          color: #FF00FF;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .timestamp-value {
          color: #00FFFF;
          font-size: 11px;
          letter-spacing: 1px;
        }

        @media (max-width: 768px) {
          .visitor-counter,
          .last-updated {
            padding: 6px 10px;
            font-size: 9px;
          }

          .counter-value {
            font-size: 12px;
          }

          .timestamp-value {
            font-size: 9px;
          }

          .visitor-counter {
            left: 10px;
            bottom: 10px;
          }

          .last-updated {
            right: 10px;
            bottom: 10px;
          }
        }
      `}</style>
    </>
  )
}
