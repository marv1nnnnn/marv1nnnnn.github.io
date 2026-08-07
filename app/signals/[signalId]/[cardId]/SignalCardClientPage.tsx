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
  const isZh = card.tags?.includes('zh');
  const translation = signalId === 'journal' ? cards.find((candidate) => candidate.id !== card.id && (
    card.markdown.includes(`/signals/journal/${candidate.id}`)
    || candidate.markdown.includes(`/signals/journal/${card.id}`)
  )) : undefined;

  return (
    <main className="article">
      <article lang={isZh ? 'zh' : 'en'}>
        <p className="article__meta">
          <span>{signalId === 'journal' ? 'Journal' : 'Project'}</span>
          <time>{card.date?.replaceAll('-', '.')}</time>
          <span>{isZh ? '中文' : 'EN'}</span>
        </p>
        <h1>{card.title}</h1>
        {card.subtitle && <p className="article__sub">{card.subtitle}</p>}
        {translation && (
          <Link className="article__toggle" href={`/signals/journal/${translation.id}`}>
            {translation.tags?.includes('zh') ? '读中文版' : 'Read in English'} ↗
          </Link>
        )}

        <div className="markdown-body">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{card.markdown}</ReactMarkdown>
        </div>
      </article>

      <nav className="article__pager" aria-label="More">
        {previous
          ? <Link href={`/signals/${signalId}/${previous.id}`}><span>Previous</span>{previous.title}</Link>
          : <span />}
        {next
          ? <Link href={`/signals/${signalId}/${next.id}`}><span>Next</span>{next.title}</Link>
          : <span />}
      </nav>
    </main>
  );
}
