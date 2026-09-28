import type { Metadata } from 'next';
import Booklet from '@/components/tape/Booklet';
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
    <Booklet path="/log" own className="log">
      <TapeScene seed="log" age={0.2} />
      <LogDeck items={log} />
    </Booklet>
  );
}
