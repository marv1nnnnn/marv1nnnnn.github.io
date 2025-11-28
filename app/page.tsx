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
      <main className={`relative h-screen flex flex-col bg-white text-black ${isOverdrive ? 'overdrive' : ''}`}>
      {/* CRT Screen Effect - reduced in brutal mode */}
      <CRTOverlay intensity={isOverdrive ? 0.3 : 0.1} />

      {/* Audio Engine */}
      <AudioEngine />

      {/* Header */}
      <header className={`relative border-b-4 border-black px-4 py-2 overflow-hidden ${isOverdrive ? 'bg-brutal-pink/20' : 'bg-white'}`}>
        <div className="relative z-10 flex flex-col">
          <RotatingBillboard />
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-brutal-off-white">
        {/* Scanner Controls Panel */}
        <div
          className={`
            transition-all duration-300 ease-in-out
            border-black bg-white z-30
            md:relative md:h-auto md:w-80 md:border-b-0 md:border-r-4
            ${isPanelCollapsed
              ? 'h-0 border-b-0 overflow-hidden opacity-0 md:opacity-100 md:h-auto'
              : 'h-[50vh] border-b-4 opacity-100'
            }
          `}
        >
          <ScannerPanel />
        </div>

        {/* Display Screen Panel */}
        <div className="flex-1 bg-brutal-off-white overflow-hidden relative z-20">
          <DisplayScreen />
        </div>

        {/* Mobile Tuner Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsPanelCollapsed(!isPanelCollapsed);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`
            fixed bottom-6 right-6 z-50
            w-14 h-14
            flex items-center justify-center
            border-brutal
            bg-brutal-pink text-black
            shadow-brutal
            active:shadow-none active:translate-x-[6px] active:translate-y-[6px]
            hover:bg-black hover:text-brutal-pink
            transition-all duration-100
            md:hidden
            font-black text-2xl
          `}
          aria-label={isPanelCollapsed ? 'Show tuner' : 'Hide tuner'}
        >
          {isPanelCollapsed ? '↑' : '↓'}
        </button>
      </div>
    </main>
    </>
  );
}
