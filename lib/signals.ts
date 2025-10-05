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
  if (SIGNALS.length === 0) {
    return { signal: null, distance: Infinity, clarity: 0 };
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

  return {
    signal: closestSignal,
    distance: minDistance,
    clarity,
  };
}

export function getSignalState(clarity: number): 'NOISE' | 'APPROACHING' | 'LOCKED_ON' {
  if (clarity >= 0.95) return 'LOCKED_ON';
  if (clarity >= 0.3) return 'APPROACHING';
  return 'NOISE';
}
