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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="h-full"
    >
      <Link
        href={href}
        className="group relative flex h-full flex-col overflow-hidden border-4 border-white/80 bg-black/60 p-5 text-left shadow-[6px_6px_0px_0px_rgba(255,255,255,0.4)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <div
          className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: cardColor }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-[#0A0A0A]/30 group-hover:opacity-0 transition-opacity" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_62%)] mix-blend-screen opacity-40 group-hover:opacity-0 transition-opacity" />

        <div className="relative z-10 flex flex-1 flex-col gap-4 text-white">
          <div className="flex flex-wrap justify-between gap-2 text-[11px] uppercase tracking-[0.32em] text-white/70">
            <span>{card.date ?? 'UNRECORDED'}</span>
            {card.subtitle && (
              <span className="text-right text-white/60">{card.subtitle}</span>
            )}
          </div>

          <div className="space-y-3">
            <h3
              className="text-2xl font-bold leading-tight tracking-[0.1em] text-white transition-colors"
              style={{
                ['--hover-color' as string]: textColor
              } as React.CSSProperties}
            >
              <span className="group-hover:[color:var(--hover-color)]">{card.title}</span>
            </h3>
            <p className="text-xs leading-relaxed text-white/80 font-medium">{card.summary}</p>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.28em] font-bold text-white/90">
            {card.tags?.map((tag) => (
              <span key={tag} className="border-2 border-white/60 bg-black/50 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <span className="pointer-events-none absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.35em] text-white/80">
          Open
        </span>
      </Link>
    </motion.div>
  );
}
