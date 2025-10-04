'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Signal, SignalCardsPage, SignalProfilePage, SignalListPage } from '@/types/scanner';
import SignalCard from './SignalCard';

interface ZineViewerProps {
  signal: Signal;
  clarity: number;
}

function ProfilePage({ page }: { page: SignalProfilePage }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col gap-6 border border-white/10 bg-black/40 p-6">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/50">
          {page.hero.eyebrow}
        </span>
        <h2 className="text-3xl font-semibold tracking-[0.14em] text-white">
          {page.hero.title}
        </h2>
        {page.hero.subtitle && (
          <p className="text-sm uppercase tracking-[0.28em] text-white/60">
            {page.hero.subtitle}
          </p>
        )}
        {page.hero.description && (
          <p className="text-sm leading-relaxed text-white/75">
            {page.hero.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border border-white/10 bg-black/40 p-6">
        <h3 className="text-[11px] uppercase tracking-[0.32em] text-white/60">
          Contact
        </h3>
        <ul className="flex flex-col gap-3 text-sm">
          {page.contact.map((entry) => (
            <li key={`${entry.label}-${entry.value}`} className="flex items-center justify-between gap-4">
              <span className="text-white/60 uppercase tracking-[0.25em] text-[11px]">
                {entry.label}
              </span>
              {entry.href ? (
                <a
                  href={entry.href}
                  className="text-white underline decoration-white/30 decoration-dotted underline-offset-4 transition hover:text-white/90"
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.value}
                </a>
              ) : (
                <span className="text-white/80">{entry.value}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-2 grid gap-4 border border-white/10 bg-black/30 p-6">
        {page.sections.map((section) => (
          <div key={section.title} className="space-y-2 border border-white/10 bg-black/40 p-5">
            <h3 className="text-xs uppercase tracking-[0.32em] text-white/60">
              {section.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/80">{section.body}</p>
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
        <div className="border border-white/10 bg-black/40 p-6">
          <div className="flex flex-col gap-3">
            {page.intro.eyebrow && (
              <span className="text-[11px] uppercase tracking-[0.32em] text-white/50">
                {page.intro.eyebrow}
              </span>
            )}
            <h2 className="text-3xl font-semibold tracking-[0.14em] text-white">
              {page.intro.title}
            </h2>
            {page.intro.description && (
              <p className="text-sm leading-relaxed text-white/75">
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
        <div className="flex items-center justify-between border border-white/10 bg-black/50 px-5 py-4 text-[11px] uppercase tracking-[0.28em] text-white/60">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-white/70 transition disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Prev Batch
          </button>

          <span className="tracking-[0.32em] text-white/50">
            Page {currentPage + 1} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-white/70 transition disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Next Batch
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
        <div className="border border-white/10 bg-black/40 p-6">
          <div className="flex flex-col gap-3">
            {page.intro.eyebrow && (
              <span className="text-[11px] uppercase tracking-[0.32em] text-white/50">
                {page.intro.eyebrow}
              </span>
            )}
            <h2 className="text-3xl font-semibold tracking-[0.14em] text-white">
              {page.intro.title}
            </h2>
            {page.intro.description && (
              <p className="text-sm leading-relaxed text-white/75">
                {page.intro.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border border-white/10 bg-black/40 px-8 py-6">
        {Object.entries(groupedItems).map(([category, items]) => {
          if (items.length === 0) return null;
          const isOpen = openCategories.has(category);

          return (
            <div key={category} className="mb-6 last:mb-0">
              <button
                onClick={() => toggleCategory(category)}
                className="mb-3 flex w-full items-center gap-2 text-left text-[11px] uppercase tracking-[0.32em] text-white/50 transition-colors hover:text-white/70"
              >
                <span className="font-mono transition-transform" style={{
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  [&gt;]
                </span>
                <span>{category}</span>
                <span className="text-white/30">({items.length})</span>
              </button>

              {isOpen && (
                <div className="ml-6 flex flex-col gap-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex items-baseline justify-between gap-4 border-l border-white/10 pl-4 text-sm transition-colors hover:border-white/30"
                    >
                      <div className="flex-1 text-right text-white/80">
                        <span className="font-light">{item.title}</span>
                        <span className="mx-2 text-white/40">—</span>
                        <span className="text-white/60">{item.creator}</span>
                      </div>
                      {item.date && (
                        <span className="text-[10px] uppercase tracking-wider text-white/40">
                          {formatDate(item.date)}
                        </span>
                      )}
                    </div>
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

export default function ZineViewer({ signal }: ZineViewerProps) {
  return (
    <div className="relative min-h-full w-full px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
      <div className="relative z-10 flex flex-col gap-10">
        {signal.page.type === 'profile' ? (
          <ProfilePage page={signal.page} />
        ) : signal.page.type === 'list' ? (
          <ListPage page={signal.page} />
        ) : (
          <CardsPage page={signal.page} signalId={signal.id} />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 border border-white/5" />
    </div>
  );
}
