import type { Metadata } from 'next'
import './globals.css'
import { AudioProvider } from '@/contexts/AudioContext'

export const metadata: Metadata = {
  title: 'marv1nnnnn OS - Digital Consciousness',
  description: 'Enter marv1nnnnn\'s digital realm - An experimental fusion of AI, 3D art, and interactive design',
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
      <body className="marv1nnnnn-os">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  )
}