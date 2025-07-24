'use client'

import { useEffect, useRef } from 'react'

interface WebGLContextManagerProps {
  children: React.ReactNode
}

export function WebGLContextManager({ children }: WebGLContextManagerProps) {
  const contextLossCount = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null

    const handleContextLoss = (event: Event) => {
      console.warn('[WebGL] Context lost. Preventing default behavior.')
      event.preventDefault()
      contextLossCount.current++
      
      if (contextLossCount.current <= maxRetries) {
        console.log(`[WebGL] Attempting to restore context (attempt ${contextLossCount.current}/${maxRetries})`)
      } else {
        console.error('[WebGL] Max context loss retries reached. Consider refreshing the page.')
      }
    }

    const handleContextRestore = () => {
      console.log('[WebGL] Context restored successfully.')
      contextLossCount.current = 0
    }

    const setupContextHandlers = () => {
      // Find Three.js canvas elements
      const canvases = document.querySelectorAll('canvas')
      canvases.forEach((canvasElement) => {
        if (canvasElement.getContext('webgl') || canvasElement.getContext('webgl2')) {
          canvas = canvasElement
          canvas.addEventListener('webglcontextlost', handleContextLoss)
          canvas.addEventListener('webglcontextrestored', handleContextRestore)
        }
      })
    }

    // Set up handlers after a brief delay to ensure canvases are created
    const timeoutId = setTimeout(setupContextHandlers, 1000)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLoss)
        canvas.removeEventListener('webglcontextrestored', handleContextRestore)
      }
    }
  }, [])

  return <>{children}</>
}

// Additional utility to monitor WebGL memory usage
export function useWebGLMemoryMonitor() {
  useEffect(() => {
    const checkMemory = () => {
      // Check if WebGL context exists
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        if (gl) {
          // Log WebGL info for debugging
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          if (debugInfo) {
            console.log('[WebGL Memory] Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
            console.log('[WebGL Memory] Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
          }
        }
      }
    }

    // Check memory usage every 30 seconds
    const interval = setInterval(checkMemory, 30000)
    
    // Initial check
    setTimeout(checkMemory, 2000)

    return () => clearInterval(interval)
  }, [])
} 