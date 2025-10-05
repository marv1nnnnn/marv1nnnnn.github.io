'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { SignalCardContent } from '@/types/scanner';

interface ProjectSinglePageProps {
  cards: SignalCardContent[];
  signalId: string;
}

export default function ProjectSinglePage({ cards }: ProjectSinglePageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1));
  };

  const currentCard = cards[currentIndex];

  if (!currentCard) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* PROJECTS HEADER */}
      <div className="border-5 border-white bg-white px-6 py-6 text-center shadow-[12px_12px_0_rgba(255,255,255,0.3)]">
        <h1 className="font-mono text-3xl font-black uppercase tracking-widest text-black sm:text-4xl">
          PROJECTS
        </h1>
      </div>

      {/* BRUTALIST NAVIGATION */}
      <div className="grid grid-cols-[1fr_auto_1fr] border-5 border-t-0 border-white bg-white shadow-[12px_12px_0_rgba(255,255,255,0.3)]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="border-r-5 border-white bg-black px-6 py-5 font-mono text-base font-black uppercase tracking-wider text-white transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#FFE500] hover:text-black disabled:bg-white disabled:text-black/20 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          ◄◄ PREV
        </button>

        <div className="flex items-center justify-center bg-white px-8 font-mono text-xl font-black text-black sm:text-2xl">
          {currentIndex + 1}/{cards.length}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= cards.length - 1}
          className="border-l-5 border-white bg-black px-6 py-5 font-mono text-base font-black uppercase tracking-wider text-white transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:bg-[#FFE500] hover:text-black disabled:bg-white disabled:text-black/20 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          NEXT ►►
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto border-5 border-white border-t-0 bg-black px-8 py-10 sm:px-12 text-white"
        >
          {/* Header */}
          <div className="mb-10 space-y-6">
            <h2 className="font-mono text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
              {currentCard.title}
            </h2>
            {currentCard.subtitle && (
              <p className="font-mono text-sm font-bold uppercase tracking-widest text-white/70">
                {currentCard.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center border-y-4 border-white py-3 font-mono text-xs font-bold uppercase tracking-wider">
              {currentCard.date && <span className="mr-4">{currentCard.date}</span>}
              {currentCard.tags && currentCard.tags.length > 0 && (
                <>
                  {currentCard.tags.map((tag, idx) => (
                    <span key={tag} className="flex items-center">
                      {idx > 0 && <span className="mx-3 text-lg">│</span>}
                      {tag}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-none space-y-6">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h3 className="mb-4 mt-10 border-b-4 border-white pb-2 font-mono text-xl font-black uppercase tracking-tight">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="mb-3 mt-8 border-b-3 border-white pb-1 font-mono text-lg font-black uppercase tracking-tight">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="mb-4 font-sans text-base leading-relaxed text-white">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-6 ml-6 space-y-2 text-white">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="relative pl-4 font-sans leading-relaxed before:absolute before:left-0 before:content-['▪'] before:font-black before:text-lg before:text-white">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-[#FFE500] underline decoration-2 underline-offset-4 transition-all hover:bg-[#FFE500] hover:text-black hover:px-1"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {currentCard.markdown}
            </ReactMarkdown>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
