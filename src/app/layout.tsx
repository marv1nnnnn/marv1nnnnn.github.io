import type { Metadata } from 'next'
import './globals.css'
import { AudioProvider } from '@/contexts/AudioContext'

export const metadata: Metadata = {
  title: 'The Transmitter-Receiver OS',
  description: 'A Suda51-inspired digital consciousness - Enter the 25th Ward',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="kamino-os">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  )
}