'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal, getSignalState } from '@/lib/signals';
import StaticEffect from './StaticEffect';
import ZineViewer from './ZineViewer';
import { motion, AnimatePresence } from 'framer-motion';

export default function DisplayScreen() {
  const { currentFrequency, setLockedOnSignalId } = useScannerStore();
  const { signal, clarity } = useMemo(() => findClosestSignal(currentFrequency), [currentFrequency]);
  const signalState = getSignalState(clarity);

  useEffect(() => {
    if (signalState === 'LOCKED_ON' && signal) {
      setLockedOnSignalId(signal.id);
    } else {
      setLockedOnSignalId(null);
    }
  }, [signalState, signal, setLockedOnSignalId]);

  return (
    <div className="relative h-full w-full overflow-hidden flex items-start justify-center">
      
      {/* Background Static (Subtle when locked) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 opacity-10"
        style={{ opacity: 0.05 + (0.95 * (1 - clarity)) }}
      >
        <StaticEffect intensity={1 - clarity} />
      </div>

      {/* Content Container (Scrollable) */}
      <div 
        className="relative z-10 w-full max-w-7xl mx-auto overflow-y-visible"
      >
        <AnimatePresence mode="wait">
          {signal && clarity > 0.85 ? (
             <motion.div
               key={signal.id}
               className="w-full"
             >
                <ZineViewer signal={signal} clarity={clarity} />
             </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

    </div>
  );
}
