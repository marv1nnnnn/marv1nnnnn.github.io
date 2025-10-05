'use client';

import { useEffect, useRef } from 'react';
import { useScannerStore } from '@/store/scanner';
import { findClosestSignal } from '@/lib/signals';

export default function AudioEngine() {
  const { currentFrequency, isTuning } = useScannerStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
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

      isInitializedRef.current = true;
      console.log('🔊 White noise initialized!');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  // Handle frequency changes - adjust noise volume based on signal clarity and tuning state
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!audioContextRef.current || !noiseGainRef.current) return;

    const { clarity } = findClosestSignal(currentFrequency);

    // Adjust noise volume based on clarity (inverse relationship)
    // Louder when far from signal, quieter when near target frequency
    let noiseVolume: number;
    if (isTuning) {
      // While tuning: dynamic noise that decreases as you approach a signal
      // Near signal (clarity ~1): very quiet (0.05)
      // Far from signal (clarity ~0): loud (0.45)
      noiseVolume = 0.05 + (1 - clarity) * 0.4;
    } else {
      // When idle: subtle noise based on clarity
      noiseVolume = Math.max(0, (1 - clarity) * 0.1);
    }

    noiseGainRef.current.gain.linearRampToValueAtTime(
      noiseVolume,
      audioContextRef.current.currentTime + 0.1
    );
  }, [currentFrequency, isTuning]);

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
    };
  }, []);

  return null; // This component doesn't render anything
}
