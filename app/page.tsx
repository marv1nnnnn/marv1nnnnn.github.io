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
      <header className={`relative border-b-6 px-6 py-2 overflow-hidden ${isOverdrive ? 'border-brutal-pink bg-brutal-pink/20' : 'border-black bg-white'}`}>
        <div className="relative z-10 flex flex-col">
          <RotatingBillboard />
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-brutal-gray">
        {/* Scanner Controls Panel */}
        <div
          className={`
            transition-all duration-200
            border-black bg-white
            md:h-auto md:w-80 md:border-b-0 md:border-r-6
            ${isPanelCollapsed
              ? 'h-0 border-b-0 overflow-hidden'
              : 'h-[50vh] border-b-6'
            }
          `}
        >
          <ScannerPanel />
        </div>

        {/* Display Screen Panel */}
        <div className="flex-1 bg-brutal-gray overflow-y-auto">
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
            w-16 h-16
            flex items-center justify-center
            border-6 border-black
            bg-brutal-pink
            shadow-brutal-lg
            hover:bg-black hover:text-brutal-pink
            transition-none
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
