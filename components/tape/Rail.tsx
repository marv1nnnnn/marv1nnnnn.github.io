'use client';

import { useEffect, useRef, useState } from 'react';

interface Mark { id: string; label: string }

// The tape spine: a tick per group at its position in the page, and a playhead for the scroll position.
export default function Rail({ marks }: { marks: Mark[] }) {
  const [pos, setPos] = useState<Record<string, number>>({});
  const head = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const measure = () => {
      const total = document.documentElement.scrollHeight;
      const next: Record<string, number> = {};
      for (const m of marks) {
        const el = document.getElementById(m.id);
        if (el) next[m.id] = (el.getBoundingClientRect().top + window.scrollY) / total;
      }
      setPos(next);
    };
    const track = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const k = max > 0 ? window.scrollY / max : 0;
      if (head.current) head.current.style.top = `${(k * 100).toFixed(2)}%`;
    };
    measure();
    track();
    const onResize = () => { measure(); track(); };
    window.addEventListener('scroll', track, { passive: true });
    window.addEventListener('resize', onResize);
    const late = window.setTimeout(onResize, 600);
    return () => {
      window.removeEventListener('scroll', track);
      window.removeEventListener('resize', onResize);
      clearTimeout(late);
    };
  }, [marks]);

  return (
    <nav className="rail" aria-label="On this page">
      <span className="rail-line" aria-hidden="true" />
      <span className="rail-head" ref={head} aria-hidden="true" />
      {marks.map((m) => (
        <a key={m.id} href={`#${m.id}`} className="rail-mark" style={{ top: `${((pos[m.id] ?? 0) * 100).toFixed(2)}%` }}>
          {m.label}
        </a>
      ))}
    </nav>
  );
}
