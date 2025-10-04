'use client';

import { useScannerStore } from '@/store/scanner';
import ScannerPanel from '@/components/scanner/ScannerPanel';
import DisplayScreen from '@/components/scanner/DisplayScreen';
import AudioEngine from '@/components/audio/AudioEngine';
import RotatingBillboard from '@/components/RotatingBillboard';

export default function Home() {
  const isOverdrive = useScannerStore((state) => state.isOverdrive);

  return (
    <main className={`relative h-screen flex flex-col bg-gradient-to-br from-black via-[#0f0f10] to-[#17171c] text-white transition-all noise-overlay ${isOverdrive ? 'overdrive' : ''}`}>
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

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scanner Controls */}
        <div className="w-80 border-r border-white/10 bg-black/50 backdrop-blur-sm">
          <ScannerPanel />
        </div>

        {/* Right Panel - Display Screen */}
        <div className="flex-1 bg-black/30 backdrop-blur">
          <DisplayScreen />
        </div>
      </div>
    </main>
  );
}
