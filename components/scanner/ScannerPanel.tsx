'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useScannerStore } from '@/store/scanner';
import { SIGNALS } from '@/lib/signals';
import { motion } from 'framer-motion';
import WaveformVisualizer from '@/components/audio/WaveformVisualizer';

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatFrequency = (value: number) => `${value.toFixed(1)}`;

export default function ScannerPanel() {
  const { currentFrequency, setFrequency, setIsTuning, setIsOverdrive, isPanelCollapsed } = useScannerStore();
  const [isDragging, setIsDragging] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const overdriveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingFrequencyRef = useRef<number | null>(null);

  // Swipe gesture tracking
  const touchStartY = useRef<number | null>(null);
  const touchStartFreq = useRef<number | null>(null);

  const scheduleFrequencyUpdate = useCallback((value: number) => {
    if (typeof window === 'undefined') {
      setFrequency(value);
      return;
    }

    pendingFrequencyRef.current = value;

    if (rafRef.current !== null) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingFrequencyRef.current !== null) {
        setFrequency(pendingFrequencyRef.current);
        pendingFrequencyRef.current = null;
      }
    });
  }, [setFrequency]);

  const updateFrequencyFromPoint = useCallback((clientY: number) => {
    if (!sliderTrackRef.current) return;

    const rect = sliderTrackRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const ratio = 1 - clamp(y / rect.height, 0, 1); // Inverted: top = max, bottom = min
    const newFrequency = MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ);

    scheduleFrequencyUpdate(Number(newFrequency.toFixed(1)));
  }, [scheduleFrequencyUpdate]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    setIsTuning(true);
    sliderTrackRef.current?.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    updateFrequencyFromPoint(event.clientY);
  }, [setIsTuning, updateFrequencyFromPoint]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFrequencyFromPoint(event.clientY);
  }, [isDragging, updateFrequencyFromPoint]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    sliderTrackRef.current?.releasePointerCapture(event.pointerId);
    setIsDragging(false);
    setIsTuning(false);
  }, [setIsTuning]);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const nextFrequency = clamp(currentFrequency + delta, MIN_FREQ, MAX_FREQ);
    setIsTuning(true);
    setFrequency(parseFloat(nextFrequency.toFixed(1)));
    setTimeout(() => setIsTuning(false), 150);
  }, [currentFrequency, setFrequency, setIsTuning]);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = clamp(currentFrequency - 0.1, MIN_FREQ, MAX_FREQ);
      setIsTuning(true);
      setFrequency(parseFloat(next.toFixed(1)));
      setTimeout(() => setIsTuning(false), 150);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = clamp(currentFrequency + 0.1, MIN_FREQ, MAX_FREQ);
      setIsTuning(true);
      setFrequency(parseFloat(next.toFixed(1)));
      setTimeout(() => setIsTuning(false), 150);
    }
  }, [currentFrequency, setFrequency, setIsTuning]);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (isPanelCollapsed) return; // Don't handle touch when panel is collapsed
    if (event.touches.length === 1) {
      touchStartY.current = event.touches[0].clientY;
      touchStartFreq.current = currentFrequency;
    }
  }, [currentFrequency, isPanelCollapsed]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (isPanelCollapsed) return; // Don't handle touch when panel is collapsed
    if (touchStartY.current === null || touchStartFreq.current === null) return;
    if (event.touches.length !== 1) return;

    event.preventDefault(); // Prevent scrolling while tuning
    const deltaY = touchStartY.current - event.touches[0].clientY;
    // Improved sensitivity: 100px of swipe = 5 MHz change
    const frequencyDelta = (deltaY / 100) * 5;
    const newFrequency = clamp(
      touchStartFreq.current + frequencyDelta,
      MIN_FREQ,
      MAX_FREQ
    );

    setIsTuning(true);
    scheduleFrequencyUpdate(parseFloat(newFrequency.toFixed(1)));
  }, [setIsTuning, scheduleFrequencyUpdate, isPanelCollapsed]);

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    touchStartFreq.current = null;
    setIsTuning(false);
  }, [setIsTuning]);

  useEffect(() => {
    if (!isDragging) {
      setIsTuning(false);
    }
  }, [isDragging, setIsTuning]);

  // Add wheel and touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const container = sliderTrackRef.current?.parentElement;
    const slider = sliderTrackRef.current;
    if (!slider || !container) return;

    slider.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      slider.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Overdrive detection
  useEffect(() => {
    const isAtExtreme = currentFrequency === MIN_FREQ || currentFrequency === MAX_FREQ;

    if (isAtExtreme) {
      if (!overdriveTimerRef.current) {
        overdriveTimerRef.current = setTimeout(() => {
          setIsOverdrive(true);
        }, 1000);
      }
    } else {
      if (overdriveTimerRef.current) {
        clearTimeout(overdriveTimerRef.current);
        overdriveTimerRef.current = null;
      }
      setIsOverdrive(false);
    }

    return () => {
      if (overdriveTimerRef.current) {
        clearTimeout(overdriveTimerRef.current);
      }
    };
  }, [currentFrequency, setIsOverdrive]);

  // Calculate position percentage (0-100) for the current frequency
  const handlePosition = useMemo(() => {
    const ratio = (currentFrequency - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
    return (1 - ratio) * 100; // Inverted: top = max
  }, [currentFrequency]);

  // Generate frequency markers (major at whole numbers, minor at 0.5 intervals)
  const frequencyMarkers = useMemo(() => {
    const markers: Array<{ freq: number; position: number; isMajor: boolean }> = [];

    // Add all frequencies from 88.0 to 108.0 at 0.5 intervals
    for (let f = MIN_FREQ; f <= MAX_FREQ; f += 0.5) {
      const ratio = (f - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
      const isMajor = f % 1 === 0; // Major tick at whole numbers
      markers.push({
        freq: f,
        position: (1 - ratio) * 100, // Inverted
        isMajor,
      });
    }

    return markers;
  }, []);

  // Generate signal indicators
  const signalIndicators = useMemo(() => {
    return SIGNALS.map((signal) => {
      const ratio = (signal.freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
      return {
        ...signal,
        position: (1 - ratio) * 100, // Inverted
        // Add random rotation to indicators for organic feel
        rotation: (Math.random() - 0.5) * 4 
      };
    });
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 gap-6 bg-brutal-off-white border-brutal shadow-brutal relative overflow-hidden">
       {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/textures/noise.svg')] bg-repeat" />

      {/* Header / Title Block */}
      <div className="w-full flex justify-between items-center border-b-4 border-black pb-4 mb-2">
        <div className="bg-black text-white px-4 py-2">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest font-sans">TUNER</h1>
        </div>
        
        {/* Visualizer */}
        <div className="h-10 w-24 border-2 border-black bg-black relative overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
             <WaveformVisualizer color="#CCFF00" />
             <div className="absolute inset-0 border border-white/10 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px]" />
        </div>
      </div>

      {/* Main Tuner Area */}
      <div className="flex-1 flex items-stretch gap-4 w-full max-w-md min-h-[400px] relative">
        
        {/* Frequency Scale (Left) */}
        <div className="w-16 md:w-24 relative border-r-4 border-black/10">
          <div className="relative h-full py-12">
             {frequencyMarkers.filter(m => m.isMajor).map((marker) => (
              <div
                key={marker.freq}
                className="absolute right-0 flex items-center gap-2 -translate-y-1/2 pr-2"
                style={{ top: `${marker.position}%` }}
              >
                <span className="text-lg font-mono font-bold tabular-nums text-black/60">
                  {Math.round(marker.freq)}
                </span>
                <div className="w-4 h-1 bg-black" />
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Slider Track */}
        <div className="flex-1 relative h-full">
           <div
            ref={sliderTrackRef}
            role="slider"
            aria-label="Frequency Tuner"
            aria-valuemin={MIN_FREQ}
            aria-valuemax={MAX_FREQ}
            aria-valuenow={currentFrequency}
            aria-valuetext={`${formatFrequency(currentFrequency)} MHz`}
            aria-orientation="vertical"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className={`relative w-full h-full py-12 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } focus:outline-none touch-none select-none group`}
          >
            {/* Track Background */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-black/10" />

            {/* Minor Ticks (Grid) */}
            {frequencyMarkers.map((marker) => (
               <div
                key={`tick-${marker.freq}`}
                className={`absolute left-1/2 -translate-x-1/2 h-0.5 bg-black/20 pointer-events-none ${marker.isMajor ? 'w-full' : 'w-1/3'}`}
                style={{ top: `${marker.position}%` }}
              />
            ))}

             {/* Station Indicators (Stickers) */}
            {signalIndicators.map((signal, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={signal.id}
                  className="absolute pointer-events-none z-10 w-full flex justify-center"
                  style={{ top: `${signal.position}%` }}
                >
                  <div 
                    className={`
                      absolute top-0 
                      ${isLeft ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'}
                      -translate-y-1/2
                      border-3 border-black bg-white
                      px-2 py-1 shadow-brutal-hover
                      transform transition-transform
                      ${isLeft ? '-rotate-2' : 'rotate-2'}
                    `}
                    style={{ backgroundColor: signal.accentColor || '#FFF' }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-black whitespace-nowrap">
                      {signal.title}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* The Tuning Needle (Interactive Element) */}
            <motion.div
               className="absolute left-0 right-0 z-30 pointer-events-none flex items-center justify-center"
               style={{ top: `${handlePosition}%` }}
               animate={{ scale: isDragging ? 1.05 : 1 }}
            >
               {/* Line */}
               <div className="w-full h-1 bg-brutal-pink border-y border-black absolute" />
               
               {/* Handle */}
               <div className="w-full h-12 border-4 border-black bg-white/80 backdrop-blur-sm shadow-brutal-hover flex items-center justify-between px-2 relative z-10">
                   <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-black" />
                   <div className="w-16 h-1 bg-black/10 rounded-full" />
                   <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-black" />
               </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Frequency Display (Footer) */}
      <div className="w-full bg-black p-4 text-center border-t-4 border-black shadow-brutal-lg transform rotate-1">
        <div className="flex items-end justify-center gap-2 leading-none">
           <span className="text-6xl font-mono font-bold text-brutal-lime tracking-tighter">
              {formatFrequency(currentFrequency)}
           </span>
           <span className="text-xl font-black text-white mb-2">MHz</span>
        </div>
      </div>

    </div>
  );
}
