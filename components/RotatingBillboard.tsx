'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BILLBOARDS } from '@/lib/signals';

const INTERVAL_MS = 5000;

export default function RotatingBillboard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BILLBOARDS.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const active = BILLBOARDS[index];

  return (
    <div className="relative overflow-hidden border-6 border-black bg-white text-black uppercase audio-border audio-pulse">
      {/* Accent bar */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-brutal-pink" />

      <AnimatePresence mode="wait">
        <motion.div
          key={active.headline}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.4, ease: 'linear' }}
          className="relative flex flex-wrap items-center gap-x-3 md:gap-x-6 gap-y-1 md:gap-y-2 px-3 md:px-6 py-2 md:py-4 pl-4 md:pl-8 tracking-[0.15em] md:tracking-[0.2em] text-xs font-black"
        >
          {active.kicker && (
            <div className="flex items-center gap-2 md:gap-3">
              <span className="inline-block h-1 w-4 md:w-8 bg-black" />
              <span className="text-[8px] md:text-[10px]">{active.kicker}</span>
            </div>
          )}

          <span className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-black tracking-[0.1em] md:tracking-[0.15em] text-black break-words reactive-text">
            {active.headline}
          </span>

          <span className="text-[10px] sm:text-xs md:text-sm opacity-60 tracking-[0.15em] md:tracking-[0.25em] font-bold break-words">
            {active.subhead}
          </span>

          {active.cta && (
            <div className="ml-auto inline-flex items-center border-3 md:border-4 border-black bg-brutal-pink text-white px-3 md:px-5 py-1 md:py-2 text-[9px] md:text-[11px] tracking-[0.15em] md:tracking-[0.25em] font-black whitespace-nowrap shadow-brutal">
              {active.cta}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
