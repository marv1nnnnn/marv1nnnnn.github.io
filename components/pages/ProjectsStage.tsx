import Link from 'next/link';
import Field from '@/components/Field';
import { decay, yearsToPoints } from '@/lib/decay';
import type { SignalCardContent, SignalCardsPage } from '@/types/scanner';

function mediaFrom(card: SignalCardContent) {
  return card.markdown.match(/<img[^>]+src=["']([^"']+)/i)?.[1]
    ?? card.markdown.match(/!\[[^\]]*\]\(([^)\s]+)/)?.[1];
}

export default function ProjectsStage({ page, signalId, title }: { page: SignalCardsPage; signalId: string; title: string }) {
  const cards = [...page.cards].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const dates = cards.map((card) => card.date ?? '');
  const points = yearsToPoints(dates);

  return (
    <main className="page">
      <h1 className="page__title">{title}</h1>
      <Field
        points={points}
        from={dates[dates.length - 1]?.slice(0, 7).replace('-', '.') ?? ''}
        to={dates[0]?.slice(0, 7).replace('-', '.') ?? ''}
        count={`${cards.length} built`}
      />

      <ol className="rows">
        {cards.map((card, index) => {
          const media = mediaFrom(card);
          return (
            <li key={card.id} style={{ ...decay(card.date), '--i': index } as React.CSSProperties} className="stagger">
              <Link href={`/signals/${signalId}/${card.id}`}>
                <span className="rows__n">{String(index + 1).padStart(2, '0')}</span>
                <h2>{card.title}</h2>
                {card.subtitle && <p className="rows__sub">{card.subtitle}</p>}
                <span className="rows__meta">{card.date?.replaceAll('-', '.')}</span>
                <span className="rows__go">OPEN ↗</span>
                {media && <img className="rows__media" src={media} alt="" loading="lazy" />}
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
