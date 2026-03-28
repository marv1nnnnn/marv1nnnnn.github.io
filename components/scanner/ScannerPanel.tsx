'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useScannerStore } from '@/store/scanner';
import { SIGNALS, findClosestSignal } from '@/lib/signals';
import { motion, AnimatePresence } from 'framer-motion';

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ScannerPanel() {
  const { currentFrequency, setFrequency, setIsTuning } = useScannerStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { clarity } = useMemo(() => findClosestSignal(currentFrequency), [currentFrequency]);

  const handlePointerMove = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const newFreq = MIN_FREQ + x * (MAX_FREQ - MIN_FREQ);
    setFrequency(Number(newFreq.toFixed(1)));
  }, [isDragging, setFrequency]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsTuning(true);
    handlePointerMove(e);
  };

  useEffect(() => {
    const up = () => {
      setIsDragging(false);
      setIsTuning(false);
    };
    const move = (e: PointerEvent) => {
      if (isDragging) handlePointerMove(e);
    };
    window.addEventListener('pointerup', up, { passive: false });
    window.addEventListener('pointermove', move, { passive: false });
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointermove', move);
    };
  }, [isDragging, handlePointerMove, setIsTuning]);

  const progress = (currentFrequency - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative h-full w-full cursor-none group bg-white/10 touch-none"
    >
       {/* Visual Interactive Zone (The "Track") */}
       <div className="absolute inset-x-0 bottom-0 top-0 w-[8px] bg-white mix-blend-difference z-20"
            style={{ left: `${progress * 100}%` }}
       />
       
       {/* Background Grid: Visible on hover */}
       <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-10">
         {Array.from({ length: 50 }).map((_, i) => (
           <div 
             key={i} 
             className={`w-[2px] bg-white h-full ${i % 5 === 0 ? 'opacity-100' : 'opacity-20'}`} 
           />
         ))}
       </div>

       {/* Station Hotspots (Markers) */}
       {SIGNALS.map((s) => (
         <div 
           key={s.id}
           className="absolute top-0 bottom-0 w-[4px] bg-white/40 group-hover:bg-white/80 transition-all"
           style={{ left: `${((s.freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * 100}%` }}
         >
           <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-tighter transform -rotate-90 origin-center whitespace-nowrap opacity-40">
             {s.title}
           </div>
         </div>
       ))}

       {/* Large Interactive Glow */}
       <motion.div 
         animate={{ 
           opacity: isDragging ? 0.3 : 0.05,
         }}
         className="absolute inset-0 bg-white z-0 pointer-events-none"
       />

       {/* Numerical Slider Label */}
       {isDragging && (
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 font-black text-2xl scale-125 z-50">
             {currentFrequency.toFixed(1)}
          </div>
       )}
    </div>
  );
}
