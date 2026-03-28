import { create } from 'zustand';
import { ScannerStore } from '@/types/scanner';

export const useScannerStore = create<ScannerStore>((set) => ({
  // Initial state
  currentFrequency: 100.0,
  isTuning: false,
  lockedOnSignalId: null,
  isOverdrive: false,
  isPanelCollapsed: false,
  audioAnalyser: null,

  // Actions
  setFrequency: (freq) => set({ currentFrequency: freq }),
  setIsTuning: (tuning) => set({ isTuning: tuning }),
  setLockedOnSignalId: (id) => set({ lockedOnSignalId: id }),
  setIsOverdrive: (overdrive) => set({ isOverdrive: overdrive }),
  setIsPanelCollapsed: (collapsed) => set({ isPanelCollapsed: collapsed }),
  setAudioAnalyser: (analyser) => set({ audioAnalyser: analyser }),
}));
