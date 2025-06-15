'use client'

import React, { useRef } from 'react'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import { useWindowManager, WindowConfig } from '@/hooks/useWindowManager'

interface WindowProps {
  window: WindowConfig
}

const Window: React.FC<WindowProps> = ({ window }) => {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, updateWindow } = useWindowManager()
  const windowRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = () => {
    if (!window.isActive) {
      focusWindow(window.id)
    }
  }

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    updateWindow(window.id, {
      position: { x: data.x, y: data.y }
    })
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    closeWindow(window.id)
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    minimizeWindow(window.id)
  }

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    maximizeWindow(window.id)
  }

  if (window.isMinimized) {
    return null
  }

  // Defensive fallback for undefined position
  const safePosition = window.position || { x: 100, y: 100 }
  
  const windowStyle: React.CSSProperties = {
    width: window.size.width,
    height: window.size.height,
    zIndex: window.zIndex,
    transform: window.isMaximized ? 'none' : undefined,
    position: 'fixed',
    top: window.isMaximized ? 0 : safePosition.y,
    left: window.isMaximized ? 0 : safePosition.x,
  }

  return (
    <Draggable
      nodeRef={windowRef}
      disabled={!window.draggable || window.isMaximized}
      position={window.isMaximized ? { x: 0, y: 0 } : safePosition}
      onDrag={handleDrag}
      handle=".window-title-bar"
    >
      <div
        ref={windowRef}
        className="window"
        style={windowStyle}
        onMouseDown={handleMouseDown}
      >
        <div className={`window-title-bar ${window.isActive ? '' : 'inactive'}`}>
          <span className="window-title">{window.title}</span>
          <div className="window-controls">
            <button
              className="window-control-btn minimize-btn"
              onClick={handleMinimize}
              title="Minimize"
            >
              _
            </button>
            <button
              className="window-control-btn maximize-btn"
              onClick={handleMaximize}
              title={window.isMaximized ? "Restore" : "Maximize"}
            >
              {window.isMaximized ? '❐' : '□'}
            </button>
            <button
              className="window-control-btn close-btn"
              onClick={handleClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="window-content">
          {window.component}
        </div>
      </div>
    </Draggable>
  )
}

export default Window