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

export interface SignalProfileResume {
  href: string;
  label?: string;
  subtitle?: string;
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
  resume?: SignalProfileResume;
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
  type: string;
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

export interface VinylRecord {
  id: string;
  artist: string;
  title: string;
  year: number;
  medium: 'music' | 'film' | 'book' | 'anime' | 'game';
  color?: string;  // Optional: auto-generated from medium if not provided
  image_url?: string;
  personalNote: string;
  tags?: string[];
  links?: Array<{ label: string; url: string }>;
}

export interface SignalInfluencesPage {
  type: 'influences';
  records: VinylRecord[];
}

export interface SignalKnowledgePage {
  type: 'knowledge';
}

export type SignalPage = SignalProfilePage | SignalCardsPage | SignalListPage | SignalInfluencesPage | SignalKnowledgePage;

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

