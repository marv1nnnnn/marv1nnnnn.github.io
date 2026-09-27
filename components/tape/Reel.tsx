'use client';

import { useEffect, useRef, useState } from 'react';
import type { VinylRecord } from '@/types/scanner';

// The canon wound on a reel: covers sit along a spiral tunnel and scrolling winds the camera
// through it. The cover nearest the viewer is "under the read head" and its note is shown.
const SPACING = 900;

export default function Reel({ records }: { records: VinylRecord[] }) {
  const section = useRef<HTMLElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  const intro = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  // Images that failed before hydration never fire onError; catch them once after mount.
  useEffect(() => {
    const failed: Record<string, boolean> = {};
    items.current.forEach((node, i) => {
      const img = node?.querySelector('img');
      if (img && img.complete && img.naturalWidth === 0) failed[records[i].id] = true;
    });
    if (Object.keys(failed).length) setBroken((b) => ({ ...b, ...failed }));
  }, [records]);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let raf = 0;
    let px = 0, py = 0, tx = 0, ty = 0;
    let current = -1;

    const render = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const progress = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      const cam = progress * (records.length - 1) * SPACING + SPACING * 0.7;
      const R = Math.min(window.innerWidth, window.innerHeight) * 0.26;
      px += (tx - px) * 0.12;
      py += (ty - py) * 0.12;

      let nearest = 0, best = Infinity;
      records.forEach((_, i) => {
        const node = items.current[i];
        if (!node) return;
        const z = -i * SPACING - SPACING * 0.7 + cam;
        const angle = i * 0.95 + cam * 0.00035;
        const x = Math.cos(angle) * R + px * (1 - z / -8000) * 60;
        const y = Math.sin(angle) * R * 0.78 + py * (1 - z / -8000) * 40;
        const tilt = Math.sin(angle) * 8;
        const fadeNear = z > 150 ? Math.max(0, 1 - (z - 150) / 450) : 1;
        const fadeFar = Math.max(0, Math.min(1, 1 + z / 7200));
        node.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
        node.style.opacity = (fadeNear * fadeFar).toFixed(3);
        node.style.visibility = fadeNear * fadeFar < 0.01 ? 'hidden' : 'visible';
        const d = Math.abs(z + 120);
        if (d < best) { best = d; nearest = i; }
      });
      if (intro.current) intro.current.style.opacity = String(Math.max(0, 1 - progress * 12));
      if (nearest !== current) {
        current = nearest;
        setActive(nearest);
      }
      if (Math.abs(tx - px) > 0.001 || Math.abs(ty - py) > 0.001) raf = requestAnimationFrame(render);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };
    const onPointer = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      schedule();
    };

    render();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [records]);

  const r = records[active];
  return (
    <section className="reel" ref={section} style={{ height: `${records.length * 55 + 100}vh` }} aria-hidden="true">
      <div className="reel-stage">
        <div className="reel-intro" ref={intro}>
          <p className="reel-word">input</p>
          <p className="lede">Fourteen things that stayed with me. These don’t wear.</p>
        </div>
        {records.map((rec, i) => (
          <figure
            key={rec.id}
            className={`reel-item${i === active ? ' is-active' : ''}`}
            ref={(node) => { items.current[i] = node; }}
          >
            {rec.image_url && !broken[rec.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rec.image_url}
                alt=""
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
                onError={() => setBroken((b) => ({ ...b, [rec.id]: true }))}
              />
            ) : (
              <span className="reel-blank">{rec.title}</span>
            )}
            <figcaption>{String(i + 1).padStart(2, '0')} · {rec.year}</figcaption>
          </figure>
        ))}
        {r && (
          <div className="reel-head" key={r.id}>
            <span className="reel-count">{String(active + 1).padStart(2, '0')} / {records.length}</span>
            <span className="reel-title">{r.title}</span>
            <span className="reel-by">{r.artist} · {r.medium} · {r.year}</span>
            <q>{r.personalNote}</q>
          </div>
        )}
      </div>
    </section>
  );
}
