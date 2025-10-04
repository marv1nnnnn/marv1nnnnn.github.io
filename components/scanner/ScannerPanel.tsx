'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useScannerStore } from '@/store/scanner';
import { SIGNALS } from '@/lib/signals';

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;
const START_ANGLE = -135;
const END_ANGLE = 135;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatFrequency = (value: number) => `${value.toFixed(1)} MHz`;

export default function ScannerPanel() {
  const { currentFrequency, setFrequency, setIsTuning, setIsOverdrive, lockedOnSignalId } = useScannerStore();
  const [isRotating, setIsRotating] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const overdriveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingFrequencyRef = useRef<number | null>(null);

  const frequencyToAngle = useCallback((freq: number) => {
    const ratio = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
    return START_ANGLE + ratio * (END_ANGLE - START_ANGLE);
  }, []);

  const angleToFrequency = useCallback((angle: number) => {
    const ratio = (angle - START_ANGLE) / (END_ANGLE - START_ANGLE);
    const freq = MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ);
    return clamp(freq, MIN_FREQ, MAX_FREQ);
  }, []);

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

  const updateFrequencyFromPoint = useCallback((clientX: number, clientY: number) => {
    if (!knobRef.current) return;

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = centerY - clientY; // invert Y axis for screen coords

    // Calculate raw angle from cursor position (-180 to 180, 0° = east)
    let rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Handle dead zone (bottom semicircle): snap to nearest valid edge
    // Valid range is -135° to 135° (top semicircle)
    if (rawAngle < START_ANGLE || rawAngle > END_ANGLE) {
      // Calculate distance to both edges considering circular nature
      const distToStart = Math.abs(rawAngle - START_ANGLE);
      const distToEnd = Math.abs(rawAngle - END_ANGLE);

      // For angles in the dead zone, pick the closer edge
      rawAngle = distToStart < distToEnd ? START_ANGLE : END_ANGLE;
    }

    const newFrequency = angleToFrequency(rawAngle);
    scheduleFrequencyUpdate(Number(newFrequency.toFixed(1)));
  }, [angleToFrequency, scheduleFrequencyUpdate]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsRotating(true);
    setIsTuning(true);
    knobRef.current?.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    updateFrequencyFromPoint(event.clientX, event.clientY);
  }, [setIsTuning, updateFrequencyFromPoint]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isRotating) return;
    updateFrequencyFromPoint(event.clientX, event.clientY);
  }, [isRotating, updateFrequencyFromPoint]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    knobRef.current?.releasePointerCapture(event.pointerId);
    setIsRotating(false);
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
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = clamp(currentFrequency - 0.1, MIN_FREQ, MAX_FREQ);
      setIsTuning(true);
      setFrequency(parseFloat(next.toFixed(1)));
      setTimeout(() => setIsTuning(false), 150);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = clamp(currentFrequency + 0.1, MIN_FREQ, MAX_FREQ);
      setIsTuning(true);
      setFrequency(parseFloat(next.toFixed(1)));
      setTimeout(() => setIsTuning(false), 150);
    }
  }, [currentFrequency, setFrequency, setIsTuning]);

  useEffect(() => {
    if (!isRotating) {
      setIsTuning(false);
    }
  }, [isRotating, setIsTuning]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Overdrive detection mirrors previous behaviour
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

  const knobAngle = useMemo(() => frequencyToAngle(currentFrequency), [currentFrequency, frequencyToAngle]);

  const tickMarks = useMemo(() => {
    const ticks: Array<{ angle: number; isMajor: boolean; color?: string; freq: number }> = [];
    const minorDivisions = 10; // 每1MHz分成10个小刻度，即0.1MHz步进

    // 检查频率是否接近信号频率
    const getSignalColor = (freq: number) => {
      for (const signal of SIGNALS) {
        if (Math.abs(freq - signal.freq) < 0.05) {
          return signal.accentColor;
        }
      }
      return null;
    };

    // 生成刻度：每0.1MHz一个小刻度，每1MHz一个大刻度
    for (let f = MIN_FREQ; f <= MAX_FREQ + 0.01; f += 0.1) {
      const freq = Number(f.toFixed(1));
      const isMajor = Math.abs(freq - Math.round(freq)) < 0.01;
      const color = getSignalColor(freq);

      ticks.push({
        angle: frequencyToAngle(freq),
        isMajor,
        freq,
        color: color || undefined
      });
    }

    return ticks;
  }, [frequencyToAngle]);

  return (
    <div className="h-full flex flex-col p-6 gap-8">
      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <div className="relative flex items-center justify-center w-80 h-80">
          {/* Tick marks around the dial */}
          <div className="absolute inset-6 pointer-events-none">
            {tickMarks.map((tick, index) => (
              <div
                key={`tick-${index}`}
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  height: '50%',
                  transform: `translate(-50%, -100%) rotate(${tick.angle}deg)`,
                }}
              >
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 ${tick.isMajor ? 'w-0.5 h-4' : 'w-px h-2'}`}
                  style={{
                    backgroundColor: tick.color || (tick.isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'),
                    boxShadow: tick.color ? `0 0 10px ${tick.color}, 0 0 20px ${tick.color}` : 'none'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main dial */}
          <div className="relative w-64 h-64">
            <div
              ref={knobRef}
              role="slider"
              aria-label="frequency tuner knob"
              aria-valuemin={MIN_FREQ}
              aria-valuemax={MAX_FREQ}
              aria-valuenow={currentFrequency}
              aria-valuetext={formatFrequency(currentFrequency)}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              onKeyDown={handleKeyDown}
              className={`relative w-full h-full rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 shadow-[0_10px_50px_rgba(0,0,0,0.8)] ${isRotating ? 'cursor-grabbing' : 'cursor-grab'} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 touch-none select-none`}
            >
              {/* Metallic shine */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)]" />

              {/* Inner ring */}
              <div className="absolute inset-8 rounded-full border border-white/5" />

              {/* Red indicator needle */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `rotate(${knobAngle}deg)` }}
              >
                <div className="absolute left-1/2 top-8 h-16 w-1 -translate-x-1/2 bg-gradient-to-b from-red-500 to-red-700 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
              </div>

              {/* Center cap */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 shadow-inner" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm rounded-md border border-white/10 bg-black/70 px-6 py-4 text-center shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="text-[10px] uppercase tracking-[0.45em] text-white/50">current frequency</div>
          <div className="mt-3 text-4xl font-semibold tracking-[0.18em] text-white">{currentFrequency.toFixed(1)}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.5em] text-white/40">MHz</div>
        </div>
      </div>
    </div>
  );
}
