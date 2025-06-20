'use client'

import { useState, useEffect, useRef } from 'react'
import { WindowState } from '@/types'
import CaseFileReader from '@/components/applications/CaseFileReader'
import CatherinesSuitcase from '@/components/applications/CatherinesSuitcase'
import ControlPanel from '@/components/applications/ControlPanel'
import { gsap } from 'gsap'
import { getWindowIcon, getWindowStatusIcon } from '@/utils/window'

interface WindowProps {
  window: WindowState
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  isDragging: boolean
}

export default function Window({ 
  window, 
  onFocus, 
  onClose, 
  onMinimize, 
  onMaximize, 
  isDragging 
}: WindowProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [glitchActive, setGlitchActive] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Window entrance animation
    if (windowRef.current) {
      gsap.fromTo(windowRef.current,
        { opacity: 0, scale: 0.8, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)"
        }
      )
    }

    // Simulate loading time for window content
    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
    }, Math.random() * 1000 + 500)

    return () => clearTimeout(loadingTimer)
  }, [])

  useEffect(() => {
    // Random glitch effects
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.02) { // 2% chance every 3 seconds
        setGlitchActive(true)
        
        // GSAP glitch animation
        if (windowRef.current) {
          gsap.fromTo(windowRef.current,
            { x: 0, y: 0, rotationZ: 0 },
            { 
              x: "random(-3, 3)",
              y: "random(-2, 2)",
              rotationZ: "random(-0.3, 0.3)",
              duration: 0.05,
              repeat: 5,
              yoyo: true,
              ease: "power2.inOut",
              onComplete: () => {
                gsap.set(windowRef.current, { x: 0, y: 0, rotationZ: 0 })
              }
            }
          )
        }
        
        setTimeout(() => setGlitchActive(false), 150)
      }
    }, 3000)

    return () => clearInterval(glitchInterval)
  }, [])

  const renderApplicationComponent = () => {
    if (isLoading) {
      return (
        <div className="window-loading">
          <div className="loading-text">
            LOADING {window.component.toUpperCase()}
            <span className="loading-dots"></span>
          </div>
          <div className="loading-bar">
            <div className="loading-progress" />
          </div>
        </div>
      )
    }

    switch (window.component) {
      case 'CaseFileReader':
        return <CaseFileReader windowId={window.id} />
      case 'CatherinesSuitcase':
        return <CatherinesSuitcase windowId={window.id} />
      case 'ControlPanel':
        return <ControlPanel windowId={window.id} {...(window.props || {})} />
      default:
        return (
          <div className="window-error">
            <div className="error-title">SYSTEM ERROR</div>
            <div className="error-message">
              Unknown application: {window.component}
            </div>
            <div className="error-code">
              ERROR_CODE: 0x{Math.random().toString(16).substr(2, 8).toUpperCase()}
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      ref={windowRef}
      className={`window ${window.isFocused ? 'focused' : 'unfocused'} ${glitchActive ? 'glitch' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onFocus}
    >
      <div className="window-header">
        <div className="window-title">
          <span className={`title-icon ${glitchActive ? 'icon-glitched' : ''}`}>
            {getWindowIcon(window.component, { 
              isGlitched: glitchActive,
              isCorrupted: Math.random() < 0.05,
              classificationLevel: window.props?.classificationLevel
            })}
          </span>
          <span className="title-text">
            {window.title}
          </span>
          <span className={`window-status-icon ${window.isFocused ? 'focused' : 'unfocused'}`}>
            {getWindowStatusIcon(window.isFocused, window.isMinimized, false)}
          </span>
        </div>
        
        <div className="window-controls">
          <button 
            className="window-control minimize"
            onClick={(e) => {
              e.stopPropagation()
              onMinimize()
            }}
            title="Minimize"
          >
            −
          </button>
          <button 
            className="window-control maximize"
            onClick={(e) => {
              e.stopPropagation()
              onMaximize()
            }}
            title="Maximize"
          >
            {window.isMaximized ? '❐' : '□'}
          </button>
          <button 
            className="window-control close"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="window-content">
        {renderApplicationComponent()}
      </div>

      <style jsx>{`
        .window {
          width: 100%;
          height: 100%;
          background: var(--color-void);
          border: 2px solid var(--color-light);
          box-shadow: 
            inset 1px 1px 0 var(--color-shadow),
            inset -1px -1px 0 var(--color-grey-dark),
            4px 4px 12px rgba(0, 0, 0, 0.6);
          font-family: var(--font-system);
          display: flex;
          flex-direction: column;
          transition: all 0.1s ease;
          position: relative;
          overflow: hidden;
        }

        .window.focused {
          border-color: var(--color-info);
          box-shadow: 
            inset 1px 1px 0 var(--color-shadow),
            inset -1px -1px 0 var(--color-grey-dark),
            4px 4px 12px rgba(0, 0, 0, 0.8),
            0 0 0 1px var(--color-info);
        }

        .window.unfocused {
          opacity: 0.9;
        }

        .window.dragging {
          opacity: 0.8;
          transform: rotate(0.5deg);
        }

        .window.glitch {
          animation: window-glitch 0.15s ease-out;
        }

        @keyframes window-glitch {
          0% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          25% { transform: translate(-1px, 1px); filter: hue-rotate(90deg); }
          50% { transform: translate(1px, -1px); filter: hue-rotate(180deg); }
          75% { transform: translate(-1px, -1px); filter: hue-rotate(270deg); }
          100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
        }

        .window-header {
          background: var(--color-shadow);
          border-bottom: 1px solid var(--color-light);
          padding: var(--space-sm);
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 32px;
          cursor: move;
          user-select: none;
          pointer-events: auto;
        }

        .window.focused .window-header {
          background: var(--color-info);
          color: var(--color-void);
        }

        .window-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-weight: bold;
          font-size: var(--font-size-sm);
          text-transform: uppercase;
          letter-spacing: 1px;
          overflow: hidden;
          flex: 1;
        }

        .title-icon {
          font-size: var(--font-size-base);
          transition: all 0.1s ease;
          min-width: 16px;
          text-align: center;
          cursor: crosshair;
        }

        .title-icon:hover {
          transform: scale(1.1);
          filter: brightness(1.2);
          text-shadow: 0 0 4px currentColor;
        }

        .title-icon.icon-glitched {
          animation: icon-corruption 0.2s ease-in-out;
          color: var(--color-blood);
        }

        @keyframes icon-corruption {
          0% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
          25% { transform: scale(1.1) rotate(-2deg); filter: hue-rotate(90deg); }
          50% { transform: scale(0.9) rotate(2deg); filter: hue-rotate(180deg); }
          75% { transform: scale(1.05) rotate(-1deg); filter: hue-rotate(270deg); }
          100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
        }

        .title-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .window-status-icon {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          margin-left: var(--space-xs);
          transition: all 0.2s ease;
        }

        .window-status-icon.focused {
          opacity: 1;
          color: var(--color-info);
          text-shadow: 0 0 4px currentColor;
        }

        .window-status-icon.unfocused {
          opacity: 0.5;
          color: var(--color-static);
        }

        .connection-status {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          animation: connection-blink 2s infinite;
        }

        .window.focused .connection-status {
          color: var(--color-void);
        }

        @keyframes connection-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }

        .window-controls {
          display: flex;
          gap: var(--space-xs);
          pointer-events: auto;
          z-index: 10;
          position: relative;
          cursor: default;
        }

        .window-control {
          width: 20px;
          height: 20px;
          border: 1px solid var(--color-light);
          background: var(--color-shadow);
          color: var(--color-light);
          cursor: crosshair;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: bold;
          transition: all 0.1s ease;
          pointer-events: auto;
          position: relative;
          z-index: 20;
        }

        .window-control:hover {
          background: var(--color-light);
          color: var(--color-void);
          transform: scale(1.1);
        }

        .window-control.close:hover {
          background: var(--color-blood);
          color: var(--color-light);
        }

        .window.focused .window-control {
          border-color: var(--color-void);
          background: var(--color-light);
          color: var(--color-void);
        }

        .window.focused .window-control:hover {
          background: var(--color-void);
          color: var(--color-light);
        }

        .window.focused .window-control.close:hover {
          background: var(--color-blood);
          color: var(--color-light);
        }

        .window-content {
          flex: 1;
          overflow: auto;
          position: relative;
          height: 100%;
          pointer-events: auto;
          cursor: auto;
        }

        .window-content * {
          pointer-events: auto;
        }

        .window-content button {
          cursor: pointer;
        }

        .window-content input,
        .window-content textarea,
        .window-content select {
          cursor: text;
        }

        .window-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: var(--space-xl);
          text-align: center;
        }

        .loading-text {
          font-size: var(--font-size-base);
          color: var(--color-info);
          margin-bottom: var(--space-lg);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .loading-bar {
          width: 200px;
          height: 10px;
          border: 1px solid var(--color-light);
          background: var(--color-void);
          overflow: hidden;
        }

        .loading-progress {
          height: 100%;
          background: linear-gradient(90deg, var(--color-info), var(--color-blood));
          animation: loading-progress 2s infinite;
        }

        @keyframes loading-progress {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }

        .window-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: var(--space-xl);
          text-align: center;
          color: var(--color-blood);
        }

        .error-title {
          font-size: var(--font-size-lg);
          font-weight: bold;
          margin-bottom: var(--space-base);
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .error-message {
          font-size: var(--font-size-base);
          margin-bottom: var(--space-base);
        }

        .error-code {
          font-size: var(--font-size-sm);
          color: var(--color-static);
          font-family: monospace;
        }
      `}</style>
    </div>
  )
}

