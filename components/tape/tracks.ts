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

const DETAIL = 40; // counter units a detail page (an essay, a tool) takes inside its track

// The stretch of tape a page covers: a whole track for a section, a short stretch inside its
// track for a detail page.
export function spanOf(path: string): [number, number] {
  const track = TRACKS[trackIndex(path)];
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 1) {
    const room = track.length - DETAIL - 40;
    const lo = track.start + 20 + (hash(parts.slice(1).join('/')) % room);
    return [lo, lo + DETAIL];
  }
  return [track.start, track.start + track.length - 1];
}

// Where a page sits on the tape; `through` is how far down the page the reader has scrolled.
export function headOf(path: string, through = 0) {
  const [lo, hi] = spanOf(path);
  return lo + through * (hi - lo);
}

// The other way round: how far down the page a head position inside its span is.
export function throughOf(path: string, head: number) {
  const [lo, hi] = spanOf(path);
  return Math.min(1, Math.max(0, (head - lo) / (hi - lo)));
}

export const counter = (head: number) => String(Math.max(0, Math.min(TAPE_LENGTH - 1, Math.floor(head)))).padStart(3, '0');
