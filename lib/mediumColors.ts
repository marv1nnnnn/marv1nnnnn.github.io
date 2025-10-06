import type { VinylRecord } from '@/types/scanner';

// Color palette for each medium type
const MEDIUM_COLORS: Record<VinylRecord['medium'], string> = {
  music: '#8b0000',      // Dark red
  film: '#1a0033',       // Deep purple
  book: '#2f4f4f',       // Dark slate gray
  anime: '#0a0a0a',      // Near black
  game: '#3d3d29',       // Dark olive
};

/**
 * Get the color associated with a medium type
 */
export function getMediumColor(medium: VinylRecord['medium']): string {
  return MEDIUM_COLORS[medium];
}
