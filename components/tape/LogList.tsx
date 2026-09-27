'use client';

import { useMemo, useState } from 'react';
import type { SignalListItem } from '@/types/scanner';
import { Worn } from './parts';

const ORDER = ['music', 'video', 'text', 'game', 'live'];
const LABEL: Record<string, string> = { music: 'heard', video: 'watched', text: 'read', game: 'played', live: 'live' };

// The log as a filterable tape: pick a kind and the months close up around what is left.
export default function LogList({ items }: { items: SignalListItem[] }) {
  const [kind, setKind] = useState('all');
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.type] = (c[i.type] ?? 0) + 1;
    return c;
  }, [items]);
  const kinds = [...ORDER.filter((k) => counts[k]), ...Object.keys(counts).filter((k) => !ORDER.includes(k))];

  const months = useMemo(() => {
    const out: { key: string; items: SignalListItem[] }[] = [];
    for (const i of items) {
      if (kind !== 'all' && i.type !== kind) continue;
      const key = (i.date ?? '').slice(0, 7);
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(i);
      else out.push({ key, items: [i] });
    }
    return out;
  }, [items, kind]);

  return (
    <>
      <div className="log-filter" role="group" aria-label="Filter by kind">
        {['all', ...kinds].map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k === 'all' ? 'all' : LABEL[k] ?? k} <span>{k === 'all' ? items.length : counts[k]}</span>
          </button>
        ))}
      </div>
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
                  <span className="kind">{LABEL[l.type] ?? l.type}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
