'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { SignalCardContent } from '@/types/scanner';

interface SignalCardProps {
  card: SignalCardContent;
  href: string;
  index: number;
}

export default function SignalCard({ card, href, index }: SignalCardProps) {
  return (
    <Link href={href} className="group relative block w-full overflow-hidden bg-black transition-all">
       <div className="h-full w-full p-12 flex flex-col justify-between border-2 border-white/10 group-hover:border-white transition-all aspect-[4/5] md:aspect-[4/3]">
          
          <div className="flex justify-between items-start opacity-20 group-hover:opacity-100 transition-opacity">
            <span className="text-mono text-[10px] font-bold">FRAGMENT {String(index + 1).padStart(3, '0')}</span>
            <span className="text-mono text-[10px] font-bold tracking-[0.3em]">{card.date ?? 'UNDEFINED'}</span>
          </div>

          <div className="flex flex-col gap-6">
             <h3 className="text-[6vw] font-black group-hover:italic leading-none transition-all uppercase tracking-tighter">
               {card.title}
             </h3>
             <p className="text-xl opacity-40 leading-tight font-sans font-medium line-clamp-3 group-hover:opacity-80 transition-opacity">
               {card.summary}
             </p>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-wrap gap-4">
              {card.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-mono border border-white/20 px-3 py-1 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all">
                  {tag}
                </span>
              ))}
            </div>
            <div className="group-hover:translate-x-2 transition-transform">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"/>
               </svg>
            </div>
          </div>

          {/* Glitch Overlay on Hover */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-5 bg-white transition-opacity" />
       </div>
    </Link>
  );
}
