'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SignalCardContent } from '@/types/scanner';
import TiltCard from '@/components/effects/TiltCard';

interface SignalCardProps {
  card: SignalCardContent;
  href: string;
  index: number;
}

export default function SignalCard({ card, href, index }: SignalCardProps) {
  // Neo-brutal rotation & sticker colors
  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2'];
  const rotation = rotations[index % rotations.length];
  
  const stickerColors = ['bg-brutal-cyan', 'bg-brutal-pink', 'bg-brutal-lime', 'bg-brutal-yellow'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "circOut" }}
      className={`h-full ${rotation}`}
    >
      <TiltCard className="h-full">
        <Link
          href={href}
          className="group relative flex h-full flex-col overflow-hidden border-brutal bg-white p-6 text-left shadow-brutal transition-all duration-200 hover:shadow-brutal-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-black"
        >
          {/* Background Pattern Overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />

          <div className="relative z-10 flex flex-1 flex-col gap-6">
            
            {/* Header: Date & ID */}
            <div className="flex justify-between items-start border-b-2 border-black pb-2">
               <div className="bg-black text-white px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-widest">
                 {card.date ?? 'NO_DATE'}
               </div>
               <div className="text-xs font-mono font-bold text-black/50">
                 #{String(index + 1).padStart(2, '0')}
               </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-4">
              <h3 className="text-3xl md:text-4xl font-black uppercase leading-[0.85] tracking-tight group-hover:text-brutal-pink transition-colors duration-200">
                {card.title}
              </h3>
              
              {card.subtitle && (
                 <div className="text-sm font-bold bg-brutal-off-white inline-block px-2 py-1 border border-black">
                   {card.subtitle}
                 </div>
              )}

              <p className="text-sm md:text-base font-medium leading-relaxed text-black/80 line-clamp-4">
                {card.summary}
              </p>
            </div>

            {/* Footer: Tags as Stickers */}
            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {card.tags?.map((tag, i) => {
                 const stickerColor = stickerColors[i % stickerColors.length];
                 return (
                    <span 
                      key={tag} 
                      className={`${stickerColor} border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-wider transform hover:-rotate-2 transition-transform`}
                    >
                      {tag}
                    </span>
                 );
              })}
            </div>
          </div>

          {/* Arrow Indicator */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-x-2 group-hover:translate-x-0">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="black" strokeWidth="3" strokeLinecap="square"/>
             </svg>
          </div>

        </Link>
      </TiltCard>
    </motion.div>
  );
}
