'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  if (!homeReady) return null;

  const segments = pathname.split('/').filter(Boolean);
  const parent = pathname === '/shows'
    ? { href: '/signals/about', label: 'ABOUT' }
    : segments.length > 2 && segments[0] === 'signals' && segments[1]
      ? { href: `/signals/${segments[1]}`, label: segments[1] === 'listening' ? 'MEDIA' : segments[1].toUpperCase() }
      : null;

  const hasShader = pathname === '/' || ['/signals/about', '/signals/projects', '/signals/influences'].includes(pathname);

  return (
    <header className="site-shell">
      <div className="site-shell__left">
        <Link href="/" className="site-shell__mark">MARV1NNNNN</Link>
        {parent && <Link href={parent.href} className="site-shell__parent">← {parent.label}</Link>}
      </div>
      {hasShader && (
        <button type="button" className="site-shell__random" onClick={() => window.dispatchEvent(new Event('machine-ghost-random'))}>
          RANDOM
        </button>
      )}
    </header>
  );
}
