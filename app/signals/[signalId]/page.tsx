import { notFound } from 'next/navigation';
import { SIGNALS, getSignalById } from '@/lib/signals';
import type { Metadata } from 'next';
import SignalClientPage from './SignalClientPage';

export function generateStaticParams() {
  return SIGNALS.map((signal) => ({
    signalId: signal.id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ signalId: string }> }): Promise<Metadata> {
  const { signalId } = await params;
  const signal = getSignalById(signalId);

  if (!signal) {
    return {
      title: 'Signal Not Found',
    };
  }

  const title = `${signal.title} // MARV1NNNNN`;
  const description = signal.summary ?? `Selected data fragments from ${signal.title} // Archive_v0.6`;
  const url = `/signals/${signalId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: '/images/cursor_shenzhen.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/cursor_shenzhen.png'],
    },
  };
}

export default async function SignalPage({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params;
  const signal = getSignalById(signalId);

  if (!signal) {
    notFound();
  }

  return <SignalClientPage signal={signal} signalId={signalId} />;
}
