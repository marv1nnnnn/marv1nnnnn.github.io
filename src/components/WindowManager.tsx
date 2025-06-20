'use client'

import { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import { WindowState } from '@/types'
import Window from '@/components/Window'
import { useAudio } from '@/contexts/AudioContext'

interface WindowManagerProps {
  windows: WindowState[]
  setWindows: React.Dispatch<React.SetStateAction<WindowState[]>>
}

export default function WindowManager({ windows, setWindows }: WindowManagerProps) {
  const { playSound } = useAudio()
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null)

  const handleWindowFocus = (windowId: string) => {
    const maxZ = Math.max(...windows.map(w => w.zIndex), 0)
    
    setWindows(prev => prev.map(window => ({
      ...window,
      isFocused: window.id === windowId,
      zIndex: window.id === windowId ? maxZ + 1 : window.zIndex,
    })))
  }

  const handleWindowClose = (windowId: string) => {
    playSound('windowClose')
    setWindows(prev => prev.filter(window => window.id !== windowId))
  }

  const handleWindowMinimize = (windowId: string) => {
    playSound('click')
    setWindows(prev => prev.map(window => ({
      ...window,
      isMinimized: window.id === windowId ? !window.isMinimized : window.isMinimized,
    })))
  }

  const handleWindowMaximize = (windowId: string) => {
    playSound('click')
    setWindows(prev => prev.map(windowState => {
      if (windowState.id === windowId) {
        return {
          ...windowState,
          isMaximized: !windowState.isMaximized,
          position: !windowState.isMaximized 
            ? { x: 0, y: 0, width: typeof window !== 'undefined' ? window.innerWidth : 1200, height: typeof window !== 'undefined' ? window.innerHeight - 40 : 760 }
            : windowState.position,
        }
      }
      return windowState
    }))
  }

  const handleDragStart = (windowId: string) => {
    setDraggedWindow(windowId)
    handleWindowFocus(windowId)
  }

  const handleDragStop = (windowId: string, position: { x: number; y: number }) => {
    setDraggedWindow(null)
    setWindows(prev => prev.map(window => ({
      ...window,
      position: window.id === windowId 
        ? { ...window.position, x: position.x, y: position.y }
        : window.position,
    })))
  }

  const handleResize = (windowId: string, size: { width: number; height: number }, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(window => ({
      ...window,
      position: window.id === windowId
        ? { x: position.x, y: position.y, width: size.width, height: size.height }
        : window.position,
      isMaximized: window.id === windowId ? false : window.isMaximized,
    })))
  }

  return (
    <div className="window-manager">
      {windows.map(window => {
        if (window.isMinimized) return null

        return (
          <Rnd
            key={window.id}
            size={{
              width: window.isMaximized ? '100vw' : window.position.width,
              height: window.isMaximized ? 'calc(100vh - 40px)' : window.position.height,
            }}
            position={{
              x: window.isMaximized ? 0 : window.position.x,
              y: window.isMaximized ? 0 : window.position.y,
            }}
            onDragStart={() => handleDragStart(window.id)}
            onDragStop={(e, data) => handleDragStop(window.id, { x: data.x, y: data.y })}
            onResizeStop={(e, direction, ref, delta, position) => {
              handleResize(window.id, {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
              }, position)
            }}
            minWidth={300}
            minHeight={200}
            bounds="window"
            disableDragging={window.isMaximized}
            cancel=".window-controls, .window-content, button, input, textarea, select, .scrollable"
            dragHandleClassName="window-header"
            enableResizing={!window.isMaximized}
            resizeHandleStyles={{
              top: {
                height: '8px',
                top: '-4px',
                cursor: 'ns-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              right: {
                width: '8px',
                right: '-4px',
                cursor: 'ew-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              bottom: {
                height: '8px',
                bottom: '-4px',
                cursor: 'ns-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              left: {
                width: '8px',
                left: '-4px',
                cursor: 'ew-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              topRight: {
                width: '10px',
                height: '10px',
                top: '-5px',
                right: '-5px',
                cursor: 'ne-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              topLeft: {
                width: '10px',
                height: '10px',
                top: '-5px',
                left: '-5px',
                cursor: 'nw-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              bottomRight: {
                width: '10px',
                height: '10px',
                bottom: '-5px',
                right: '-5px',
                cursor: 'nw-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              },
              bottomLeft: {
                width: '10px',
                height: '10px',
                bottom: '-5px',
                left: '-5px',
                cursor: 'ne-resize',
                background: 'transparent',
                zIndex: 10000,
                pointerEvents: 'auto'
              }
            }}
            style={{
              zIndex: window.zIndex,
            }}
          >
            <Window
              window={window}
              onFocus={() => handleWindowFocus(window.id)}
              onClose={() => handleWindowClose(window.id)}
              onMinimize={() => handleWindowMinimize(window.id)}
              onMaximize={() => handleWindowMaximize(window.id)}
              isDragging={draggedWindow === window.id}
            />
          </Rnd>
        )
      })}

      <style jsx>{`
        .window-manager {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }

        .window-manager :global(.react-rnd) {
          pointer-events: auto;
        }

        .window-manager :global(.window-header) {
          pointer-events: auto;
          cursor: move;
        }

        .window-manager :global(.window-content) {
          pointer-events: auto;
          cursor: auto;
        }

        .window-manager :global(.react-rnd-resize-handle) {
          background: rgba(255, 0, 0, 0.5) !important;
          z-index: 9999 !important;
          pointer-events: auto !important;
          position: absolute !important;
          border: 1px solid red !important;
        }

        .window-manager :global(.react-rnd-resize-handle-top),
        .window-manager :global(.react-rnd-resize-handle-bottom) {
          height: 10px !important;
          cursor: ns-resize !important;
          left: 0px !important;
          right: 0px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-left),
        .window-manager :global(.react-rnd-resize-handle-right) {
          width: 10px !important;
          cursor: ew-resize !important;
          top: 0px !important;
          bottom: 0px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-top-left),
        .window-manager :global(.react-rnd-resize-handle-top-right),
        .window-manager :global(.react-rnd-resize-handle-bottom-left),
        .window-manager :global(.react-rnd-resize-handle-bottom-right) {
          width: 15px !important;
          height: 15px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-top-left) {
          cursor: nw-resize !important;
          top: -5px !important;
          left: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-top-right) {
          cursor: ne-resize !important;
          top: -5px !important;
          right: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-bottom-left) {
          cursor: ne-resize !important;
          bottom: -5px !important;
          left: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-bottom-right) {
          cursor: nw-resize !important;
          bottom: -5px !important;
          right: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-top) {
          top: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-bottom) {
          bottom: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-left) {
          left: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle-right) {
          right: -5px !important;
        }

        .window-manager :global(.react-rnd-resize-handle:hover) {
          background: rgba(0, 255, 0, 0.3) !important;
        }
      `}</style>
    </div>
  )
}