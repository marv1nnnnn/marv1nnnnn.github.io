import type { Metadata } from 'next';
import { PageFoot, TapeScene, Worn } from '@/components/tape/parts';
import { getCanon, getLog } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'input',
  description: 'Fourteen works that stayed with Marvin Ma, and a running log of what he watches, reads, hears and plays.',
  alternates: { canonical: '/input' },
};

export default function InputPage() {
  const canon = getCanon();
  const log = getLog();
  return (
    <article className="page">
      <TapeScene seed="input" age={0.1} />
      <h1>input</h1>
      <p className="lede">Fourteen things that stayed with me, which don’t wear, and a running log of everything else, which does.</p>

      <h2>stayed with me</h2>
      <div className="canon">
        {canon.map((c) => (
          <div key={c.id}>
            <span className="t">{c.artist}, <em>{c.title}</em></span> <span className="m">{c.medium} · {c.year}</span>
            <q>{c.personalNote}</q>
          </div>
        ))}
      </div>

      <h2 id="log">the log · {log.length} entries</h2>
      <ul className="rows compact">
        {log.map((l) => {
          const title = <><Worn text={l.title} date={l.date ?? ''} /> <span className="by">{l.creator}</span></>;
          return (
            <li className="row" key={`${l.date}-${l.title}`}>
              <span className="date">{(l.date ?? '').slice(2).replaceAll('-', '.')}</span>
              <span className="title">{l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer">{title}</a> : title}</span>
              <span className="kind">{l.type}</span>
            </li>
          );
        })}
      </ul>
      <PageFoot />
    </article>
  );
}
