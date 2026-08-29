import Link from 'next/link';
import type { SignalCardsPage, SignalCardContent } from '@/types/scanner';

function translationFor(card: SignalCardContent, cards: SignalCardContent[]) {
  return cards.find((candidate) => candidate.id !== card.id && (
    card.markdown.includes(`/signals/journal/${candidate.id}`)
    || candidate.markdown.includes(`/signals/journal/${card.id}`)
  ));
}

export default function JournalIndex({ page, signalId }: { page: SignalCardsPage; signalId: string }) {
  return (
    <main className="journal-index">
      <header className="journal-index__hero">
        <h1>Journal</h1>
        <span>{page.cards.length} articles</span>
      </header>
      <ol>
        {page.cards.map((card) => {
          const translation = translationFor(card, page.cards);
          return (
            <li key={card.id}>
              <Link href={`/signals/${signalId}/${card.id}`}>
                <div className="journal-index__meta">
                  <time>{card.date?.replaceAll('-', '.')}</time>
                  <span>{card.tags?.includes('zh') ? '中文' : 'EN'}</span>
                </div>
                <h2>{card.title}</h2>
                {card.subtitle && <p className="journal-index__subtitle">{card.subtitle}</p>}
                <p className="journal-index__summary">{card.summary}</p>
                <span className="journal-index__open">READ ARTICLE ↗</span>
              </Link>
              {translation && (
                <Link className="journal-index__translation" href={`/signals/${signalId}/${translation.id}`}>
                  ALSO AVAILABLE: {translation.tags?.includes('zh') ? 'ZH' : 'EN'}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
