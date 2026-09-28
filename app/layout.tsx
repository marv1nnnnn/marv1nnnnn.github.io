import type { Metadata, Viewport } from "next";
import "./globals.css";
import TapeProvider from "@/components/tape/TapeProvider";
import { TopNav } from "@/components/tape/parts";

const siteUrl = 'https://marv1nnnnn.github.io';
const siteName = 'MARV1NNNNN';
const siteTitle = 'Marvin Ma (MARV1NNNNN) · Product Manager';
const siteDescription =
  'Marvin Ma is a product manager at YouWare and Cursor Ambassador. Formerly live coding and circuit bending in Beijing. Writing about agents, building small tools, and logging what he watches, reads and plays.';
const defaultImage = '/images/cursor_shenzhen.png';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#07090C',
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
    'Product Manager',
    'YouWare',
    'Cursor Ambassador',
    'AI agents',
    'live coding',
    'generative art',
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
        jobTitle: 'Product Manager',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The booklets measure their pages in these, so fetch them before anything else. */}
        <link rel="preload" href="/fonts/martian-mono.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/newsreader.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/newsreader-italic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        {/* The tape a returning visitor chose, set before anything is drawn: its world decides the
            lamp and the booklet's type, and the booklet measures its pages in that type. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tape-palette');var r=${JSON.stringify({ oxide: 'haze', lain: '3am', phosphor: 'nightbus', uv: 'ritual', mono: 'pressure', noise: 'bent' })};document.documentElement.dataset.tape=(t&&r[t])||t||'haze'}catch(e){document.documentElement.dataset.tape='haze'}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <TapeProvider>
          <TopNav />
          <main id="content">{children}</main>
        </TapeProvider>
      </body>
    </html>
  );
}
