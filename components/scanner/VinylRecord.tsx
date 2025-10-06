'use client';

import type { VinylRecord as VinylRecordType } from '@/types/scanner';
import { getMediumColor } from '@/lib/mediumColors';

interface VinylRecordProps {
  record: VinylRecordType;
  viewMode: 'spine' | 'card';
  isCenter?: boolean;
  onClick?: () => void;
}

export default function VinylRecord({ record, viewMode, isCenter = false, onClick }: VinylRecordProps) {
  const color = record.color || getMediumColor(record.medium);
  if (viewMode === 'spine') {
    // Spine view - thin vertical rectangle like a record in a crate
    return (
      <div
        className={`vinyl-spine ${isCenter ? 'center' : ''} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        style={{
          borderLeftColor: color,
          borderLeftWidth: '6px'
        }}
      >
        <div className="spine-content">
          <div className="spine-artist">{record.artist} - {record.title}</div>
        </div>
      </div>
    );
  }

  // Card view - full record with album art and metadata
  return (
    <div className="vinyl-card">
      {/* Album art square */}
      <div className="vinyl-art">
        {record.image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center border-6 border-black shadow-brutal-lg"
            style={{ backgroundImage: `url(${record.image_url})` }}
          />
        ) : (
          <div
            className="absolute inset-0 border-6 border-black shadow-brutal-lg"
            style={{ backgroundColor: color }}
          />
        )}
      </div>

      {/* Metadata below the art */}
      <div className="vinyl-metadata">
        <div className="border-4 border-black bg-white px-4 py-2 shadow-brutal">
          <div className="font-black text-2xl uppercase tracking-wide text-black">
            {record.artist}
          </div>
        </div>
        <div className="border-4 border-black bg-white px-4 py-2 shadow-brutal mt-2">
          <div className="font-bold text-lg uppercase tracking-wide text-black/90">
            {record.title}
          </div>
        </div>
        <div className="border-4 border-black bg-white px-3 py-1 shadow-brutal mt-2">
          <div className="font-bold text-sm uppercase text-black/70">
            {record.year} · {record.medium}
          </div>
        </div>
      </div>
    </div>
  );
}
