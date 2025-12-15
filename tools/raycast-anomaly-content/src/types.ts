// Content types for Anomaly Scanner

export type ContentType = "music" | "video" | "text" | "game" | "live";

export interface ListeningItem {
  title: string;
  creator: string;
  type: ContentType;
  date: string;
  url?: string;
}

export interface CardFrontmatter {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  summary: string;
  tags: string[];
  image?: string;
}

export interface Card {
  frontmatter: CardFrontmatter;
  content: string;
  filePath: string;
}

export interface Signal {
  id: string;
  freq: number;
  title: string;
  pages: number;
  audioUrl?: string;
  accentColor: string;
  background: string;
  pageType: "cards" | "list" | "profile";
  renderMode?: string;
  intro?: {
    title: string;
  };
}

export interface ProfileData {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    description: string;
  };
  sections: Array<{
    title: string;
    body: string;
  }>;
  contact: Array<{
    label: string;
    value: string;
    href?: string;
  }>;
}

export type SignalType =
  | "projects"
  | "journal"
  | "listening"
  | "about"
  | "influences";

