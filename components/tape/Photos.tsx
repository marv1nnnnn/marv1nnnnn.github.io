'use client';

import { useEffect, useRef, useState } from 'react';
import type { VinylRecord } from '@/types/scanner';
import { hash } from './engine';

// One of the canon as a photo page of the booklet: the print stuck on at a slight angle with a
// strip of tape, its number, and a note written under it.
export default function Photo({ record: c, index }: { record: VinylRecord; index: number }) {
  const img = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);

  // An image that failed before hydration never fires onError; check once after mount.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, []);

  const tilt = ((hash(c.id) % 100) / 100 - 0.5) * 4;
  return (
    <figure className="canon-item" style={{ '--tilt': `${tilt.toFixed(2)}deg` } as React.CSSProperties}>
      <div className="print">
        {c.image_url && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={img} src={c.image_url} alt={`${c.title}, ${c.artist}`} loading={index < 4 ? 'eager' : 'lazy'} decoding="async" onError={() => setBroken(true)} />
        ) : (
          <span className="print-blank" aria-hidden="true">{c.title}</span>
        )}
      </div>
      <figcaption className="canon-text">
        <span className="canon-no">{String(index + 1).padStart(2, '0')}</span>
        <span className="canon-title">{c.title}</span>
        <span className="canon-by">{c.artist} · {c.medium} · {c.year}</span>
        <q>{c.personalNote}</q>
      </figcaption>
    </figure>
  );
}
