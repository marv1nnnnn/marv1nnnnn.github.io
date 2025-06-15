'use client'

import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface WindowConfig {
  id: string
  title: string
  component: ReactNode
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  isActive: boolean
  isMinimized: boolean
  isMaximized: boolean
  icon?: string
  resizable?: boolean
  draggable?: boolean
}

interface WindowManagerContextType {
  windows: WindowConfig[]
  createWindow: (config: Partial<WindowConfig>) => string
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  updateWindow: (id: string, updates: Partial<WindowConfig>) => void
  getNextZIndex: () => number
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null)

// Helper function to get random position
const getRandomPosition = (): { x: number; y: number } => {
  const maxX = Math.max(100, window.innerWidth - 300)
  const maxY = Math.max(100, window.innerHeight - 200)
  return {
    x: Math.random() * maxX,
    y: Math.random() * maxY
  }
}

// Helper function to get next z-index
let currentZIndex = 1000

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowConfig[]>([])

  const getNextZIndex = useCallback(() => {
    currentZIndex += 1
    return currentZIndex
  }, [])

  const createWindow = useCallback((config: Partial<WindowConfig>): string => {
    const id = uuidv4()
    const newWindow: WindowConfig = {
      id,
      title: config.title || 'Untitled Window',
      component: config.component || <div>Empty Window</div>,
      position: config.position || getRandomPosition(),
      size: config.size || { width: 400, height: 300 },
      zIndex: getNextZIndex(),
      isActive: true,
      isMinimized: false,
      isMaximized: false,
      icon: config.icon,
      resizable: config.resizable !== false,
      draggable: config.draggable !== false,
      ...config
    }

    setWindows(prev => {
      // Deactivate all other windows
      const updatedWindows = prev.map(w => ({ ...w, isActive: false }))
      return [...updatedWindows, newWindow]
    })

    return id
  }, [getNextZIndex])

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id))
  }, [])

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      isActive: w.id === id,
      zIndex: w.id === id ? getNextZIndex() : w.zIndex
    })))
  }, [getNextZIndex])

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ))
  }, [])

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { 
        ...w, 
        isMaximized: !w.isMaximized,
        position: w.isMaximized ? w.position : { x: 0, y: 0 },
        size: w.isMaximized ? w.size : { width: window.innerWidth, height: window.innerHeight - 30 }
      } : w
    ))
  }, [])

  const updateWindow = useCallback((id: string, updates: Partial<WindowConfig>) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ))
  }, [])

  const contextValue: WindowManagerContextType = {
    windows,
    createWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindow,
    getNextZIndex
  }

  return (
    <WindowManagerContext.Provider value={contextValue}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export const useWindowManager = (): WindowManagerContextType => {
  const context = useContext(WindowManagerContext)
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider')
  }
  return context
}