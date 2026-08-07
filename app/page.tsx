'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import BruiseField from '@/components/BruiseField';

const ENTRIES = [
  { label: 'ABOUT', href: '/signals/about' },
  { label: 'PROJECTS', href: '/signals/projects' },
  { label: 'JOURNAL', href: '/signals/journal' },
  { label: 'LISTENING', href: '/signals/listening' },
  { label: 'INFLUENCES', href: '/signals/influences' },
];

export default function Home() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [flooding, setFlooding] = useState(false);

  const enter = (href: string) => (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setFlooding(true);
    setTimeout(() => router.push(href), 380);
  };

  return (
    <div ref={root} className={`home${flooding ? ' is-flooding' : ''}`}>
      <BruiseField host={root} />
      <nav className="home__nav" aria-label="Directory">
        {ENTRIES.map((entry) => (
          <a key={entry.href} href={entry.href} onClick={enter(entry.href)}>{entry.label}</a>
        ))}
      </nav>
      <p className="home__sig">MARV1NNNNN</p>
      <div className="home__flood" aria-hidden="true" />
    </div>
  );
}
