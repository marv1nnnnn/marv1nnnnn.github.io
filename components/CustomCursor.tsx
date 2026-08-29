'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) {
      document.documentElement.classList.add('touch-device');
      return;
    }

    const move = (event: PointerEvent) => {
      const node = cursor.current;
      if (!node) return;
      node.style.translate = `${event.clientX}px ${event.clientY}px`;
      node.classList.toggle('is-link', !!(event.target as HTMLElement).closest('a, button'));
      node.classList.add('is-visible');
    };
    const down = () => cursor.current?.classList.add('is-down');
    const up = () => cursor.current?.classList.remove('is-down');
    const leave = () => cursor.current?.classList.remove('is-visible');

    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', down, { passive: true });
    addEventListener('pointerup', up, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', down);
      removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, []);

  return <div ref={cursor} className="machine-cursor" aria-hidden="true" />;
}
