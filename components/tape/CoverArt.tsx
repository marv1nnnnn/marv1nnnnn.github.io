'use client';

import { useEffect, useRef } from 'react';
import { hash, makeNoise, rng } from './engine';
import { useTape } from './TapeProvider';

// The booklet cover's artwork: lines of force like the filings on the desk, printed once in the
// tape's ink and accent colour. Redrawn when another tape goes in.
export default function CoverArt() {
  const art = useRef<HTMLCanvasElement>(null);
  const { palette } = useTape();

  useEffect(() => {
    const canvas = art.current;
    if (!canvas) return;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue('--ink').trim() || '#D7DEE5';
      const stripe = css.getPropertyValue('--accent').trim() || '#6CE0FF';
      const rand = rng(hash('marv1nnnnn'));
      const noise = makeNoise(rand);
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 700; i++) {
        let x = rand() * W, y = rand() * H;
        const hot = rand() < 0.07;
        ctx.strokeStyle = hot ? stripe : ink;
        ctx.globalAlpha = hot ? 0.8 : 0.08 + rand() * 0.22;
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
    };
    // The palette variables are written by the provider in the same tick; draw after them.
    const id = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', draw);
    };
  }, [palette]);

  return <canvas ref={art} className="cover-art" aria-hidden="true" />;
}
