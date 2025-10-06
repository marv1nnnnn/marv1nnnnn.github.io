'use client';

import type { SignalInfluencesPage } from '@/types/scanner';
import VinylCarousel from './VinylCarousel';

interface InfluencesPageProps {
  page: SignalInfluencesPage;
  clarity: number;
}

export default function InfluencesPage({ page, clarity }: InfluencesPageProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <div className="border-8 border-black bg-brutal-pink p-8 shadow-brutal-xl">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-black">
            INFLUENCES
          </h1>
          <p className="text-base font-bold uppercase tracking-wide text-black/80">
            Flip through the stuffs that shaped me
          </p>
        </div>
      </div>

      {/* Vinyl Crate Container */}
      <div className="vinyl-crate-brutal">
        <div className="relative">
          {/* Wood grain texture overlay would go here */}
          <VinylCarousel records={page.records} clarity={clarity} />
        </div>
      </div>

      {/* Category Legend */}
      <div className="border-6 border-black bg-white p-6 shadow-brutal-lg">
        <h3 className="text-xs uppercase tracking-widest font-black mb-4 bg-black text-white px-2 py-1 inline-block">
          Categories
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { type: 'music', label: 'Music', count: page.records.filter(r => r.medium === 'music').length },
            { type: 'film', label: 'Film', count: page.records.filter(r => r.medium === 'film').length },
            { type: 'book', label: 'Books', count: page.records.filter(r => r.medium === 'book').length },
            { type: 'anime', label: 'Anime', count: page.records.filter(r => r.medium === 'anime').length },
            { type: 'game', label: 'Games', count: page.records.filter(r => r.medium === 'game').length },
          ].map(({ type, label, count }) => (
            <div
              key={type}
              className="border-4 border-black bg-white px-4 py-3 shadow-brutal text-center"
            >
              <div className="font-black text-2xl text-black">{count}</div>
              <div className="font-bold text-xs uppercase tracking-wider text-black/70">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="border-6 border-black bg-brutal-cyan p-6 shadow-brutal-lg">
        <h3 className="text-xs uppercase tracking-widest font-black mb-3">
          How to Browse
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-black text-brutal-pink text-lg">→</span>
            <div>
              <div className="font-black uppercase text-xs mb-1">Desktop</div>
              <div className="font-medium text-black/80">
                Click arrows, drag, or use keyboard arrows
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-black text-brutal-pink text-lg">→</span>
            <div>
              <div className="font-black uppercase text-xs mb-1">Mobile</div>
              <div className="font-medium text-black/80">
                Swipe left/right to flip through
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-black text-brutal-pink text-lg">→</span>
            <div>
              <div className="font-black uppercase text-xs mb-1">Pull Out</div>
              <div className="font-medium text-black/80">
                Click center record to view details
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
