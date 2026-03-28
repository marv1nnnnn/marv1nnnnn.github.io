'use client';

import { Signal } from '@/types/scanner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const StaircaseScene = dynamic(() => import('@/components/StaircaseScene'), {
  ssr: false,
});

export default function SignalClientPage({ signal, signalId }: { signal: Signal; signalId: string }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    document.body.className = `antialiased theme-${signalId}`;
    return () => {
      document.body.className = 'antialiased';
    };
  }, [signalId]);

  const handleSelect = useCallback(
    (id: string) => {
      if (signal.page.type === 'cards') {
        router.push(`/signals/${signalId}/${id}`);
      } else if (signal.page.type === 'list') {
        const item = signal.page.items.find((i: any) => i.title === id);
        if (item?.url) window.open(item.url, '_blank');
      }
    },
    [router, signalId, signal.page]
  );

  const { page } = signal;

  const staircaseItems = useMemo(() => {
    if (page.type === 'cards') {
      return page.cards.map((card: any) => ({
        id: card.id,
        title: card.title,
        subtitle: card.summary ? card.summary.slice(0, 40) + '...' : 'Fragment',
        meta: card.date ? card.date.replace(/-/g, '.') : '',
      }));
    } else if (page.type === 'list') {
      return page.items.map((item: any) => ({
        id: item.title,
        title: item.title,
        subtitle: item.type,
        meta: item.creator,
        onClick: () => item.url && window.open(item.url, '_blank'),
      }));
    }
    return [];
  }, [page]);

  if (!mounted) return null;

  return (
    <>
      <div className="noise-overlay" />

      <AnimatePresence>
        <motion.div
          key={signalId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[-1]"
          style={{
            backgroundImage:
              signalId === 'about'
                ? 'radial-gradient(circle, currentColor 2px, transparent 2px)'
                : signalId === 'projects'
                  ? 'linear-gradient(90deg, currentColor 1px, transparent 1px)'
                  : signalId === 'listening'
                    ? 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 60px)'
                    : signalId === 'influences'
                      ? 'linear-gradient(135deg, currentColor 2px, transparent 2px), linear-gradient(45deg, currentColor 2px, transparent 2px)'
                      : 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
            filter: 'blur(1px)',
          }}
        />
      </AnimatePresence>

      {/* Fixed Return Link */}
      <div className="fixed top-8 left-8 md:top-12 md:left-12 z-[100] mix-blend-difference">
        <Link href="/" className="group flex items-center gap-4 text-white">
          <div className="w-6 h-[1px] bg-white opacity-50 group-hover:w-10 transition-all"></div>
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
          >
            Return to Index
          </motion.span>
        </Link>
      </div>

      {/* Header */}
      <div className="fixed top-24 left-12 z-[100] mix-blend-difference pointer-events-none">
        <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-serif italic tracking-tighter lowercase leading-none text-white kinetic-text">
          {signal.title}
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 mt-6 flex items-center gap-4">
          <div className="w-8 h-[1px] bg-white/40"></div>
          [{signal.freq.toFixed(1)} MHz] &mdash; {page.type}
        </div>
      </div>

      {/* Content Rendering */}
      {page.type === 'profile' && (
        <main className="pt-64 px-8 md:px-12 pb-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left Column: Hero & Bio */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative mb-16">
                  <div className="absolute -top-12 -left-12 text-[15rem] font-serif italic text-white/5 pointer-events-none select-none">
                    Bio
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase leading-[0.9] mb-8">
                    {page.hero.title}
                  </h2>
                  <p className="text-xl md:text-2xl font-serif italic text-white/70 leading-relaxed mb-12">
                    {page.hero.subtitle}
                  </p>
                </div>

                <div className="space-y-12">
                  {(page.sections || []).map((section: any, sIdx: number) => (
                    <div key={sIdx} className="border-l-2 border-white/10 pl-8 py-2">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/30 mb-6 flex items-center gap-4">
                        <span className="w-4 h-px bg-white/30"></span>
                        {section.title}
                      </h3>
                      <div className="prose prose-invert prose-lg max-w-none font-serif text-white/80 leading-relaxed">
                        {(section.content || '').split('\n').map((para: string, pIdx: number) => (
                          <p key={pIdx} className="mb-6 last:mb-0">
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Contact & Info */}
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="bg-white/5 border border-white/10 p-12 backdrop-blur-sm"
              >
                <h3 className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40 mb-12 flex items-center justify-between">
                  Connect_Interface
                  <span className="w-2 h-2 bg-white animate-pulse"></span>
                </h3>

                <div className="space-y-12">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-4">Location</span>
                    <p className="text-2xl font-serif italic text-white">{page.contact?.location || 'Unknown'}</p>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 block mb-4">Channels</span>
                    <div className="flex flex-col gap-4">
                      {(page.contact?.links || []).map((link: any, lIdx: number) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between border-b border-white/10 pb-4 hover:border-white transition-all"
                        >
                          <span className="text-xl font-serif font-bold uppercase tracking-tight group-hover:italic transition-all">
                            {link.label}
                          </span>
                          <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            → VISIT
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="pt-12 border-t border-white/10">
                    <div className="font-mono text-[10px] text-white/20 leading-loose uppercase tracking-[0.2em]">
                      System_Status: Operational<br />
                      Last_Update: 2026.03.28<br />
                      Encryption: Active<br />
                      Protocol: Brutalist_V2
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      )}

      {page.type === 'influences' && (
        <main className="pt-64 px-8 md:px-12 pb-32">
          <div className="relative">
            {(page.records || []).map((record: any, idx: number) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 mb-64 relative`}
              >
                {/* Large Background Number */}
                <div className="absolute -top-24 left-0 text-[20rem] font-black opacity-5 pointer-events-none select-none leading-none">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Image Container with Long Line Effect */}
                <div className="relative w-full md:w-1/2 aspect-[4/5] md:aspect-square overflow-hidden group">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    className="w-full h-full"
                  >
                    {record.image_url ? (
                      <img 
                        src={record.image_url} 
                        alt={record.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 border-4 border-white"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 border-4 border-white flex items-center justify-center text-white/20 font-mono italic">
                        NO_SIGNAL_IMAGE
                      </div>
                    )}
                  </motion.div>
                  {/* Decorative Lines */}
                  <div className="absolute -bottom-8 -right-8 w-full h-px bg-white/20 hidden md:block"></div>
                  <div className="absolute -top-8 -left-8 w-px h-full bg-white/20 hidden md:block"></div>
                </div>

                {/* Text Content */}
                <div className={`w-full md:w-1/2 ${idx % 2 === 0 ? 'text-left' : 'md:text-right'} z-10`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="font-mono text-xs uppercase tracking-[0.5em] text-white/40 block mb-4">
                      {record.medium} // {record.year}
                    </span>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black tracking-tighter leading-[0.8] uppercase mb-6 break-words">
                      {record.title}
                    </h2>
                    <h3 className="text-2xl md:text-3xl font-serif italic text-white/60 mb-8">
                      {record.artist}
                    </h3>
                    <div className="max-w-md ml-0 mr-auto md:ml-auto md:mr-0">
                      <p className="font-serif text-lg md:text-xl leading-relaxed text-white/80 italic border-l-4 md:border-l-0 md:border-r-4 border-white/20 pl-6 md:pl-0 md:pr-6 py-2">
                        {record.personalNote}
                      </p>
                    </div>
                    {record.links && record.links.length > 0 && (
                      <div className={`mt-12 flex flex-wrap gap-4 ${idx % 2 === 0 ? 'justify-start' : 'md:justify-end'}`}>
                        {record.links.map((link: any, lIdx: number) => (
                          <a 
                            key={lIdx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] uppercase tracking-[0.3em] border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      )}

      {(page.type === 'cards' || page.type === 'list') && (
        <>
          <StaircaseScene 
            items={staircaseItems}
            onHover={() => {}}
            onSelect={handleSelect}
          />
          <div style={{ height: '300vh' }} aria-hidden="true" />
        </>
      )}
    </>
  );
}
