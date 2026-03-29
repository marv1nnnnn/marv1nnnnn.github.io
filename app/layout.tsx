import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "MARV1NNNNN",
  description: "Personal website and portfolio of Marvin.",
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
    title: "MARV1NNNNN",
    description: "Personal website and portfolio of Marvin.",
    siteName: "MARV1NNNNN",
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MARV1NNNNN',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "MARV1NNNNN",
    description: "Personal website and portfolio of Marvin.",
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
    <html lang="en" style={{ backgroundColor: '#050505' }}>
      <body className="antialiased" style={{ backgroundColor: '#050505', color: '#ffffff' }}>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
