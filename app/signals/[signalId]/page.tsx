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

  return {
    title: `${signal.title} // MARV1NNNNN`,
    description: `Selected data fragments from ${signal.title} // Archive_v0.6`,
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
