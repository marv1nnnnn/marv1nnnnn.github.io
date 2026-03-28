'use client';

import { SIGNALS } from '@/lib/signals';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const StaircaseScene = dynamic(() => import('@/components/StaircaseScene'), {
  ssr: false,
});

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
    meta: `[${signal.freq.toFixed(1)} MHz]`,
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

      {/* Banner Highway Marquee */}
      <div className="fixed top-0 left-0 w-full border-b border-white/10 bg-[#050505] z-[100] overflow-hidden py-2">
        <div className="animate-marquee whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">
          <span className="mx-4">Personal_Archive // v0.6 [2026]</span>
          <span className="mx-4">Location: Hong Kong // 22.3193° N</span>
          <span className="mx-4">Status: System_Operational</span>
          <span className="mx-4">Personal_Archive // v0.6 [2026]</span>
          <span className="mx-4">Location: Hong Kong // 22.3193° N</span>
          <span className="mx-4">Status: System_Operational</span>
          <span className="mx-4">Personal_Archive // v0.6 [2026]</span>
          <span className="mx-4">Location: Hong Kong // 22.3193° N</span>
          <span className="mx-4">Status: System_Operational</span>
        </div>
      </div>

      {/* Fixed Header */}
      <div className="fixed top-24 left-12 z-[100] mix-blend-difference pointer-events-none">
        <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-serif italic tracking-tighter leading-none kinetic-text text-white">
          marv1nnnnn
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-4 mt-4">
          <div className="w-8 h-[1px] bg-white/50"></div>
          INDEX
        </div>
      </div>

      {/* Three.js Spiral Staircase */}
      <StaircaseScene
        items={staircaseItems}
        onHover={setHoveredId}
        onSelect={handleSelect}
      />

      {/* Scroll spacer */}
      <div style={{ height: '300vh' }} aria-hidden="true" />
    </>
  );
}
