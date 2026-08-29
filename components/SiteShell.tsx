'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type GhostPreset = { seed: number; texture: number[]; hue: number; accentHue: number };

function applyCssPreset(value: unknown) {
  const preset = value as GhostPreset | null;
  if (!preset || typeof preset.accentHue !== 'number' || !Array.isArray(preset.texture)
    || preset.texture.length !== 3 || !preset.texture.every(Number.isFinite)) return;
  const root = document.documentElement.style;
  root.setProperty('--ghost-hue', String(preset.accentHue * 360));
  root.setProperty('--signal', `hsl(${preset.accentHue * 360} 78% 58%)`);
  root.setProperty('--ghost-angle', `${Math.round(preset.texture[0] * 55)}deg`);
  root.setProperty('--ghost-spacing', `${Math.round(preset.texture[2] * 7 + 8)}px`);
  root.setProperty('--ghost-line-alpha', String(0.03 + preset.texture[1] * 0.025));
}

export default function SiteShell() {
  const pathname = usePathname();
  const [homeReady, setHomeReady] = useState(pathname !== '/');

  useEffect(() => {
    if (pathname !== '/') {
      setHomeReady(true);
      return;
    }
    const reveal = () => setHomeReady(window.scrollY > 24);
    reveal();
    window.addEventListener('scroll', reveal, { passive: true });
    return () => window.removeEventListener('scroll', reveal);
  }, [pathname]);

  useEffect(() => {
    try { applyCssPreset(JSON.parse(localStorage.getItem('machine-ghost-preset') ?? 'null')); } catch {}
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const parent = pathname === '/shows'
    ? { href: '/signals/about', label: 'ABOUT' }
    : segments.length > 2 && segments[0] === 'signals' && segments[1]
      ? { href: `/signals/${segments[1]}`, label: segments[1] === 'listening' ? 'MEDIA' : segments[1].toUpperCase() }
      : null;

  const randomizeVisual = () => {
    const hue = Math.random();
    const preset = {
      seed: Math.random() * 20,
      texture: [1.4 + Math.random() * 2.2, 0.65 + Math.random(), 1.2 + Math.random() * 2.4],
      hue,
      accentHue: (hue + 0.28 + Math.random() * 0.3) % 1,
    };
    try { localStorage.setItem('machine-ghost-preset', JSON.stringify(preset)); } catch {}
    applyCssPreset(preset);
    window.dispatchEvent(new CustomEvent('machine-ghost-random', { detail: preset }));
  };

  return (
    <header className="site-shell">
      {homeReady && (
        <div className="site-shell__left">
          <Link href="/" className="site-shell__mark">MARV1NNNNN</Link>
          {parent && <Link href={parent.href} className="site-shell__parent">← {parent.label}</Link>}
        </div>
      )}
      <button type="button" className="site-shell__random" onClick={randomizeVisual}>
        CHANGE
      </button>
    </header>
  );
}
