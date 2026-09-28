'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTape } from './TapeProvider';
import { TAPE_LENGTH, TRACKS, counter, trackAt } from './tracks';
import type { CassetteScene } from './cassette3d';
import { LOOKS } from './tapes';

// Counter units per radian of the pencil: a full turn winds about 190, a little more than half a track.
const PER_RADIAN = 30;
const PACK_MIN = 0.8;
const PACK_MAX = 2.4;
const n = (i: number) => String(i + 1).padStart(2, '0');
const radius = (share: number) => Math.sqrt(PACK_MIN ** 2 + share * (PACK_MAX ** 2 - PACK_MIN ** 2));

// The cassette, on every page. On the home page it lies in the middle with a pencil in the take-up
// hub; on any other page it sits docked in the top bar (in the `.deck-dock` slot). Either way the
// pencil winds the tape: inside the page it scrolls the page, past its ends it winds to another
// track. A tap on the docked cassette goes back home. The model comes from Blender
// (scripts/blender/cassette.py); the scene is loaded after first paint.
export default function Cassette() {
  const { head, turn, release, skip, palette } = useTape();
  const pathname = usePathname();
  const router = useRouter();
  const home = pathname === '/';
  const canvas = useRef<HTMLCanvasElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CassetteScene | null>(null);
  const homeRef = useRef(home);
  const paletteRef = useRef(palette);
  const shown = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [turned, setTurned] = useState(false);
  // angle: the pencil around the hub, counter-clockwise on the cassette face.
  const spin = useRef({ angle: 0.45, left: 0, v: 0, last: 0, grab: null as number | null, id: -1, travel: 0, since: 0 });

  homeRef.current = home;
  paletteRef.current = palette;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let alive = true;
    let raf = 0;
    const cleanups: (() => void)[] = [];
    const s = spin.current;

    // One step of the pencil: the take-up hub turns with it, the supply hub at its own radius.
    // Clockwise (a falling angle) runs the tape forward.
    const apply = (da: number) => {
      const before = head.current;
      turn(-da * PER_RADIAN);
      const moved = -(head.current - before) / PER_RADIAN;
      if (!moved) {
        s.v = 0;
        return;
      }
      const p = head.current / TAPE_LENGTH;
      s.angle += moved;
      s.left += (moved * radius(p)) / radius(1 - p);
    };

    (async () => {
      try {
        // On the home page the cassette is the page, so it loads at once. Anywhere else it is only
        // the docked deck: let the page settle first (compiling the shaders can stall a slow machine).
        if (!homeRef.current) {
          await new Promise<void>((done) => {
            const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
            if (w.requestIdleCallback) w.requestIdleCallback(() => done(), { timeout: 2500 });
            else window.setTimeout(done, 1200);
          });
          if (!alive) return;
        }
        const { CassetteScene } = await import('./cassette3d');
        if (!alive) return;
        const scene = new CassetteScene(el);
        scene.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Sized to the canvas (the large viewport), and only when that changes: a phone's address
        // bar coming and going would otherwise clear it mid-scroll.
        let was = '';
        const size = () => {
          const w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight;
          if (`${w}x${h}` === was) return;
          was = `${w}x${h}`;
          scene.resize(w, h);
        };
        size();
        window.addEventListener('resize', size);
        cleanups.push(() => window.removeEventListener('resize', size));
        await scene.load('/models/cassette.glb');
        if (!alive) return scene.dispose();
        sceneRef.current = scene;
        scene.start();
        document.body.classList.add('has-cassette');
        setReady(true);
      } catch (err) {
        console.error('cassette failed to load', err);
      }
    })();

    // The slot in the top bar, while it is showing.
    const dockRect = () => {
      if (homeRef.current) return null;
      const slot = document.querySelector('.deck-dock');
      const r = slot?.getBoundingClientRect();
      return r && r.width > 0 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
    };

    const draw = () => {
      // Let go mid-turn and it coasts, slowing, before the tape lands.
      if (s.id < 0 && Math.abs(s.v) > 0.002) {
        s.v *= 0.93;
        apply(s.v);
        if (Math.abs(s.v) <= 0.002) {
          s.v = 0;
          release();
        }
      }
      const h = head.current;
      const i = trackAt(h);
      const scene = sceneRef.current;
      if (scene) {
        scene.dock = dockRect();
        scene.pencilAngle = s.angle;
        scene.hubAngleR = s.angle;
        scene.hubAngleL = s.left;
        scene.wound = h / TAPE_LENGTH;
        if (scene.info.count !== counter(h) || scene.info.current !== i) {
          scene.info = { tracks: TRACKS.map((t) => t.label), current: i, count: counter(h) };
        }
        // A different tape chosen on the shelf: eject this one and put that one in.
        const want = paletteRef.current;
        if (shown.current !== want) {
          const look = LOOKS[want] ?? LOOKS.haze;
          if (shown.current === null) scene.setLook(look);
          else scene.swap(look);
          shown.current = want;
        }
      }
      slider.current?.setAttribute('aria-valuenow', String(Math.floor(h)));
      slider.current?.setAttribute('aria-valuetext', `${n(i)} ${TRACKS[i].label}`);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // The canvas never takes pointer events itself (it covers the page); instead a touch is
    // claimed here, before anything else sees it, when it lands on the cassette or its pencil.
    let swallowClick = false;
    const grabs = (e: PointerEvent) => {
      const scene = sceneRef.current;
      if (!scene || e.button > 0) return false;
      const d = scene.dock;
      const inDock = !!d && e.clientX >= d.x - 6 && e.clientX <= d.x + d.w + 6 && e.clientY >= d.y - 6 && e.clientY <= d.y + d.h + 6;
      // Buttons and links win over the pencil passing above them.
      if (!inDock && (e.target as Element | null)?.closest?.('a, button, input, [role="slider"]')) return false;
      if (homeRef.current) return scene.hitAt(e.clientX, e.clientY) !== null;
      if (inDock) return true;
      // Docked, the pencil sticks out over the page; only a mouse can pick it up there.
      return e.pointerType === 'mouse' && scene.hitAt(e.clientX, e.clientY) === 'pencil';
    };
    const onDown = (e: PointerEvent) => {
      if (!grabs(e)) return;
      const a = sceneRef.current?.angleAt(e.clientX, e.clientY, false);
      if (a == null) return;
      e.preventDefault();
      e.stopPropagation();
      s.id = e.pointerId;
      s.grab = a;
      s.v = 0;
      s.travel = 0;
      s.since = s.last = performance.now();
      document.body.classList.add('is-winding-by-hand');
    };
    const onMove = (e: PointerEvent) => {
      const scene = sceneRef.current;
      if (!scene) return;
      if (e.pointerId !== s.id || s.grab === null) {
        if (e.pointerType === 'mouse') document.body.classList.toggle('over-cassette', grabs(e));
        return;
      }
      e.stopPropagation();
      const a = scene.angleAt(e.clientX, e.clientY, false);
      if (a == null) return;
      let da = a - s.grab;
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      s.grab = a;
      const now = performance.now();
      const dt = Math.max(1, now - s.last);
      s.last = now;
      s.v = s.v * 0.5 + (da / dt) * 16 * 0.5;
      s.travel += Math.abs(da);
      apply(da);
      if (da !== 0) setTurned(true);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== s.id) return;
      e.stopPropagation();
      s.id = -1;
      s.grab = null;
      swallowClick = true;
      window.setTimeout(() => (swallowClick = false), 0);
      document.body.classList.remove('is-winding-by-hand');
      // A tap, not a turn, on the docked cassette: back to the home page.
      if (!homeRef.current && s.travel < 0.08 && performance.now() - s.since < 450) {
        s.v = 0;
        release();
        router.push('/');
        return;
      }
      if (performance.now() - s.last > 80) s.v = 0;
      if (Math.abs(s.v) <= 0.002) release();
    };
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { capture: true };
    window.addEventListener('pointerdown', onDown, opts);
    window.addEventListener('pointermove', onMove, opts);
    window.addEventListener('pointerup', onUp, opts);
    window.addEventListener('pointercancel', onUp, opts);
    window.addEventListener('click', onClick, opts);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
      window.removeEventListener('pointerdown', onDown, opts);
      window.removeEventListener('pointermove', onMove, opts);
      window.removeEventListener('pointerup', onUp, opts);
      window.removeEventListener('pointercancel', onUp, opts);
      window.removeEventListener('click', onClick, opts);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      document.body.classList.remove('has-cassette');
    };
  }, [head, turn, release, router]);

  return (
    <>
      <canvas ref={canvas} className={`cassette-canvas${ready ? ' is-ready' : ''}`} aria-hidden="true" />
      {home && (
        <>
          <div
            ref={slider}
            className="visually-hidden"
            role="slider"
            tabIndex={0}
            aria-label="Wind the tape: turn the pencil, or use the arrow keys"
            aria-valuemin={0}
            aria-valuemax={TAPE_LENGTH - 1}
            aria-valuenow={0}
            aria-valuetext="01 intro"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); skip(-1); }
              else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); skip(1); }
            }}
          />
          <p className={`cassette-hint${ready && !turned ? '' : ' is-gone'}`} aria-hidden="true">turn the pencil ↻ to wind the tape</p>
        </>
      )}
    </>
  );
}
