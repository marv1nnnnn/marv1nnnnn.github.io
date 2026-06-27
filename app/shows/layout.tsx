import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live / Performances',
  description: 'Live coding, circuit bending, and experimental music performances by Marvin Ma in Beijing and beyond.',
  alternates: { canonical: '/shows' },
  openGraph: {
    type: 'website',
    url: '/shows',
    title: 'Live / Performances · MARV1NNNNN',
    description: 'Live coding, circuit bending, and experimental music performances by Marvin Ma.',
    images: [{ url: '/images/cursor_shenzhen.png', width: 1200, height: 630, alt: 'MARV1NNNNN live performances' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live / Performances · MARV1NNNNN',
    description: 'Live coding, circuit bending, and experimental music performances by Marvin Ma.',
    images: ['/images/cursor_shenzhen.png'],
  },
};

export default function ShowsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
