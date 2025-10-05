import type { Signal, SignalCardContent } from '@/types/scanner';
import data from './signals.json';

interface BillboardItem {
  headline: string;
  subhead: string;
  kicker?: string;
  cta?: string;
}

// Load signals and billboards from generated JSON (built from content/ directory)
const signalsData = data as { signals: Signal[]; billboards: BillboardItem[] };
export const SIGNALS: Signal[] = signalsData.signals;
export const BILLBOARDS: BillboardItem[] = signalsData.billboards;

export const FALLOFF_DISTANCE = 1.5; // MHz - distance for signal clarity falloff

// Memoization cache for findClosestSignal
const signalCache = new Map<number, { signal: Signal | null; distance: number; clarity: number }>();
const CACHE_PRECISION = 1; // Cache results to 0.1 MHz precision

export function getSignalById(id: string): Signal | null {
  return SIGNALS.find((signal) => signal.id === id) ?? null;
}

export function getSignalCard(signalId: string, cardId: string): {
  signal: Signal;
  card: SignalCardContent;
} | null {
  const signal = getSignalById(signalId);

  if (!signal || signal.page.type !== 'cards') {
    return null;
  }

  const card = signal.page.cards.find((entry) => entry.id === cardId);

  if (!card) {
    return null;
  }

  return { signal, card };
}

export function getAllSignalCards(): Array<{
  signalId: string;
  cardId: string;
}> {
  const params: Array<{ signalId: string; cardId: string }> = [];

  SIGNALS.forEach((signal) => {
    if (signal.page.type !== 'cards') {
      return;
    }

    signal.page.cards.forEach((card) => {
      params.push({ signalId: signal.id, cardId: card.id });
    });
  });

  return params;
}

export function findClosestSignal(
  frequency: number
): { signal: Signal | null; distance: number; clarity: number } {
  // Round frequency to cache precision (0.1 MHz)
  const cacheKey = Math.round(frequency * 10) / 10;

  // Check cache first
  const cached = signalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (SIGNALS.length === 0) {
    const result = { signal: null, distance: Infinity, clarity: 0 };
    signalCache.set(cacheKey, result);
    return result;
  }

  let closestSignal = SIGNALS[0];
  let minDistance = Math.abs(frequency - SIGNALS[0].freq);

  for (let i = 1; i < SIGNALS.length; i++) {
    const distance = Math.abs(frequency - SIGNALS[i].freq);
    if (distance < minDistance) {
      minDistance = distance;
      closestSignal = SIGNALS[i];
    }
  }

  // Calculate clarity: 1.0 at exact frequency, 0.0 at FALLOFF_DISTANCE or beyond
  const clarity = Math.max(0, 1 - minDistance / FALLOFF_DISTANCE);

  const result = {
    signal: closestSignal,
    distance: minDistance,
    clarity,
  };

  // Store in cache (limit cache size to prevent memory issues)
  if (signalCache.size > 200) {
    // Clear oldest entries by removing first entry
    const firstKey = signalCache.keys().next().value;
    if (firstKey !== undefined) {
      signalCache.delete(firstKey);
    }
  }
  signalCache.set(cacheKey, result);

  return result;
}

export function getSignalState(clarity: number): 'NOISE' | 'APPROACHING' | 'LOCKED_ON' {
  if (clarity >= 0.95) return 'LOCKED_ON';
  if (clarity >= 0.3) return 'APPROACHING';
  return 'NOISE';
}
