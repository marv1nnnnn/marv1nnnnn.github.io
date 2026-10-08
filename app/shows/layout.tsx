import type { Metadata } from 'next';
import { shareImage } from '@/lib/share';

export const metadata: Metadata = {
  title: 'Live / Performances',
  description: 'Live coding, circuit bending, and experimental music performances by Marvin Ma in Beijing and beyond.',
  alternates: { canonical: '/shows' },
  openGraph: {
    type: 'website',
    url: '/shows',
    title: 'Live / Performances · MARV1NNNNN',
    description: 'Live coding, circuit bending, and experimental music performances by Marvin Ma.',
    images: [shareImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live / Performances · MARV1NNNNN',
    description: 'Live coding, circuit bending, and experimental music performances by Marvin Ma.',
    images: [shareImage],
  },
};

export default function ShowsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
