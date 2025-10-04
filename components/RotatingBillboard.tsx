'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface BillboardItem {
  headline: string;
  subhead: string;
  kicker: string;
  cta: string;
}

const BILLBOARD_ITEMS: BillboardItem[] = [
  {
    headline: 'NEON CONSEQUENCE // A/W 2025',
    subhead: 'HYPER-CHARGED SOUND GARMENTS, VOL. 04',
    kicker: 'SPONSORED TRANSMISSION',
    cta: 'tap to transmit',
  },
  {
    headline: 'VOID PARFUM ATELIER',
    subhead: 'LIMITED DISTRESS SIGNAL FRAGRANCE DROP',
    kicker: 'FIELD TESTED / LAB APPROVED',
    cta: 'scan for sample',
  },
  {
    headline: 'CONCRETE CLUB ROTATION',
    subhead: 'POP-UP BROADCAST LOUNGE // 48H ONLY',
    kicker: 'FREQUENCY PARTNERS',
    cta: 'book ingress',
  },
];

const INTERVAL_MS = 5000;

export default function RotatingBillboard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BILLBOARD_ITEMS.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const active = BILLBOARD_ITEMS[index];

  return (
    <div className="relative overflow-hidden border border-white/20 bg-black/80 text-white uppercase">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.08)_6px,transparent_6px,transparent_12px)] mix-blend-screen opacity-70" />

      <AnimatePresence mode="wait">
        <motion.div
          key={active.headline}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="relative flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 tracking-[0.28em] text-[10px] sm:text-xs"
        >
          <div className="flex items-center gap-3 text-white/60 whitespace-nowrap">
            <span className="inline-block h-px w-6 bg-white/25" />
            <span>{active.kicker}</span>
          </div>

          <span className="text-base sm:text-lg lg:text-xl font-semibold tracking-[0.22em] text-white whitespace-nowrap">
            {active.headline}
          </span>

          <span className="text-[10px] sm:text-xs text-white/70 tracking-[0.35em] whitespace-nowrap">
            {active.subhead}
          </span>

          <div className="ml-auto inline-flex items-center border border-white bg-white text-black px-4 py-1 text-[10px] tracking-[0.3em] whitespace-nowrap">
            {active.cta}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
