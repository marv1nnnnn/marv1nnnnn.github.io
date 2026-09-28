import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { SignalCardContent } from '@/types/scanner';
import Booklet from './Booklet';
import { TapeScene, Worn } from './parts';
import { dayOf, readingMinutes } from '@/lib/tape';

// Markdown split into its top-level blocks (paragraphs, headings, lists, code), so the booklet can
// lay them out page by page. Fenced code stays whole.
function chunks(markdown: string) {
  const out: string[] = [];
  let cur: string[] = [];
  let fence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (!fence && line.trim() === '') {
      if (cur.length) out.push(cur.join('\n'));
      cur = [];
    } else cur.push(line);
  }
  if (cur.length) out.push(cur.join('\n'));
  return out;
}

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
  const lang = card.tags?.includes('zh') ? 'zh' : 'en';
  const parts = chunks(card.markdown);
  let paragraphs = 0;
  return (
    <Booklet
      path={path}
      label={`make · ${section === 'think' ? 'words' : kind ?? 'notes'}`}
      kicker={label}
      title={date ? <Worn text={card.title} date={date} /> : card.title}
      lede={card.subtitle || card.summary}
      className="article"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} key="ld" />
      <TapeScene seed={`${back}:${card.id}`} date={date || undefined} key="scene" />
      {parts.map((md, k) => {
        const heading = /^#{1,6}\s/.test(md);
        const first = !heading && /^[^\s!<>#*\-\d|`]/.test(md) && paragraphs++ === 0;
        return (
          <div className={`prose${heading ? ' keep' : ''}${first ? ' first' : ''}`} lang={lang} key={k}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{md}</ReactMarkdown>
          </div>
        );
      })}
      <p className="back-line" key="back"><Link className="back" href={back}>← {backLabel}</Link></p>
    </Booklet>
  );
}
