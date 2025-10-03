'use client';

import { useState } from 'react';
import { Signal } from '@/types/scanner';
import { motion, AnimatePresence } from 'framer-motion';

interface ZineViewerProps {
  signal: Signal;
  clarity: number;
}

export default function ZineViewer({ signal, clarity }: ZineViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = () => {
    if (currentPage < signal.pages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate blur based on clarity (0px at 1.0 clarity, 20px at 0.0 clarity)
  const blurAmount = (1 - clarity) * 20;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8">
      {/* Zine Page Container */}
      <div
        className="relative w-full max-w-4xl bg-scanner-text/5 border border-scanner-text/30 p-12 transition-all duration-300"
        style={{
          filter: `blur(${blurAmount}px)`,
        }}
      >
        {/* Zine Title */}
        <div className="mb-8 pb-4 border-b-2 border-scanner-text/50">
          <h1 className="text-4xl phosphor-text tracking-wider font-bold">
            {signal.title}
          </h1>
          <div className="mt-2 text-sm opacity-50">
            FREQUENCY: {signal.freq} MHz // PAGES: {signal.pages}
          </div>
        </div>

        {/* Page Content - Placeholder */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px] space-y-6"
          >
            <div className="text-xl leading-relaxed">
              <p className="mb-4">
                &#91;CASE FILE PAGE {currentPage + 1}&#93;
              </p>
              <p className="opacity-70">
                This is placeholder content for the zine page.
                In the final version, this will display actual
                case file content with redactions, stamps, and
                handwritten annotations.
              </p>
              <p className="mt-4 opacity-50 text-sm">
                Signal ID: {signal.id}
              </p>
            </div>

            {/* Redaction Example */}
            <div className="mt-8 p-4 bg-black text-black select-none">
              &#91;REDACTED&#93;
            </div>

            {/* Stamp Example */}
            <div className="mt-6 inline-block border-4 border-scanner-glow/30 px-4 py-2 rotate-3 text-scanner-glow">
              &#60;&#60; VERIFIED ANOMALY &#62;&#62;
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Page Navigation - Diegetic Controls */}
        <div className="mt-12 pt-6 border-t-2 border-scanner-text/50 flex justify-between items-center">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`
              px-6 py-2 border-2 border-scanner-text
              ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-scanner-glow hover:text-scanner-glow cursor-pointer'}
              transition-all
            `}
          >
            &#91; PREV &#93;
          </button>

          <div className="text-sm opacity-50">
            PAGE {currentPage + 1} / {signal.pages}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === signal.pages - 1}
            className={`
              px-6 py-2 border-2 border-scanner-text
              ${currentPage === signal.pages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-scanner-glow hover:text-scanner-glow cursor-pointer'}
              transition-all
            `}
          >
            &#91; NEXT &#93;
          </button>
        </div>
      </div>

      {/* Signal Strength Indicator */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs opacity-50">SIGNAL STRENGTH:</span>
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-6 border border-scanner-text/30 ${
                i < clarity * 10 ? 'bg-scanner-glow' : 'bg-transparent'
              }`}
            ></div>
          ))}
        </div>
        <span className="text-xs opacity-50">{(clarity * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
