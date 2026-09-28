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
  const first = pathname.split('/').filter(Boolean)[0] ?? '';
  // Essays keep their /think/[id] URLs but belong to make.
  const section = first === 'think' ? 'make' : first;
  const links = ['make', 'input', 'log', 'about'];
  return (
    <header className="top">
      <Link className="mark" href="/">marv1nnnnn</Link>
      <div className="top-right">
        <nav aria-label="Site">
          {links.map((l) => (
            <Link key={l} href={`/${l}`} aria-current={section === l ? 'page' : undefined}>{l}</Link>
          ))}
        </nav>
        <SoundToggle />
      </div>
    </header>
  );
}

export function HomeControls() {
  const { newTape } = useTape();
  return <button type="button" className="regen" onClick={newTape}>new tape ↻</button>;
}

// Sound is opt-in. Once it plays, { } shows the Strudel pattern and the values it is reading.
export function SoundToggle() {
  const { sound, toggleSound, code } = useTape();
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState('');
  const shown = open && sound === 'on';
  useEffect(() => {
    if (!shown) return;
    const id = window.setInterval(() => {
      const ear = (window as unknown as { tape?: Record<string, number> }).tape;
      if (ear) setReading(Object.entries(ear).map(([k, v]) => `tape.${k} = ${Number.isInteger(v) ? v : v.toFixed(2)}`).join('\n'));
    }, 100);
    return () => clearInterval(id);
  }, [shown]);
  return (
    <>
      <button type="button" className="sound" data-sound-toggle aria-label="Sound" aria-pressed={sound === 'on'} aria-busy={sound === 'loading'} onClick={toggleSound}>
        ♪<span className="sound-state"> {sound === 'loading' ? '…' : sound}</span>
      </button>
      {sound === 'on' && (
        <button type="button" className="sound sound-code" aria-label="Show the pattern" aria-expanded={open} onClick={() => setOpen(!open)}>{'{ }'}</button>
      )}
      {shown && (
        <pre className="strudel" aria-label="The Strudel pattern playing now">
          {code}
          <span className="strudel-live">{reading}</span>
        </pre>
      )}
    </>
  );
}
