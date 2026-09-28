'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DEFAULT_PALETTE, PALETTES, Tape, nightness, type Scene } from './engine';
import type { TapeSound } from './sound';
import Cassette from './Cassette';
import { TAPE_LENGTH, TRACKS, headOf, spanOf, throughOf, trackAt, trackIndex } from './tracks';

export type SoundState = 'off' | 'loading' | 'on';

interface TapeControls {
  setScene: (scene: Scene) => void;
  newTape: (name?: string) => void;
  palette: string;
  sound: SoundState;
  toggleSound: () => void;
  code: string;
  // The tape position, 0..TAPE_LENGTH, read every frame by the deck.
  head: React.MutableRefObject<number>;
  // -1 while fast-forwarding, 1 while rewinding.
  winding: -1 | 0 | 1;
  skip: (direction: -1 | 1) => void;
  turn: (delta: number) => void;
  scan: (direction: -1 | 1) => void;
  release: () => void;
}

const TapeContext = createContext<TapeControls | null>(null);

export function useTape() {
  const ctx = useContext(TapeContext);
  if (!ctx) throw new Error('useTape must be used inside TapeProvider');
  return ctx;
}

// How long a wind takes: longer the further the tape has to travel.
const windTime = (distance: number) => 420 + Math.min(1, Math.abs(distance) / TAPE_LENGTH) * 1400;
const SCAN_SPEED = 280; // counter units per second while fast-forward or rewind is held

// Pointer contact with readable content should not gather the lines.
const READING = 'a, button, input, .top, .sheet';

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

// Browsers (Safari especially) only start audio from inside a user gesture, and the Strudel
// bundle is still downloading after it. So the context is created and woken here, synchronously.
function unlockAudio() {
  const ctx = new AudioContext({ latencyHint: 'playback' });
  ctx.resume();
  const src = ctx.createBufferSource();
  src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  src.connect(ctx.destination);
  src.start();
  return ctx;
}

