'use client'

import React, { useState, useEffect, useRef } from 'react'

interface SystemAlert {
  id: number
  timestamp: string
  type: 'ERROR' | 'WARNING' | 'INFO' | 'CRITICAL'
  message: string
  code: string
}

const SYSTEM_MESSAGES = {
  ERROR: [
    "KERNEL PANIC: Too much fun detected in system",
    "ERROR 404: Sanity not found",
    "MEMORY LEAK: Rainbow colors overflowing buffer",
    "STACK OVERFLOW: Too many awesome vibes",
    "BLUE SCREEN: Actually it's rainbow now",
    "CRITICAL: Chaos levels exceeding safety limits",
    "DISK FULL: Too many good memories stored",
    "GPU OVERLOAD: Rendering too much beauty"
  ],
  WARNING: [
    "WARNING: User appears to be having too much fun",
    "CAUTION: Nostalgia levels approaching maximum",
    "ALERT: GeoCities energy detected",
    "WARNING: Y2K compliance questionable",
    "NOTICE: Dial-up modem sounds missing",
    "ALERT: Not enough Comic Sans detected",
    "WARNING: Visitor may experience temporal displacement",
    "CAUTION: Reality glitch in progress"
  ],
  INFO: [
    "INFO: Chaos engine operating normally",
    "STATUS: All rainbow generators functional",
    "INFO: Visitor satisfaction at 147%",
    "STATUS: Sparkle particles initialized",
    "INFO: Time travel protocols enabled",
    "STATUS: Retro mode fully activated",
    "INFO: Early web simulation running",
    "STATUS: Maximum chaos achieved"
  ],
  CRITICAL: [
    "CRITICAL: System too awesome for current reality",
    "EMERGENCY: Fun levels dangerously high",
    "CRITICAL: Nostalgia overflow imminent",
    "EMERGENCY: User trapped in digital wonderland",
    "CRITICAL: Matrix glitch detected",
    "EMERGENCY: Time paradox in progress",
    "CRITICAL: Reality buffer underrun",
    "EMERGENCY: Chaos singularity approaching"
  ]
}

const ERROR_CODES = [
  '0x00000001', '0xDEADBEEF', '0xCAFEBABE', '0x8BADF00D',
  '0xFEEDFACE', '0xDEADC0DE', '0xBAADF00D', '0xC0FFEE00',
  '0x1337C0DE', '0xABCDEF00', '0x80085555', '0xF4CE8000'
]

