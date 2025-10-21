import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARV1NNNNN // Creative Technologist",
  description: "Personal website and portfolio of Marvin, a designer and creative technologist exploring narrative systems and experiential web installations.",
  metadataBase: new URL('https://marv1nnnnn.github.io'),
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://marv1nnnnn.github.io',
    title: "MARV1NNNNN // Creative Technologist",
    description: "Personal website and portfolio of Marvin, a designer and creative technologist exploring narrative systems and experiential web installations.",
    siteName: "MARV1NNNNN",
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MARV1NNNNN - Creative Technologist Portfolio',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "MARV1NNNNN // Creative Technologist",
    description: "Personal website and portfolio of Marvin, a designer and creative technologist exploring narrative systems and experiential web installations.",
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
