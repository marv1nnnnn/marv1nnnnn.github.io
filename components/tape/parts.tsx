'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HOME_SCENE, PAGE_SCENE, PALETTES, hash, rng, wearOf } from './engine';
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

export function Clock() {
  const [text, setText] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setText(`your time ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · the tape runs brightest at 03:00`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return <span className="clock">{text}</span>;
}

export function PalettePicker() {
  const { palette, setPalette } = useTape();
  return (
    <div className="tapes" role="group" aria-label="Tape colour">
      <span>tape</span>
      {Object.values(PALETTES).map((p) => (
        <button key={p.name} type="button" aria-pressed={p.name === palette} onClick={() => setPalette(p.name)}>
          <i style={{ background: `rgb(${p.hot})`, boxShadow: `-4px 0 0 rgb(${p.line})` }} />
          {p.name}
        </button>
      ))}
    </div>
  );
}

export function HomeControls() {
  const { newTape } = useTape();
  const [coarse, setCoarse] = useState(false);
  const [faded, setFaded] = useState(false);
  useEffect(() => {
    setCoarse(matchMedia('(pointer: coarse)').matches);
    let timer = 0;
    const once = () => {
      timer = window.setTimeout(() => setFaded(true), 2500);
      window.removeEventListener('pointermove', once);
      window.removeEventListener('pointerdown', once);
    };
    window.addEventListener('pointermove', once);
    window.addEventListener('pointerdown', once);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', once);
      window.removeEventListener('pointerdown', once);
    };
  }, []);
  return (
    <div className="side">
      <p className={`hint${faded ? ' faded' : ''}`}>
        {coarse
          ? 'drag to stir · hold to gather · let go to scatter · double-tap to erase a strip'
          : 'move to stir · hold to gather · release to scatter · double-click to erase a strip'}
      </p>
      <p className="clock-line"><Clock /></p>
      <PalettePicker />
      <button type="button" className="regen" onClick={newTape}>new tape ↻</button>
    </div>
  );
}

export function PageFoot() {
  return (
    <footer className="foot">
      <Clock />
      <PalettePicker />
    </footer>
  );
}
