'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) {
      document.documentElement.classList.add('touch-device');
      return;
    }

    let previousX = innerWidth / 2;
    let previousY = innerHeight / 2;
    let settleTimer = 0;
    const move = (event: PointerEvent) => {
      const node = cursor.current;
      if (!node) return;
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      node.style.translate = `${event.clientX}px ${event.clientY}px`;
      node.style.setProperty('--cursor-angle', `${Math.atan2(dy, dx)}rad`);
      node.style.setProperty('--cursor-stretch', String(1 + Math.min(Math.hypot(dx, dy) / 20, 1.5)));
      node.classList.toggle('is-link', !!(event.target as HTMLElement).closest('a, button'));
      node.classList.add('is-visible');
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => node.style.setProperty('--cursor-stretch', '1'), 90);
    };
    const down = () => cursor.current?.classList.add('is-down');
    const up = () => cursor.current?.classList.remove('is-down');
    const leave = () => cursor.current?.classList.remove('is-visible');

    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down, { passive: true });
    addEventListener('pointerup', up, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      clearTimeout(settleTimer);
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, []);

  return <div ref={cursor} className="machine-cursor" aria-hidden="true"><span /></div>;
}
