'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HOME_SCENE, PAGE_SCENE, hash, rng, wearOf } from './engine';
import { useTape } from './TapeProvider';

// Sets the tape parameters for the page it is rendered on.
export function TapeScene({ seed, date, age, home = false }: { seed: string; date?: string; age?: number; home?: boolean }) {
  const { setScene } = useTape();
  useEffect(() => {
    const base = home ? HOME_SCENE : PAGE_SCENE;
    const wear = date ? wearOf(date) : age ?? base.age;
    setScene({ ...base, seed, age: wear, home });
  }, [seed, date, age, home, setScene]);
  return null;
}

// Older recordings lose signal: fainter, blurred, with dropped characters and a faint echo.
export function Worn({ text, date }: { text: string; date: string }) {
  const [w, setW] = useState(0);
  useEffect(() => setW(wearOf(date)), [date]);
  const r = rng(hash(text));
  const chars = Array.from(text).map((c, i) => (c !== ' ' && r() < w * w * 0.22 ? <span key={i} className="drop">{c}</span> : c));
  return <span className="worn" style={{ '--w': w.toFixed(3) } as React.CSSProperties}>{chars}</span>;
}

export function TopNav() {
  const pathname = usePathname();
  const section = pathname.split('/').filter(Boolean)[0] ?? '';
  const links = ['make', 'think', 'input', 'about'];
  return (
    <header className="top">
      <Link className="mark" href="/">marv1nnnnn</Link>
      <nav aria-label="Site">
        {links.map((l) => (
          <Link key={l} href={`/${l}`} aria-current={section === l ? 'page' : undefined}>{l}</Link>
        ))}
      </nav>
    </header>
  );
}

export function HomeControls() {
  const { newTape } = useTape();
  return <button type="button" className="regen" onClick={newTape}>new tape ↻</button>;
}
