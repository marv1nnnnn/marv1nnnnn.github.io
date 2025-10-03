export interface Signal {
  id: string;
  freq: number;
  title: string;
  pages: number;
  audioUrl?: string;
}

export type SignalState = 'NOISE' | 'APPROACHING' | 'LOCKED_ON';

export interface ScannerStore {
  // Live value from the slider, e.g., 88.0 to 108.0
  currentFrequency: number;

  // Is the user currently dragging the slider?
  isTuning: boolean;

  // The ID of the currently locked-on signal, or null
  lockedOnSignalId: string | null;

  // Is the system in overdrive mode (frequency at extremes)?
  isOverdrive: boolean;

  // Actions
  setFrequency: (freq: number) => void;
  setIsTuning: (tuning: boolean) => void;
  setLockedOnSignalId: (id: string | null) => void;
  setIsOverdrive: (overdrive: boolean) => void;
}
