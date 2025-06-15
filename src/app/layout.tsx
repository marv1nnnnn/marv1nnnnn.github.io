import type { Metadata } from 'next'
import './globals.css'
import './effects.css'

export const metadata: Metadata = {
  title: 'Chaotic Early-Web OS',
  description: 'A nostalgic desktop environment celebrating early web aesthetics',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}