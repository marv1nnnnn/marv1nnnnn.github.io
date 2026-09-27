import type { Metadata } from 'next';
import { TapeScene } from '@/components/tape/parts';
import LogDeck from '@/components/tape/LogDeck';
import { getLog } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'log',
  description: 'What Marvin Ma has been listening to, watching, reading and playing lately.',
  alternates: { canonical: '/log' },
};

export default function LogPage() {
  const log = getLog();
  return (
    <article className="page page-wide">
      <TapeScene seed="log" age={0.2} />
      <header className="page-head">
        <h1>log</h1>
        <p className="lede">What I’ve been listening to, watching, reading and playing lately, one mark per entry. Drag along the tape to play it back.</p>
      </header>
      <LogDeck items={log} />
    </article>
  );
}
