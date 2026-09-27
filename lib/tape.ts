import { getSignalById } from '@/lib/signals';
import showsData from '@/data/shows.json';
import type { SignalCardContent, SignalContact, SignalListItem, VinylRecord } from '@/types/scanner';

// Talks and workshops share the projects signal with tools; a `kind` field in Clin would replace this list.
const TALK_IDS = new Set([
  'bloome-aws-summit',
  'build-for-yourself',
  'build-for-yourself-2',
  'cursor-yesterday-today-tomorrow',
  'hack4sdg',
  'vibe_is_all_you_need',
]);

const byDateDesc = <T extends { date?: string }>(a: T, b: T) => (b.date ?? '').localeCompare(a.date ?? '');

function cards(signalId: string): SignalCardContent[] {
  const page = getSignalById(signalId)?.page;
  return page?.type === 'cards' ? [...page.cards].sort(byDateDesc) : [];
}

export type MakeKind = 'tool' | 'talk';

export function getMakes() {
  return cards('projects').map((card) => ({ ...card, kind: (TALK_IDS.has(card.id) ? 'talk' : 'tool') as MakeKind }));
}

export function getMake(id: string) {
  return getMakes().find((card) => card.id === id) ?? null;
}

export function getEssays() {
  return cards('journal');
}

export function getEssay(id: string) {
  return getEssays().find((card) => card.id === id) ?? null;
}

export interface Show {
  date: string;
  title: string;
  venue: string;
  city: string;
  url?: string;
}

export function getShows(): Show[] {
  return [...(showsData.shows as Show[])].sort(byDateDesc);
}

export function getCanon(): VinylRecord[] {
  const page = getSignalById('influences')?.page;
  return page?.type === 'influences' ? page.records : [];
}

export function getLog(): SignalListItem[] {
  const page = getSignalById('listening')?.page;
  if (page?.type !== 'list') return [];
  const seen = new Set<string>();
  return page.items
    .map((item) => ({ ...item, date: (item.date ?? '').slice(0, 10) }))
    .sort(byDateDesc)
    .filter((item) => {
      const key = `${item.title}|${item.creator}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function getAbout() {
  const page = getSignalById('about')?.page;
  if (page?.type !== 'profile') return null;
  const facts = page.sections.find((s) => s.title === 'Fun facts');
  return {
    hero: page.hero,
    current: page.sections.find((s) => s.title === 'Current')?.body ?? '',
    facts: (facts?.body ?? '').split('\n').map((line) => line.replace(/^-\s*/, '').trim()).filter(Boolean),
    contact: page.contact as SignalContact[],
    resume: page.resume ?? null,
  };
}

export const monthOf = (date: string) => date.slice(0, 7).replace('-', '.');
export const dayOf = (date: string) => date.slice(0, 10).replaceAll('-', '.');

// Groups date-sorted items into runs by a key (year or month), keeping order.
export function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups: { key: string; items: T[] }[] = [];
  for (const item of items) {
    const k = key(item);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(item);
    else groups.push({ key: k, items: [item] });
  }
  return groups;
}

// Minutes to read, from the Markdown body.
export function readingMinutes(markdown: string) {
  const text = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#>*_`[\]()-]/g, ' ');
  const latin = (text.match(/[A-Za-z0-9']+/g) ?? []).length;
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  return Math.max(1, Math.round(latin / 230 + cjk / 500));
}
