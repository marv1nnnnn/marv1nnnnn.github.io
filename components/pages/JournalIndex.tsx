import Link from 'next/link';
import { decay } from '@/lib/decay';
import type { SignalCardsPage } from '@/types/scanner';

export default function JournalIndex({ page, signalId, title }: { page: SignalCardsPage; signalId: string; title: string }) {
  const cards = [...page.cards].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const [latest, ...rest] = cards;

  return (
    <main className="page">
      <h1 className="page__title">{title}</h1>

      {latest && (
        <article className="journal__lead" style={{ marginTop: '3.5rem' }}>
          <p className="nano">{latest.date?.replaceAll('-', '.')} · LATEST</p>
          <Link href={`/signals/${signalId}/${latest.id}`}>
            <h2>{latest.title}</h2>
          </Link>
          {latest.subtitle && <p style={{ fontStyle: 'italic' }}>{latest.subtitle}</p>}
          <p>{latest.summary}</p>
          <Link className="article__toggle" href={`/signals/${signalId}/${latest.id}`}>READ ↗</Link>
        </article>
      )}

      {rest.length > 0 && (
        <ol className="rows" style={{ marginTop: '5rem' }}>
          {rest.map((card, index) => (
            <li key={card.id} style={decay(card.date)}>
              <Link href={`/signals/${signalId}/${card.id}`}>
                <span className="rows__n">{String(index + 2).padStart(2, '0')}</span>
                <h2>{card.title}</h2>
                <span className="rows__meta">{card.date?.replaceAll('-', '.')}</span>
                <span className="rows__go">READ ↗</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
