'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Signal, SignalCardsPage, SignalProfilePage, SignalListPage, SignalInfluencesPage } from '@/types/scanner';
import SignalCard from './SignalCard';
import InfluencesPage from './InfluencesPage';

// Code-split ProjectSinglePage for better performance
const ProjectSinglePage = dynamic(() => import('./ProjectSinglePage'), {
  loading: () => <div className="flex items-center justify-center p-12 text-white/60">Loading...</div>
});

interface ZineViewerProps {
  signal: Signal;
  clarity: number;
}

function ProfilePage({ page }: { page: SignalProfilePage }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-6 border-6 border-black bg-white p-6 shadow-brutal-lg halftone-overlay">
        <span className="text-[11px] uppercase tracking-[0.25em] font-black bg-black text-white px-2 py-1 inline-block">
          {page.hero.eyebrow}
        </span>
        <h2 className="text-4xl font-black tracking-[0.08em] text-black uppercase">
          {page.hero.title}
        </h2>
        {page.hero.subtitle && (
          <p className="text-sm uppercase tracking-[0.2em] font-bold text-black/60">
            {page.hero.subtitle}
          </p>
        )}
        {page.hero.description && (
          <p className="text-base leading-relaxed text-black/80 normal-case">
            {page.hero.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-6 border-black bg-brutal-cyan p-6 shadow-brutal-lg">
        <h3 className="text-xs uppercase tracking-[0.25em] font-black bg-black text-white px-2 py-1 inline-block">
          Contact
        </h3>
        <ul className="flex flex-col gap-3 text-sm">
          {page.contact.map((entry) => (
            <li key={`${entry.label}-${entry.value}`} className="flex items-center justify-between gap-4 border-b-2 border-black/20 pb-2">
              <span className="font-black uppercase tracking-[0.2em] text-[11px]">
                {entry.label}
              </span>
              {entry.href ? (
                <a
                  href={entry.href}
                  className="font-bold underline decoration-black decoration-2 underline-offset-4 hover:bg-black hover:text-white px-1 transition-none"
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.value}
                </a>
              ) : (
                <span className="font-bold">{entry.value}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-2 grid gap-4 border-6 border-black bg-white p-6 shadow-brutal-lg halftone-overlay">
        {page.sections.map((section) => (
          <div key={section.title} className="space-y-3 border-l-6 border-black bg-white pl-5 py-2">
            <h3 className="text-xs uppercase tracking-[0.25em] font-black">
              {section.title}
            </h3>
            <p className="text-sm leading-relaxed text-black/80 whitespace-pre-line">{section.body}</p>
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
    <div className="flex flex-col gap-8">
      {page.intro && (
        <div className="border-6 border-black bg-brutal-pink p-6 shadow-brutal-lg">
          <div className="flex flex-col gap-3">
            {page.intro.eyebrow && (
              <span className="text-[11px] uppercase tracking-[0.25em] font-black bg-black text-white px-2 py-1 inline-block">
                {page.intro.eyebrow}
              </span>
            )}
            <h2 className="text-4xl font-black tracking-[0.08em] text-black uppercase">
              {page.intro.title}
            </h2>
            {page.intro.description && (
              <p className="text-base leading-relaxed text-black/90 normal-case font-medium">
                {page.intro.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 auto-rows-[minmax(240px,1fr)]">
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
        <div className="flex items-center justify-between border-6 border-black bg-white px-5 py-4 text-xs uppercase tracking-[0.2em] font-black shadow-brutal">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="border-4 border-black bg-white px-4 py-2 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-none shadow-brutal"
          >
            ← PREV
          </button>

          <span className="tracking-[0.25em] font-black">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1}
            className="border-4 border-black bg-white px-4 py-2 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 transition-none shadow-brutal"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}

function ListPage({ page }: { page: SignalListPage }) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['AUDIO', 'VIDEO', 'TEXT']));

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof page.items> = {
      AUDIO: [],
      VIDEO: [],
      TEXT: [],
    };

    page.items.forEach((item) => {
      if (item.type === 'album') {
        groups.AUDIO.push(item);
      } else if (item.type === 'video') {
        groups.VIDEO.push(item);
      } else if (item.type === 'text') {
        groups.TEXT.push(item);
      }
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-8">
      {page.intro && (
        <div className="border-6 border-black bg-brutal-lime p-6 shadow-brutal-lg">
          <div className="flex flex-col gap-3">
            {page.intro.eyebrow && (
              <span className="text-[11px] uppercase tracking-[0.25em] font-black bg-black text-white px-2 py-1 inline-block">
                {page.intro.eyebrow}
              </span>
            )}
            <h2 className="text-4xl font-black tracking-[0.08em] text-black uppercase">
              {page.intro.title}
            </h2>
            {page.intro.description && (
              <p className="text-base leading-relaxed text-black/90 normal-case font-medium">
                {page.intro.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border-6 border-black bg-white px-8 py-6 shadow-brutal-lg halftone-overlay">
        {Object.entries(groupedItems).map(([category, items]) => {
          if (items.length === 0) return null;
          const isOpen = openCategories.has(category);

          return (
            <div key={category} className="mb-6 last:mb-0">
              <button
                onClick={() => toggleCategory(category)}
                className="mb-3 flex w-full items-center gap-2 text-left text-xs uppercase tracking-[0.25em] font-black hover:bg-black hover:text-white px-2 py-1 transition-none border-b-4 border-black"
              >
                <span className="font-mono" style={{
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  ▶
                </span>
                <span>{category}</span>
                <span className="opacity-50">({items.length})</span>
              </button>

              {isOpen && (
                <div className="ml-6 flex flex-col gap-2">
                  {items.map((item, index) => {
                    const content = (
                      <div className="flex-1 text-right">
                        <span className="font-bold">{item.title}</span>
                        <span className="mx-2 opacity-40">—</span>
                        <span className="opacity-70">{item.creator}</span>
                      </div>
                    );

                    return (
                      <div
                        key={`${item.title}-${index}`}
                        className="group flex items-baseline justify-between gap-4 border-l-4 border-black/20 pl-4 text-sm hover:border-black hover:bg-black/5 hover:pl-5 transition-none py-1"
                      >
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 cursor-pointer hover:underline decoration-2 underline-offset-2"
                          >
                            {content}
                          </a>
                        ) : (
                          content
                        )}
                        {item.date && (
                          <span className="text-[10px] uppercase tracking-wider opacity-50 font-black">
                            {formatDate(item.date)}
                          </span>
                        )}
                      </div>
                    );
                  })}
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
    <div className="relative min-h-full w-full px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
      <div className="relative z-10 flex flex-col gap-10">
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

      <div className="pointer-events-none absolute inset-0 border border-white/5" />
    </div>
  );
}
