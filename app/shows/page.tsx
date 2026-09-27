import type { Metadata } from 'next';
import Redirect from '@/components/tape/Redirect';

export const metadata: Metadata = {
  title: 'Moved',
  robots: { index: false, follow: true },
  alternates: { canonical: '/make' },
};

export default function MovedShows() {
  return <Redirect to="/make#noise" />;
}
