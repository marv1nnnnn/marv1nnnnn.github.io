import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { SignalCardContent } from '@/types/scanner';
import Booklet from './Booklet';
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
  const label = [kind, date && dayOf(date), `${readingMinutes(card.markdown)} min read`].filter(Boolean).join(' · ');
  const path = `/${section}/${card.id}`;
  return (
    <Booklet path={path} label={`make · ${section === 'think' ? 'words' : kind ?? 'notes'}`} className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TapeScene seed={`${back}:${card.id}`} date={date || undefined} />
      <header className="essay-head" lang={card.tags?.includes('zh') ? 'zh' : 'en'}>
        <p className="tape-label">{label}</p>
        <h1 data-anchor>{date ? <Worn text={card.title} date={date} /> : card.title}</h1>
        {(card.subtitle || card.summary) && <p className="sub">{card.subtitle || card.summary}</p>}
        <p className="credit-line">words by marv1nnnnn</p>
      </header>
      <div className="prose" lang={card.tags?.includes('zh') ? 'zh' : 'en'}>
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{card.markdown}</ReactMarkdown>
      </div>
      <Link className="back" href={back}>← {backLabel}</Link>
    </Booklet>
  );
}
