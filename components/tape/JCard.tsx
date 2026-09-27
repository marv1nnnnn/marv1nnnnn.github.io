'use client';

import { useEffect, useRef, useState } from 'react';
import { hash, makeNoise, rng } from './engine';

interface Props {
  name: string;
  handle: string;
  role: string;
  sideA: string[];
  sideB: string[];
}

// Cover art: the same kind of field as the site's tape, drawn once, small, in the current palette.
function paint(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink-rgb').trim() || '196, 206, 216';
  const accent = css.getPropertyValue('--accent-rgb').trim() || '108, 224, 255';
  const rand = rng(hash('marv1nnnnn'));
  const noise = makeNoise(rand);
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 900; i++) {
    let x = rand() * W, y = rand() * H;
    const hot = rand() < 0.06;
    ctx.strokeStyle = hot ? `rgba(${accent}, 0.55)` : `rgba(${ink}, ${0.05 + rand() * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 40; s++) {
      const a = noise(x * 0.006, y * 0.006, 0.3) * Math.PI * 3;
      x += Math.cos(a) * 2.2;
      y += Math.sin(a) * 2.2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// About as a cassette J-card: the cover, the spine and the flap unfold out from a folded case;
// the pointer tilts it. On phones the three panels simply stack.
export default function JCard({ name, handle, role, sideA, sideB }: Props) {
  const card = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (art.current) paint(art.current);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setOpen(true), still ? 0 : 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = card.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, tx = 0, ty = 0, px = 0, py = 0;
    const tick = () => {
      px += (tx - px) * 0.08;
      py += (ty - py) * 0.08;
      el.style.setProperty('--rx', `${(-py * 8).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
      raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className={`jcard${open ? ' is-open' : ''}`}>
      <div className="jcard-body" ref={card}>
        <section className="jcard-cover">
          <canvas ref={art} className="jcard-art" aria-hidden="true" />
          <p className="jcard-handle">{handle}</p>
          <div className="jcard-name">
            <p lang="zh">{name}</p>
            <p className="jcard-role">{role}</p>
          </div>
          <p className="jcard-spec" aria-hidden="true">side a · now&nbsp;&nbsp;/&nbsp;&nbsp;side b · before</p>
        </section>
        <div className="jcard-spine">
          <p aria-hidden="true">{handle} · {name} · about</p>
          <section className="jcard-flap">
            <h2 className="jcard-side">side a · now</h2>
            {sideA.map((p) => <p key={p}>{p}</p>)}
            <h2 className="jcard-side">side b · before</h2>
            <ol>
              {sideB.map((f, i) => <li key={f}><span>b{i + 1}</span>{f}</li>)}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
