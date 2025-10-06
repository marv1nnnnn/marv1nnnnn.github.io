'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VinylRecord as VinylRecordType } from '@/types/scanner';
import { getMediumColor } from '@/lib/mediumColors';
import VinylRecord from './VinylRecord';

interface VinylCarouselProps {
  records: VinylRecordType[];
  clarity: number;
}

export default function VinylCarousel({ records }: VinylCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pulledOutIndex, setPulledOutIndex] = useState<number | null>(null);

  const isPulledOut = pulledOutIndex !== null;
  const pulledRecord = pulledOutIndex !== null ? records[pulledOutIndex] : null;
  const pulledRecordColor = pulledRecord ? (pulledRecord.color || getMediumColor(pulledRecord.medium)) : '';

  const flipNext = useCallback(() => {
    if (isPulledOut) return; // Don't navigate when pulled out
    setCurrentIndex((prev) => (prev < records.length - 1 ? prev + 1 : prev));
  }, [records.length, isPulledOut]);

  const flipPrev = useCallback(() => {
    if (isPulledOut) return; // Don't navigate when pulled out
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, [isPulledOut]);

  const handlePullOut = () => {
    setPulledOutIndex(currentIndex);
  };

  const handlePutBack = () => {
    setPulledOutIndex(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPulledOut) {
        if (e.key === 'Escape') {
          handlePutBack();
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        flipNext();
      } else if (e.key === 'ArrowLeft') {
        flipPrev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handlePullOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipNext, flipPrev, isPulledOut, handlePullOut]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < records.length - 1;

  // Browsing view - show all record spines
  if (!isPulledOut) {
    return (
      <div className="flex flex-col items-center gap-8">
        {/* Counter */}
        <div className="border-6 border-black bg-white px-6 py-3 shadow-brutal-lg">
          <span className="font-black text-xl uppercase tracking-widest">
            {currentIndex + 1} / {records.length}
          </span>
        </div>

        {/* Record spines in crate */}
        <div className="vinyl-crate-container">
          <div className="flex items-center justify-center gap-1 py-8 px-4 overflow-x-auto">
            {records.map((record, index) => (
              <VinylRecord
                key={record.id}
                record={record}
                viewMode="spine"
                isCenter={index === currentIndex}
                onClick={() => {
                  setCurrentIndex(index);
                  setPulledOutIndex(index);
                }}
              />
            ))}
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={flipPrev}
            disabled={!canGoPrev}
            className="crate-arrow disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous record"
          >
            ←
          </button>

          <button
            onClick={handlePullOut}
            className="border-4 border-black bg-brutal-pink px-6 py-3 shadow-brutal hover:bg-black hover:text-brutal-pink transition-none cursor-pointer"
          >
            <span className="font-black text-sm uppercase tracking-wider">
              Click to Pull Out
            </span>
          </button>

          <button
            onClick={flipNext}
            disabled={!canGoNext}
            className="crate-arrow disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next record"
          >
            →
          </button>
        </div>
      </div>
    );
  }

  // Pulled out view - show record card + quote panel
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Counter */}
      <div className="border-6 border-black bg-white px-6 py-3 shadow-brutal-lg">
        <span className="font-black text-xl uppercase tracking-widest">
          {pulledOutIndex! + 1} / {records.length}
        </span>
      </div>

      {/* Record + Quote Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-8 max-w-5xl w-full px-4">
        {/* Left: Album Art */}
        <div className="flex justify-center lg:justify-start">
          <div className="vinyl-art-large">
            {pulledRecord!.image_url ? (
              <div
                className="absolute inset-0 bg-cover bg-center border-8 border-black shadow-brutal-xl"
                style={{ backgroundImage: `url(${pulledRecord!.image_url})` }}
              />
            ) : (
              <div
                className="absolute inset-0 border-8 border-black shadow-brutal-xl"
                style={{ backgroundColor: pulledRecordColor }}
              />
            )}
          </div>
        </div>

        {/* Right: Metadata + Quote Panel */}
        <div className="flex flex-col justify-center">
          <div className="border-8 border-black bg-white p-8 shadow-brutal-xl">
            {/* Metadata section */}
            <div className="mb-8 pb-6 border-b-4 border-black">
              <h2 className="text-4xl font-black uppercase tracking-tight text-black mb-3">
                {pulledRecord!.artist}
              </h2>
              <h3 className="text-2xl font-bold uppercase tracking-wide text-black/80 mb-2">
                {pulledRecord!.title}
              </h3>
              <div className="text-lg font-bold uppercase text-black/60">
                {pulledRecord!.year} · {pulledRecord!.medium}
              </div>
            </div>

            {/* Quote section */}
            <div>
              <p className="text-xl leading-relaxed text-black font-medium italic">
                "{pulledRecord!.personalNote}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Put back button */}
      <button
        onClick={handlePutBack}
        className="border-6 border-black bg-black text-white px-12 py-4 shadow-brutal-lg font-black text-base uppercase tracking-widest hover:bg-brutal-pink hover:text-black transition-none"
      >
        ← Put Back in Crate
      </button>
    </div>
  );
}
