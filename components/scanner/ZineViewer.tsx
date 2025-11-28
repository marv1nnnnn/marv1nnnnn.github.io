'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Signal, SignalCardsPage, SignalProfilePage, SignalListPage, SignalInfluencesPage } from '@/types/scanner';
import SignalCard from './SignalCard';
import InfluencesPage from './InfluencesPage';

// Code-split ProjectSinglePage for better performance
const ProjectSinglePage = dynamic(() => import('./ProjectSinglePage'), {
  loading: () => <div className="flex items-center justify-center p-12 font-mono font-bold text-xl uppercase animate-pulse">Loading Data...</div>
});

interface ZineViewerProps {
  signal: Signal;
  clarity: number;
}

function ProfilePage({ page }: { page: SignalProfilePage }) {
  return (
    <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.2fr_1fr]">
      {/* Hero Section */}
      <div className="flex flex-col gap-4 md:gap-6 border-brutal bg-white p-6 md:p-8 shadow-brutal-lg relative overflow-hidden">
         {/* Decorative corner */}
         <div className="absolute top-0 right-0 w-12 h-12 bg-brutal-cyan border-l-4 border-b-4 border-black" />

        <span className="text-xs md:text-sm uppercase tracking-widest font-black bg-black text-white px-3 py-1 inline-block self-start transform -rotate-1">
          {page.hero.eyebrow}
        </span>
        
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black uppercase leading-[0.9]">
          {page.hero.title}
        </h2>
        
        {page.hero.subtitle && (
          <p className="text-sm md:text-base uppercase tracking-widest font-bold text-black/60 border-l-4 border-brutal-pink pl-4">
            {page.hero.subtitle}
          </p>
        )}
        
        {page.hero.description && (
          <p className="text-base md:text-lg leading-relaxed font-medium text-black/90">
            {page.hero.description}
          </p>
        )}
      </div>

      {/* Contact / Info Box */}
      <div className="flex flex-col gap-4 md:gap-6 border-brutal bg-brutal-cyan p-6 md:p-8 shadow-brutal-lg transform rotate-1">
        <h3 className="text-sm md:text-base uppercase tracking-widest font-black bg-black text-white px-3 py-1 inline-block self-start">
          Contact Protocol
        </h3>
        <ul className="flex flex-col gap-3 md:gap-4">
          {page.contact.map((entry) => (
            <li key={`${entry.label}-${entry.value}`} className="flex flex-col gap-1 border-b-4 border-black pb-2">
              <span className="font-black uppercase tracking-wider text-[10px] md:text-xs opacity-60">
                {entry.label}
              </span>
              {entry.href ? (
                <a
                  href={entry.href}
                  className="font-mono font-bold text-sm md:text-base hover:bg-black hover:text-white px-1 -mx-1 transition-colors break-all"
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.value}
                </a>
              ) : (
                <span className="font-mono font-bold text-sm md:text-base break-all">{entry.value}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Detail Sections */}
      <div className="lg:col-span-2 grid gap-6 md:gap-8 border-brutal bg-white p-6 md:p-8 shadow-brutal-lg">
        {page.sections.map((section) => (
          <div key={section.title} className="space-y-3 md:space-y-4">
            <h3 className="text-xl md:text-2xl uppercase tracking-widest font-black border-b-4 border-black pb-2">
              {section.title}
            </h3>
            <p className="text-sm md:text-base leading-relaxed font-medium text-black/80 whitespace-pre-line">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardsPage({
  page,
  signalId,
}: {
  page: SignalCardsPage;
  signalId: string;
}) {
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(page.cards.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(0);
  }, [page.cards]);

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const pagedCards = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    return page.cards.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, page.cards]);

  const startIndex = currentPage * PAGE_SIZE;

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      {page.intro && (
        <div className="border-brutal bg-brutal-pink p-6 md:p-10 shadow-brutal-lg transform -rotate-1">
          <div className="flex flex-col gap-4">
            {page.intro.eyebrow && (
              <span className="text-xs md:text-sm uppercase tracking-widest font-black bg-black text-white px-3 py-1 inline-block self-start border-2 border-white">
                {page.intro.eyebrow}
              </span>
            )}
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black uppercase leading-none text-outline-white">
              {page.intro.title}
            </h2>
            {page.intro.description && (
              <p className="text-base md:text-lg leading-relaxed text-black font-bold max-w-prose">
                {page.intro.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:gap-8 md:grid-cols-2 xl:grid-cols-3 auto-rows-[minmax(300px,1fr)]">
        {pagedCards.map((card, index) => (
          <SignalCard
            key={card.id}
            card={card}
            href={`/signals/${signalId}/${card.id}`}
            index={startIndex + index}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-brutal bg-white px-6 py-4 shadow-brutal sticky bottom-4 z-50">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="border-2 border-black bg-brutal-off-white px-4 py-2 text-sm font-black uppercase tracking-wider hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            ← Prev
          </button>

          <span className="font-mono font-bold text-lg tracking-widest">
             PAGE {String(currentPage + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1}
            className="border-2 border-black bg-brutal-off-white px-4 py-2 text-sm font-black uppercase tracking-wider hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ListPage({ page }: { page: SignalListPage }) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const categories = new Set<string>();
    page.items.forEach((item) => {
      categories.add(item.type.toUpperCase());
    });
    return categories;
  });

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof page.items> = {};

    page.items.forEach((item) => {
      const category = item.type.toUpperCase();
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });

    return groups;
  }, [page.items]);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      {page.intro && (
        <div className="border-brutal bg-brutal-lime p-6 md:p-10 shadow-brutal-lg transform rotate-1">
          <div className="flex flex-col gap-4">
             {page.intro.eyebrow && (
              <span className="text-xs md:text-sm uppercase tracking-widest font-black bg-black text-white px-3 py-1 inline-block self-start">
                {page.intro.eyebrow}
              </span>
            )}
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black uppercase leading-none">
              {page.intro.title}
            </h2>
             {page.intro.description && (
              <p className="text-base md:text-lg leading-relaxed text-black font-bold max-w-prose border-l-4 border-black pl-4">
                {page.intro.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border-brutal bg-white px-4 md:px-8 py-6 md:py-8 shadow-brutal-xl">
        {Object.entries(groupedItems)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, items]) => {
          if (items.length === 0) return null;
          const isOpen = openCategories.has(category);

          return (
            <div key={category} className="mb-8 last:mb-0">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between bg-black text-white px-4 py-3 border-brutal hover:bg-brutal-pink hover:text-black transition-colors group mb-4 shadow-brutal"
              >
                <span className="text-lg md:text-xl font-black uppercase tracking-widest">
                  {category}
                </span>
                 <div className="flex items-center gap-4">
                    <span className="font-mono text-sm bg-white text-black px-2 py-0.5 font-bold">
                      {String(items.length).padStart(2, '0')}
                    </span>
                    <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                 </div>
              </button>

              {isOpen && (
                <div className="grid gap-3 pl-2 md:pl-0">
                  {items.map((item, index) => (
                     <a
                        key={`${item.title}-${index}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`
                          group block border-l-4 border-black/20 pl-4 py-3 
                          hover:border-brutal-cyan hover:bg-brutal-off-white 
                          transition-all duration-200
                          ${!item.url ? 'pointer-events-none' : 'cursor-pointer'}
                        `}
                     >
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1 md:gap-4">
                           <div className="flex-1">
                              <h4 className="text-lg font-bold leading-tight group-hover:text-brutal-pink transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-sm font-mono text-black/60 mt-1">
                                {item.creator}
                              </p>
                           </div>
                           {item.date && (
                              <div className="text-xs font-black uppercase tracking-wider bg-black/5 px-2 py-1 self-start md:self-center">
                                {formatDate(item.date)}
                              </div>
                           )}
                        </div>
                     </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ZineViewer({ signal, clarity }: ZineViewerProps) {
  return (
    <div className="relative min-h-full w-full px-4 sm:px-8 md:px-12 lg:px-20 py-10 sm:py-16 md:py-20 bg-[url('/textures/grid.svg')] bg-fixed">
      
      {/* Main Content Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-10 md:gap-16">
        {signal.page.type === 'profile' ? (
          <ProfilePage page={signal.page} />
        ) : signal.page.type === 'list' ? (
          <ListPage page={signal.page} />
        ) : signal.page.type === 'influences' ? (
          <InfluencesPage page={signal.page} clarity={clarity} />
        ) : signal.page.renderMode === 'single' ? (
          <ProjectSinglePage cards={signal.page.cards} signalId={signal.id} />
        ) : (
          <CardsPage page={signal.page} signalId={signal.id} />
        )}
      </div>

      {/* Background decorative line */}
      <div className="absolute top-0 left-8 md:left-16 bottom-0 w-px bg-black/10 pointer-events-none" />
      <div className="absolute top-0 right-8 md:right-16 bottom-0 w-px bg-black/10 pointer-events-none" />
    </div>
  );
}
