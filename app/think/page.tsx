import type { Metadata } from 'next';
import Link from 'next/link';
import { PageFoot, TapeScene, Worn } from '@/components/tape/parts';
import { getEssays, monthOf } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'think',
  description: 'Essays by Marvin Ma on agents, coding tools and the culture around them.',
  alternates: { canonical: '/think' },
};

export default function ThinkPage() {
  const essays = getEssays();
  return (
    <article className="page">
      <TapeScene seed="think" age={0.05} />
      <h1>think</h1>
      <p className="lede">Notes from thinking out loud, probably wrong in places.</p>
      <ul className="rows">
        {essays.map((e) => (
          <li className="row" key={e.id}>
            <span className="date">{monthOf(e.date ?? '')}</span>
            <Link href={`/think/${e.id}`}>
              <span className="title"><Worn text={e.title} date={e.date ?? ''} /></span>
              <span className="sub">{e.subtitle || e.summary}</span>
            </Link>
            <span className="kind">essay</span>
          </li>
        ))}
      </ul>
      <PageFoot />
    </article>
  );
}
