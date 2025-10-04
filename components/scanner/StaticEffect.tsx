'use client';

import { useRef, useEffect } from 'react';
import { useScannerStore } from '@/store/scanner';

interface StaticEffectProps {
  intensity?: number; // 0.0 to 1.0
}

export default function StaticEffect({ intensity = 1.0 }: StaticEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const { isTuning, currentFrequency } = useScannerStore();

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

    // Pattern generation functions
    const patterns = {
      // GEOMETRIC PATTERNS
      spiral: (nx: number, ny: number, time: number) => {
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const angle = Math.atan2(cy, cx);
        const radius = Math.sqrt(cx * cx + cy * cy);
        return Math.sin(angle * 5 + radius * 20 - time * 2);
      },

      concentricCircles: (nx: number, ny: number, time: number) => {
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const dist = Math.sqrt(cx * cx + cy * cy);
        return Math.sin(dist * 30 - time * 3);
      },

      sunburst: (nx: number, ny: number, time: number) => {
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const angle = Math.atan2(cy, cx);
        const radius = Math.sqrt(cx * cx + cy * cy);
        return Math.sin(angle * 12 + time) * Math.cos(radius * 10 - time);
      },

      voronoi: (nx: number, ny: number, time: number, seed: number) => {
        const points = 8;
        let minDist = Infinity;
        for (let i = 0; i < points; i++) {
          const px = Math.sin(i * 2.3 + time * 0.5 + seed) * 0.4 + 0.5;
          const py = Math.cos(i * 3.1 + time * 0.3 + seed) * 0.4 + 0.5;
          const dist = Math.sqrt((nx - px) ** 2 + (ny - py) ** 2);
          minDist = Math.min(minDist, dist);
        }
        return Math.sin(minDist * 40);
      },

      // MATHEMATICAL/FRACTAL PATTERNS
      sierpinski: (nx: number, ny: number, time: number) => {
        const x = Math.floor(nx * 256 + time * 10) % 256;
        const y = Math.floor(ny * 256 + time * 10) % 256;
        return (x & y) === 0 ? 1 : -1;
      },

      cellularAutomata: (nx: number, ny: number, frameCount: number) => {
        const x = Math.floor(nx * 64);
        const y = Math.floor(ny * 64);
        const rule = ((x + y + frameCount) * 31) % 2;
        return rule === 0 ? -1 : 1;
      },

      perlinFlow: (nx: number, ny: number, time: number) => {
        const noise = Math.sin(nx * 7.3 + time) * Math.cos(ny * 5.7 - time) +
                     Math.sin(nx * 3.1 - time * 0.7) * Math.cos(ny * 8.2 + time * 0.5);
        return noise;
      },

      recursiveSubdivision: (nx: number, ny: number, time: number) => {
        let value = 0;
        for (let i = 1; i <= 4; i++) {
          const scale = Math.pow(2, i);
          value += Math.sin(nx * scale * 5 + time * i * 0.5) * Math.cos(ny * scale * 5 - time * i * 0.3) / i;
        }
        return value;
      },

      // TRANSMISSION-THEMED PATTERNS
      radioWaves: (nx: number, ny: number, time: number) => {
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const dist = Math.sqrt(cx * cx + cy * cy);
        const wave1 = Math.sin(dist * 25 - time * 4);
        const wave2 = Math.sin(dist * 15 + time * 2);
        return (wave1 + wave2) / 2;
      },

      spectrumBars: (nx: number, ny: number, time: number) => {
        const barIndex = Math.floor(nx * 16);
        const barHeight = (Math.sin(barIndex * 0.5 + time * 3) + 1) / 2;
        return ny > (1 - barHeight) ? 1 : -1;
      },

      moirePattern: (nx: number, ny: number, time: number) => {
        const pattern1 = Math.sin(nx * 40 + time);
        const pattern2 = Math.sin((nx + 0.1) * 40 - time * 0.5);
        return pattern1 * pattern2;
      },

      testPattern: (nx: number, ny: number) => {
        const cx = Math.abs(nx - 0.5);
        const cy = Math.abs(ny - 0.5);
        const crosshair = (cx < 0.01 || cy < 0.01) ? 1 : -1;
        const circle = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2);
        const circleRing = (circle > 0.3 && circle < 0.32) ? 1 : crosshair;
        return circleRing;
      },

      // WTF ANOMALY PATTERNS
      hiddenEyes: (nx: number, ny: number, time: number) => {
        const eye1x = 0.35, eye1y = 0.4;
        const eye2x = 0.65, eye2y = 0.4;
        const eyeSize = 0.08;

        const dist1 = Math.sqrt((nx - eye1x) ** 2 + (ny - eye1y) ** 2);
        const dist2 = Math.sqrt((nx - eye2x) ** 2 + (ny - eye2y) ** 2);

        const pupil1 = dist1 < eyeSize * 0.3 ? 1 : (dist1 < eyeSize ? -1 : 0);
        const pupil2 = dist2 < eyeSize * 0.3 ? 1 : (dist2 < eyeSize ? -1 : 0);

        return pupil1 || pupil2 || Math.sin(nx * 50 + time) * Math.cos(ny * 50 - time);
      },

      glitchedFace: (nx: number, ny: number, time: number) => {
        const faceCircle = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) < 0.3 ? 1 : -1;
        const mouth = (ny > 0.6 && ny < 0.65 && nx > 0.3 && nx < 0.7) ? -1 : 0;
        const glitch = Math.random() > 0.7 ? Math.random() > 0.5 ? 1 : -1 : 0;
        return faceCircle + mouth + glitch;
      },

      fakeQR: (nx: number, ny: number, seed: number) => {
        const gridX = Math.floor(nx * 16);
        const gridY = Math.floor(ny * 16);
        const hash = (gridX * 31 + gridY * 37 + seed) % 2;
        return hash === 0 ? -1 : 1;
      },

      crypticRunes: (nx: number, ny: number, time: number) => {
        const runeX = Math.floor(nx * 8);
        const runeY = Math.floor(ny * 6);
        const runeHash = (runeX * 17 + runeY * 23 + Math.floor(time * 0.5)) % 5;

        const localX = (nx * 8) % 1;
        const localY = (ny * 6) % 1;

        if (runeHash === 0 && localX > 0.3 && localX < 0.7 && localY > 0.2 && localY < 0.8) return 1;
        if (runeHash === 1 && (localX < 0.3 || localX > 0.7)) return 1;
        return -1;
      },

      helpText: (nx: number, ny: number, time: number) => {
        const texts = ['HELP', 'SIGNAL LOST', 'ERROR', 'TRANSMISSION FAILED'];
        const textIndex = Math.floor(time / 3) % texts.length;

        // Simple text-like patterns
        const charX = Math.floor(nx * 20);
        const charY = Math.floor(ny * 10);
        const inTextRegion = (charY === 5 && charX > 5 && charX < 15);

        return inTextRegion && (charX + charY + Math.floor(time)) % 2 === 0 ? 1 : -1;
      },

      // DRAG-ONLY TRANSITION EFFECTS
      tunnelWarp: (nx: number, ny: number, time: number) => {
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const angle = Math.atan2(cy, cx);
        const radius = Math.sqrt(cx * cx + cy * cy);
        const warp = Math.sin(angle * 8 - radius * 20 + time * 5);
        return warp;
      },

      matrixRain: (nx: number, ny: number, time: number) => {
        const col = Math.floor(nx * 20);
        const speed = (col * 0.3 + 1);
        const y = (ny + time * speed) % 1.2;
        const trail = Math.exp(-y * 5);
        return trail * Math.sin(col * 3 + time) > 0.3 ? 1 : -1;
      },

      lightning: (nx: number, ny: number, time: number, seed: number) => {
        const branches = 3;
        let value = -1;

        for (let i = 0; i < branches; i++) {
          const branchX = 0.5 + Math.sin(i * 2 + seed) * 0.2;
          const branchY = (time * 0.5 + i * 0.3) % 1;
          const dist = Math.abs(nx - branchX) + Math.abs(ny - branchY) * 0.5;

          if (dist < 0.05) value = 1;
        }

        return value;
      },

      barcodeSweep: (nx: number, ny: number, time: number) => {
        const sweepPos = (time * 0.3) % 1;
        const inSweep = Math.abs(ny - sweepPos) < 0.1;
        const barcode = Math.floor(nx * 40) % 2 === 0 ? 1 : -1;
        return inSweep ? barcode : Math.sin(nx * 20) * Math.cos(ny * 20);
      },

      screenTear: (nx: number, ny: number, time: number) => {
        const tearY = (Math.sin(time * 2) + 1) / 2;
        const tearHeight = 0.1;

        if (Math.abs(ny - tearY) < tearHeight) {
          const offset = Math.sin(ny * 50 + time * 10) * 0.2;
          const shiftedX = (nx + offset) % 1;
          return Math.sin(shiftedX * 30);
        }

        return Math.sin(nx * 15) * Math.cos(ny * 15);
      },
    };

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      time += 0.02 * intensity;
      frameCount++;

      // At high intensity, add more chaos and randomness
      const chaos = intensity * 0.8 + Math.random() * 0.2;

      // Pattern selection based on timestamp (changes every 2 seconds)
      const patternSeed = Math.floor(Date.now() / 2000);

      // Detect cursed frequency (99.9 MHz ± 0.1)
      const isCursedFrequency = Math.abs(currentFrequency - 99.9) < 0.1;

      // Determine which pattern to use
      let selectedPattern: string | null = null;

      if (isTuning) {
        // Only show special patterns during dragging
        if (isCursedFrequency) {
          // Force WTF patterns at cursed frequency
          const cursedPatterns = ['hiddenEyes', 'glitchedFace', 'fakeQR', 'crypticRunes', 'helpText'];
          selectedPattern = cursedPatterns[patternSeed % cursedPatterns.length];
        } else {
          // Random pattern selection with weighted categories
          const rand = (patternSeed * 31) % 100;

          if (rand < 3) {
            // 3% chance: WTF anomaly patterns
            const wtfPatterns = ['hiddenEyes', 'glitchedFace', 'fakeQR', 'crypticRunes', 'helpText'];
            selectedPattern = wtfPatterns[(patternSeed * 17) % wtfPatterns.length];
          } else if (rand < 25) {
            // 22% chance: Geometric patterns
            const geoPatterns = ['spiral', 'concentricCircles', 'sunburst', 'voronoi'];
            selectedPattern = geoPatterns[(patternSeed * 13) % geoPatterns.length];
          } else if (rand < 45) {
            // 20% chance: Mathematical/fractal patterns
            const mathPatterns = ['sierpinski', 'cellularAutomata', 'perlinFlow', 'recursiveSubdivision'];
            selectedPattern = mathPatterns[(patternSeed * 19) % mathPatterns.length];
          } else if (rand < 65) {
            // 20% chance: Transmission-themed patterns
            const txPatterns = ['radioWaves', 'spectrumBars', 'moirePattern', 'testPattern'];
            selectedPattern = txPatterns[(patternSeed * 23) % txPatterns.length];
          } else {
            // 35% chance: Drag-only transition effects
            const transitionPatterns = ['tunnelWarp', 'matrixRain', 'lightning', 'barcodeSweep', 'screenTear'];
            selectedPattern = transitionPatterns[(patternSeed * 29) % transitionPatterns.length];
          }
        }
      }

      // Mix of different pattern types based on intensity
      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          const nx = x / width;
          const ny = y / height;

          let value;

          // Use selected pattern if tuning, otherwise use original patterns
          if (selectedPattern && isTuning) {
            // Call the selected pattern function
            const patternFunc = patterns[selectedPattern as keyof typeof patterns];
            if (patternFunc) {
              // @ts-ignore - pattern functions have varying signatures
              const patternValue = patternFunc(nx, ny, time, patternSeed);
              value = (patternValue + 1) / 2; // Normalize to 0-1
            } else {
              value = Math.random();
            }
          } else {
            // Original fallback patterns
            const patternChoice = Math.random();

            if (chaos > 0.8 && patternChoice < 0.3) {
              // Pure random static at high intensity
              value = Math.random();
            } else if (patternChoice < 0.6) {
              // Organic swirling patterns
              const wave1 = Math.sin(nx * 10 + time) * Math.cos(ny * 10 + time);
              const wave2 = Math.sin(nx * 5 - time * 0.7) * Math.cos(ny * 5 - time * 0.7);
              const wave3 = Math.sin((nx + ny) * 8 + time * 0.5);
              const wave4 = Math.sin(nx * 15 + ny * 15 + time * 1.5) * chaos;

              const combined = (wave1 + wave2 * 0.5 + wave3 * 0.3 + wave4 * 0.6) / 2.4;
              value = (combined + 1) / 2;
            } else {
              // Interference patterns (grid-like)
              const grid1 = Math.sin(nx * 20 + time * 2) * Math.sin(ny * 20 - time * 2);
              const noise = Math.random() * 0.3 * chaos;
              value = ((grid1 + 1) / 2) + noise;
            }
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
  }, [intensity, isTuning, currentFrequency]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
