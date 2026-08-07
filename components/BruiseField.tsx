'use client';

import { useEffect, useRef } from 'react';

/**
 * A bruise, not an aurora. Three rules make the difference:
 *  - posterized channels (separate R/G/B tables) => blotches, not gradient
 *  - tables capped below 1 => venous, never neon
 *  - anisotropic noise + rotation => irregular edge, not a scalloped flower
 * The filter rasterises once; only a transform moves. baseFrequency is never animated.
 */
export default function BruiseField({ host }: { host?: React.RefObject<HTMLElement | null> }) {
  const blot = useRef<SVGGElement>(null);

  useEffect(() => {
    if (matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    const target = host?.current ?? document.documentElement;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const style = (target as HTMLElement).style;
        style.setProperty('--bx', `${(event.clientX / innerWidth - 0.5) * 260}px`);
        style.setProperty('--by', `${(event.clientY / innerHeight - 0.5) * 200}px`);
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(frame); removeEventListener('pointermove', move); };
  }, [host]);

  return (
    <svg className="bruise" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="bruise-filter" x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0042 0.0085" numOctaves="5" seed="23" result="coarse" />
          <feDisplacementMap in="SourceGraphic" in2="coarse" scale="185" xChannelSelector="R" yChannelSelector="G" result="warped" />
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

        <radialGradient id="bruise-core">
          <stop offset="0%" stopColor="#2b0714" />
          <stop offset="26%" stopColor="#6d1140" />
          <stop offset="52%" stopColor="#a3195b" />
          <stop offset="76%" stopColor="#5e1338" stopOpacity=".78" />
          <stop offset="100%" stopColor="#a3195b" stopOpacity="0" />
        </radialGradient>
        {/* real bruises go yellow-green at the edge as they resolve */}
        <radialGradient id="bruise-edge">
          <stop offset="58%" stopColor="#7a7a2e" stopOpacity="0" />
          <stop offset="84%" stopColor="#7a7a2e" stopOpacity=".42" />
          <stop offset="100%" stopColor="#7a7a2e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g ref={blot} className="bruise__blot" filter="url(#bruise-filter)" opacity=".94">
        <g transform="rotate(-19 950 450)">
          <ellipse cx="955" cy="450" rx="370" ry="250" fill="url(#bruise-edge)" />
          <ellipse cx="945" cy="445" rx="285" ry="180" fill="url(#bruise-core)" />
        </g>
        <ellipse cx="1105" cy="600" rx="145" ry="95" fill="url(#bruise-core)" opacity=".7" />
        <ellipse cx="800" cy="300" rx="115" ry="78" fill="url(#bruise-core)" opacity=".55" />
        <ellipse cx="1180" cy="330" rx="80" ry="58" fill="url(#bruise-core)" opacity=".4" />
      </g>
    </svg>
  );
}
