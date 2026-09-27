import type { Metadata } from 'next';
import Redirect from '@/components/tape/Redirect';

// The footnote prototype was superseded by the tape design.
export const metadata: Metadata = {
  title: 'Moved',
  robots: { index: false, follow: true },
  alternates: { canonical: '/' },
};

export default function MovedDraft() {
  return <Redirect to="/" />;
}
