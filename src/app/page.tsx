'use client'

import Desktop from '@/components/Desktop'
import { WindowManagerProvider } from '@/hooks/useWindowManager'
import { AIChatProvider } from '@/contexts/AIChatContext'
import { ChaosProvider } from '@/contexts/ChaosProvider'
import { AudioVisualProvider } from '@/components/AudioVisualManager'

export default function Home() {
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