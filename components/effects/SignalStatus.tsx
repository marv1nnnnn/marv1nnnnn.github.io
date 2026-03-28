'use client';

import { useScannerStore } from '@/store/scanner';
import { findClosestSignal } from '@/lib/signals';
import { useEffect, useState } from 'react';

export default function SignalStatus() {
  const { currentFrequency, isTuning } = useScannerStore();
  const { clarity } = findClosestSignal(currentFrequency);
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Generate some random hex/status data
      const newData = [
        `FREQ: ${currentFrequency.toFixed(4)} MHz`,
        `CLARITY: ${(clarity * 100).toFixed(2)}%`,
        `STATUS: ${clarity > 0.95 ? 'LOCKED' : clarity > 0.1 ? 'SEARCHING' : 'NOISE'}`,
        `BUF: 0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0')}`,
        `AMP: ${(Math.random() * 0.5 + clarity * 0.5).toFixed(3)}`
      ];
      setData(newData);
    }, 100);

    return () => clearInterval(interval);
  }, [currentFrequency, clarity]);

  if (!isTuning && clarity > 0.95) return null;

  return (
    <div className="fixed bottom-24 left-6 z-[100] bg-black text-brutal-lime p-4 border-2 border-brutal-lime shadow-brutal-lime font-mono text-[10px] leading-tight select-none pointer-events-none transform -rotate-1">
      <div className="mb-2 border-b border-brutal-lime pb-1 font-black uppercase">Signal Data</div>
      {data.map((line, i) => (
        <div key={i} className="whitespace-nowrap">{line}</div>
      ))}
      <div className="mt-2 text-[8px] opacity-50">SYNCING_BITSTREAM...</div>
    </div>
  );
}
