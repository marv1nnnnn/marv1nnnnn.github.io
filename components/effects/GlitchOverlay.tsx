'use client';

import { useScannerStore } from '@/store/scanner';
import { findClosestSignal } from '@/lib/signals';
import { useEffect, useState } from 'react';

export default function GlitchOverlay() {
  const { currentFrequency, isOverdrive } = useScannerStore();
  const { clarity } = findClosestSignal(currentFrequency);
  const [glitchStyle, setGlitchStyle] = useState({});

  useEffect(() => {
    if (clarity > 0.9 || (!isOverdrive && clarity > 0.1)) {
      setGlitchStyle({ display: 'none' });
      return;
    }

    const interval = setInterval(() => {
      const intensity = isOverdrive ? 1 : 1 - clarity;
      if (Math.random() > 0.8 / intensity) {
        const x = (Math.random() - 0.5) * 20 * intensity;
        const y = (Math.random() - 0.5) * 10 * intensity;
        const skew = (Math.random() - 0.5) * 10 * intensity;
        
        setGlitchStyle({
          display: 'block',
          transform: `translate(${x}px, ${y}px) skew(${skew}deg)`,
          filter: `hue-rotate(${Math.random() * 360}deg) contrast(${100 + intensity * 100}%)`,
          opacity: 0.1 + Math.random() * 0.2 * intensity,
        });
      } else {
        setGlitchStyle({ display: 'none' });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [clarity, isOverdrive]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] mix-blend-difference overflow-hidden"
      style={glitchStyle}
    >
      <div className="absolute inset-0 bg-white opacity-20" />
      <div className="absolute top-1/4 left-0 w-full h-2 bg-brutal-pink opacity-50" />
      <div className="absolute top-3/4 left-0 w-full h-1 bg-brutal-cyan opacity-50" />
    </div>
  );
}
