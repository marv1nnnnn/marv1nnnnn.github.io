'use client'

import { useState, useEffect } from 'react'
import BootSequence from '@/components/BootSequence'
import Desktop from '@/components/Desktop'

export default function Home() {
  const [isBooting, setIsBooting] = useState(true)
  const [bootComplete, setBootComplete] = useState(false)

  useEffect(() => {
    // Skip boot sequence in dev mode if needed
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('skip-boot')) {
      setIsBooting(false)
      setBootComplete(true)
    }
  }, [])

  const handleBootComplete = () => {
    setIsBooting(false)
    setBootComplete(true)
  }

  if (isBooting) {
    return <BootSequence onBootComplete={handleBootComplete} />
  }

  return <Desktop />
}