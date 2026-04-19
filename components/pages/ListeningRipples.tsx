'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function ListeningRipples({ page }: { page: any }) {
  const items = page.items || [];

  // Sort items descending by date
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [items]);

  const ALL_CATEGORIES = ['text', 'video', 'music', 'game', 'live'];
  const categories = ALL_CATEGORIES.filter(cat => sortedItems.some((item: any) => item.type === cat));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'UNKNOWN';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white pt-32 md:pt-48 pb-24 px-4 md:px-12">
      <div className="max-w-[100vw] mx-auto relative z-10">
        {/* Desktop Matrix View */}
        <div className="hidden md:block w-full border-t-2 border-l-2 border-white/20 bg-black/40 backdrop-blur-sm relative">
          {/* Background vertical grid lines for categories */}
          <div className="absolute inset-0 pointer-events-none flex z-0">
            <div className="w-48 shrink-0 border-r-2 border-white/10" />
            <div className="flex-1 flex">
              {categories.map((cat) => (
                <div key={cat} className="flex-1 border-r-2 border-white/5 relative">
                  <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/5" />
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="flex w-full border-b-2 border-white/20 bg-black/90 backdrop-blur-md sticky top-0 z-50">
            <div className="w-48 shrink-0 border-r-2 border-white/20 p-6 font-mono text-xs uppercase tracking-[0.3em] text-white/50 text-right bg-black flex items-center justify-end">
              Date
            </div>
            <div className="flex-1 flex bg-black/60">
              {categories.map(cat => (
                <div key={cat} className="flex-1 border-r-2 border-white/20 p-6 font-mono text-xs uppercase tracking-[0.3em] text-white/50 pl-10 flex items-center">
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {sortedItems.map((item: any, idx: number) => {
            const matchIndex = categories.indexOf(item.type);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: (idx % 10) * 0.05 }}
                className="flex w-full border-b-2 border-white/20 group hover:bg-white/[0.05] transition-colors relative z-10"
              >
                <div className="w-48 shrink-0 border-r-2 border-white/20 p-6 flex flex-col justify-center items-end font-mono text-sm opacity-70 relative bg-black/40">
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-black border-2 border-white/50 rounded-full z-10 group-hover:bg-[#FFE500] group-hover:border-[#FFE500] transition-colors" />
                  <span className="group-hover:text-[#FFE500] transition-colors">{formatDate(item.date)}</span>
                </div>

                <div className="flex-1 flex relative">
                  {matchIndex !== -1 && (
                    <div
                      className="absolute top-1/2 left-0 h-[2px] bg-white/20 group-hover:bg-white/60 transition-colors z-0 pointer-events-none"
                      style={{ width: `calc(${(matchIndex / categories.length) * 100}% + 2rem)` }}
                    >
                      <div className="absolute top-0 left-0 h-full w-0 bg-[#FFE500] group-hover:w-full transition-all duration-500 ease-out opacity-0 group-hover:opacity-100" />
                    </div>
                  )}

                  {categories.map((cat) => {
                    const isMatch = item.type === cat;
                    return (
                      <div key={cat} className="flex-1 border-r-2 border-white/20 relative min-h-[140px] flex flex-col justify-center z-10">
                        {isMatch && (
                          <div className="w-full h-full p-6 pl-8 relative z-10 hover:bg-white/5 transition-colors flex flex-col justify-center">
                            <div className="absolute left-[31px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black border-2 border-white rounded-full group-hover:bg-[#FFE500] group-hover:border-[#FFE500] group-hover:scale-150 transition-all duration-300 z-20" />
                            <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/20 -z-10 group-hover:bg-[#FFE500]/50 transition-colors" />

                            <div className="pl-6 border-l-2 border-white/40 group-hover:border-[#FFE500] transition-colors ml-2 relative">
                              <div className="absolute left-[-3px] top-0 w-1 h-1 bg-white/40 group-hover:bg-[#FFE500] transition-colors" />
                              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-2">
                                // {item.creator}
                              </span>
                              {item.url ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group/link">
                                  <h3 className="text-xl font-serif italic leading-tight group-hover/link:text-[#FFE500] transition-colors">
                                    {item.title}
                                  </h3>
                                </a>
                              ) : (
                                <h3 className="text-xl font-serif italic leading-tight text-white/80">
                                  {item.title}
                                </h3>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Timeline View — single-screen-width vertical feed */}
        <div className="md:hidden relative">
          {/* Continuous timeline spine */}
          <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-white/15" aria-hidden="true" />

          <ul className="flex flex-col">
            {sortedItems.map((item: any, idx: number) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: (idx % 8) * 0.04 }}
                className="relative pl-12 pr-1 py-5 group"
              >
                {/* Timeline node */}
                <span
                  className="absolute left-[13px] top-[26px] w-[14px] h-[14px] rounded-full bg-black border-2 border-white/70 group-hover:bg-[#FFE500] group-hover:border-[#FFE500] transition-colors z-10"
                  aria-hidden="true"
                />
                {/* Horizontal tick */}
                <span
                  className="absolute left-[27px] top-[32px] h-[2px] w-4 bg-white/25 group-hover:bg-[#FFE500] transition-colors"
                  aria-hidden="true"
                />

                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="font-mono text-[10px] tracking-[0.25em] text-white/55 group-hover:text-[#FFE500] transition-colors">
                    {formatDate(item.date)}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] border border-white/25 px-2 py-[2px] text-white/70 group-hover:border-[#FFE500] group-hover:text-[#FFE500] transition-colors whitespace-nowrap">
                    {item.type}
                  </span>
                </div>

                <div className="border-l-2 border-white/25 group-hover:border-[#FFE500] pl-3 transition-colors">
                  {item.creator && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 block mb-1.5">
                      // {item.creator}
                    </span>
                  )}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group/link active:text-[#FFE500]"
                    >
                      <h3 className="text-lg font-serif italic leading-snug group-hover/link:text-[#FFE500] transition-colors break-words">
                        {item.title}
                      </h3>
                    </a>
                  ) : (
                    <h3 className="text-lg font-serif italic leading-snug text-white/85 break-words">
                      {item.title}
                    </h3>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
