'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SignalCardContent } from '@/types/scanner';
import { generateCardGradient, getContrastColor } from '@/lib/cardGradients';

interface SignalCardProps {
  card: SignalCardContent;
  href: string;
  index: number;
}

export default function SignalCard({ card, href, index }: SignalCardProps) {
  const cardColor = useMemo(() => generateCardGradient(card.id), [card.id]);
  const textColor = useMemo(() => getContrastColor(cardColor), [cardColor]);

  // Brutal rotation angles - cycle through different rotations
  const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-3', 'rotate-3'];
  const rotation = rotations[index % rotations.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`h-full ${rotation}`}
    >
      <Link
        href={href}
        className="group relative flex h-full flex-col overflow-hidden border-8 border-black bg-white p-5 text-left shadow-brutal-lg hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal focus:outline-none focus-visible:ring-4 focus-visible:ring-black halftone-overlay transition-none"
      >
        {/* Hover color block */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-none"
          style={{ backgroundColor: cardColor }}
        />

        {/* Base background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 group-hover:opacity-0 transition-none" />

        <div className="relative z-10 flex flex-1 flex-col gap-4 text-black group-hover:text-white">
          <div className="flex flex-wrap justify-between gap-2 text-[11px] uppercase tracking-[0.32em] font-bold">
            <span className="bg-black text-white px-2 py-1">{card.date ?? 'UNRECORDED'}</span>
            {card.subtitle && (
              <span className="text-right opacity-60">{card.subtitle}</span>
            )}
          </div>

          <div className="space-y-3">
            <h3
              className="text-2xl font-black leading-tight tracking-[0.08em] uppercase transition-none"
              style={{
                ['--hover-color' as string]: textColor
              } as React.CSSProperties}
            >
              <span className="group-hover:[color:var(--hover-color)]">{card.title}</span>
            </h3>
            <p className="text-sm leading-relaxed font-normal normal-case">{card.summary}</p>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em] font-black">
            {card.tags?.map((tag) => (
              <span key={tag} className="border-3 border-black group-hover:border-white bg-transparent px-3 py-1.5">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <span className="pointer-events-none absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.35em] font-black opacity-60 group-hover:opacity-100">
          →
        </span>
      </Link>
    </motion.div>
  );
}
