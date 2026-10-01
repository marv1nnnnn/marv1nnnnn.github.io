// The tape has two sides. Side A is the site: the tracks in tracks.ts, read as a booklet. Side B
// is the things to play: each work is a track on side B and lives on its own subdomain,
// <id>.marv1nnnnn.com. Turning the cassette over on the home page shows side B's label; playing a
// track there winds the tape out to that work. A work links back with marv1nnnnn.com/?side=b.

export type Side = 'a' | 'b';

export interface Work {
  id: string; // also the subdomain
  title: string; // written on the label
  note: string; // one line under it
  year: string;
}

export const SIDE_B: Work[] = [
  { id: 'cyberia', title: 'cyberia', note: 'a club in the wired, open all night', year: '2026' },
];

export const DOMAIN = 'marv1nnnnn.com';
export const workUrl = (w: Work) => `https://${w.id}.${DOMAIN}`;
export const workHost = (w: Work) => `${w.id}.${DOMAIN}`;
