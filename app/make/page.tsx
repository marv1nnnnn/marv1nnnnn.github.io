import type { Metadata } from 'next';
import Link from 'next/link';
import Booklet from '@/components/tape/Booklet';
import { TapeScene, Worn } from '@/components/tape/parts';
import { dayOf, getEssays, getMakes, getShows, groupBy, monthOf, readingMinutes } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'make',
  description: 'Essays, tools, talks and workshops by Marvin Ma, and live coding and circuit bending shows in Beijing, 2016–2021.',
  alternates: { canonical: '/make' },
};

const year = (date?: string) => (date ?? '').slice(0, 4);

export default function MakePage() {
  const essays = getEssays();
  const makes = groupBy(getMakes(), (m) => year(m.date));
  const shows = groupBy(getShows(), (s) => year(s.date));
  // One block per line of the booklet: headings and years travel with what follows them.
  return (
    <Booklet path="/make" title="make" lede="Writing, tools, talks, and five years of noise. Everything is on the same tape; the older a recording, the more it has worn.">
      <TapeScene seed="make" age={0.35} />
      <h2 id="writing" className="keep"><span>writing</span></h2>
      {essays.map((e, k) => (
        <div key={e.id} className="song">
          <Link href={`/think/${e.id}`} className="essay-link">
            <span className="essay-meta">a{k + 1} · {dayOf(e.date ?? '')} · {readingMinutes(e.markdown)} min</span>
            <span className="essay-title"><Worn text={e.title} date={e.date ?? ''} /></span>
            <span className="essay-sub">{e.subtitle || e.summary}</span>
          </Link>
        </div>
      ))}

      <h2 id="tools" className="keep"><span>tools and talks</span></h2>
      {makes.flatMap((g) => [
        <p className="year-label keep" key={`y-${g.key}`}><Worn text={g.key} date={`${g.key}-06-30`} /></p>,
        ...g.items.map((m) => (
          <div className="row" key={m.id}>
            <span className="date">{monthOf(m.date ?? '')}</span>
            <Link href={`/make/${m.id}`}>
              <span className="title"><Worn text={m.title.length > 40 ? m.title.split(':')[0] : m.title} date={m.date ?? ''} /></span>
              {m.subtitle && <span className="sub">{m.subtitle}</span>}
            </Link>
            <span className="kind">{m.kind}</span>
          </div>
        )),
      ])}

      <h2 id="noise" className="keep brk"><span>noise · Beijing 2016–2021</span></h2>
      {shows.flatMap((g) => [
        <p className="year-label keep" key={`n-${g.key}`}><Worn text={g.key} date={`${g.key}-06-30`} /></p>,
        ...g.items.map((s) => {
          const body = (
            <>
              <span className="title"><Worn text={s.title} date={s.date} /></span>
              <span className="sub"><Worn text={s.venue} date={s.date} /></span>
            </>
          );
          return (
            <div className="row" key={s.date + s.title}>
              <span className="date">{monthOf(s.date)}</span>
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{body}</a> : <span>{body}</span>}
              <span className="kind">show</span>
            </div>
          );
        }),
      ])}
    </Booklet>
  );
}
