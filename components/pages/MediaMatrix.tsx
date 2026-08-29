'use client';

import { useMemo } from 'react';
import type { SignalListPage } from '@/types/scanner';

const TYPES = ['text', 'video', 'music', 'game', 'live'];

export default function MediaMatrix({ page }: { page: SignalListPage }) {
  const items = useMemo(() => [...page.items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')), [page.items]);
  const categories = TYPES.filter((type) => items.some((item) => item.type === type));

  return (
    <main className="media-matrix">
      <header className="media-matrix__hero">
        <h1>Media</h1>
        <span>{items.length} items</span>
      </header>

      <nav className="media-matrix__types" aria-label="Media types">
        {categories.map((type) => <a key={type} href={`#media-${type}`}>{type}</a>)}
      </nav>

      <div className="media-matrix__desktop" style={{ '--media-columns': categories.length } as React.CSSProperties}>
        <div className="media-matrix__head">
          <span>DATE</span>
          {categories.map((type) => <span key={type} id={`media-${type}`}>{type}</span>)}
        </div>
        {items.map((item, index) => (
          <div className="media-matrix__row" key={`${item.date}-${item.title}-${index}`}>
            <time>{item.date ?? 'No date'}</time>
            {categories.map((type) => (
              <div key={type}>
                {item.type === type && (
                  item.url ? <a href={item.url} target="_blank" rel="noreferrer">
                    <span>{item.creator}</span><strong>{item.title}</strong><i>↗</i>
                  </a> : <p><span>{item.creator}</span><strong>{item.title}</strong></p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <ol className="media-matrix__mobile">
        {items.map((item, index) => (
          <li key={`${item.date}-${item.title}-${index}`}>
            <div><time>{item.date ?? 'No date'}</time><span>{item.type}</span></div>
            {item.url ? <a href={item.url} target="_blank" rel="noreferrer"><small>{item.creator}</small>{item.title} ↗</a> : <p><small>{item.creator}</small>{item.title}</p>}
          </li>
        ))}
      </ol>
    </main>
  );
}