export default function TapeProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tapeRef = useRef<Tape | null>(null);
  const reducedRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const lastPath = useRef<string | null>(null);
  const head = useRef(0);
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [winding, setWinding] = useState<-1 | 0 | 1>(0);
  const windingRef = useRef<{ dir: -1 | 1; scanning: boolean; frame: number } | null>(null);
  const paletteRef = useRef(DEFAULT_PALETTE);
  const soundRef = useRef<TapeSound | null>(null);
  const [sound, setSound] = useState<SoundState>('off');
  const soundStateRef = useRef<SoundState>('off');
  const [code, setCode] = useState('');

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
    setPalette(saved);
    tape.resize();
    tape.onEvent = (e) => soundRef.current?.event(e);

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
      const s = soundRef.current;
      if (s && soundStateRef.current === 'on') {
        if (document.hidden) s.pause();
        else s.resume();
      }
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

  const setWind = useCallback((dir: -1 | 0 | 1) => {
    setWinding(dir);
    if (dir) document.body.dataset.wind = dir < 0 ? 'ff' : 'rew';
    else delete document.body.dataset.wind;
  }, []);

  // Reading down a page plays through its track.
  const through = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }, []);
  // Set while the pencil turns inside the page's own stretch of tape: the page follows the head,
  // not the other way round.
  const scrubbing = useRef(false);
  const scrollTo = useCallback((path: string, at: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 0) window.scrollTo({ top: throughOf(path, at) * max, behavior: 'instant' as ScrollBehavior });
  }, []);
  useEffect(() => {
    const onScroll = () => {
      if (!windingRef.current && !scrubbing.current) head.current = headOf(pathname, through());
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname, through]);

  // Every page change winds the tape from where it was to where the new page sits.
  useEffect(() => {
    const prev = lastPath.current;
    lastPath.current = pathname;
    const to = headOf(pathname);
    const w = windingRef.current;
    if (w) cancelAnimationFrame(w.frame);
    const tape = tapeRef.current;
    if (!tape || prev === null || prev === pathname || reducedRef.current) {
      windingRef.current = null;
      head.current = to;
      if (w?.scanning) tape?.land();
      setWind(0);
      return;
    }
    const from = head.current;
    const dir = to >= from ? -1 : 1;
    // After a held scan the tape is already close: only the landing is left.
    const duration = w?.scanning ? 360 : windTime(to - from);
    tape.seek(dir, duration);
    setWind(dir);
    const t0 = performance.now();
    const state = { dir, scanning: false, frame: 0 } as { dir: -1 | 1; scanning: boolean; frame: number };
    windingRef.current = state;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / duration);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      head.current = from + (to - from) * e;
      if (k < 1) state.frame = requestAnimationFrame(tick);
      else {
        windingRef.current = null;
        head.current = headOf(pathname, through());
        setWind(0);
      }
    };
    state.frame = requestAnimationFrame(tick);
  }, [pathname, setWind, through]);

  // Next or previous track.
  const skip = useCallback((direction: -1 | 1) => {
    const i = trackIndex(pathname) + (direction < 0 ? 1 : -1);
    if (i >= 0 && i < TRACKS.length) router.push(TRACKS[i].path);
  }, [pathname, router]);

  // Holding fast-forward or rewind runs the tape until it is let go, then plays the track under the head.
  const scan = useCallback((direction: -1 | 1) => {
    const tape = tapeRef.current;
    if (!tape || reducedRef.current) return skip(direction);
    const prev = windingRef.current;
    if (prev) cancelAnimationFrame(prev.frame);
    const state = { dir: direction, scanning: true, frame: 0 } as { dir: -1 | 1; scanning: boolean; frame: number };
    windingRef.current = state;
    tape.scan(direction);
    setWind(direction);
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const step = ((now - last) / 1000) * SCAN_SPEED * (direction < 0 ? 1 : -1);
      last = now;
      head.current = Math.max(0, Math.min(TAPE_LENGTH - 1, head.current + step));
      state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
  }, [setWind, skip]);

  // Winding by hand with the pencil; positive runs the tape forward. Inside the page's own stretch
  // it is just playing: the page scrolls with the head and the music carries on. Past either end
  // the tape winds (music off the head, spool on) until the pencil is let go.
  const turn = useCallback((delta: number) => {
    const tape = tapeRef.current;
    const next = Math.max(0, Math.min(TAPE_LENGTH - 1, head.current + delta));
    if (!tape || next === head.current) return;
    const [lo, hi] = spanOf(pathname);
    const state = windingRef.current;
    if (!state?.scanning && next >= lo && next <= hi) {
      scrubbing.current = true;
      head.current = next;
      scrollTo(pathname, next);
      return;
    }
    const dir: -1 | 1 = delta > 0 ? -1 : 1;
    if (!state?.scanning || state.dir !== dir) {
      if (state) cancelAnimationFrame(state.frame);
      windingRef.current = { dir, scanning: true, frame: 0 };
      tape.scan(dir);
      setWind(dir);
    }
    head.current = next;
  }, [pathname, scrollTo, setWind]);

  // Letting go: inside the page's stretch the page plays from there; anywhere else, the track
  // under the head plays from its start.
  const release = useCallback(() => {
    const state = windingRef.current;
    if (!state?.scanning) {
      scrubbing.current = false;
      return;
    }
    cancelAnimationFrame(state.frame);
    const [lo, hi] = spanOf(pathname);
    const h = head.current;
    if (h < lo || h > hi) {
      const landed = trackAt(h);
      scrubbing.current = false;
      router.push(TRACKS[landed].path);
      return;
    }
    windingRef.current = null;
    tapeRef.current?.land();
    scrollTo(pathname, h);
    scrubbing.current = false;
    setWind(0);
  }, [pathname, router, scrollTo, setWind]);

  const setScene = useCallback((scene: Scene) => {
    document.body.classList.toggle('is-home', scene.home);
    soundRef.current?.scene(scene.home, scene.age);
    const tape = tapeRef.current;
    if (!tape) return;
    tape.setScene(scene);
    requestAnimationFrame(updateObstacle);
    if (reducedRef.current) for (let i = 0; i < 400; i++) tape.frame();
  }, [updateObstacle]);

  // Putting in another tape: its palette, its pattern and a fresh field. The choice is
  // remembered so the rest of the site plays on the same tape.
  const newTape = useCallback((chosen?: string) => {
    const names = Object.keys(PALETTES).filter((n) => n !== paletteRef.current);
    const name = chosen && PALETTES[chosen] ? chosen : names[Math.floor(Math.random() * names.length)];
    if (name === paletteRef.current) return;
    paletteRef.current = name;
    setPalette(name);
    applyPaletteVars(name);
    tapeRef.current?.setPalette(PALETTES[name]);
    tapeRef.current?.reseed(`home-${Math.random()}`);
    try {
      localStorage.setItem('tape-palette', name);
    } catch {}
    const s = soundRef.current;
    if (s && soundStateRef.current === 'on') s.newTape(name).then(() => setCode(s.code));
  }, []);

  const changeSound = useCallback((next: SoundState) => {
    soundStateRef.current = next;
    setSound(next);
  }, []);

  // Sound is off until the visitor asks for it; the Strudel bundle loads only then.
  const toggleSound = useCallback(async () => {
    const state = soundStateRef.current;
    if (state === 'loading') return;
    if (state === 'on') {
      changeSound('off');
      soundRef.current?.pause();
      try {
        localStorage.setItem('tape-sound', 'off');
      } catch {}
      return;
    }
    try {
      localStorage.setItem('tape-sound', 'on');
    } catch {}
    if (soundRef.current) {
      changeSound('on');
      await soundRef.current.resume(paletteRef.current);
      setCode(soundRef.current.code);
      return;
    }
    changeSound('loading');
    const ctx = unlockAudio();
    try {
      const { TapeSound } = await import('./sound');
      const s = await TapeSound.create(ctx, paletteRef.current);
      soundRef.current = s;
      const scene = tapeRef.current?.scene;
      if (scene) s.scene(scene.home, scene.age);
      setCode(s.code);
      if (soundStateRef.current === 'loading') changeSound('on');
    } catch (err) {
      console.error('sound failed to start', err);
      ctx.close();
      changeSound('off');
    }
  }, [changeSound]);

  // While sound is on, the pattern hears the pointer about thirty times a second.
  useEffect(() => {
    if (sound !== 'on') return;
    const id = window.setInterval(() => {
      const tape = tapeRef.current;
      if (tape) soundRef.current?.update(tape.listen(), nightness());
    }, 33);
    return () => clearInterval(id);
  }, [sound]);

  // A visitor who left sound on gets it back at their first touch or key press.
  useEffect(() => {
    let wanted = false;
    try {
      wanted = localStorage.getItem('tape-sound') === 'on';
    } catch {}
    if (!wanted) return;
    const onGesture = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('[data-sound-toggle]')) return;
      remove();
      if (soundStateRef.current === 'off') toggleSound();
    };
    const remove = () => {
      window.removeEventListener('pointerup', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerup', onGesture);
    window.addEventListener('keydown', onGesture);
    return remove;
  }, [toggleSound]);

  const value = useMemo(
    () => ({ setScene, newTape, palette, sound, toggleSound, code, head, winding, skip, turn, scan, release }),
    [setScene, newTape, palette, sound, toggleSound, code, winding, skip, turn, scan, release],
  );

  return (
    <TapeContext.Provider value={value}>
      <canvas ref={canvasRef} className="tape-canvas" aria-hidden="true" />
      {children}
      <Cassette />
    </TapeContext.Provider>
  );
}
