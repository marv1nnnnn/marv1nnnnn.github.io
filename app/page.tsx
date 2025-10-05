'use client';

import { useScannerStore } from '@/store/scanner';
import ScannerPanel from '@/components/scanner/ScannerPanel';
import DisplayScreen from '@/components/scanner/DisplayScreen';
import AudioEngine from '@/components/audio/AudioEngine';
import RotatingBillboard from '@/components/RotatingBillboard';
import CRTOverlay from '@/components/effects/CRTOverlay';

export default function Home() {
  const isOverdrive = useScannerStore((state) => state.isOverdrive);
  const isPanelCollapsed = useScannerStore((state) => state.isPanelCollapsed);
  const setIsPanelCollapsed = useScannerStore((state) => state.setIsPanelCollapsed);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Marvin',
    jobTitle: 'Creative Technologist',
    description: 'Designer and creative technologist exploring narrative systems and experiential web installations',
    url: 'https://marv1nnnnn.github.io',
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={`relative h-screen flex flex-col bg-gradient-to-br from-black via-[#0f0f10] to-[#17171c] text-white transition-all noise-overlay ${isOverdrive ? 'overdrive' : ''}`}>
      {/* CRT Screen Effect - intensified in overdrive */}
      <CRTOverlay intensity={isOverdrive ? 0.5 : 0.25} />

      {/* Audio Engine */}
      <AudioEngine />

      {/* Header */}
      <header className={`relative border-b px-6 py-4 overflow-hidden ${isOverdrive ? 'border-red-500/70 bg-red-600/20' : 'border-white/10 bg-black/60'}`}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
        <div className="pointer-events-none absolute -left-10 top-0 h-full w-72 -skew-x-12 bg-scanner-glow/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4">
          <RotatingBillboard />
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Scanner Controls Panel */}
        <div
          className={`
            transition-all duration-300 ease-in-out
            border-white/10 bg-black/50 backdrop-blur-sm
            md:h-auto md:w-80 md:border-b-0 md:border-r
            ${isPanelCollapsed
              ? 'h-0 border-b-0 overflow-hidden'
              : 'h-[50vh] border-b'
            }
          `}
        >
          <ScannerPanel />
        </div>

        {/* Display Screen Panel */}
        <div className="flex-1 bg-black/30 backdrop-blur overflow-y-auto">
          <DisplayScreen />
        </div>

        {/* Mobile Tuner Toggle Button */}
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className={`
            fixed bottom-6 right-6 z-50
            w-14 h-14 rounded-full
            flex items-center justify-center
            border-2 border-white/20
            bg-gradient-to-br from-zinc-800 via-zinc-900 to-black
            shadow-[0_0_30px_rgba(0,0,0,0.8)]
            hover:border-scanner-glow/50
            transition-all duration-300
            md:hidden
            ${isPanelCollapsed ? 'shadow-[0_0_20px_rgba(127,255,212,0.4)]' : ''}
          `}
          aria-label={isPanelCollapsed ? 'Show tuner' : 'Hide tuner'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-6 h-6 text-scanner-glow transition-transform duration-300 ${
              isPanelCollapsed ? 'rotate-180' : ''
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={isPanelCollapsed
                ? "M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                : "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              }
            />
          </svg>
        </button>
      </div>
    </main>
    </>
  );
}
