import type { Metadata, Viewport } from "next";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import FluidBackground from "@/components/FluidBackground";

const siteUrl = 'https://marv1nnnnn.github.io';
const siteName = 'MARV1NNNNN';
const siteTitle = 'Marvin Ma (MARV1NNNNN) · AI Engineer & Vibe Coding Builder';
const siteDescription =
  'Marvin Ma is an AI Engineer at YouWare and Cursor Ambassador exploring vibe coding, creative tools, live coding, music, games, and internet culture.';
const defaultImage = '/images/cursor_shenzhen.png';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Marvin Ma',
    'MARV1NNNNN',
    'AI Engineer',
    'YouWare',
    'Cursor Ambassador',
    'vibe coding',
    'creative coding',
    'portfolio',
  ],
  authors: [{ name: 'Marvin Ma', url: siteUrl }],
  creator: 'Marvin Ma',
  publisher: 'Marvin Ma',
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: { url: '/icon.svg', type: 'image/svg+xml' },
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName,
    images: [
      {
        url: defaultImage,
        width: 1200,
        height: 630,
        alt: 'Marvin Ma speaking at a Cursor community event in Shenzhen',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    creator: '@marv1nnnnn1',
    images: [defaultImage],
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: 'Marvin Ma',
        alternateName: 'MARV1NNNNN',
        url: siteUrl,
        image: `${siteUrl}${defaultImage}`,
        jobTitle: 'AI Engineer',
        worksFor: { '@type': 'Organization', name: 'YouWare' },
        sameAs: [
          'https://github.com/marv1nnnnn',
          'https://twitter.com/marv1nnnnn1',
          'https://www.linkedin.com/in/%E8%BF%9B-%E9%A9%AC-14b950113/',
          'https://bandcamp.com/marv1nnnnn',
          'https://steamcommunity.com/id/marv1nnnnn/',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        headline: siteTitle,
        description: siteDescription,
        publisher: { '@id': `${siteUrl}/#person` },
      },
    ],
  };

  return (
    <html lang="en" style={{ backgroundColor: '#050505' }}>
      <body className="antialiased" style={{ backgroundColor: '#050505', color: '#ffffff' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <FluidBackground />
        <CustomCursor />
        <div className="vignette-overlay" aria-hidden="true"></div>
        <div className="grain-overlay" aria-hidden="true"></div>
        {children}
      </body>
    </html>
  );
}
