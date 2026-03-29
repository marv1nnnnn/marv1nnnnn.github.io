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
              {categories.map((cat, i) => (
                <div key={cat} className="flex-1 border-r-2 border-white/5 relative">
                  {/* Faint vertical line down the center of each category column */}
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
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (idx % 10) * 0.05 }}
                className="flex w-full border-b-2 border-white/20 group hover:bg-white/[0.05] transition-colors relative z-10"
              >
                {/* Time */}
                <div className="w-48 shrink-0 border-r-2 border-white/20 p-6 flex flex-col justify-center items-end font-mono text-sm opacity-70 relative bg-black/40">
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-black border-2 border-white/50 rounded-full z-10 group-hover:bg-[#FFE500] group-hover:border-[#FFE500] transition-colors" />
                  <span className="group-hover:text-[#FFE500] transition-colors">{formatDate(item.date)}</span>
                </div>
                
                {/* Categories Container */}
                <div className="flex-1 flex relative">
                  {/* The branching line */}
                  {matchIndex !== -1 && (
                    <div 
                      className="absolute top-1/2 left-0 h-[2px] bg-white/20 group-hover:bg-white/60 transition-colors z-0 pointer-events-none"
                      style={{ width: `calc(${(matchIndex / categories.length) * 100}% + 2rem)` }}
                    >
                      {/* Animated pulse on hover */}
                      <div className="absolute top-0 left-0 h-full w-0 bg-[#FFE500] group-hover:w-full transition-all duration-500 ease-out opacity-0 group-hover:opacity-100" />
                    </div>
                  )}
                  
                  {/* Categories */}
                  {categories.map((cat, catIdx) => {
                    const isMatch = item.type === cat;
                    return (
                      <div key={cat} className="flex-1 border-r-2 border-white/20 relative min-h-[140px] flex flex-col justify-center z-10">
                        {isMatch && (
                          <div className="w-full h-full p-6 pl-8 relative z-10 hover:bg-white/5 transition-colors flex flex-col justify-center">
                            {/* Node at the end of the line */}
                            <div className="absolute left-[31px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black border-2 border-white rounded-full group-hover:bg-[#FFE500] group-hover:border-[#FFE500] group-hover:scale-150 transition-all duration-300 z-20" />
                            
                            {/* Vertical line connecting to previous/next items of same category */}
                            <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/20 -z-10 group-hover:bg-[#FFE500]/50 transition-colors" />
                            
                            <div className="pl-6 border-l-2 border-white/40 group-hover:border-[#FFE500] transition-colors ml-2 relative">
                              {/* Glowing dot on the text border */}
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

        {/* Mobile View */}
        <div className="md:hidden flex flex-col border-l-2 border-white/20 ml-2 mt-8">
          {sortedItems.map((item: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative pl-6 py-8 border-b border-white/20 group hover:bg-white/[0.05] transition-colors"
            >
              {/* Connection line and node */}
              <div className="absolute left-0 top-10 w-6 h-[2px] bg-white/40 group-hover:bg-[#FFE500] transition-colors" />
              <div className="absolute left-[-6px] top-[34px] w-3 h-3 bg-black border-2 border-white rounded-full group-hover:bg-[#FFE500] group-hover:border-[#FFE500] transition-colors" />
              
              <div className="font-mono text-xs text-white/50 mb-4 flex justify-between items-center">
                <span className="group-hover:text-[#FFE500] transition-colors">{formatDate(item.date)}</span>
                <span className="uppercase tracking-[0.2em] border border-white/20 px-2 py-1 text-[9px] group-hover:border-[#FFE500] group-hover:text-[#FFE500] transition-colors">{item.type}</span>
              </div>
              
              <div className="border-l-2 border-white/40 group-hover:border-[#FFE500] pl-4 py-2 transition-colors relative">
                <div className="absolute left-[-3px] top-0 w-1 h-1 bg-white/40 group-hover:bg-[#FFE500] transition-colors" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-3">
                  // {item.creator}
                </span>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group/link">
                    <h3 className="text-2xl font-serif italic leading-tight group-hover/link:text-[#FFE500] transition-colors">
                      {item.title}
                    </h3>
                  </a>
                ) : (
                  <h3 className="text-2xl font-serif italic leading-tight text-white/80">
                    {item.title}
                  </h3>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
