import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { SignalCardContent } from '@/types/scanner';
import { TapeScene, Worn } from './parts';
import { dayOf, readingMinutes } from '@/lib/tape';

export default function Article({ card, back, backLabel, section, kind }: {
  card: SignalCardContent;
  back: string;
  backLabel: string;
  section: string;
  kind?: string;
}) {
  const date = card.date ?? '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: card.title,
    description: card.summary,
    datePublished: card.date,
    author: { '@type': 'Person', name: 'Marvin Ma' },
    keywords: card.tags?.join(', '),
  };
  const label = [section, kind, date && dayOf(date), `${readingMinutes(card.markdown)} min read`].filter(Boolean).join(' · ');
  return (
    <article className="page article" lang={card.tags?.includes('zh') ? 'zh' : 'en'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TapeScene seed={`${back}:${card.id}`} date={date || undefined} />
      <header className="essay-head">
        <p className="tape-label">{label}</p>
        <h1 data-anchor>{date ? <Worn text={card.title} date={date} /> : card.title}</h1>
        {(card.subtitle || card.summary) && <p className="sub">{card.subtitle || card.summary}</p>}
      </header>
      <div className="prose">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{card.markdown}</ReactMarkdown>
      </div>
      <Link className="back" href={back}>← {backLabel}</Link>
    </article>
  );
}
