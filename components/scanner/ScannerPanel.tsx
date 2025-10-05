'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useScannerStore } from '@/store/scanner';
import { SIGNALS } from '@/lib/signals';

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatFrequency = (value: number) => `${value.toFixed(1)}`;

export default function ScannerPanel() {
  const { currentFrequency, setFrequency, setIsTuning, setIsOverdrive } = useScannerStore();
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

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
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
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      touchStartY.current = event.touches[0].clientY;
      touchStartFreq.current = currentFrequency;
    }
  }, [currentFrequency]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || touchStartFreq.current === null) return;
    if (event.touches.length !== 1) return;

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
  }, [setIsTuning, scheduleFrequencyUpdate]);

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

  // Generate frequency markers
  const frequencyMarkers = useMemo(() => {
    const markers: Array<{ freq: number; position: number; isMajor: boolean }> = [];

    for (let f = MIN_FREQ; f <= MAX_FREQ; f += 1) {
      const ratio = (f - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
      markers.push({
        freq: f,
        position: (1 - ratio) * 100, // Inverted
        isMajor: true,
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
      };
    });
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 gap-6">
      {/* Title */}
      <div className="text-center">
        <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 font-mono">
          Frequency Tuner
        </div>
      </div>

      {/* Vertical Slider Container */}
      <div
        className="flex-1 flex items-center gap-4 md:gap-6 w-full max-w-md"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Frequency Scale */}
        <div className="relative h-full w-12 md:w-16 flex flex-col justify-between py-2">
          {frequencyMarkers.map((marker) => (
            <div
              key={marker.freq}
              className="absolute right-0 flex items-center gap-2"
              style={{ top: `${marker.position}%` }}
            >
              <span className="text-xs md:text-sm font-mono text-white/60 tabular-nums">
                {marker.freq}
              </span>
            </div>
          ))}
        </div>

        {/* Slider Track */}
        <div className="relative flex-1 h-full min-h-[300px] md:min-h-[400px] flex items-center">
          <div
            ref={sliderTrackRef}
            role="slider"
            aria-label="frequency tuner slider"
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
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            className={`relative w-full h-full rounded-lg overflow-hidden ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-scanner-glow/50 touch-none select-none`}
          >
            {/* Metal panel background */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950" />

            {/* Worn texture overlay */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1),transparent_40%)]" />

            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
              }}
            />

            {/* Center track groove */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 md:w-2 bg-black/80 border-x border-white/10" />

            {/* Signal indicators */}
            {signalIndicators.map((signal) => (
              <div
                key={signal.id}
                className="absolute left-1/2 -translate-x-1/2 w-16 md:w-20 h-0.5 pointer-events-none"
                style={{
                  top: `${signal.position}%`,
                  backgroundColor: signal.accentColor,
                  boxShadow: `0 0 8px ${signal.accentColor}, 0 0 16px ${signal.accentColor}`,
                }}
              />
            ))}

            {/* Draggable handle */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-16 md:w-20 h-12 md:h-14 transition-none pointer-events-none"
              style={{ top: `${handlePosition}%`, transform: 'translate(-50%, -50%)' }}
            >
              {/* Handle body */}
              <div className="relative w-full h-full rounded-md bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-2 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                {/* Metallic shine */}
                <div className="absolute inset-0 rounded-md bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

                {/* Center indicator line */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 md:w-8 h-0.5 bg-gradient-to-r from-transparent via-scanner-glow to-transparent shadow-[0_0_10px_rgba(127,255,212,0.8)]" />

                {/* Grip lines */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-px bg-white/10" />
                  ))}
                </div>
              </div>
            </div>

            {/* Top rivet */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20 shadow-inner pointer-events-none" />

            {/* Bottom rivet */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/20 shadow-inner pointer-events-none" />
          </div>
        </div>

        {/* MHz label */}
        <div
          className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/40 font-mono"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          MHz
        </div>
      </div>

      {/* Current Frequency Display */}
      <div className="w-full max-w-xs rounded border border-white/20 bg-black/80 px-4 py-3 md:px-6 md:py-4 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-white/50 font-mono mb-1.5">
          Current Frequency
        </div>
        <div className="text-5xl md:text-6xl font-mono tracking-wider text-scanner-glow phosphor-text font-bold tabular-nums">
          {formatFrequency(currentFrequency)}
        </div>
        <div className="text-xs md:text-sm uppercase tracking-[0.5em] text-white/40 font-mono mt-1">
          MHz
        </div>
      </div>
    </div>
  );
}
