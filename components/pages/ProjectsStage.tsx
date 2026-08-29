'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import MachineGhostScene from '@/components/MachineGhostScene';
import type { SignalCardContent, SignalCardsPage } from '@/types/scanner';

function mediaFrom(card: SignalCardContent) {
  return card.markdown.match(/<(?:img|video)[^>]+src=["']([^"']+)/i)?.[1]
    ?? card.markdown.match(/!\[[^\]]*\]\(([^)\s]+)/)?.[1];
}

function durationFor(card: SignalCardContent) {
  const mediaCount = (card.markdown.match(/<(?:img|video)|!\[/gi) ?? []).length;
  return Math.min(180, 110 + mediaCount * 18 + Math.floor(card.markdown.length / 1800) * 10);
}

export default function ProjectsStage({ page, signalId }: { page: SignalCardsPage; signalId: string }) {
  const sections = useRef<Array<HTMLElement | null>>([]);
  const indexDialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const cards = useMemo(() => [
    ...page.cards.filter((card) => card.id === 'acid-music-player'),
    ...page.cards.filter((card) => card.id !== 'acid-music-player'),
  ], [page.cards]);

  useEffect(() => {
    const onScroll = () => {
      const range = document.documentElement.scrollHeight - innerHeight;
      setProgress(range > 0 ? scrollY / range : 0);
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.index));
    }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-15% 0px -15% 0px' });
    sections.current.forEach((section) => section && observer.observe(section));
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      removeEventListener('scroll', onScroll);
    };
  }, [cards]);

  const current = cards[active] ?? cards[0];

  return (
    <main className="projects-stage">
      <MachineGhostScene mode="projects" progress={progress} mediaUrl={current && mediaFrom(current)} exposure={0.86} />
      <div className="projects-stage__title"><h1>Projects</h1></div>

      <ol className="projects-stage__stream">
        {cards.map((card, index) => (
          <li
            key={card.id}
            id={`project-${card.id}`}
            ref={(node) => { sections.current[index] = node; }}
            data-index={index}
            data-duration={durationFor(card)}
            className={active === index ? 'is-active' : ''}
            style={{ minHeight: `${durationFor(card)}svh` }}
          >
            <article>
              <div className="projects-stage__meta">
                <span>{index + 1} of {cards.length}</span>
                <span>{card.date?.replaceAll('-', '.')}</span>
              </div>
              <h2>{card.title}</h2>
              {card.subtitle && <p className="projects-stage__subtitle">{card.subtitle}</p>}
              <p className="projects-stage__summary">{card.summary}</p>
              {card.tags?.length ? <p className="projects-stage__tags">{card.tags.slice(0, 4).join(' / ')}</p> : null}
              <Link href={`/signals/${signalId}/${card.id}`}>OPEN PROJECT <span aria-hidden="true">↗</span></Link>
            </article>
          </li>
        ))}
      </ol>

      <button className="project-index-button" type="button" onClick={() => indexDialog.current?.showModal()}>
        ALL PROJECTS <span>{active + 1} of {cards.length}</span>
      </button>
      <dialog ref={indexDialog} className="project-index" onClick={(event) => {
        if (event.target === indexDialog.current) indexDialog.current.close();
      }}>
        <div className="site-index__head">
          <span>PROJECTS</span>
          <button type="button" onClick={() => indexDialog.current?.close()}>CLOSE</button>
        </div>
        <nav aria-label="Project index">
          {cards.map((card, index) => (
            <a key={card.id} href={`#project-${card.id}`} onClick={() => indexDialog.current?.close()}>
              {card.title}
            </a>
          ))}
        </nav>
      </dialog>
    </main>
  );
}
