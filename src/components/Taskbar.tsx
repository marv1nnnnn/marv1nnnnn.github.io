'use client'

import { useState, useEffect } from 'react'
import { WindowState, SystemState } from '@/types'

interface TaskbarProps {
  windows: WindowState[]
  systemState: SystemState
  onWindowToggle: (windowId: string) => void
}

export default function Taskbar({ windows, systemState, onWindowToggle }: TaskbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSystemMenu, setShowSystemMenu] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'var(--color-info)'
      case 'UNSTABLE': return 'var(--color-unease)'
      case 'DISCONNECTED': return 'var(--color-blood)'
      case 'CORRUPTED': return 'var(--color-blood)'
      default: return 'var(--color-static)'
    }
  }

  const getWindowIcon = (component: string) => {
    const icons: Record<string, string> = {
      CaseFileReader: '📁',
      HeavensSmileGallery: '🎯',
      CatherinesSuitcase: '📻',
      LostFoundGames: '🎮',
      TransmittedConsciousness: '🧠',
    }
    return icons[component] || '❓'
  }

  return (
    <div className="taskbar">
      {/* Start Menu */}
      <div className="start-menu">
        <button 
          className="start-button"
          onClick={() => setShowSystemMenu(!showSystemMenu)}
        >
          <span className="start-icon">█</span>
          <span className="start-text">SYSTEM</span>
        </button>

        {showSystemMenu && (
          <div className="system-menu">
            <div className="menu-section">
              <div className="menu-title">SYSTEM STATUS</div>
              <div className="menu-item">
                Connection: <span style={{ color: getConnectionStatusColor(systemState.connectionStatus) }}>
                  {systemState.connectionStatus}
                </span>
              </div>
              <div className="menu-item">
                Glitch Level: {systemState.glitchLevel.toFixed(1)}
              </div>
              <div className="menu-item">
                Active Windows: {windows.filter(w => !w.isMinimized).length}
              </div>
            </div>

            <div className="menu-section">
              <div className="menu-title">AUDIO SYSTEM</div>
              <div className="menu-item">
                Master: {Math.round(systemState.audio.masterVolume * 100)}%
              </div>
              <div className="menu-item">
                Effects: {Math.round(systemState.audio.effectsVolume * 100)}%
              </div>
              <div className="menu-item">
                Music: {Math.round(systemState.audio.musicVolume * 100)}%
              </div>
            </div>

            <div className="menu-section">
              <button className="menu-button" onClick={() => setShowSystemMenu(false)}>
                CLOSE MENU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Window List */}
      <div className="window-list">
        {windows.map(window => (
          <button
            key={window.id}
            className={`window-button ${window.isFocused ? 'focused' : ''} ${window.isMinimized ? 'minimized' : ''}`}
            onClick={() => onWindowToggle(window.id)}
          >
            <span className="window-icon">
              {getWindowIcon(window.component)}
            </span>
            <span className="window-title">
              {window.title}
            </span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="system-tray">
        {/* Connection Status */}
        <div 
          className="tray-item"
          style={{ color: getConnectionStatusColor(systemState.connectionStatus) }}
          title={`Connection: ${systemState.connectionStatus}`}
        >
          <span className="connection-indicator">
            {systemState.connectionStatus === 'CONNECTED' ? '●' : '○'}
          </span>
        </div>

        {/* Audio Status */}
        <div 
          className="tray-item"
          title={`Audio: ${systemState.audio.isMuted ? 'Muted' : 'Active'}`}
        >
          <span className="audio-indicator">
            {systemState.audio.isMuted ? '🔇' : '🔊'}
          </span>
        </div>

        {/* Time and Date */}
        <div className="time-display">
          <div className="time">{formatTime(currentTime)}</div>
          <div className="date">{formatDate(currentTime)}</div>
        </div>
      </div>

      <style jsx>{`
        .taskbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: var(--color-shadow);
          border-top: 2px solid var(--color-light);
          display: flex;
          align-items: center;
          z-index: 1000;
          font-family: var(--font-system);
        }

        .start-menu {
          position: relative;
        }

        .start-button {
          height: 36px;
          padding: 0 var(--space-base);
          background: var(--color-void);
          border: 1px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
          cursor: crosshair;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          transition: all 0.1s ease;
        }

        .start-button:hover {
          background: var(--color-light);
          color: var(--color-void);
        }

        .start-icon {
          font-size: var(--font-size-base);
          color: var(--color-info);
        }

        .start-text {
          font-weight: bold;
          letter-spacing: 1px;
        }

        .system-menu {
          position: absolute;
          bottom: 42px;
          left: 0;
          width: 250px;
          background: var(--color-void);
          border: 2px solid var(--color-light);
          box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
          z-index: 1001;
        }

        .menu-section {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-shadow);
        }

        .menu-section:last-child {
          border-bottom: none;
        }

        .menu-title {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-sm);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .menu-item {
          font-size: var(--font-size-xs);
          color: var(--color-light);
          margin-bottom: var(--space-xs);
          display: flex;
          justify-content: space-between;
        }

        .menu-button {
          width: 100%;
          padding: var(--space-sm);
          background: var(--color-shadow);
          border: 1px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          cursor: crosshair;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.1s ease;
        }

        .menu-button:hover {
          background: var(--color-light);
          color: var(--color-void);
        }

        .window-list {
          flex: 1;
          display: flex;
          gap: var(--space-xs);
          padding: 0 var(--space-base);
          overflow-x: auto;
        }

        .window-button {
          height: 32px;
          padding: 0 var(--space-sm);
          background: var(--color-shadow);
          border: 1px solid var(--color-grey-dark);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          cursor: crosshair;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          max-width: 150px;
          transition: all 0.1s ease;
          white-space: nowrap;
        }

        .window-button:hover {
          background: var(--color-grey-dark);
          border-color: var(--color-light);
        }

        .window-button.focused {
          background: var(--color-info);
          color: var(--color-void);
          border-color: var(--color-light);
        }

        .window-button.minimized {
          opacity: 0.6;
          font-style: italic;
        }

        .window-icon {
          font-size: var(--font-size-sm);
        }

        .window-title {
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }

        .system-tray {
          display: flex;
          align-items: center;
          gap: var(--space-base);
          padding: 0 var(--space-base);
          border-left: 1px solid var(--color-grey-dark);
        }

        .tray-item {
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
          color: var(--color-light);
          cursor: crosshair;
        }

        .connection-indicator {
          animation: connection-pulse 2s infinite;
        }

        @keyframes connection-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .time-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: var(--font-size-xs);
          color: var(--color-light);
          min-width: 80px;
        }

        .time {
          font-weight: bold;
          color: var(--color-info);
        }

        .date {
          color: var(--color-grey-light);
        }
      `}</style>
    </div>
  )
}