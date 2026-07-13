'use client';

import { SIGNALS } from '@/lib/signals';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StaircaseScene from '@/components/StaircaseScene';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.className = hoveredId ? `antialiased theme-${hoveredId}` : 'antialiased';
  }, [hoveredId]);

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/signals/${id}`);
    },
    [router]
  );

  const staircaseItems = useMemo(() => SIGNALS.map((signal) => ({
    id: signal.id,
    title: signal.id === 'influences' ? 'INFLUENCES' : signal.title.charAt(0).toUpperCase() + signal.title.slice(1).toLowerCase(),
    subtitle: signal.id === 'about' ? 'Biography' : 
              signal.id === 'projects' ? 'Selected Lab' : 
              signal.id === 'influences' ? 'Echoes & Grids' : 
              signal.id === 'listening' ? 'Archive Feed' : 'Thoughts',
  })), []);

  if (!mounted) return null;

  return (
    <>
      {/* Background Reactive Layer */}
      <AnimatePresence>
        {hoveredId && (
          <motion.div
            key={hoveredId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[-1] afterimage-bg"
          />
        )}
      </AnimatePresence>

      <div className="noise-overlay" />

      {/* Fixed Header */}
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 md:top-12 md:left-12 z-[100] mix-blend-difference pointer-events-none">
        <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[9rem] font-serif italic tracking-tighter leading-none kinetic-text text-white">
          marv1nnnnn
        </h1>
        <div className="font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-3 sm:gap-4 mt-2 sm:mt-4">
          <div className="w-6 sm:w-8 h-[1px] bg-white/50"></div>
          INDEX
        </div>
      </div>

      {/* Native navigation is faster and easier to use than raycasting on touch screens. */}
      <nav className="relative z-20 min-h-[100svh] px-4 pt-32 pb-[calc(2rem+env(safe-area-inset-bottom))] md:hidden" aria-label="Main navigation">
        <ul className="border-t border-white/20">
          {staircaseItems.map((item, index) => (
            <li key={item.id} className="border-b border-white/20">
              <Link
                href={`/signals/${item.id}`}
                className="group grid min-h-20 grid-cols-[2rem_1fr_auto] items-center gap-3 py-4 active:bg-white/10"
              >
                <span className="font-mono text-[10px] tracking-[0.25em] text-white/40">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-serif text-2xl font-black italic uppercase leading-none tracking-tight">
                    {item.title}
                  </span>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                    // {item.subtitle}
                  </span>
                </span>
                <span className="font-mono text-lg text-white/50" aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden md:block">
        <StaircaseScene
          items={staircaseItems}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
        <div style={{ height: '300vh' }} aria-hidden="true" />
      </div>
    </>
  );
}
