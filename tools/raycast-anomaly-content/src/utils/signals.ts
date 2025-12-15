import { Signal } from "../types";
import { getSignals } from "./content";

export function getSignalById(id: string): Signal | undefined {
  const signals = getSignals();
  return signals.find((s) => s.id === id);
}

export function getSignalByFreq(freq: number): Signal | undefined {
  const signals = getSignals();
  return signals.find((s) => s.freq === freq);
}

export function getCardsSignals(): Signal[] {
  const signals = getSignals();
  return signals.filter((s) => s.pageType === "cards");
}

export function getListSignals(): Signal[] {
  const signals = getSignals();
  return signals.filter((s) => s.pageType === "list");
}

export function formatFrequency(freq: number): string {
  return `${freq.toFixed(1)} MHz`;
}

