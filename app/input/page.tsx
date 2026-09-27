import type { Metadata } from 'next';
import { TapeScene, Worn } from '@/components/tape/parts';
import Rail from '@/components/tape/Rail';
import { getCanon, getLog, groupBy } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'input',
  description: 'Fourteen works that stayed with Marvin Ma, and a running log of what he watches, reads, hears and plays.',
  alternates: { canonical: '/input' },
};

export default function InputPage() {
  const canon = getCanon();
  const log = getLog();
  const months = groupBy(log, (l) => (l.date ?? '').slice(0, 7));
  const marks = [{ id: 'canon', label: '14' }, ...months.map((m) => ({ id: `log-${m.key}`, label: m.key.slice(2).replace('-', '.') }))];
  return (
    <article className="page">
      <TapeScene seed="input" age={0.1} />
      <Rail marks={marks} />
      <header className="page-head">
        <h1>input</h1>
        <p className="lede">Fourteen things that stayed with me, which don’t wear, and a running log of everything else, which does.</p>
      </header>

      <h2 id="canon"><span>stayed with me</span></h2>
      <ol className="canon">
        {canon.map((c) => (
          <li key={c.id}>
            <span className="canon-title">{c.title}</span>
            <span className="canon-by">{c.artist} · {c.medium} · {c.year}</span>
            <q>{c.personalNote}</q>
          </li>
        ))}
      </ol>

      <h2 id="log"><span>the log · {log.length} entries</span></h2>
      {months.map((m) => (
        <div className="year month" id={`log-${m.key}`} key={m.key}>
          <p className="year-label" aria-hidden="true"><Worn text={m.key.replace('-', '.')} date={`${m.key}-15`} /></p>
          <ul className="rows compact">
            {m.items.map((l) => {
              const title = <><Worn text={l.title} date={l.date ?? ''} /> <span className="by">{l.creator}</span></>;
              return (
                <li className="row" key={`${l.date}-${l.title}`}>
                  <span className="date">{(l.date ?? '').slice(8, 10)}</span>
                  <span className="title">{l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer">{title}</a> : title}</span>
                  <span className="kind">{l.type}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </article>
  );
}
