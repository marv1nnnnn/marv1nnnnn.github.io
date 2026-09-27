import type { Metadata } from 'next';
import { TapeScene, Worn } from '@/components/tape/parts';
import LogList from '@/components/tape/LogList';
import { dayOf, getLog } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'log',
  description: 'What Marvin Ma has been listening to, watching, reading and playing lately.',
  alternates: { canonical: '/log' },
};

export default function LogPage() {
  const log = getLog();
  const now = log[0];
  return (
    <article className="page">
      <TapeScene seed="log" age={0.2} />
      <header className="page-head">
        <h1>log</h1>
        <p className="lede">What I’ve been listening to, watching, reading and playing lately. It wears as it goes.</p>
      </header>
      {now && (
        <p className="log-now">
          <span className="log-now-label">last in · {dayOf(now.date ?? '')}</span>
          <span className="log-now-title"><Worn text={now.title} date={now.date ?? ''} /></span>
          <span className="log-now-by">{now.creator}</span>
        </p>
      )}
      <LogList items={log} />
    </article>
  );
}
