'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTape } from './TapeProvider';
import { TAPE_LENGTH, TRACKS, counter, trackAt, trackIndex } from './tracks';

const n = (i: number) => String(i + 1).padStart(2, '0');
const HOLD_MS = 260;

// The deck in the top bar: a cassette window whose reels follow the tape, the counter, the tracks
// (the site's sections) along a strip with the play head, and the transport.
export default function Deck() {
  const pathname = usePathname();
  const current = trackIndex(pathname);
  const { head, winding, sound, skip, scan, release } = useTape();
  const count = useRef<HTMLSpanElement>(null);
  const cue = useRef<HTMLParagraphElement>(null);
  const cueTrack = useRef<HTMLSpanElement>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLElement>(null);
  const reels = useRef<SVGGElement>(null);
  const playing = sound === 'on';

  useEffect(() => {
    const left = reels.current?.children[0] as SVGGElement | undefined;
    const right = reels.current?.children[1] as SVGGElement | undefined;
    let raf = 0;
    let last = head.current;
    let t = performance.now();
    let aL = 0, aR = 0;
    const draw = () => {
      const now = performance.now();
      const dt = (now - t) / 1000;
      t = now;
      const h = head.current;
      const p = h / TAPE_LENGTH;
      // Tape moves from the left reel to the right one; the fuller reel turns slower.
      const rL = Math.sqrt(16 + (1 - p) * (144 - 16));
      const rR = Math.sqrt(16 + p * (144 - 16));
      const travel = (h - last) * 0.9 + (playing ? dt * 3 : 0);
      last = h;
      aL += (travel / rL) * 57.3;
      aR += (travel / rR) * 57.3;
      for (const [g, r, a] of [[left, rL, aL], [right, rR, aR]] as const) {
        if (!g) continue;
        (g.children[0] as SVGCircleElement).setAttribute('r', r.toFixed(2));
        (g.children[1] as SVGGElement).setAttribute('transform', `rotate(${(a % 360).toFixed(1)})`);
      }
      if (count.current) count.current.textContent = counter(h);
      const i = trackAt(h);
      // Labels keep their width, so the head is placed inside the segment of the track it is on.
      const seg = strip.current?.querySelectorAll<HTMLElement>('.deck-track')[i];
      if (needle.current && seg) {
        const k = Math.min(1, (h - TRACKS[i].start) / TRACKS[i].length);
        needle.current.style.transform = `translateX(${(seg.offsetLeft + k * seg.offsetWidth).toFixed(1)}px)`;
      }
      if (cueTrack.current) cueTrack.current.textContent = `${n(i)} ${TRACKS[i].label}`;
      if (cue.current) cue.current.dataset.track = String(i);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [head, playing]);

  // With nothing focused, the arrow keys turn pages, then skip tracks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      const el = document.activeElement;
      if (el && el !== document.body && !el.closest('.deck')) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      // A booklet on the page turns its pages first; only past its last page does the tape wind on.
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      if (!window.dispatchEvent(new CustomEvent('tape:arrow', { detail: dir, cancelable: true }))) {
        e.preventDefault();
        return;
      }
      skip(dir > 0 ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  return (
    <div className="deck">
      <div className="deck-window" aria-hidden="true">
        {/* The 3D cassette docks into this slot; the drawing below stands in until it has loaded. */}
        <span className="deck-dock">
          <svg viewBox="0 0 80 32" width="80" height="32">
            <rect x="0.5" y="0.5" width="79" height="31" rx="3" className="deck-shell" />
            <path d="M20 29 H60" className="deck-tape" />
            <g ref={reels}>
              {[20, 60].map((cx) => (
                <g key={cx} transform={`translate(${cx} 16)`}>
                  <circle r="8" className="deck-pack" />
                  <g>
                    <circle r="3.6" className="deck-hub" />
                    {[0, 120, 240].map((a) => (
                      <path key={a} d="M0 -1.4 V-3.4" transform={`rotate(${a})`} className="deck-spoke" />
                    ))}
                  </g>
                </g>
              ))}
            </g>
          </svg>
        </span>
        <span className="deck-count" ref={count}>000</span>
      </div>

      <nav aria-label="Site" className="deck-tracks" ref={strip}>
        <span className="deck-needle" ref={needle} aria-hidden="true" />
        {TRACKS.map((t, i) => (
          <Link
            key={t.path}
            href={t.path}
            className="deck-track"
            style={{ flexGrow: t.length }}
            aria-current={current === i ? 'page' : undefined}
          >
            <span className="deck-n" aria-hidden="true">{n(i)}</span> {t.label}
          </Link>
        ))}
      </nav>

      <div className="deck-transport">
        <WindButton direction={1} label="Rewind" disabled={current === 0} skip={skip} scan={scan} release={release}>◀◀</WindButton>
        <PlayButton />
        <WindButton direction={-1} label="Fast forward" disabled={current === TRACKS.length - 1} skip={skip} scan={scan} release={release}>▶▶</WindButton>
      </div>

      {winding !== 0 && (
        <p className="deck-cue" ref={cue} aria-hidden="true">
          <span className="deck-cue-dir">{winding < 0 ? '▶▶' : '◀◀'}</span>
          <span ref={cueTrack} />
        </p>
      )}
    </div>
  );
}

// A tap skips one track; holding winds until it is let go.
function WindButton({ direction, label, disabled, skip, scan, release, children }: {
  direction: -1 | 1;
  label: string;
  disabled: boolean;
  skip: (d: -1 | 1) => void;
  scan: (d: -1 | 1) => void;
  release: () => void;
  children: React.ReactNode;
}) {
  const timer = useRef(0);
  const held = useRef(false);
  const end = () => {
    clearTimeout(timer.current);
    if (held.current) release();
  };
  return (
    <button
      type="button"
      className="deck-button"
      aria-label={label}
      title={`${label} (hold to wind)`}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        held.current = false;
        timer.current = window.setTimeout(() => {
          held.current = true;
          scan(direction);
        }, HOLD_MS);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) held.current = false;
        else skip(direction);
      }}
    >
      {children}
    </button>
  );
}

// Play is the sound. Once it plays, { } shows the Strudel pattern and the values it is reading.
function PlayButton() {
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
      <button
        type="button"
        className="deck-button deck-play"
        data-sound-toggle
        aria-label="Sound"
        aria-pressed={sound === 'on'}
        aria-busy={sound === 'loading'}
        onClick={toggleSound}
      >
        {sound === 'on' ? '■' : '▶'}<span className="sound-state">{sound === 'loading' ? ' …' : sound === 'on' ? ' stop' : ' play'}</span>
      </button>
      {sound === 'on' && (
        <button type="button" className="deck-button sound-code" aria-label="Show the pattern" aria-expanded={open} onClick={() => setOpen(!open)}>{'{ }'}</button>
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
