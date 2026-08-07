/** Age of a dated item, 0 = now, 1 = DECAY_SPAN years ago or older. */
const DECAY_SPAN_MS = 10 * 365.25 * 24 * 3600 * 1000;

export function ageOf(date?: string): number {
  if (!date) return 0.4;
  const then = Date.parse(date);
  if (Number.isNaN(then)) return 0.4;
  return Math.min(1, Math.max(0, (Date.now() - then) / DECAY_SPAN_MS));
}

/** Inline style carrying the decay variable. Computed at build; no runtime cost. */
export function decay(date?: string) {
  return { '--age': ageOf(date).toFixed(3) } as React.CSSProperties;
}

/** Normalised 0..1 positions for a field strip. */
export function spread(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((value) => (value - min) / range);
}

export function yearsToPoints(dates: string[]): number[] {
  return spread(dates.map((date) => Date.parse(date) || 0));
}
