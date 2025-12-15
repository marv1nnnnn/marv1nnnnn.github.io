'use client';

import { useEffect, useRef } from 'react';
import { useScannerStore } from '@/store/scanner';

interface WaveformVisualizerProps {
  className?: string;
  color?: string;
}

export default function WaveformVisualizer({ className = '', color = '#00FFFF' }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioAnalyser = useScannerStore((state) => state.audioAnalyser);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || !audioAnalyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      audioAnalyser.getByteTimeDomainData(dataArray);

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioAnalyser, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={50} 
      className={`w-full h-full ${className}`}
    />
  );
}

