'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteShell() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  const parent = pathname === '/shows'
    ? { href: '/signals/about', label: 'ABOUT' }
    : segments.length > 2 && segments[0] === 'signals'
      ? { href: `/signals/${segments[1]}`, label: segments[1].toUpperCase() }
      : null;

  return (
    <header className="shell">
      <Link href="/">MARV1NNNNN</Link>
      {parent && <Link href={parent.href}>← {parent.label}</Link>}
    </header>
  );
}
