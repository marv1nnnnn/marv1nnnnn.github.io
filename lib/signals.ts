import type { Signal, SignalCardContent } from '@/types/scanner';
import data from './signals.json';

interface BillboardItem {
  headline: string;
  subhead: string;
  kicker?: string;
  cta?: string;
}

const signalsData = data as { signals: Signal[]; billboards: BillboardItem[] };
export const SIGNALS: Signal[] = signalsData.signals;
export const BILLBOARDS: BillboardItem[] = signalsData.billboards;

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
