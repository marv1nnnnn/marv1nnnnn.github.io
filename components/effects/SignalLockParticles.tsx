'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignalLockParticlesProps {
  isLocked: boolean;
  accentColor?: string;
}

export default function SignalLockParticles({ isLocked, accentColor = '#7FFFD4' }: SignalLockParticlesProps) {
  const [showBurst, setShowBurst] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number }>>([]);

  useEffect(() => {
    if (isLocked) {
      // Trigger particle burst
      setShowBurst(true);

      // Generate random particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (i / 20) * 360 + Math.random() * 18, // Evenly distributed with slight randomness
        distance: 60 + Math.random() * 40, // Random distance 60-100px
      }));

      setParticles(newParticles);

      // Reset after animation
      const timeout = setTimeout(() => {
        setShowBurst(false);
        setParticles([]);
      }, 600);

      return () => clearTimeout(timeout);
    }
  }, [isLocked]);

  return (
    <AnimatePresence>
      {showBurst && (
        <div className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center">
          {/* Center flash */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute h-32 w-32 rounded-full"
            style={{
              background: `radial-gradient(circle, ${accentColor}99, transparent 70%)`,
              boxShadow: `0 0 60px ${accentColor}`,
            }}
          />

          {/* Particles */}
          {particles.map((particle) => {
            const radians = (particle.angle * Math.PI) / 180;
            const x = Math.cos(radians) * particle.distance;
            const y = Math.sin(radians) * particle.distance;

            return (
              <motion.div
                key={particle.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x,
                  y,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
              />
            );
          })}

          {/* Ring expansion */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute h-24 w-24 rounded-full border-2"
            style={{
              borderColor: accentColor,
              boxShadow: `0 0 20px ${accentColor}`,
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
