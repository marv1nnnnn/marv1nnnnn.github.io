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
    <div className="relative h-full w-full overflow-hidden">
      {/* Static/Noise Effect - Always present, but fades based on clarity */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: 1 - clarity }}
      >
        <StaticEffect intensity={1 - clarity} />
      </div>

      {/* Zine Viewer - Fades in as clarity increases */}
      {signal && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: clarity }}
        >
          <ZineViewer signal={signal} clarity={clarity} />
        </div>
      )}
    </div>
  );
}
