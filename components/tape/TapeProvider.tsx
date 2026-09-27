'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_PALETTE, PALETTES, Tape, type Scene } from './engine';

interface TapeControls {
  setScene: (scene: Scene) => void;
  newTape: () => void;
}

const TapeContext = createContext<TapeControls | null>(null);

export function useTape() {
  const ctx = useContext(TapeContext);
  if (!ctx) throw new Error('useTape must be used inside TapeProvider');
  return ctx;
}

// Order of the sections on the tape: moving right fast-forwards, moving left rewinds.
const ORDER = ['', 'make', 'think', 'input', 'about'];
function position(path: string) {
  const parts = path.split('/').filter(Boolean);
  const top = ORDER.indexOf(parts[0] ?? '');
  return (top < 0 ? 0 : top) + (parts.length > 1 ? 0.5 : 0);
}

// Pointer contact with readable content should not gather the lines.
const READING = 'a, button, input, .prose, .rows, .canon, .about-body';

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function applyPaletteVars(name: string) {
  const p = PALETTES[name] ?? PALETTES[DEFAULT_PALETTE];
  const style = document.documentElement.style;
  style.setProperty('--bg', `rgb(${p.bg})`);
  style.setProperty('--bg-rgb', p.bg.join(', '));
  style.setProperty('--ink', p.ink);
  style.setProperty('--ink-rgb', hexToRgb(p.ink));
  style.setProperty('--muted', p.muted);
  style.setProperty('--faint', p.faint);
  style.setProperty('--accent', `rgb(${p.hot})`);
  style.setProperty('--accent-rgb', p.hot.join(', '));
}

export default function TapeProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tapeRef = useRef<Tape | null>(null);
  const reducedRef = useRef(false);
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const paletteRef = useRef(DEFAULT_PALETTE);

  const updateObstacle = useCallback(() => {
    const tape = tapeRef.current;
    if (!tape) return;
    const el = document.querySelector('[data-anchor]');
    if (!el) {
      tape.obstacle = null;
      return;
    }
    const r = el.getBoundingClientRect();
    tape.obstacle = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, hw: r.width / 2 + 40, hh: r.height / 2 + 40 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tape = new Tape(canvas);
    tapeRef.current = tape;
    reducedRef.current = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let saved = DEFAULT_PALETTE;
    try {
      const stored = localStorage.getItem('tape-palette');
      if (stored && PALETTES[stored]) saved = stored;
    } catch {}
    tape.palette = PALETTES[saved];
    applyPaletteVars(saved);
    paletteRef.current = saved;
    tape.resize();

    let raf = 0;
    const run = () => {
      tape.frame();
      raf = requestAnimationFrame(run);
    };
    if (reducedRef.current) for (let i = 0; i < 400; i++) tape.frame();
    else raf = requestAnimationFrame(run);

    let lastTap = { t: 0, x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      const reading = !!(e.target as Element | null)?.closest?.(READING);
      tape.pointerDown(e.pointerId, e.clientX, e.clientY, !reading);
      if (!reading && tape.scene.home) {
        const now = performance.now();
        if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) {
          tape.erase(e.clientY);
          lastTap.t = 0;
        } else {
          lastTap = { t: now, x: e.clientX, y: e.clientY };
        }
      }
    };
    const onMove = (e: PointerEvent) => {
      tape.pointerMove(e.pointerId, e.clientX, e.clientY);
      if (reducedRef.current) {
        tape.frame();
        tape.frame();
      }
    };
    const onUp = (e: PointerEvent) => tape.pointerUp(e.pointerId, e.pointerType !== 'mouse');
    const onLeave = () => tape.forgetIdle();
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        tape.resize();
        updateObstacle();
      }, 150);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reducedRef.current) raf = requestAnimationFrame(run);
    };

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('scroll', updateObstacle, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('scroll', updateObstacle);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [updateObstacle]);

  useEffect(() => {
    const prev = lastPath.current;
    lastPath.current = pathname;
    const tape = tapeRef.current;
    if (!tape || prev === null || prev === pathname || reducedRef.current) return;
    tape.seek(position(pathname) >= position(prev) ? -1 : 1);
  }, [pathname]);

  const setScene = useCallback((scene: Scene) => {
    document.body.classList.toggle('is-home', scene.home);
    const tape = tapeRef.current;
    if (!tape) return;
    tape.setScene(scene);
    requestAnimationFrame(updateObstacle);
    if (reducedRef.current) for (let i = 0; i < 400; i++) tape.frame();
  }, [updateObstacle]);

  // A new tape is a random palette (never the current one) and a fresh field. The choice is
  // remembered so the rest of the site plays on the same tape.
  const newTape = useCallback(() => {
    const names = Object.keys(PALETTES).filter((n) => n !== paletteRef.current);
    const name = names[Math.floor(Math.random() * names.length)];
    paletteRef.current = name;
    applyPaletteVars(name);
    tapeRef.current?.setPalette(PALETTES[name]);
    tapeRef.current?.reseed(`home-${Math.random()}`);
    try {
      localStorage.setItem('tape-palette', name);
    } catch {}
  }, []);

  const value = useMemo(() => ({ setScene, newTape }), [setScene, newTape]);

  return (
    <TapeContext.Provider value={value}>
      <canvas ref={canvasRef} className="tape-canvas" aria-hidden="true" />
      {children}
    </TapeContext.Provider>
  );
}
