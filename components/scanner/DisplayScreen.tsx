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
  const accentColor = signal?.accentColor || '#00FFFF';
  const isLocked = clarity > 0.95;
  
  // Brutalist background logic:
  // - Locked: White paper texture
  // - Close: Dark gray with tint
  // - Noise: Black
  const backgroundStyle = isLocked
    ? {
        background: '#F0F0F0', // Off-white paper
        transition: 'background 0.2s steps(4)',
      }
    : signal && clarity > 0.3
    ? {
        background: `linear-gradient(180deg, ${accentColor}22, #111111 40%)`,
        transition: 'background 0.2s steps(4)',
      }
    : {
        background: '#0A0A0A',
        transition: 'background 0.2s steps(4)',
      };

  return (
    <div className="relative h-full w-full overflow-hidden border-l-0 md:border-l-4 border-black shadow-[inset_6px_6px_0_0_rgba(0,0,0,0.1)]" style={backgroundStyle}>
      
      {/* Texture Overlay (Always present but subtle) */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('/textures/noise.svg')] bg-repeat z-[1]" />

      {/* Accent color stripe when locked */}
      {signal && clarity > 0.95 && (
        <div
          className="absolute top-0 left-0 right-0 h-4 z-[5] pointer-events-none border-b-4 border-black"
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

      {/* Static / Noise Layer */}
      <div
        className="absolute inset-0 z-10 pointer-events-none mix-blend-hard-light"
        style={{ opacity: clarity < 0.95 ? 1 : 0 }}
      >
        <StaticEffect intensity={1 - clarity} />
      </div>

      {/* "Searching..." Empty State Indicator */}
      {!signal && (
         <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
            <div className="text-6xl md:text-9xl font-black text-white uppercase tracking-widest animate-pulse">
               NO SIGNAL
            </div>
         </div>
      )}

      {/* Main Content Container */}
      <div
        className="absolute inset-0 z-20 overflow-y-auto scrollbar-hide"
        style={{ opacity: clarity > 0.5 ? 1 : 0.2 }}
      >
        {signal && (
          <ZineViewer signal={signal} clarity={clarity} />
        )}
      </div>
    </div>
  );
}
