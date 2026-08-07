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

export interface SignalProfileLink {
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
  shows?: SignalProfileLink;
}

export interface SignalCardsPage {
  type: 'cards';
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
  items: SignalListItem[];
}

export interface VinylRecord {
  id: string;
  artist: string;
  title: string;
  year: number;
  medium: 'music' | 'film' | 'book' | 'anime' | 'game';
  image_url?: string;
  personalNote: string;
  tags?: string[];
  links?: Array<{ label: string; url: string }>;
}

export interface SignalInfluencesPage {
  type: 'influences';
  records: VinylRecord[];
}

export type SignalPage = SignalProfilePage | SignalCardsPage | SignalListPage | SignalInfluencesPage;

export interface Signal {
  id: string;
  title: string;
  summary?: string;
  page: SignalPage;
}

