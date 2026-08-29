'use client';

import { useEffect, useRef, useState } from 'react';
import MachineGhostScene from '@/components/MachineGhostScene';
import type { SignalInfluencesPage } from '@/types/scanner';

export default function CanonField({ page }: { page: SignalInfluencesPage }) {
  const sections = useRef<Array<HTMLElement | null>>([]);
  const indexDialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const records = page.records;

  useEffect(() => {
    const onScroll = () => {
      const range = document.documentElement.scrollHeight - innerHeight;
      setProgress(range > 0 ? scrollY / range : 0);
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.index));
    }, { threshold: [0.35, 0.6], rootMargin: '-15% 0px -15% 0px' });
    sections.current.forEach((section) => section && observer.observe(section));

    const onKey = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key) || indexDialog.current?.open) return;
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      event.preventDefault();
      const next = Math.max(0, Math.min(records.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)));
      sections.current[next]?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };

    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('keydown', onKey);
    };
  }, [active, records.length]);

  const current = records[active] ?? records[0];
  const previous = records[Math.max(0, active - 1)];
  const next = records[Math.min(records.length - 1, active + 1)];

  return (
    <main className="canon-field">
      <MachineGhostScene mode="influences" progress={progress} mediaUrl={current?.image_url} exposure={0.94} />
      <div className="canon-field__residues" aria-hidden="true">
        {previous?.image_url && <img src={previous.image_url} alt="" />}
        {next?.image_url && <img src={next.image_url} alt="" />}
      </div>
      <div className="canon-field__title"><h1>Influences</h1></div>

      <ol className="canon-field__stream">
        {records.map((record, index) => (
          <li
            key={record.id}
            id={`influence-${record.id}`}
            ref={(node) => { sections.current[index] = node; }}
            data-index={index}
            className={active === index ? 'is-active' : ''}
          >
            <article>
              {record.image_url && <img className="canon-field__cover" src={record.image_url} alt={`${record.title} cover`} />}
              <p className="canon-field__meta">
                <span>{index + 1} of {records.length}</span>
                <span>{record.medium} — {record.year}</span>
              </p>
              <h2>{record.title}</h2>
              <p className="canon-field__artist">{record.artist}</p>
              <blockquote>{record.personalNote}</blockquote>
              {record.links?.length ? (
                <p className="canon-field__links">
                  {record.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
                </p>
              ) : null}
            </article>
          </li>
        ))}
      </ol>

      <button className="project-index-button" type="button" onClick={() => indexDialog.current?.showModal()}>
        ALL INFLUENCES <span>{active + 1} of {records.length}</span>
      </button>
      <dialog ref={indexDialog} className="project-index" onClick={(event) => {
        if (event.target === indexDialog.current) indexDialog.current.close();
      }}>
        <div className="site-index__head">
          <span>INFLUENCES</span>
          <button type="button" onClick={() => indexDialog.current?.close()}>CLOSE</button>
        </div>
        <nav aria-label="Canon index">
          {records.map((record, index) => (
            <a key={record.id} href={`#influence-${record.id}`} onClick={() => indexDialog.current?.close()}>
              {record.title}<small>{record.artist}</small>
            </a>
          ))}
        </nav>
      </dialog>
    </main>
  );
}