const ChaosMonitor: React.FC = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [isActive, setIsActive] = useState(true)
  const [cpuUsage, setCpuUsage] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [chaosLevel, setChaosLevel] = useState(0)
  const [uptime, setUptime] = useState(0)
  const alertIdRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Generate random system alerts
  useEffect(() => {
    if (!isActive) return

    const generateAlert = () => {
      const types: Array<keyof typeof SYSTEM_MESSAGES> = ['ERROR', 'WARNING', 'INFO', 'CRITICAL']
      const randomType = types[Math.floor(Math.random() * types.length)]
      const messages = SYSTEM_MESSAGES[randomType]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      const randomCode = ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)]

      const newAlert: SystemAlert = {
        id: alertIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        type: randomType,
        message: randomMessage,
        code: randomCode
      }

      setAlerts(prev => {
        const updated = [...prev, newAlert]
        // Keep only last 20 alerts
        return updated.slice(-20)
      })
    }

    // Generate initial alert
    generateAlert()

    // Generate alerts at random intervals
    const interval = setInterval(() => {
      if (Math.random() < 0.7) { // 70% chance
        generateAlert()
      }
    }, 2000 + Math.random() * 3000) // 2-5 seconds

    return () => clearInterval(interval)
  }, [isActive])

  // Simulate system metrics
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      setCpuUsage(prev => {
        const change = (Math.random() - 0.5) * 20
        return Math.max(0, Math.min(100, prev + change))
      })

      setMemoryUsage(prev => {
        const change = (Math.random() - 0.5) * 15
        return Math.max(0, Math.min(100, prev + change))
      })

      setChaosLevel(prev => {
        const change = (Math.random() - 0.5) * 25
        return Math.max(0, Math.min(100, prev + change))
      })

      setUptime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(metricsInterval)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [alerts])

  // Initialize random values
  useEffect(() => {
    setCpuUsage(Math.random() * 60 + 20)
    setMemoryUsage(Math.random() * 70 + 15)
    setChaosLevel(Math.random() * 80 + 10)
  }, [])

  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'ERROR': return '#ff4444'
      case 'WARNING': return '#ffaa00'
      case 'INFO': return '#44ff44'
      case 'CRITICAL': return '#ff0066'
      default: return '#ffffff'
    }
  }

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  return (
    <div className="chaos-monitor">
      {/* Header */}
      <div className="monitor-header">
        <div className="monitor-title">⚠️ SYSTEM CHAOS MONITOR v1.33.7</div>
        <div className="monitor-status">
          {isActive ? '● MONITORING' : '● PAUSED'}
        </div>
      </div>

      {/* System Metrics */}
      <div className="metrics-panel">
        <div className="metric-group">
          <div className="metric-label">CPU CHAOS:</div>
          <div className="metric-bar">
            <div 
              className="metric-fill cpu" 
              style={{ width: `${cpuUsage}%` }}
            />
            <span className="metric-value">{cpuUsage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="metric-group">
          <div className="metric-label">MEMORY MAYHEM:</div>
          <div className="metric-bar">
            <div 
              className="metric-fill memory" 
              style={{ width: `${memoryUsage}%` }}
            />
            <span className="metric-value">{memoryUsage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="metric-group">
          <div className="metric-label">CHAOS LEVEL:</div>
          <div className="metric-bar">
            <div 
              className="metric-fill chaos" 
              style={{ width: `${chaosLevel}%` }}
            />
            <span className="metric-value rainbow-text">{chaosLevel.toFixed(1)}%</span>
          </div>
        </div>

        <div className="uptime-display">
          <span className="uptime-label">SYSTEM UPTIME:</span>
          <span className="uptime-value blink">{formatUptime(uptime)}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <button 
          className={`control-btn ${isActive ? 'active' : 'inactive'}`}
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? 'PAUSE' : 'RESUME'}
        </button>
        <button 
          className="control-btn clear-btn"
          onClick={clearAlerts}
        >
          CLEAR LOG
        </button>
        <div className="alert-count">
          ALERTS: {alerts.length}
        </div>
      </div>

      {/* Alert Log */}
      <div className="alert-log">
        <div className="log-header">
          <span className="log-title">🚨 SYSTEM ALERT LOG 🚨</span>
        </div>
        
        <div className="log-content">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <div className="ascii-waiting">
{`
 ██╗    ██╗ █████╗ ██╗████████╗██╗███╗   ██╗ ██████╗ 
 ██║    ██║██╔══██╗██║╚══██╔══╝██║████╗  ██║██╔════╝ 
 ██║ █╗ ██║███████║██║   ██║   ██║██╔██╗ ██║██║  ███╗
 ██║███╗██║██╔══██║██║   ██║   ██║██║╚██╗██║██║   ██║
 ╚███╔███╔╝██║  ██║██║   ██║   ██║██║ ╚████║╚██████╔╝
  ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
`}
              </div>
              <div className="waiting-text">Waiting for chaos to begin...</div>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="alert-entry">
                <div className="alert-header">
                  <span 
                    className="alert-type"
                    style={{ color: getAlertColor(alert.type) }}
                  >
                    [{alert.type}]
                  </span>
                  <span className="alert-time">{alert.timestamp}</span>
                  <span className="alert-code">{alert.code}</span>
                </div>
                <div className="alert-message">
                  {alert.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <style jsx>{`
        .chaos-monitor {
          background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
          border: 2px outset #333;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: linear-gradient(90deg, #660000, #990000);
          border-bottom: 2px solid #ff0000;
          font-weight: bold;
          font-size: 11px;
          color: #ffff00;
          text-shadow: 1px 1px 2px black;
        }

        .metrics-panel {
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid #333;
        }

        .metric-group {
          margin-bottom: 8px;
        }

        .metric-label {
          font-size: 10px;
          color: #888;
          margin-bottom: 3px;
        }

        .metric-bar {
          position: relative;
          height: 16px;
          background: #222;
          border: 1px inset #333;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .metric-fill.cpu {
          background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
        }

        .metric-fill.memory {
          background: linear-gradient(90deg, #0066ff, #00ccff, #ff6600);
        }

        .metric-fill.chaos {
          background: linear-gradient(90deg, 
            red, orange, yellow, green, blue, indigo, violet);
          animation: rainbow-flow 2s linear infinite;
        }

        @keyframes rainbow-flow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }

        .metric-value {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: bold;
          text-shadow: 1px 1px 2px black;
        }

        .uptime-display {
          margin-top: 8px;
          text-align: center;
          font-size: 10px;
        }

        .uptime-label {
          color: #888;
          margin-right: 8px;
        }

        .uptime-value {
          color: #00ffff;
          font-weight: bold;
        }

        .blink {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .rainbow-text {
          background: linear-gradient(45deg, 
            red, orange, yellow, green, blue, indigo, violet, red);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rainbow 2s ease-in-out infinite;
        }

        @keyframes rainbow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .control-panel {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid #333;
        }

        .control-btn {
          background: linear-gradient(135deg, #003300, #001100);
          border: 1px outset #00ff00;
          color: #00ff00;
          padding: 4px 8px;
          font-family: inherit;
          font-size: 9px;
          cursor: pointer;
        }

        .control-btn:hover {
          background: linear-gradient(135deg, #004400, #002200);
        }

        .control-btn.active {
          background: linear-gradient(135deg, #00aa00, #006600);
        }

        .control-btn.inactive {
          background: linear-gradient(135deg, #660000, #440000);
          border-color: #ff6666;
          color: #ff6666;
        }

        .control-btn.clear-btn {
          background: linear-gradient(135deg, #666600, #444400);
          border-color: #ffff00;
          color: #ffff00;
        }

        .alert-count {
          margin-left: auto;
          font-size: 9px;
          color: #888;
        }

        .alert-log {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .log-header {
          padding: 6px 10px;
          background: linear-gradient(90deg, #000080, #000040);
          border-bottom: 1px solid #0066ff;
          text-align: center;
          font-size: 10px;
          color: #ffff00;
          font-weight: bold;
        }

        .log-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          font-size: 10px;
          line-height: 1.2;
        }

        .no-alerts {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .ascii-waiting {
          font-size: 6px;
          line-height: 1;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .waiting-text {
          font-size: 11px;
          animation: blink 2s infinite;
        }

        .alert-entry {
          margin-bottom: 8px;
          border-left: 3px solid;
          padding-left: 6px;
          border-color: #333;
        }

        .alert-entry:nth-child(odd) {
          background: rgba(0, 0, 0, 0.2);
        }

        .alert-header {
          display: flex;
          gap: 8px;
          margin-bottom: 2px;
          font-size: 9px;
        }

        .alert-type {
          font-weight: bold;
          min-width: 60px;
        }

        .alert-time {
          color: #888;
          min-width: 60px;
        }

        .alert-code {
          color: #666;
          font-family: monospace;
        }

        .alert-message {
          color: #ccc;
          margin-left: 8px;
          word-wrap: break-word;
        }

        /* Scrollbar styling */
        .log-content::-webkit-scrollbar {
          width: 6px;
        }

        .log-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .log-content::-webkit-scrollbar-thumb {
          background: #00ff00;
          opacity: 0.5;
        }

        /* CRT monitor effect */
        .chaos-monitor::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            transparent 50%,
            rgba(0, 255, 0, 0.03) 50%
          );
          background-size: 100% 4px;
          pointer-events: none;
          animation: scanline 0.1s linear infinite;
        }

        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
      `}</style>
    </div>
  )
}

export default ChaosMonitor