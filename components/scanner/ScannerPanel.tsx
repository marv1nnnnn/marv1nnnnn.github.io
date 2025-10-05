'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
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
    if (event.touches.length === 1) {
      touchStartY.current = event.touches[0].clientY;
      touchStartFreq.current = currentFrequency;
    }
  }, [currentFrequency]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
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
      };
    });
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 gap-6">
      {/* Title */}
      <div className="text-center">
        <div className="text-xs md:text-sm uppercase tracking-[0.25em] font-black bg-black text-white px-4 py-2">
          TUNER
        </div>
      </div>

      {/* Vertical Slider Container */}
      <div className="flex-1 flex items-center gap-4 md:gap-6 w-full max-w-lg min-h-[360px] md:min-h-[460px]">
        {/* Frequency Scale - BOLD & BRUTAL */}
        <div className="relative h-full w-16 md:w-20">
          <div className="relative h-full py-10">
            {frequencyMarkers.filter(m => m.isMajor).map((marker) => (
              <div
                key={marker.freq}
                className="absolute right-0 flex items-center gap-1 -translate-y-1/2"
                style={{ top: `${marker.position}%` }}
              >
                <span className="text-base md:text-lg font-mono font-black tabular-nums text-black leading-none">
                  {Math.round(marker.freq)}
                </span>
                <div className="w-3 h-0.5 bg-black" />
              </div>
            ))}
          </div>
        </div>

        {/* Tuner Window - NEO-BRUTALIST */}
        <div className="relative flex-1 h-full flex items-center">
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
            onKeyDown={handleKeyDown}
            className={`relative w-full h-full py-10 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } focus:outline-none touch-none select-none`}
          >
            {/* Window background - no border */}
            <div className="absolute inset-0 bg-white" />

            {/* Grid lines */}
            {frequencyMarkers.filter(m => m.isMajor).map((marker) => (
              <div
                key={`line-${marker.freq}`}
                className="absolute left-0 right-0 h-px bg-black/15 pointer-events-none"
                style={{ top: `${marker.position}%` }}
              />
            ))}

            {/* Station Cards - BRUTAL STYLE */}
            {signalIndicators.map((signal, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={signal.id}
                  className="absolute pointer-events-none"
                  style={{
                    top: `${signal.position}%`,
                    left: isLeft ? '8px' : 'auto',
                    right: isLeft ? 'auto' : '8px',
                  }}
                >
                  {/* Station label card */}
                  <div
                    className="border-4 border-black px-2 py-1"
                    style={{
                      backgroundColor: signal.accentColor,
                      transform: `translateY(-50%) rotate(${isLeft ? -1 : 1}deg)`
                    }}
                  >
                    <div className="text-[11px] md:text-xs font-black uppercase tracking-[0.15em] text-black whitespace-nowrap">
                      {signal.title}
                    </div>
                    <div className="text-[9px] font-mono font-bold tabular-nums text-black/70">
                      {signal.freq.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* CHUNKY Red Tuning Line */}
            <div
              className="absolute w-full pointer-events-none z-20"
              style={{ top: `${handlePosition}%` }}
            >
              <div className="relative w-full flex items-center -translate-y-1/2">
                {/* Main chunky line */}
                <div className="absolute inset-x-0 h-2 bg-red-600 border-2 border-black shadow-[0_0_12px_rgba(220,38,38,0.8),0_2px_0_0_rgba(0,0,0,1)]" />

                {/* Left arrow pointer - BRUTAL */}
                <div
                  className="absolute left-0 w-0 h-0"
                  style={{
                    transform: 'translateX(-12px)',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '12px solid #dc2626',
                  }}
                />
                <div
                  className="absolute left-0 w-0 h-0"
                  style={{
                    transform: 'translateX(-14px)',
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderRight: '14px solid #000',
                    zIndex: -1,
                  }}
                />

                {/* Right arrow pointer - BRUTAL */}
                <div
                  className="absolute right-0 w-0 h-0"
                  style={{
                    transform: 'translateX(12px)',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: '12px solid #dc2626',
                  }}
                />
                <div
                  className="absolute right-0 w-0 h-0"
                  style={{
                    transform: 'translateX(14px)',
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderLeft: '14px solid #000',
                    zIndex: -1,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MHz label - BRUTAL */}
        <div
          className="text-sm md:text-base uppercase tracking-[0.25em] font-black bg-black text-white px-2 py-2"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          MHz
        </div>
      </div>

      {/* Current Frequency Display - BRUTAL */}
      <div className="w-auto border-6 border-black bg-white px-6 py-3 halftone-overlay relative -rotate-1">
        {/* Corner rivets */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 border-2 border-black"></div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 border-2 border-black"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 border-2 border-black"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900 border-2 border-black"></div>

        {/* Frequency display */}
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-mono tracking-tight text-brutal-pink font-black tabular-nums">
            {formatFrequency(currentFrequency)}
          </span>
          <span className="text-base uppercase tracking-[0.25em] text-black/80 font-black">
            MHz
          </span>
        </div>
      </div>
    </div>
  );
}
