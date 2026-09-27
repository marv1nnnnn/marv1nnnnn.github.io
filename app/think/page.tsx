import type { Metadata } from 'next';
import Link from 'next/link';
import { TapeScene, Worn } from '@/components/tape/parts';
import { dayOf, getEssays, groupBy, readingMinutes } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'think',
  description: 'Essays by Marvin Ma on agents, coding tools and the culture around them.',
  alternates: { canonical: '/think' },
};

export default function ThinkPage() {
  const groups = groupBy(getEssays(), (e) => (e.date ?? '').slice(0, 4));
  return (
    <article className="page">
      <TapeScene seed="think" age={0.05} />
      <header className="page-head">
        <h1>think</h1>
        <p className="lede">Notes from thinking out loud, probably wrong in places.</p>
      </header>
      {groups.map((g) => (
        <div className="year" id={`think-${g.key}`} key={g.key}>
          <p className="year-label" aria-hidden="true"><Worn text={g.key} date={`${g.key}-06-30`} /></p>
          <ul className="essays">
            {g.items.map((e) => (
              <li key={e.id}>
                <Link href={`/think/${e.id}`} className="essay-link">
                  <span className="essay-meta">{dayOf(e.date ?? '')} · {readingMinutes(e.markdown)} min read</span>
                  <span className="essay-title"><Worn text={e.title} date={e.date ?? ''} /></span>
                  <span className="essay-sub">{e.subtitle || e.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}
