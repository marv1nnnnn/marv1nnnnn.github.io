import type { Metadata } from 'next';
import { getAllSignalCards } from '@/lib/signals';
import Redirect from '@/components/tape/Redirect';

const SECTION: Record<string, string> = { projects: '/make', journal: '/think' };

type Props = { params: Promise<{ signalId: string; cardId: string }> };

export function generateStaticParams() {
  return getAllSignalCards();
}

function target(signalId: string, cardId: string) {
  const base = SECTION[signalId];
  return base ? `${base}/${cardId}` : '/';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signalId, cardId } = await params;
  const to = target(signalId, cardId);
  return { title: 'Moved', robots: { index: false, follow: true }, alternates: { canonical: to } };
}

export default async function MovedCard({ params }: Props) {
  const { signalId, cardId } = await params;
  return <Redirect to={target(signalId, cardId)} />;
}
