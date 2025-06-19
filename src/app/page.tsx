'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { WindowManagerProvider } from '@/hooks/useWindowManager'
import { AIChatProvider } from '@/contexts/AIChatContext'
import { ChaosProvider } from '@/contexts/ChaosProvider'
import { AudioVisualProvider } from '@/components/AudioVisualManager'

// Dynamic import to prevent SSR issues with 3D components
const Desktop = dynamic(() => import('@/components/Desktop'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <div className="text-center">
        <div className="text-4xl mb-4">🧠</div>
        <div className="text-xl">Loading Chaotic Early-Web OS...</div>
        <div className="text-sm mt-2 opacity-60">Initializing neural pathways...</div>
      </div>
    </div>
  )
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-green-400 font-mono">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <div className="text-xl">Loading Chaotic Early-Web OS...</div>
          <div className="text-sm mt-2 opacity-60">Initializing neural pathways...</div>
        </div>
      </div>
    )
  }

  return (
    <AIChatProvider>
      <WindowManagerProvider>
        <ChaosProvider>
          <AudioVisualProvider>
            <Desktop />
          </AudioVisualProvider>
        </ChaosProvider>
      </WindowManagerProvider>
    </AIChatProvider>
  )
}