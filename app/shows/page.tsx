'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import showsData from '@/data/shows.json';

type Show = {
  date: string;
  title: string;
  venue: string;
  city: string;
  lineup: string[];
  note?: string;
  url?: string;
};

export default function ShowsPage() {
  const { intro, shows } = showsData as { intro: string; shows: Show[] };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black text-white">
      <div className="noise-overlay" />

      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 md:top-12 md:left-12 z-[100] mix-blend-difference">
        <Link href="/signals/about" className="group flex min-h-11 items-center gap-3 rounded-full border border-white/15 bg-black/60 px-3 text-white backdrop-blur-sm sm:min-h-0 sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-0">
          <div className="w-4 sm:w-6 h-[1px] bg-white opacity-50 group-hover:w-10 transition-all" />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em]">
            Back to About
          </span>
        </Link>
      </div>

      <div className="relative z-10 px-4 sm:px-10 lg:px-16 xl:px-24 pt-28 sm:pt-36 md:pt-44 pb-24 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/45 mb-4">
            Live / Performances
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[9rem] font-serif italic tracking-tighter leading-[0.92] mb-8 lg:mb-12">
            shows
          </h1>
          <p className="font-serif text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed mb-16 md:mb-20">
            {intro}
          </p>
        </motion.div>

        <ol className="flex flex-col gap-0 border-t border-white/15">
          {shows.map((show, i) => {
            const content = (
              <>
                <div className="md:col-span-2 font-mono text-xs uppercase tracking-[0.25em] text-white/50 mt-1">
                  {show.date}
                </div>
                <div className="md:col-span-7">
                  <h2 className="text-2xl md:text-4xl font-serif italic tracking-tight leading-tight group-hover:translate-x-2 transition-transform">
                    {show.title}
                  </h2>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 mt-3">
                    {show.venue} · {show.city}
                  </p>
                  <p className="font-serif text-base text-white/70 mt-2 leading-relaxed">
                    w/ {show.lineup.join(', ')}
                  </p>
                  {show.note && (
                    <p className="font-serif italic text-sm text-white/50 mt-2">{show.note}</p>
                  )}
                </div>
                <div className="md:col-span-3 flex md:justify-end items-start mt-3 md:mt-1">
                  {show.url && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">
                      [ link ↗ ]
                    </span>
                  )}
                </div>
              </>
            );

            const rowClasses =
              'group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 border-b border-white/15';

            return (
              <motion.li
                key={`${show.date}-${show.title}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.6 }}
              >
                {show.url ? (
                  <a
                    href={show.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={rowClasses + ' cursor-pointer hover:bg-white/[0.03] transition-colors px-2 -mx-2'}
                  >
                    {content}
                  </a>
                ) : (
                  <div className={rowClasses}>{content}</div>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
