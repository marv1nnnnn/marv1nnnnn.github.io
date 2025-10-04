'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { SignalCardContent } from '@/types/scanner';

interface SignalCardModalProps {
  card: SignalCardContent;
  onClose: () => void;
}

export default function SignalCardModal({ card, onClose }: SignalCardModalProps) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-8">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <article className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden border border-white/20 bg-[#090a0e]/95 text-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.32em] text-white/50">
              {[card.date ?? 'UNRECORDED', card.subtitle ?? 'FIELD LOG']
                .filter(Boolean)
                .join(' · ')}
            </span>
            <h2 className="text-2xl font-semibold tracking-[0.12em] text-white">
              {card.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            Close
          </button>
        </header>

        <div className="markdown-body flex-1 overflow-y-auto px-6 pb-8 pt-6">
          <ReactMarkdown>{card.markdown}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
