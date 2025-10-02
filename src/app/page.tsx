'use client'

import FilmWindow from '@/components/FilmWindow'
import { AudioProvider } from '@/contexts/AudioContext'
import '@/styles/y2k.css'

export default function Home() {
  return (
    <AudioProvider>
      <FilmWindow />
    </AudioProvider>
  )
}
