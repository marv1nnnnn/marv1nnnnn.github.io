'use client';

import { useEffect, useRef } from 'react';
import { useScannerStore } from '@/store/scanner';

export default function AudioVisualizerSync() {
  const audioAnalyser = useScannerStore((state) => state.audioAnalyser);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioAnalyser) return;

    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
    
    const update = () => {
      audioAnalyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume (0-255)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedAverage = average / 255; // 0 to 1

      // Drive global CSS variables
      document.documentElement.style.setProperty('--audio-avg', normalizedAverage.toString());
      document.documentElement.style.setProperty('--audio-pulse', (1 + normalizedAverage * 0.1).toString());
      
      // Get bass (lower frequencies)
      let bassSum = 0;
      const bassRange = Math.floor(dataArray.length * 0.2);
      for (let i = 0; i < bassRange; i++) {
        bassSum += dataArray[i];
      }
      const bassAvg = (bassSum / bassRange) / 255;
      document.documentElement.style.setProperty('--audio-bass', bassAvg.toString());

      rafRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioAnalyser]);

  return null;
}
