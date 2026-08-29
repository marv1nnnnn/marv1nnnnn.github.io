'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import MachineGhostScene from '@/components/MachineGhostScene';
import { SIGNALS } from '@/lib/signals';

export default function Home() {
  const hero = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let hitTimer = 0;
    const motion = { x: 0, y: 0, progress: 0 };
    const paintType = () => {
      const style = hero.current?.style;
      if (!style) return;
      style.setProperty('--a-x', `${motion.x * -15}px`);
      style.setProperty('--a-y', `${motion.y * 12 - motion.progress * 42}px`);
      style.setProperty('--a-r', `${motion.x * -2.5}deg`);
      style.setProperty('--b-x', `${motion.x * 10}px`);
      style.setProperty('--b-y', `${motion.y * -8 + motion.progress * 24}px`);
      style.setProperty('--b-r', `${motion.y * 2}deg`);
      style.setProperty('--c-x', `${motion.x * 18}px`);
      style.setProperty('--c-y', `${motion.y * 15 - motion.progress * 18}px`);
      style.setProperty('--c-r', `${motion.x * 3}deg`);
    };
    const updateScroll = () => {
      const range = document.documentElement.scrollHeight - innerHeight;
      motion.progress = range > 0 ? scrollY / range : 0;
      setProgress(motion.progress);
      paintType();
    };
    const updatePointer = (event: PointerEvent) => {
      motion.x = event.clientX / innerWidth * 2 - 1;
      motion.y = event.clientY / innerHeight * 2 - 1;
      paintType();
    };
    const hit = () => {
      const title = hero.current?.querySelector('h1');
      if (!title) return;
      title.classList.remove('is-hit');
      void title.clientWidth;
      title.classList.add('is-hit');
      clearTimeout(hitTimer);
      hitTimer = window.setTimeout(() => title.classList.remove('is-hit'), 800);
    };
    updateScroll();
    addEventListener('scroll', updateScroll, { passive: true });
    addEventListener('pointermove', updatePointer, { passive: true });
    addEventListener('pointerdown', hit, { passive: true });
    return () => {
      clearTimeout(hitTimer);
      removeEventListener('scroll', updateScroll);
      removeEventListener('pointermove', updatePointer);
      removeEventListener('pointerdown', hit);
    };
  }, []);

  return (
    <main className="home-machine">
      <MachineGhostScene mode="home" progress={progress} />
      <section ref={hero} className="home-machine__hero" aria-label="MARV1NNNNN">
        <h1 aria-label="marv1nnnnn">
          {[...'marv1nnnnn'].map((letter, index) => <span key={index} aria-hidden="true">{letter}</span>)}
        </h1>
      </section>
      <section className="home-machine__index">
        <nav aria-label="Main navigation">
          {SIGNALS.map((signal) => (
            <Link key={signal.id} href={`/signals/${signal.id}`}>
              <span className="home-machine__label">{signal.id === 'listening' ? 'MEDIA' : signal.title.toUpperCase()}</span>
              <span className="home-machine__arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
