'use client';

import { SIGNALS } from '@/lib/signals';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

      {/* Three.js Spiral Staircase */}
      <StaircaseScene
        items={staircaseItems}
        onHover={setHoveredId}
        onSelect={handleSelect}
      />

      {/* Mobile navigation overlay */}
      <div className="md:hidden fixed inset-0 z-[50] flex flex-col justify-end pointer-events-none pb-12 px-5">
        <nav className="flex flex-col gap-1 pointer-events-auto">
          {staircaseItems.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              onClick={() => handleSelect(item.id)}
              className="group text-left py-3 border-b border-white/10 flex items-baseline gap-3 active:opacity-70 transition-opacity"
            >
              <span className="font-mono text-[9px] text-white/30 tracking-[0.3em] uppercase shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-2xl font-serif italic font-bold tracking-tight text-white/90">
                {item.title}
              </span>
              {item.subtitle && (
                <span className="font-mono text-[9px] text-white/30 tracking-[0.15em] uppercase ml-auto shrink-0">
                  {item.subtitle}
                </span>
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Scroll spacer — desktop only for staircase scroll */}
      <div className="hidden md:block" style={{ height: '300vh' }} aria-hidden="true" />
    </>
  );
}
