import React from 'react';

export default function FluidBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden">
      {/* Base swampy/sepia subtle gradient for the Southern Gothic feel */}
      <div className="absolute inset-0 opacity-80 mix-blend-screen"
           style={{
             background: 'radial-gradient(circle at 50% 50%, rgba(120, 110, 90, 0.15) 0%, rgba(5, 5, 5, 0) 80%)',
           }}
      />

      {/* Slow moving stretched smoke/fog texture (True Detective intro style) */}
      <div className="fluid-texture absolute inset-[-50%] w-[200%] h-[200%] opacity-[0.3] mix-blend-screen"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.002 0.004' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             backgroundSize: 'cover',
             animation: 'flow-texture 90s linear infinite',
           }}
      />

      {/* Secondary texture layer for depth (moving opposite direction, like ash or double exposure) */}
      <div className="fluid-texture absolute inset-[-50%] w-[200%] h-[200%] opacity-[0.25] mix-blend-color-dodge"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005 0.001' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E")`,
             backgroundSize: 'cover',
             animation: 'flow-texture-reverse 120s linear infinite',
           }}
      />

      {/* Subtle warm/fire pulse (like a distant burning field) */}
      <div className="fluid-texture absolute inset-0 opacity-60 mix-blend-overlay"
           style={{
             background: 'radial-gradient(circle at 30% 70%, rgba(180, 100, 50, 0.15) 0%, transparent 60%)',
             animation: 'pulse-glow 15s ease-in-out infinite alternate',
           }}
      />
    </div>
  );
}
