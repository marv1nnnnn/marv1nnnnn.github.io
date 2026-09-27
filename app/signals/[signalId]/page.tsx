import type { Metadata } from 'next';
import { SIGNALS } from '@/lib/signals';
import Redirect from '@/components/tape/Redirect';

const MOVED: Record<string, string> = {
  about: '/about',
  projects: '/make',
  journal: '/think',
  influences: '/input',
  listening: '/input#log',
};

type Props = { params: Promise<{ signalId: string }> };

export function generateStaticParams() {
  return SIGNALS.map((signal) => ({ signalId: signal.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signalId } = await params;
  const to = MOVED[signalId] ?? '/';
  return { title: 'Moved', robots: { index: false, follow: true }, alternates: { canonical: to.split('#')[0] } };
}

export default async function MovedSignal({ params }: Props) {
  const { signalId } = await params;
  return <Redirect to={MOVED[signalId] ?? '/'} />;
}
