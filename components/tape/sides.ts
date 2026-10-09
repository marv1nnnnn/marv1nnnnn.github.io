// The tape has two sides. Side A is the site: the tracks in tracks.ts, read as a booklet. Side B
// is the things to play: each work is a track on side B and lives on its own subdomain,
// <id>.marv1nnnnn.com, or, built as a page of its own in public/<id>/, at marv1nnnnn.com/<id>/.
// Turning the cassette over on the home page shows side B's label; playing a track there winds the
// tape out to that work. A work links back with marv1nnnnn.com/?side=b.

export type Side = 'a' | 'b';

export interface Work {
  id: string; // also the subdomain
  title: string; // written on the label
  note: string; // one line under it
  year: string;
  path?: string; // kept on this site, at this path, rather than on its subdomain
}

export const SIDE_B: Work[] = [
  { id: 'cyberia', title: 'cyberia', note: 'a club in the wired, open all night', year: '2026' },
  { id: 'repeat', title: '复读', note: '从小到大听歌用过的每一台机器，和它们装得下的每一首歌', year: '2026', path: '/repeat/' },
];

export const DOMAIN = 'marv1nnnnn.com';
export const workUrl = (w: Work) => w.path ?? `https://${w.id}.${DOMAIN}`;
export const workHost = (w: Work) => `${w.id}.${DOMAIN}`;
