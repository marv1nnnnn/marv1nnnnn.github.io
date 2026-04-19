'use client';

import { Signal, SignalCardContent } from '@/types/scanner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function SignalCardClientPage({ 
  signal, 
  card, 
  signalId, 
  cardId 
}: { 
  signal: Signal; 
  card: SignalCardContent; 
  signalId: string; 
  cardId: string 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.className = `theme-${signalId}`;
    return () => {
      document.body.className = '';
    };
  }, [signalId]);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-x-hidden selection:bg-white selection:text-black bg-[#050505] dot-grid">
      <div className="noise-overlay" />
      
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 md:top-12 md:left-12 z-[100] mix-blend-difference">
        <Link href={`/signals/${signalId}`} className="group flex items-center gap-3 sm:gap-4 text-white">
           <div className="w-4 sm:w-6 h-[1px] bg-white opacity-50 group-hover:w-10 transition-all"></div>
           <motion.span
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em]"
           >
              Back
           </motion.span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto pt-24 sm:pt-40 px-4 md:px-8 pb-24 relative z-10">
        <motion.article
          className="text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Header */}
          <header className="mb-12 sm:mb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-8 mb-8 sm:mb-12">
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] opacity-40 flex items-center gap-3 sm:gap-4">
                <div className="w-6 sm:w-8 h-[1px] bg-white/40"></div>
                {signal.title}
              </div>
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] opacity-40 md:text-right">
                {card.date || ''}
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[6rem] font-serif font-black tracking-tighter italic leading-[0.9] uppercase mb-8 sm:mb-12 break-words kinetic-text">
              {card.title}
            </h1>

            <div className="flex flex-col gap-6 sm:gap-8">
              {card.summary && (
                <p className="text-base sm:text-xl md:text-3xl font-serif italic opacity-70 leading-relaxed border-l border-white/20 pl-4 sm:pl-8">
                  {card.summary}
                </p>
              )}
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {card.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 bg-white/5 px-4 py-2 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="markdown-body">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{card.markdown}</ReactMarkdown>
          </div>
        </motion.article>
      </div>

      <footer className="py-24 flex flex-col items-center justify-center relative z-10 text-white">
         <Link href={`/signals/${signalId}`} className="group flex flex-col items-center gap-6">
            <div className="w-8 h-8 border border-white/30 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
              <div className="w-1.5 h-1.5 bg-white"></div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-50 group-hover:opacity-100 transition-opacity">
              Back
            </span>
         </Link>
      </footer>
    </main>
  );
}
