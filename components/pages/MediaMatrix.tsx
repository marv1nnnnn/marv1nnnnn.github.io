'use client';

import { useMemo, useState } from 'react';
import Field from '@/components/Field';
import { decay, yearsToPoints } from '@/lib/decay';
import type { SignalListItem, SignalListPage } from '@/types/scanner';

const GLYPH: Record<string, string> = { music: '♪', video: '▶', text: '¶', game: '◆', live: '✳' };

export default function MediaMatrix({ page, title }: { page: SignalListPage; title: string }) {
  const [only, setOnly] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...page.items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [page.items],
  );
  const types = useMemo(
    () => Object.keys(GLYPH).filter((type) => sorted.some((item) => item.type === type)),
    [sorted],
  );

  const items = only ? sorted.filter((item) => item.type === only) : sorted;

  const months = useMemo(() => {
    const map = new Map<string, SignalListItem[]>();
    items.forEach((item) => {
      const key = (item.date ?? 'unknown').slice(0, 7);
      (map.get(key) ?? map.set(key, []).get(key)!).push(item);
    });
    return [...map.entries()];
  }, [items]);

  const peak = Math.max(1, ...months.map(([, list]) => list.length));
  const dates = sorted.map((item) => item.date ?? '');

  return (
    <main className="page log">
      <h1 className="page__title">{title}</h1>
      <Field
        points={yearsToPoints(dates)}
        from={dates[dates.length - 1]?.slice(0, 7).replace('-', '.') ?? ''}
        to={dates[0]?.slice(0, 7).replace('-', '.') ?? ''}
        count={`${sorted.length} taken in`}
      />

      <div className="log__filters">
        <button type="button" aria-pressed={only === null} onClick={() => setOnly(null)}>all</button>
        {types.map((type) => (
          <button key={type} type="button" aria-pressed={only === type} onClick={() => setOnly(only === type ? null : type)}>
            {GLYPH[type]} {type}
          </button>
        ))}
      </div>

      {months.map(([month, list]) => (
        <section key={month} style={decay(`${month}-15`)}>
          <h2 className="log__month">
            <span>{month.replace('-', '.')}</span>
            <span className="log__bar" style={{ width: `${(list.length / peak) * 46}%` }} />
            <span>{String(list.length).padStart(2, '0')}</span>
          </h2>
          <ol>
            {list.map((item, index) => {
              const body = (
                <>
                  <span className="log__who">{item.creator}</span>
                  <span className="log__title">{item.title}</span>
                  {item.url && ' ↗'}
                </>
              );
              return (
                <li key={`${item.date}-${item.title}-${index}`}>
                  <span className="log__glyph" aria-hidden="true">{GLYPH[item.type] ?? '·'}</span>
                  <time dateTime={item.date}>{item.date?.slice(5).replace('-', '.')}</time>
                  {item.url
                    ? <a className="log__item" href={item.url} target="_blank" rel="noreferrer">{body}</a>
                    : <span className="log__item">{body}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </main>
  );
}
