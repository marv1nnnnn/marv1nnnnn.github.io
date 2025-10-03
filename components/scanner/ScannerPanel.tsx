'use client';

import { useState, useRef, useEffect } from 'react';
import { useScannerStore } from '@/store/scanner';
import { SIGNALS } from '@/lib/signals';

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;

export default function ScannerPanel() {
  const { currentFrequency, setFrequency, setIsTuning, setIsOverdrive } = useScannerStore();
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const overdriveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateFrequency = (clientY: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, y / rect.height));

    // Invert because top = high frequency, bottom = low frequency
    const freq = MAX_FREQ - (percentage * (MAX_FREQ - MIN_FREQ));
    setFrequency(Math.round(freq * 10) / 10); // Round to 1 decimal
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsTuning(true);
    updateFrequency(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateFrequency(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsTuning(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setIsTuning]);

  // Overdrive detection
  useEffect(() => {
    const isAtExtreme = currentFrequency === MIN_FREQ || currentFrequency === MAX_FREQ;

    if (isAtExtreme) {
      // Start overdrive timer
      if (!overdriveTimerRef.current) {
        overdriveTimerRef.current = setTimeout(() => {
          setIsOverdrive(true);
        }, 1000);
      }
    } else {
      // Clear timer and reset overdrive
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

  // Calculate slider position (inverted)
  const sliderPosition = ((MAX_FREQ - currentFrequency) / (MAX_FREQ - MIN_FREQ)) * 100;

  // Get signal label
  const getSignalLabel = (id: string) => {
    const labels: Record<string, string> = {
      'about': 'ABOUT',
      'project-1': 'PROJ',
      'log': 'LOG',
      'contact': 'CONTACT',
    };
    return labels[id] || id.charAt(0).toUpperCase();
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Title */}
      <div className="mb-8 pb-4 border-b border-scanner-text/30">
        <h2 className="text-2xl phosphor-text tracking-wider">
          FREQUENCY TUNER
        </h2>
        <p className="text-sm opacity-50 mt-2">
          DRAG TO SCAN SPECTRUM
        </p>
      </div>

      {/* Vertical Slider */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-4 h-full max-h-[600px] items-center">
          {/* Frequency Scale */}
          <div className="flex flex-col justify-between h-full text-right text-sm opacity-70">
            <span className="phosphor-text">{MAX_FREQ}</span>
            <span>106</span>
            <span>104</span>
            <span>102</span>
            <span className="phosphor-text">100</span>
            <span>98</span>
            <span>96</span>
            <span>94</span>
            <span className="phosphor-text">92</span>
            <span>90</span>
            <span className="phosphor-text">{MIN_FREQ}</span>
          </div>

          {/* Slider Track */}
          <div
            ref={sliderRef}
            className="relative h-full w-3 bg-scanner-text/20 cursor-pointer border border-scanner-text/50 hover:border-scanner-glow/50 transition-colors"
            onMouseDown={handleMouseDown}
          >
            {/* Signal Indicators */}
            {SIGNALS.map((signal) => {
              const signalPosition = ((MAX_FREQ - signal.freq) / (MAX_FREQ - MIN_FREQ)) * 100;
              return (
                <div
                  key={signal.id}
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ top: `${signalPosition}%` }}
                >
                  {/* Signal marker - thicker and more visible */}
                  <div className="w-6 h-1 bg-scanner-glow shadow-[0_0_4px_rgba(127,255,212,0.6)] -ml-1.5"></div>
                </div>
              );
            })}

            {/* Slider Handle */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-12 h-8 -ml-px transition-all duration-75"
              style={{ top: `${sliderPosition}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className={`
                w-full h-full border-2 border-scanner-glow bg-scanner-panel
                shadow-[0_0_10px_rgba(127,255,212,0.5)]
                ${isDragging ? 'scale-110 shadow-[0_0_20px_rgba(127,255,212,0.8)]' : ''}
                transition-all duration-100
              `}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-scanner-glow"></div>
                </div>
              </div>
            </div>

            {/* Frequency Indicator Line */}
            <div
              className="absolute left-0 w-full h-0.5 bg-scanner-glow pointer-events-none"
              style={{ top: `${sliderPosition}%` }}
            ></div>
          </div>

          {/* Signal Labels */}
          <div className="relative h-full">
            {SIGNALS.map((signal) => {
              const signalPosition = ((MAX_FREQ - signal.freq) / (MAX_FREQ - MIN_FREQ)) * 100;
              return (
                <div
                  key={signal.id}
                  className="absolute left-0"
                  style={{
                    top: `${signalPosition}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  <div className="text-scanner-glow phosphor-text text-sm font-bold tracking-wider whitespace-nowrap">
                    {getSignalLabel(signal.id)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-8 pt-4 border-t border-scanner-text/30">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isDragging ? 'bg-scanner-glow animate-pulse' : 'bg-scanner-text/30'}`}></div>
          <span className="text-sm">
            {isDragging ? 'TUNING...' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
}
