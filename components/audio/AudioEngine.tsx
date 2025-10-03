'use client';

import { useEffect, useRef } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal, getSignalState } from '@/lib/signals';

export default function AudioEngine() {
  const { currentFrequency, isTuning } = useScannerStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientSourceRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize Web Audio on first user interaction
  const initAudio = () => {
    if (isInitializedRef.current) return;

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create noise generator
      const bufferSize = 2 * audioContext.sampleRate;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseGain = audioContext.createGain();
      noiseGain.gain.value = 0;
      noiseGainRef.current = noiseGain;

      const createNoiseSource = () => {
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        // Add filter for more interesting noise
        const filter = audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseSource.start();

        return noiseSource;
      };

      noiseNodeRef.current = createNoiseSource();

      // Create gain for ambient track
      const ambientGain = audioContext.createGain();
      ambientGain.gain.value = 0;
      ambientGainRef.current = ambientGain;

      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  // Handle frequency changes
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!audioContextRef.current || !noiseGainRef.current || !ambientGainRef.current) return;

    const { signal, clarity } = findClosestSignal(currentFrequency);
    const signalState = getSignalState(clarity);

    // Adjust noise volume (inverse of clarity)
    const noiseVolume = Math.max(0, (1 - clarity) * 0.1);
    noiseGainRef.current.gain.linearRampToValueAtTime(
      noiseVolume,
      audioContextRef.current.currentTime + 0.2
    );

    // Adjust ambient volume (proportional to clarity)
    const ambientVolume = Math.max(0, Math.min(1, (clarity - 0.3) / 0.7)) * 0.3;
    ambientGainRef.current.gain.linearRampToValueAtTime(
      ambientVolume,
      audioContextRef.current.currentTime + 0.5
    );

    // TODO: Load and play signal-specific ambient track
    // For now, we just adjust the gain

  }, [currentFrequency]);

  // Initialize audio on mount (requires user interaction)
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (ambientSourceRef.current) {
        ambientSourceRef.current.pause();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
