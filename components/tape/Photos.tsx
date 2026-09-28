'use client';

import { useEffect, useRef, useState } from 'react';
import type { VinylRecord } from '@/types/scanner';
import { hash } from './engine';

// The canon as the booklet's photo pages: each work a print stuck on the paper at a slight angle,
// with its number and a note written beside it.
export default function Photos({ records }: { records: VinylRecord[] }) {
  const list = useRef<HTMLOListElement>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  // Images that failed before hydration never fire onError; catch them once after mount.
  useEffect(() => {
    const failed: Record<string, boolean> = {};
    list.current?.querySelectorAll('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.dataset.id) failed[img.dataset.id] = true;
    });
    if (Object.keys(failed).length) setBroken((b) => ({ ...b, ...failed }));
  }, [records]);

  return (
    <ol className="canon" ref={list}>
      {records.map((c, i) => {
        const tilt = ((hash(c.id) % 100) / 100 - 0.5) * 4;
        return (
          <li key={c.id} className="cue" style={{ '--tilt': `${tilt.toFixed(2)}deg` } as React.CSSProperties}>
            <figure className="print">
              {c.image_url && !broken[c.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image_url}
                  alt={`${c.title}, ${c.artist}`}
                  data-id={c.id}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={() => setBroken((b) => ({ ...b, [c.id]: true }))}
                />
              ) : (
                <span className="print-blank" aria-hidden="true">{c.title}</span>
              )}
            </figure>
            <div className="canon-text">
              <span className="canon-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="canon-title">{c.title}</span>
              <span className="canon-by">{c.artist} · {c.medium} · {c.year}</span>
              <q>{c.personalNote}</q>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
