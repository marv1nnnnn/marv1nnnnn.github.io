import type { Metadata } from 'next';
import Link from 'next/link';
import { PageFoot, TapeScene, Worn } from '@/components/tape/parts';
import { getMakes, getShows, monthOf } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'make',
  description: 'Tools, talks and workshops by Marvin Ma, and live coding and circuit bending shows in Beijing, 2016–2021.',
  alternates: { canonical: '/make' },
};

export default function MakePage() {
  const makes = getMakes();
  const shows = getShows();
  return (
    <article className="page">
      <TapeScene seed="make" age={0.35} />
      <h1>make</h1>
      <p className="lede">Everything here is on the same tape. The older a recording, the more it has worn.</p>

      <h2>tools and talks</h2>
      <ul className="rows">
        {makes.map((m) => (
          <li className="row" key={m.id}>
            <span className="date">{monthOf(m.date ?? '')}</span>
            <Link href={`/make/${m.id}`}>
              <span className="title"><Worn text={m.title.length > 40 ? m.title.split(':')[0] : m.title} date={m.date ?? ''} /></span>
              {m.subtitle && <span className="sub">{m.subtitle}</span>}
            </Link>
            <span className="kind">{m.kind}</span>
          </li>
        ))}
      </ul>

      <h2 id="noise">noise · Beijing 2016–2021</h2>
      <ul className="rows">
        {shows.map((s) => {
          const body = (
            <>
              <span className="title"><Worn text={s.title} date={s.date} /></span>
              <span className="sub"><Worn text={s.venue} date={s.date} /></span>
            </>
          );
          return (
            <li className="row" key={s.date + s.title}>
              <span className="date">{monthOf(s.date)}</span>
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{body}</a> : <span>{body}</span>}
              <span className="kind">show</span>
            </li>
          );
        })}
      </ul>
      <PageFoot />
    </article>
  );
}
