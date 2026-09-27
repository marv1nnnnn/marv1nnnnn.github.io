import type { Metadata } from 'next';
import Link from 'next/link';
import { TapeScene, Worn } from '@/components/tape/parts';
import Rail from '@/components/tape/Rail';
import { getMakes, getShows, groupBy, monthOf } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'make',
  description: 'Tools, talks and workshops by Marvin Ma, and live coding and circuit bending shows in Beijing, 2016–2021.',
  alternates: { canonical: '/make' },
};

const year = (date?: string) => (date ?? '').slice(0, 4);

export default function MakePage() {
  const makes = groupBy(getMakes(), (m) => year(m.date));
  const shows = groupBy(getShows(), (s) => year(s.date));
  const marks = [
    ...makes.map((g) => ({ id: `make-${g.key}`, label: g.key })),
    ...shows.map((g) => ({ id: `noise-${g.key}`, label: g.key })),
  ];
  return (
    <article className="page">
      <TapeScene seed="make" age={0.35} />
      <Rail marks={marks} />
      <header className="page-head">
        <h1>make</h1>
        <p className="lede">Tools, talks, and five years of noise. Everything is on the same tape; the older a recording, the more it has worn.</p>
      </header>

      <section className="side-a">
        <h2><span>tools and talks</span></h2>
        {makes.map((g) => (
          <div className="year" id={`make-${g.key}`} key={g.key}>
            <p className="year-label" aria-hidden="true"><Worn text={g.key} date={`${g.key}-06-30`} /></p>
            <ul className="rows">
              {g.items.map((m) => (
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
          </div>
        ))}
      </section>

      <section className="side-b">
        <h2 id="noise"><span>noise · Beijing 2016–2021</span></h2>
        {shows.map((g) => (
          <div className="year" id={`noise-${g.key}`} key={g.key}>
            <p className="year-label" aria-hidden="true"><Worn text={g.key} date={`${g.key}-06-30`} /></p>
            <ul className="rows">
              {g.items.map((s) => {
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
          </div>
        ))}
      </section>
    </article>
  );
}
