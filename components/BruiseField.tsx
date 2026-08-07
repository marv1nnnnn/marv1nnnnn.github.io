'use client';

import { useEffect } from 'react';

/**
 * A bruise, not an aurora.
 *  - posterized channels (separate R/G/B tables) => blotches, not gradient
 *  - tables capped below 1 => venous, never neon
 *  - anisotropic noise + rotation => irregular edge, not a scalloped flower
 *
 * Motion: the SVG filters rasterise ONCE. Everything that moves is a compositor
 * transform or opacity on the finished raster, so nothing re-runs feTurbulence.
 * Three layers with different seeds slide over each other at different speeds;
 * where posterized bands cross, new bands appear and dissolve. That interference
 * is the whole effect — a single blob really is just a gradient blob.
 */

const LAYERS = [
  { id: 'a', seed: 23, freq: '0.0042 0.0085', scale: 185, rot: -19 },
  { id: 'b', seed: 7, freq: '0.0068 0.0031', scale: 150, rot: 34 },
  { id: 'c', seed: 41, freq: '0.0029 0.0057', scale: 210, rot: -62 },
];

export default function BruiseField({ host }: { host?: React.RefObject<HTMLElement | null> }) {
  useEffect(() => {
    if (matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    const target = (host?.current ?? document.documentElement) as HTMLElement;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        target.style.setProperty('--bx', `${(event.clientX / innerWidth - 0.5) * 260}px`);
        target.style.setProperty('--by', `${(event.clientY / innerHeight - 0.5) * 200}px`);
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(frame); removeEventListener('pointermove', move); };
  }, [host]);

  return (
    <div className="bruise" aria-hidden="true">
      {LAYERS.map((layer) => (
        <svg key={layer.id} className={`bruise__layer bruise__layer--${layer.id}`}
          viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id={`bruise-${layer.id}`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency={layer.freq} numOctaves="5" seed={layer.seed} result="coarse" />
              <feDisplacementMap in="SourceGraphic" in2="coarse" scale={layer.scale} xChannelSelector="R" yChannelSelector="G" result="warped" />
              <feComponentTransfer in="warped" result="steps">
                <feFuncR type="discrete" tableValues="0 .08 .2 .36 .56 .79" />
                <feFuncG type="discrete" tableValues="0 .06 .15 .27 .43 .62" />
                <feFuncB type="discrete" tableValues="0 .07 .18 .32 .5 .72" />
                <feFuncA type="discrete" tableValues="0 0 0 .18 .42 .68 .9 1" />
              </feComponentTransfer>
              <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="5" result="grain" />
              <feColorMatrix in="grain" type="matrix" result="grainMono"
                values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .55  0 0 0 .34 0" />
              <feComposite in="grainMono" in2="steps" operator="in" result="grainClip" />
              <feBlend in="steps" in2="grainClip" mode="multiply" />
            </filter>

            <radialGradient id={`core-${layer.id}`}>
              <stop offset="0%" stopColor="#2b0714" />
              <stop offset="26%" stopColor="#6d1140" />
              <stop offset="52%" stopColor="#a3195b" />
              <stop offset="76%" stopColor="#5e1338" stopOpacity=".78" />
              <stop offset="100%" stopColor="#a3195b" stopOpacity="0" />
            </radialGradient>
            {/* real bruises go yellow-green at the edge as they resolve */}
            <radialGradient id={`edge-${layer.id}`}>
              <stop offset="58%" stopColor="#7a7a2e" stopOpacity="0" />
              <stop offset="84%" stopColor="#7a7a2e" stopOpacity=".42" />
              <stop offset="100%" stopColor="#7a7a2e" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g filter={`url(#bruise-${layer.id})`}>
            <g transform={`rotate(${layer.rot} 950 450)`}>
              <ellipse cx="955" cy="450" rx="370" ry="250" fill={`url(#edge-${layer.id})`} />
              <ellipse cx="945" cy="445" rx="285" ry="180" fill={`url(#core-${layer.id})`} />
            </g>
            <ellipse cx="1105" cy="600" rx="145" ry="95" fill={`url(#core-${layer.id})`} opacity=".7" />
            <ellipse cx="800" cy="300" rx="115" ry="78" fill={`url(#core-${layer.id})`} opacity=".55" />
            <ellipse cx="1180" cy="330" rx="80" ry="58" fill={`url(#core-${layer.id})`} opacity=".4" />
          </g>
        </svg>
      ))}

      {/* the word-bleed filter: a light displacement, legibility survives it */}
      <svg className="bruise__defs" aria-hidden="true">
        <filter id="bleed" x="-20%" y="-30%" width="140%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.021 0.009" numOctaves="3" seed="13" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  );
}
