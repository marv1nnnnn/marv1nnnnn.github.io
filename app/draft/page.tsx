import type { Metadata } from 'next';
import { getSignalById } from '@/lib/signals';
import showsData from '@/data/shows.json';
import DraftPage, { type DraftData } from './DraftPage';

export const metadata: Metadata = {
  title: 'Draft',
  description: 'Prototype: a homepage made of footnotes.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/draft' },
};

// Talks and workshops live in the projects signal today; a `kind` field in Clin would replace this list.
const TALK_IDS = new Set([
  'bloome-aws-summit',
  'build-for-yourself',
  'build-for-yourself-2',
  'cursor-yesterday-today-tomorrow',
  'hack4sdg',
  'vibe_is_all_you_need',
]);

function byDateDesc<T extends { date?: string }>(a: T, b: T) {
  return (b.date ?? '').localeCompare(a.date ?? '');
}

function loadDraftData(): DraftData {
  const about = getSignalById('about')?.page;
  const projects = getSignalById('projects')?.page;
  const journal = getSignalById('journal')?.page;
  const influences = getSignalById('influences')?.page;
  const listening = getSignalById('listening')?.page;

  const projectCards = projects?.type === 'cards' ? [...projects.cards].sort(byDateDesc) : [];
  const toEntry = (card: { id: string; title: string; date?: string }, signalId: string) => ({
    title: card.title,
    date: card.date ?? '',
    href: `/signals/${signalId}/${card.id}`,
  });

  const funFacts = about?.type === 'profile'
    ? (about.sections.find((section) => section.title === 'Fun facts')?.body ?? '')
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter(Boolean)
    : [];

  const records = influences?.type === 'influences' ? influences.records : [];
  const logItems = listening?.type === 'list' ? [...listening.items].sort(byDateDesc) : [];

  return {
    talks: projectCards.filter((card) => TALK_IDS.has(card.id)).map((card) => toEntry(card, 'projects')),
    works: projectCards.filter((card) => !TALK_IDS.has(card.id)).map((card) => toEntry(card, 'projects')),
    essays: journal?.type === 'cards'
      ? [...journal.cards].sort(byDateDesc).map((card) => ({ ...toEntry(card, 'journal'), summary: card.subtitle ?? card.summary }))
      : [],
    shows: [...showsData.shows].sort(byDateDesc).map((show) => ({ title: show.title, date: show.date, venue: show.venue })),
    canon: records.map((record) => ({ artist: record.artist, title: record.title, note: record.personalNote })),
    log: logItems.map((item) => ({ title: item.title, creator: item.creator, date: item.date ?? '' })),
    funFacts,
    contact: about?.type === 'profile' ? about.contact.map(({ label, href }) => ({ label, href: href ?? '#' })) : [],
    resume: about?.type === 'profile' ? about.resume?.href ?? null : null,
  };
}

export default function Draft() {
  return <DraftPage data={loadDraftData()} />;
}
