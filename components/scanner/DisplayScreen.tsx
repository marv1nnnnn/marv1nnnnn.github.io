'use client';

import { useEffect, useRef } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal, getSignalState } from '@/lib/signals';
import StaticEffect from './StaticEffect';
import ZineViewer from './ZineViewer';
import SignalLockParticles from '@/components/effects/SignalLockParticles';

export default function DisplayScreen() {
  const { currentFrequency, setLockedOnSignalId } = useScannerStore();
  const previousSignalState = useRef<string>('NOISE');

  // Calculate current signal state
  const { signal, distance, clarity } = findClosestSignal(currentFrequency);
  const signalState = getSignalState(clarity);

  // Update locked signal in store with haptic feedback
  useEffect(() => {
    if (signalState === 'LOCKED_ON' && signal) {
      setLockedOnSignalId(signal.id);

      // Haptic feedback when locking onto a signal
      if (previousSignalState.current !== 'LOCKED_ON' && 'vibrate' in navigator) {
        // Short vibration pattern: [vibrate, pause, vibrate]
        navigator.vibrate([40, 20, 60]);
      }
    } else {
      setLockedOnSignalId(null);
    }

    previousSignalState.current = signalState;
  }, [signalState, signal, setLockedOnSignalId]);

  // Calculate color transition based on signal clarity
  const accentColor = signal?.accentColor || '#7FFFD4';
  const backgroundStyle = signal && clarity > 0.3
    ? {
        background: `radial-gradient(circle at 50% 120%, ${accentColor}${Math.floor(clarity * 15).toString(16).padStart(2, '0')}, #050505 60%)`,
        transition: 'background 800ms ease-out',
      }
    : {
        background: '#050505',
        transition: 'background 800ms ease-out',
      };

  return (
    <div className="relative h-full w-full" style={backgroundStyle}>
      {/* Accent color glow when approaching signal */}
      {signal && clarity > 0.5 && (
        <div
          className="absolute inset-0 z-[5] pointer-events-none transition-opacity duration-700"
          style={{
            opacity: (clarity - 0.5) * 0.4, // Fade in from 50% clarity
            background: `radial-gradient(ellipse at center, ${accentColor}10, transparent 70%)`,
            boxShadow: `inset 0 0 100px ${accentColor}20`,
          }}
        />
      )}

      {/* Signal lock particle effect */}
      <SignalLockParticles
        isLocked={signalState === 'LOCKED_ON'}
        accentColor={accentColor}
      />

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
