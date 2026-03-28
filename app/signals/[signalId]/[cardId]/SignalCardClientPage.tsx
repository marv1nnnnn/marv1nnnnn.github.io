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
      
      {/* Return Link */}
      <div className="fixed top-8 left-8 md:top-12 md:left-12 z-[100] mix-blend-difference">
        <Link href={`/signals/${signalId}`} className="group flex items-center gap-4 text-white">
           <div className="w-6 h-[1px] bg-white opacity-50 group-hover:w-10 transition-all"></div>
           <motion.span 
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="font-mono text-[10px] uppercase tracking-[0.3em]"
           >
              Return to {signal.title}
           </motion.span>
        </Link>
      </div>

      <div className="max-w-[95vw] mx-auto pt-32 px-4 md:px-8 pb-24 relative z-10">
        <motion.article 
          className="bg-white text-black p-8 md:p-16 lg:p-24 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-4 border-black"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Broadsheet Header */}
          <header className="mb-16 border-b-4 border-black pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
              <div className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-60 flex items-center gap-4">
                <div className="w-4 h-4 border-2 border-black flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black"></div>
                </div>
                {signal.title} // VOL. {card.date?.split('-')[0] || '2026'}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-60 text-right">
                ISSUE NO. {cardId.substring(0, 4)}<br/>
                {card.date || 'CURRENT'}
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-serif font-black tracking-tighter leading-[0.85] uppercase mb-12 break-words kinetic-text">
              {card.title}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {card.summary && (
                <p className="md:col-span-8 text-2xl md:text-4xl font-serif italic opacity-80 leading-tight border-l-4 border-black pl-8">
                  {card.summary}
                </p>
              )}
              {card.tags && card.tags.length > 0 && (
                <div className="md:col-span-4 flex flex-wrap gap-3 justify-start md:justify-end">
                  {card.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] uppercase tracking-[0.3em] border border-black px-3 py-1">
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
              End of Document
            </span>
         </Link>
      </footer>
    </main>
  );
}
