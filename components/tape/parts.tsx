'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Deck from './Deck';
import { HOME_SCENE, PAGE_SCENE, hash, rng, wearOf } from './engine';
import { useTape } from './TapeProvider';
import { LOOKS } from './tapes';

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
  return (
    <header className="top">
      <Link className="mark" href="/">marv1nnnnn</Link>
      <Deck />
    </header>
  );
}

// The tape shelf: every tape as a case spine. The one in the deck is pulled out; pick another to
// eject the cassette and put that one in (its look, its palette and its music).
export function HomeControls() {
  const { newTape, palette } = useTape();
  return (
    <div className="shelf" role="group" aria-label="Tapes">
      {Object.values(LOOKS).map((t) => (
        <button
          key={t.name}
          type="button"
          className="spine"
          aria-pressed={palette === t.name}
          aria-label={`${t.name} tape: ${t.mood}, after ${t.after}`}
          style={{ '--shell': t.shell, '--paper': t.paper, '--ink': t.ink, '--stripe': t.stripe } as React.CSSProperties}
          onClick={() => newTape(t.name)}
        >
          <span className="spine-label">
            <b>{t.name}</b>
            <span>{t.mood}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
