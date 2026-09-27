import type { Metadata } from 'next';
import Redirect from '@/components/tape/Redirect';

export const metadata: Metadata = {
  title: 'Moved',
  robots: { index: false, follow: true },
  alternates: { canonical: '/make' },
};

// Essays now live on /make; the essay pages themselves stay at /think/[id].
export default function ThinkPage() {
  return <Redirect to="/make#writing" />;
}
