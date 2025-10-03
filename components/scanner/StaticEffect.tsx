'use client';

import { useRef, useEffect } from 'react';

interface StaticEffectProps {
  intensity?: number; // 0.0 to 1.0
}

export default function StaticEffect({ intensity = 1.0 }: StaticEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Bayer matrix for ordered dithering (8x8)
    const bayerMatrix = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21],
    ];

    let time = 0;
    let frameCount = 0;
    const pixelSize = 4;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      time += 0.02 * intensity;
      frameCount++;

      // At high intensity, add more chaos and randomness
      const chaos = intensity * 0.8 + Math.random() * 0.2;

      // Mix of different pattern types based on intensity
      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          const nx = x / width;
          const ny = y / height;

          let value;

          // Random pattern switching for more chaos
          const patternChoice = Math.random();

          if (chaos > 0.8 && patternChoice < 0.3) {
            // Pure random static at high intensity
            value = Math.random();
          } else if (patternChoice < 0.6) {
            // Organic swirling patterns
            const wave1 = Math.sin(nx * 10 + time) * Math.cos(ny * 10 + time);
            const wave2 = Math.sin(nx * 5 - time * 0.7) * Math.cos(ny * 5 - time * 0.7);
            const wave3 = Math.sin((nx + ny) * 8 + time * 0.5);
            const wave4 = Math.sin(nx * 15 + ny * 15 + time * 1.5) * chaos; // New chaotic layer

            const combined = (wave1 + wave2 * 0.5 + wave3 * 0.3 + wave4 * 0.6) / 2.4;
            value = (combined + 1) / 2;
          } else {
            // Interference patterns (grid-like)
            const grid1 = Math.sin(nx * 20 + time * 2) * Math.sin(ny * 20 - time * 2);
            const noise = Math.random() * 0.3 * chaos;
            value = ((grid1 + 1) / 2) + noise;
          }

          // Add random noise spikes
          if (Math.random() < 0.05 * chaos) {
            value = Math.random();
          }

          // Apply intensity with more variation
          const adjustedValue = value * intensity + (1 - intensity) * 0.5 + (Math.random() - 0.5) * 0.1 * chaos;

          // Get threshold from Bayer matrix
          const matrixX = Math.floor(x / pixelSize) % 8;
          const matrixY = Math.floor(y / pixelSize) % 8;
          const threshold = bayerMatrix[matrixY][matrixX] / 64;

          // Dither: pure black or white
          const color = adjustedValue > threshold ? 255 : 0;

          // Fill the pixel block
          for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
            for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
              const index = ((y + dy) * width + (x + dx)) * 4;
              data[index] = color;
              data[index + 1] = color;
              data[index + 2] = color;
              data[index + 3] = 255;
            }
          }
        }
      }

      // Add various glitches and artifacts
      if (intensity > 0.5) {
        // Horizontal scanlines / interference
        if (Math.random() > 0.85) {
          const scanlineY = Math.floor(Math.random() * (height / pixelSize)) * pixelSize;
          const scanlineThickness = pixelSize * (1 + Math.floor(Math.random() * 3));
          for (let x = 0; x < width; x++) {
            for (let dy = 0; dy < scanlineThickness && scanlineY + dy < height; dy++) {
              const index = ((scanlineY + dy) * width + x) * 4;
              const color = Math.random() > 0.5 ? 255 : 0;
              data[index] = color;
              data[index + 1] = color;
              data[index + 2] = color;
            }
          }
        }

        // Vertical glitch bars
        if (Math.random() > 0.9) {
          const barX = Math.floor(Math.random() * (width / pixelSize)) * pixelSize;
          const barWidth = pixelSize * (2 + Math.floor(Math.random() * 5));
          for (let y = 0; y < height; y++) {
            for (let dx = 0; dx < barWidth && barX + dx < width; dx++) {
              const index = (y * width + barX + dx) * 4;
              const color = Math.random() > 0.5 ? 255 : 0;
              data[index] = color;
              data[index + 1] = color;
              data[index + 2] = color;
            }
          }
        }

        // Random block glitches
        if (Math.random() > 0.88) {
          const numBlocks = 2 + Math.floor(Math.random() * 4);
          for (let b = 0; b < numBlocks; b++) {
            const blockX = Math.floor(Math.random() * (width / pixelSize)) * pixelSize;
            const blockY = Math.floor(Math.random() * (height / pixelSize)) * pixelSize;
            const blockSize = pixelSize * (3 + Math.floor(Math.random() * 8));
            const blockColor = Math.random() > 0.5 ? 255 : 0;

            for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
              for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
                const index = ((blockY + dy) * width + (blockX + dx)) * 4;
                data[index] = blockColor;
                data[index + 1] = blockColor;
                data[index + 2] = blockColor;
              }
            }
          }
        }

        // Geometric glyphs
        if (Math.random() > 0.92) {
          const glyphX = Math.floor(Math.random() * (width / pixelSize - 10)) * pixelSize;
          const glyphY = Math.floor(Math.random() * (height / pixelSize - 10)) * pixelSize;
          const glyphSize = pixelSize * (4 + Math.floor(Math.random() * 8));

          const glyphType = Math.floor(Math.random() * 4);

          for (let dy = 0; dy < glyphSize && glyphY + dy < height; dy += pixelSize) {
            for (let dx = 0; dx < glyphSize && glyphX + dx < width; dx += pixelSize) {
              let shouldDraw = false;

              if (glyphType === 0) {
                // Circle
                const centerDist = Math.sqrt(
                  Math.pow(dx - glyphSize / 2, 2) + Math.pow(dy - glyphSize / 2, 2)
                );
                shouldDraw = centerDist < glyphSize / 2 && centerDist > glyphSize / 3;
              } else if (glyphType === 1) {
                // X pattern
                shouldDraw = Math.abs(dx - dy) < pixelSize * 2 || Math.abs(dx - (glyphSize - dy)) < pixelSize * 2;
              } else if (glyphType === 2) {
                // Grid
                shouldDraw = dx % (pixelSize * 2) === 0 || dy % (pixelSize * 2) === 0;
              } else {
                // Checkerboard
                shouldDraw = ((dx / pixelSize) + (dy / pixelSize)) % 2 === 0;
              }

              if (shouldDraw) {
                const index = ((glyphY + dy) * width + (glyphX + dx)) * 4;
                data[index] = 255;
                data[index + 1] = 255;
                data[index + 2] = 255;
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
