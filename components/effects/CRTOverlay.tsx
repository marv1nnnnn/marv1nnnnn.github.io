'use client';

interface CRTOverlayProps {
  intensity?: number; // 0.0 to 1.0
}

export default function CRTOverlay({ intensity = 0.3 }: CRTOverlayProps) {
  return (
    <>
      {/* Scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-[999]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, ${0.05 * intensity}),
            rgba(0, 0, 0, ${0.05 * intensity}) 1px,
            transparent 1px,
            transparent 2px
          )`,
          opacity: intensity,
        }}
      />

      {/* Screen curvature distortion */}
      <div
        className="pointer-events-none fixed inset-0 z-[998]"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 70%,
            rgba(0, 0, 0, ${0.3 * intensity}) 100%
          )`,
          opacity: intensity,
        }}
      />

      {/* Phosphor glow */}
      <div
        className="pointer-events-none fixed inset-0 z-[997] mix-blend-screen"
        style={{
          background: `radial-gradient(
            circle at 50% 50%,
            rgba(127, 255, 212, ${0.08 * intensity}),
            transparent 60%
          )`,
          opacity: intensity * 0.6,
        }}
      />

      {/* Chromatic aberration (RGB split) */}
      <div
        className="pointer-events-none fixed inset-0 z-[996]"
        style={{
          opacity: intensity * 0.15,
          mixBlendMode: 'screen',
          background: `
            radial-gradient(circle at 48% 50%, rgba(255, 0, 0, 0.05), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 255, 0, 0.05), transparent 50%),
            radial-gradient(circle at 52% 50%, rgba(0, 0, 255, 0.05), transparent 50%)
          `,
        }}
      />

      {/* Flicker effect */}
      <div
        className="pointer-events-none fixed inset-0 z-[995] animate-flicker"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          opacity: intensity * 0.5,
        }}
      />
    </>
  );
}
