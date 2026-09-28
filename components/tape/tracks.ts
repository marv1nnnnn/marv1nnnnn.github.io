import { hash } from './engine';

// The site is one cassette, side A. Each section is a track; the counter runs 000 to 999 across
// the whole tape, and moving between sections winds the tape from one track to the other.
export interface Track { path: string; label: string; sections: string[]; start: number; length: number }

const LENGTHS: [string, string, string[], number][] = [
  ['/', 'intro', [''], 60],
  ['/make', 'make', ['make', 'think'], 360],
  ['/input', 'input', ['input'], 180],
  ['/log', 'log', ['log'], 300],
  ['/about', 'about', ['about'], 100],
];

export const TAPE_LENGTH = LENGTHS.reduce((sum, [, , , len]) => sum + len, 0);

export const TRACKS: Track[] = LENGTHS.reduce<Track[]>((out, [path, label, sections, length]) => {
  const prev = out[out.length - 1];
  out.push({ path, label, sections, length, start: prev ? prev.start + prev.length : 0 });
  return out;
}, []);

export function trackIndex(path: string) {
  const first = path.split('/').filter(Boolean)[0] ?? '';
  const i = TRACKS.findIndex((t) => t.sections.includes(first));
  return i < 0 ? 0 : i;
}

export function trackAt(head: number) {
  for (let i = TRACKS.length - 1; i >= 0; i--) if (head >= TRACKS[i].start) return i;
  return 0;
}

// Where a page sits on the tape. Detail pages (an essay, a tool) sit somewhere inside their track;
// `through` is how far down the page the reader has scrolled.
export function headOf(path: string, through = 0) {
  const track = TRACKS[trackIndex(path)];
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 1) {
    const room = track.length - 60;
    return track.start + 30 + (hash(parts.slice(1).join('/')) % room) + through * 20;
  }
  return track.start + through * (track.length - 1);
}

export const counter = (head: number) => String(Math.max(0, Math.min(TAPE_LENGTH - 1, Math.floor(head)))).padStart(3, '0');
