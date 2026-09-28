'use client';

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

// The home page: the whole site on one cassette, with a pencil in the take-up hub. Turn the pencil
// clockwise to wind forward through the tracks, the other way to wind back; let go and the tape
// plays the track under the head. The model comes from Blender (scripts/blender/cassette.py).
export default function Cassette() {
  const { head, turn, release, skip, palette } = useTape();
  const paletteRef = useRef(palette);
  const shown = useRef<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CassetteScene | null>(null);
  const applyRef = useRef<(da: number) => void>(() => {});
  const [ready, setReady] = useState(false);
  const [turned, setTurned] = useState(false);
  // angle: the pencil around the hub, counter-clockwise on the cassette face.
  const spin = useRef({ angle: 0.45, left: 0, v: 0, last: 0, grab: null as number | null, id: -1 });

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
    applyRef.current = apply;

    (async () => {
      try {
        const { CassetteScene } = await import('./cassette3d');
        if (!alive) return;
        const scene = new CassetteScene(el);
        scene.still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const size = () => scene.resize(el.clientWidth, el.clientHeight);
        size();
        window.addEventListener('resize', size);
        cleanups.push(() => window.removeEventListener('resize', size));
        await scene.load('/models/cassette.glb');
        if (!alive) return scene.dispose();
        sceneRef.current = scene;
        scene.start();
        setReady(true);
      } catch (err) {
        console.error('cassette failed to load', err);
      }
    })();

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
        scene.pencilAngle = s.angle;
        scene.hubAngleR = s.angle;
        scene.hubAngleL = s.left;
        scene.wound = h / TAPE_LENGTH;
        scene.info = { tracks: TRACKS.map((t) => t.label), current: i, count: counter(h) };
        // A different tape chosen on the shelf: eject this one and put that one in.
        const want = paletteRef.current;
        if (shown.current !== want) {
          const look = LOOKS[want] ?? LOOKS.oxide;
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
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cleanups.forEach((f) => f());
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [head, turn, release]);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  const onDown = (e: React.PointerEvent) => {
    const s = spin.current;
    const a = sceneRef.current?.angleAt(e.clientX, e.clientY, true);
    if (a == null) return; // missed the cassette: the field behind gets the touch
    // Tell the field not to gather this touch (TapeProvider checks the flag).
    (e.nativeEvent as unknown as Record<string, boolean>).tapeCassette = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.id = e.pointerId;
    s.grab = a;
    s.v = 0;
    s.last = performance.now();
  };
  const onMove = (e: React.PointerEvent) => {
    const s = spin.current;
    const scene = sceneRef.current;
    if (!scene) return;
    if (e.pointerId !== s.id || s.grab === null) {
      if (e.pointerType === 'mouse') (e.currentTarget as HTMLElement).style.cursor = scene.angleAt(e.clientX, e.clientY, true) == null ? '' : 'grab';
      return;
    }
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
    applyRef.current(da);
    if (!turned && da !== 0) setTurned(true);
  };
  const onUp = (e: React.PointerEvent) => {
    const s = spin.current;
    if (e.pointerId !== s.id) return;
    s.id = -1;
    s.grab = null;
    if (performance.now() - s.last > 80) s.v = 0;
    if (Math.abs(s.v) <= 0.002) release();
  };

  return (
    <div className="cassette">
      <canvas
        ref={canvas}
        className={`cassette-canvas${ready ? ' is-ready' : ''}`}
        data-ready={ready || undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
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
    </div>
  );
}
