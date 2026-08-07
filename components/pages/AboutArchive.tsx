'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MachineGhostScene from '@/components/MachineGhostScene';
import type { SignalProfilePage } from '@/types/scanner';

export default function AboutArchive({ page }: { page: SignalProfilePage }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const range = document.documentElement.scrollHeight - innerHeight;
      setProgress(range > 0 ? scrollY / range : 0);
    };
    update();
    addEventListener('scroll', update, { passive: true });
    return () => removeEventListener('scroll', update);
  }, []);

  return (
    <main className="about-archive">
      <MachineGhostScene mode="about" progress={progress} />
      <section className="about-archive__hero">
        <h1>{page.hero.title}</h1>
        {page.hero.subtitle && <h2>{page.hero.subtitle}</h2>}
        {page.hero.description && <blockquote>{page.hero.description}</blockquote>}
      </section>

      <section className="about-archive__dossier" aria-label="Profile">
        {page.sections.map((section, index) => (
          <article key={section.title} className="about-trace">
            <p>{String(index + 1).padStart(2, '0')}</p>
            <h2>{section.title}</h2>
            <div>{section.body.split('\n').map((line) => (
              <p key={line}>{line.replace(/^\s*-\s*/, '')}</p>
            ))}</div>
          </article>
        ))}
      </section>

      <section className="about-archive__access">
        <div><h2>Links</h2></div>
        <nav aria-label="About links">
          {page.resume?.href && <a href={page.resume.href} target="_blank" rel="noreferrer"><span>RESUME</span>{page.resume.subtitle ?? 'PDF'} ↗</a>}
          {page.shows?.href && <Link href={page.shows.href}><span>{page.shows.label ?? 'SHOWS'}</span>{page.shows.subtitle ?? 'Performances'} ↗</Link>}
          {page.contact.map((contact) => (
            <a key={contact.label} href={contact.href}><span>{contact.label}</span>{contact.value} ↗</a>
          ))}
        </nav>
      </section>
    </main>
  );
}
