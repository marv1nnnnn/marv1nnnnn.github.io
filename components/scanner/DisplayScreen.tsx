'use client';

import { useEffect, useRef, useState } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal, getSignalState } from '@/lib/signals';
import StaticEffect from './StaticEffect';
import ZineViewer from './ZineViewer';
import SignalLockParticles from '@/components/effects/SignalLockParticles';

export default function DisplayScreen() {
  const { currentFrequency, setLockedOnSignalId } = useScannerStore();
  const previousSignalState = useRef<string>('NOISE');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Track user interaction for vibration API
  useEffect(() => {
    const markInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener('mousedown', markInteraction);
      document.removeEventListener('touchstart', markInteraction);
      document.removeEventListener('keydown', markInteraction);
    };

    document.addEventListener('mousedown', markInteraction);
    document.addEventListener('touchstart', markInteraction);
    document.addEventListener('keydown', markInteraction);

    return () => {
      document.removeEventListener('mousedown', markInteraction);
      document.removeEventListener('touchstart', markInteraction);
      document.removeEventListener('keydown', markInteraction);
    };
  }, []);

  // Calculate current signal state
  const { signal, distance, clarity } = findClosestSignal(currentFrequency);
  const signalState = getSignalState(clarity);

  // Update locked signal in store with haptic feedback
  useEffect(() => {
    if (signalState === 'LOCKED_ON' && signal) {
      setLockedOnSignalId(signal.id);

      // Haptic feedback when locking onto a signal (only after user interaction)
      if (
        previousSignalState.current !== 'LOCKED_ON' &&
        hasUserInteracted &&
        'vibrate' in navigator
      ) {
        // Short vibration pattern: [vibrate, pause, vibrate]
        navigator.vibrate([40, 20, 60]);
      }
    } else {
      setLockedOnSignalId(null);
    }

    previousSignalState.current = signalState;
  }, [signalState, signal, setLockedOnSignalId, hasUserInteracted]);

  // Calculate color transition based on signal clarity
  const accentColor = signal?.accentColor || '#7FFFD4';
  const isLocked = clarity > 0.95;
  const backgroundStyle = isLocked
    ? {
        background: '#FFFFFF',
        transition: 'none',
      }
    : signal && clarity > 0.3
    ? {
        background: `linear-gradient(180deg, ${accentColor}15, #0A0A0A 40%)`,
        transition: 'none',
      }
    : {
        background: '#0A0A0A',
        transition: 'none',
      };

  return (
    <div className="relative h-full w-full halftone-overlay" style={backgroundStyle}>
      {/* Accent color block when locked on signal */}
      {signal && clarity > 0.95 && (
        <div
          className="absolute top-0 left-0 right-0 h-2 z-[5] pointer-events-none"
          style={{
            background: accentColor,
          }}
        />
      )}

      {/* Signal lock particle effect */}
      <SignalLockParticles
        isLocked={signalState === 'LOCKED_ON'}
        accentColor={accentColor}
      />

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ opacity: clarity < 0.95 ? 1 : 0 }}
      >
        <StaticEffect intensity={1 - clarity} />
      </div>

      <div
        className="absolute inset-0 z-20 overflow-y-auto"
        style={{ opacity: clarity > 0.5 ? 1 : 0.2 }}
      >
        {signal && (
          <ZineViewer signal={signal} clarity={clarity} />
        )}
      </div>
    </div>
  );
}
