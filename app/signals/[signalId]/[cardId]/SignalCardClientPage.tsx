'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { Signal, SignalCardContent } from '@/types/scanner';

export default function SignalCardClientPage({
  signal,
  card,
  signalId,
  cardId,
}: {
  signal: Signal;
  card: SignalCardContent;
  signalId: string;
  cardId: string;
}) {
  const cards = signal.page.type === 'cards' ? signal.page.cards : [];
  const index = cards.findIndex((entry) => entry.id === cardId);
  const previous = cards[index - 1];
  const next = cards[index + 1];
  const translation = signalId === 'journal' ? cards.find((candidate) => candidate.id !== card.id && (
    card.markdown.includes(`/signals/journal/${candidate.id}`)
    || candidate.markdown.includes(`/signals/journal/${card.id}`)
  )) : undefined;

  return (
    <main className="article-page">
      <article lang={card.tags?.includes('zh') ? 'zh' : 'en'}>
        <header className="article-page__header">
          <div className="article-page__meta">
            <span>{signalId === 'journal' ? 'JOURNAL' : 'PROJECT'}</span>
            <time>{card.date?.replaceAll('-', '.')}</time>
          </div>
          <h1>{card.title}</h1>
          {card.subtitle && <p className="article-page__subtitle">{card.subtitle}</p>}
          <p className="article-page__summary">{card.summary}</p>
          <div className="article-page__tags">
            {card.tags?.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          {translation && (
            <Link className="article-page__translation" href={`/signals/journal/${translation.id}`}>
              READ IN {translation.tags?.includes('zh') ? 'CHINESE' : 'ENGLISH'} ↗
            </Link>
          )}
        </header>

        <div className="markdown-body article-page__body">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{card.markdown}</ReactMarkdown>
        </div>
      </article>

      <nav className="article-page__pagination" aria-label="Article navigation">
        {previous ? <Link href={`/signals/${signalId}/${previous.id}`}><span>PREVIOUS</span>{previous.title}</Link> : <span />}
        {next ? <Link href={`/signals/${signalId}/${next.id}`}><span>NEXT</span>{next.title}</Link> : <span />}
      </nav>
    </main>
  );
}
