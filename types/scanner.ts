export interface SignalContact {
  label: string;
  value: string;
  href?: string;
}

export interface SignalSection {
  title: string;
  body: string;
}

export interface SignalCardContent {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  summary: string;
  tags?: string[];
  markdown: string;
}

export interface SignalProfilePage {
  type: 'profile';
  hero: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    description?: string;
  };
  sections: SignalSection[];
  contact: SignalContact[];
}

export interface SignalCardsPage {
  type: 'cards';
  renderMode?: 'single' | 'cards';
  intro?: {
    eyebrow?: string;
    title: string;
    description?: string;
  };
  cards: SignalCardContent[];
}

export interface SignalListItem {
  title: string;
  creator: string;
  type: 'album' | 'text' | 'video';
  date?: string;
  url?: string;
}

export interface SignalListPage {
  type: 'list';
  intro?: {
    eyebrow?: string;
    title: string;
    description?: string;
  };
  items: SignalListItem[];
}

export type SignalPage = SignalProfilePage | SignalCardsPage | SignalListPage;

export interface Signal {
  id: string;
  freq: number;
  title: string;
  pages: number;
  audioUrl?: string;
  broadcastDate?: string;
  location?: string;
  tags?: string[];
  summary?: string;
  accentColor?: string;
  background?: string;
  page: SignalPage;
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

  // Is the tuner panel collapsed on mobile?
  isPanelCollapsed: boolean;

  // Actions
  setFrequency: (freq: number) => void;
  setIsTuning: (tuning: boolean) => void;
  setLockedOnSignalId: (id: string | null) => void;
  setIsOverdrive: (overdrive: boolean) => void;
  setIsPanelCollapsed: (collapsed: boolean) => void;
}
