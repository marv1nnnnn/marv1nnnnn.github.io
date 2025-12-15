import { getPreferenceValues } from "@raycast/api";
import { homedir } from "os";
import { join } from "path";

interface Preferences {
  contentPath: string;
  projectPath: string;
}

function expandPath(path: string): string {
  if (path.startsWith("~")) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

export function getContentPath(): string {
  const prefs = getPreferenceValues<Preferences>();
  return expandPath(prefs.contentPath);
}

export function getProjectPath(): string {
  const prefs = getPreferenceValues<Preferences>();
  return expandPath(prefs.projectPath);
}

export const CONTENT_TYPES = [
  "music",
  "video",
  "text",
  "game",
  "live",
] as const;

export const SIGNAL_TYPES = {
  projects: {
    label: "Projects",
    cardsPath: "projects/cards",
    hasCards: true,
  },
  journal: {
    label: "Journal",
    cardsPath: "journal/cards",
    hasCards: true,
  },
  listening: {
    label: "Listening",
    itemsPath: "listening/items.json",
    hasCards: false,
  },
  about: {
    label: "About",
    profilePath: "about/profile.json",
    hasCards: false,
  },
  influences: {
    label: "Influences",
    itemsPath: "influences/influences.json",
    hasCards: false,
  },
} as const;

export const TYPE_ICONS: Record<string, string> = {
  music: "🎵",
  video: "🎬",
  text: "📖",
  game: "🎮",
  live: "🎤",
};

