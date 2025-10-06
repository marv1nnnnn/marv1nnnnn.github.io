'use client';

import type { VinylRecord } from '@/types/scanner';
import { getMediumColor } from '@/lib/mediumColors';

interface RecordDetailProps {
  record: VinylRecord;
  onClose: () => void;
}

export default function RecordDetail({ record, onClose }: RecordDetailProps) {
  const color = record.color || getMediumColor(record.medium);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-brutal-gray border-8 border-black shadow-brutal-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 bg-brutal-pink border-4 border-black shadow-brutal font-black text-xl hover:bg-black hover:text-brutal-pink transition-none z-10"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-8 md:p-12">
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            {/* Left: Album art */}
            <div className="flex flex-col gap-4">
              {record.image_url ? (
                <div
                  className="w-full aspect-square border-6 border-black shadow-brutal-lg bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${record.image_url})` }}
                >
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="relative h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                    <div className="bg-black/60 px-4 py-2 border-3 border-white/20">
                      <div className="text-white font-black text-2xl uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {record.artist}
                      </div>
                    </div>
                    <div className="bg-black/60 px-4 py-2 border-3 border-white/20">
                      <div className="text-white/95 font-bold text-base uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {record.title}
                      </div>
                    </div>
                    <div className="bg-black/60 px-3 py-1 border-2 border-white/10 mt-2">
                      <div className="text-white/80 font-bold text-sm uppercase">
                        {record.year} · {record.medium}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full aspect-square border-6 border-black shadow-brutal-lg flex flex-col items-center justify-center p-6 text-center"
                  style={{ backgroundColor: color }}
                >
                  <div className="text-white font-black text-2xl uppercase tracking-wider mb-2 drop-shadow-brutal">
                    {record.artist}
                  </div>
                  <div className="text-white/90 font-bold text-base uppercase tracking-wide">
                    {record.title}
                  </div>
                  <div className="text-white/70 font-bold text-sm uppercase mt-3">
                    {record.year}
                  </div>
                  <div className="text-white/60 font-black text-xs uppercase mt-2 tracking-widest">
                    {record.medium}
                  </div>
                </div>
              )}

              {/* Medium badge */}
              <div className="border-6 border-black bg-brutal-yellow p-4 shadow-brutal text-center">
                <div className="font-black uppercase tracking-widest text-xs mb-2">Medium</div>
                <div className="font-black uppercase text-lg">{record.medium}</div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="border-6 border-black bg-brutal-pink p-6 shadow-brutal-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-widest font-black bg-black text-white px-2 py-1">
                    {record.medium}
                  </span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-wide text-black mb-2">
                  {record.artist}
                </h2>
                <h3 className="text-xl font-bold uppercase tracking-wide text-black/80">
                  {record.title} ({record.year})
                </h3>
              </div>

              {/* Personal note */}
              <div className="border-6 border-black bg-white p-6 shadow-brutal-lg">
                <h4 className="text-xs uppercase tracking-widest font-black mb-3 bg-black text-white px-2 py-1 inline-block">
                  Personal Note
                </h4>
                <p className="text-base leading-relaxed text-black/90 font-medium">
                  {record.personalNote}
                </p>
              </div>

              {/* Tags */}
              {record.tags && record.tags.length > 0 && (
                <div className="border-6 border-black bg-white p-6 shadow-brutal-lg">
                  <h4 className="text-xs uppercase tracking-widest font-black mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {record.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-black text-white font-bold text-xs uppercase border-2 border-black shadow-brutal"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {record.links && record.links.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {record.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-brutal-pink border-6 border-black shadow-brutal font-black text-sm uppercase tracking-wider hover:bg-black hover:text-brutal-pink transition-none"
                    >
                      {link.label} →
                    </a>
                  ))}
                </div>
              )}

              {/* Put back button */}
              <button
                onClick={onClose}
                className="mt-4 w-full py-4 bg-black text-white border-6 border-black shadow-brutal-lg font-black text-base uppercase tracking-widest hover:bg-brutal-pink hover:text-black transition-none"
              >
                ← Put Back in Crate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
