// The page: one stop per player down the scroll, the gallery drawn behind. The scroll walks the hall
// and sets which player is in hand (stage.focus), the plan shows where you are, and keys go to the
// player last touched.

import { Stage } from './stage.js';
import repeater from './devices/repeater.js';
import newsmy from './devices/newsmy.js';
import unis from './devices/unis.js';
import philips from './devices/philips.js';
import cube from './devices/cube.js';
import ipod from './devices/ipod.js';
import zune from './devices/zune.js';
import { exhibit } from './devices/exhibit.js';

// Everything, in the order it came (got: the year he got it): the players, and between them the
// earphones, headphones and speakers (sizes in cm as measured off the models in
// scripts/blender/fidelity/, grams as published). Streaming began in 2017 and goes on: the last plinth.
const players = [
  repeater,
  newsmy,
  unis,
  exhibit('sparkplug', 'Koss Spark Plug', 2010, [7.7, 1.7, 11.5], 14, { era: 'mp4', flat: true }),
  philips,
  cube,
  exhibit('gr4', 'VSONIC GR04', 2012, [6.11, 2.12, 11.41], 18, { era: 'late', flat: true }),
  ipod,
  exhibit('m6', 'MEE M6', 2014, [8.9, 1.52, 10.25], 20, { era: 'better', flat: true }),
  exhibit('dt235', 'beyerdynamic DT 235', 2015, [17.64, 21.08, 12.41], 130, { era: 'hifi' }),
  zune,
  exhibit('srh1540', 'Shure SRH1540', 2017, [18.3, 19.4, 15.8], 286),
  exhibit('erise5', 'PreSonus Eris E5', 2017, [42.6, 26.0, 20.6], 9260),
  exhibit('symfonisk', 'SYMFONISK', 2019, [10.04, 31.01, 15.07], 2080),
  exhibit('move2', 'Sonos Move 2', 2023, [16.0, 24.1, 12.71], 3000, { era: 'slight' }),
  exhibit('sony', 'Sony XE200, XB100', 2024, [21.61, 20.8, 9.43], 1074, { era: 'bluetooth' }),
  exhibit('axon3', 'NUX Axon 3', 2025, [24.8, 20.5, 16.6], 1980, { era: 'slight' }),
];
const stops = [...document.querySelectorAll('.stop')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.querySelector('canvas.stage');
const loading = document.querySelector('.loading');
const plan = document.querySelector('.plan');
// In the plan; the last plinth is empty.
const NAMES = [...players.map((p) => p.name), 'Mixcloud'];

let stage = null;
try {
  stage = new Stage(canvas, players, { onPick: (i) => go(i + 1) });
} catch (e) {
  console.warn('fidelity: no WebGL', e);
  document.documentElement.classList.add('no-gl');
  loading.textContent = 'no WebGL here';
}

function go(k) {
  const r = stops[k].getBoundingClientRect();
  scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: reduced ? 'auto' : 'smooth' });
}
document.querySelectorAll('a[href="#top"]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}));

// The scroll as a focus: each stop holds its player through the middle of its height, and the
// camera travels between stops in the stretches either side.
function read() {
  const c = scrollY + innerHeight / 2;
  const marks = stops.map((s, k) => {
    const r = s.getBoundingClientRect();
    const top = r.top + scrollY;
    return { top, h: r.height, a: top + r.height * (k === 0 ? 0 : 0.28), b: top + r.height * (k === stops.length - 1 ? 1 : 0.68) };
  });
  let f = marks.length - 1;
  for (let k = 0; k < marks.length; k++) {
    const m = marks[k];
    if (c < m.a) {
      const p = marks[k - 1];
      f = p ? k - 1 + (c - p.b) / (m.a - p.b) : 0;
      break;
    }
    if (c <= m.b) { f = k; break; }
  }
  stops.forEach((s, k) => {
    const m = marks[k];
    const u = Math.max(0, Math.min(1, (c - m.top) / m.h));
    if (stage && k >= 1 && k <= players.length) stage.progress[k - 1] = u;
    const near = 1 - Math.min(1, Math.abs(f - k) * 1.6);
    s.querySelector('.words')?.style.setProperty('--shown', String(stage ? Math.max(0.08, near) : 1));
  });
  if (stage) stage.focus = f;
  plan.querySelectorAll('button').forEach((b, k) => b.classList.toggle('is-here', k === Math.round(f) - 1));
  // the shade under the words is for the players in hand, not the hall at the door
  document.body.style.setProperty('--shade', String(Math.min(1, Math.max(0, f - 0.3) * 2)));
}
addEventListener('scroll', read, { passive: true });
addEventListener('resize', read);
read();

if (stage) {
  window.__fidelity = stage; // for poking at from the console
  stage.start();
  stage.load().then(() => loading.classList.add('is-done'));

  // Keys go to the player in hand once it has been touched.
  addEventListener('keydown', (e) => {
    const i = stage.engaged;
    if (i == null || Math.abs(stage.focus - (i + 1)) > 0.3 || e.metaKey || e.ctrlKey || e.altKey) return;
    if (stage.slots[i].ctl?.key?.(e.key)) e.preventDefault();
  });

  // The plan: a box a plinth.
  plan.innerHTML = NAMES.map((name) => `<button type="button" aria-label="${name}"></button>`).join('');
  plan.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => go(i + 1)));
  read();
}
