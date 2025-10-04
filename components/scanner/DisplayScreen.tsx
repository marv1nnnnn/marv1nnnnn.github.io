'use client';

import { useEffect } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal, getSignalState } from '@/lib/signals';
import StaticEffect from './StaticEffect';
import ZineViewer from './ZineViewer';

export default function DisplayScreen() {
  const { currentFrequency, setLockedOnSignalId } = useScannerStore();

  // Calculate current signal state
  const { signal, distance, clarity } = findClosestSignal(currentFrequency);
  const signalState = getSignalState(clarity);

  // Update locked signal in store
  useEffect(() => {
    if (signalState === 'LOCKED_ON' && signal) {
      setLockedOnSignalId(signal.id);
    } else {
      setLockedOnSignalId(null);
    }
  }, [signalState, signal, setLockedOnSignalId]);

  return (
    <div className="relative h-full w-full bg-[#050505]">
      <div
        className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
        style={{ opacity: 1 - clarity }}
      >
        <StaticEffect intensity={1 - clarity} />
      </div>

      <div
        className="absolute inset-0 z-20 overflow-y-auto"
        style={{ opacity: 0.35 + clarity * 0.65 }}
      >
        {signal && (
          <ZineViewer signal={signal} clarity={clarity} />
        )}
      </div>
    </div>
  );
}
