'use client';

import { useEffect, useState, useRef } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal } from '@/lib/signals';

export default function SignalCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { currentFrequency } = useScannerStore();
  const { clarity } = findClosestSignal(currentFrequency);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Add jitter to cursor when clarity is low
      const jitter = (1 - clarity) * 30;
      setPosition({ 
        x: e.clientX + (Math.random() - 0.5) * jitter, 
        y: e.clientY + (Math.random() - 0.5) * jitter 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [clarity]);

  return (
    <>
      <div 
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[10000] mix-blend-difference transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate(${position.x - 16}px, ${position.y - 16}px)`,
        }}
      >
        <div className="w-full h-full border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-white" />
        </div>
        
        {/* Signal Strength Rings */}
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="absolute inset-0 border border-white/30 rounded-full animate-ping"
            style={{ 
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 - clarity * 2}s`,
              opacity: 0.1 + clarity * 0.4
            }}
          />
        ))}
      </div>
    </>
  );
}
