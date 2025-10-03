import { Signal } from '@/types/scanner';

export const SIGNALS: Signal[] = [
  {
    id: 'about',
    freq: 88.1,
    title: 'CASE FILE: SUBJECT PROFILE',
    pages: 3,
    audioUrl: '/audio/about-ambient.mp3',
  },
  {
    id: 'project-1',
    freq: 94.5,
    title: 'ANOMALY REPORT: PROJECT ALPHA',
    pages: 5,
    audioUrl: '/audio/project-ambient.mp3',
  },
  {
    id: 'log',
    freq: 101.2,
    title: 'RECOVERED TRANSMISSIONS',
    pages: 4,
    audioUrl: '/audio/log-ambient.mp3',
  },
  {
    id: 'contact',
    freq: 107.8,
    title: 'COMMUNICATION PROTOCOLS',
    pages: 2,
    audioUrl: '/audio/contact-ambient.mp3',
  },
];

export const FALLOFF_DISTANCE = 1.5; // MHz - distance for signal clarity falloff

export function findClosestSignal(frequency: number): { signal: Signal | null; distance: number; clarity: number } {
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
  const clarity = Math.max(0, 1 - (minDistance / FALLOFF_DISTANCE));

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
