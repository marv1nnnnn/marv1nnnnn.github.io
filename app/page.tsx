'use client';

import { useScannerStore } from '@/store/scanner';
import ScannerPanel from '@/components/scanner/ScannerPanel';
import DisplayScreen from '@/components/scanner/DisplayScreen';
import AudioEngine from '@/components/audio/AudioEngine';

export default function Home() {
  const currentFrequency = useScannerStore((state) => state.currentFrequency);
  const isOverdrive = useScannerStore((state) => state.isOverdrive);

  return (
    <main className={`h-screen flex flex-col bg-scanner-bg noise-overlay transition-all ${isOverdrive ? 'overdrive' : ''}`}>
      {/* Audio Engine */}
      <AudioEngine />

      {/* Header */}
      <header className={`border-b border-scanner-text/30 px-6 py-3 scanlines ${isOverdrive ? 'border-red-500/50' : ''}`}>
        <div className="flex justify-between items-center">
          <div className={`phosphor-text text-2xl tracking-wider ${isOverdrive ? 'text-red-500 animate-pulse' : ''}`}>
            {isOverdrive ? '⚠ OVERDRIVE WARNING ⚠' : 'ANOMALY SCANNER v1.0'}
          </div>
          <div className={`phosphor-text text-3xl font-bold tracking-widest ${isOverdrive ? 'text-red-500' : ''}`}>
            {currentFrequency.toFixed(1)} MHz
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scanner Controls */}
        <div className="w-80 border-r border-scanner-text/30 bg-scanner-panel">
          <ScannerPanel />
        </div>

        {/* Right Panel - Display Screen */}
        <div className="flex-1 bg-scanner-panel">
          <DisplayScreen />
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t border-scanner-text/30 px-6 py-2 text-sm opacity-50 ${isOverdrive ? 'border-red-500/50' : ''}`}>
        <div className="flex justify-between">
          <span className={isOverdrive ? 'text-red-500' : ''}>
            SYSTEM STATUS: {isOverdrive ? 'CRITICAL OVERDRIVE' : 'OPERATIONAL'}
          </span>
          <span>SIGNAL LOCK: {useScannerStore((state) => state.lockedOnSignalId) || 'NONE'}</span>
        </div>
      </footer>
    </main>
  );
}
