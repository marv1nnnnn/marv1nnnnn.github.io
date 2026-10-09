// The page: one stop per player down the scroll, the desk drawn behind. The scroll sets which player
// is in hand (stage.focus), the names ride along the tape, and keys go to the player last touched.

import { Stage } from './stage.js';
import repeater from './devices/repeater.js';
import newsmy from './devices/newsmy.js';
import unis from './devices/unis.js';
import philips from './devices/philips.js';
import cube from './devices/cube.js';
import ipod from './devices/ipod.js';
import zune from './devices/zune.js';

const players = [repeater, newsmy, unis, philips, cube, ipod, zune];
const stops = [...document.querySelectorAll('.stop')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.querySelector('canvas.stage');
const loading = document.querySelector('.loading');

let stage = null;
try {
  stage = new Stage(canvas, players, { onPick: (i) => go(i + 1) });
} catch (e) {
  console.warn('repeat: no WebGL', e);
  document.documentElement.classList.add('no-gl');
  loading.textContent = '这台浏览器画不了 3D · no WebGL here';
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
    const bought = k === 6 && stage?.slots[5]?.ctl?.bought;
    s.querySelectorAll('.later').forEach((el) => el.classList.toggle('is-on', u > 0.5 || !!bought || !stage));
  });
  if (stage) stage.focus = f;
  // the shade under the words is for the players in hand, not the row seen whole
  document.body.style.setProperty('--shade', String(Math.min(1, Math.max(0, f - 0.3) * 2)));
}
addEventListener('scroll', read, { passive: true });
addEventListener('resize', read);
read();

// Names along the tape and the count over each block of songs.
const box = document.querySelector('.labels');
const NAMES = ['步步高 BK-898', '纽曼 M520', '紫光 MQ-908', '飞利浦 SA28', '酷比魔方 C30', 'iPod classic', 'Zune HD'];
const label = (cls, html) => {
  const el = document.createElement('div');
  el.className = `label ${cls}`;
  el.innerHTML = html;
  box.appendChild(el);
  return el;
};
const names = players.map((p, i) => label('name', `${NAMES[i]}<small>${p.grams ? `${p.roughly ? '约 ' : ''}${p.grams} g` : ''}</small>`));
const counts = players.map((p) => label('count', `${p.songs.toLocaleString('en')} 首<small>${p.capacity}</small>`));
const cloudName = label('name', 'Mixcloud<small>∞</small>');

function place(el, p, on) {
  if (!p || p.behind) { el.classList.remove('on'); return; }
  el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, ${el.classList.contains('count') ? '-100%' : '0'})`;
  el.classList.toggle('on', on);
}

if (stage) {
  stage.after = () => {
    const f = stage.shown;
    const over = f < 0.45;
    players.forEach((p, i) => {
      place(names[i], stage.onScreen(i), over);
      place(counts[i], stage.blockTop(i), over);
    });
    place(cloudName, stage.onScreen(players.length), over);
  };
  window.__repeat = stage; // for poking at from the console
  stage.start();
  stage.load().then(() => loading.classList.add('is-done'));

  // Keys go to the player in hand once it has been touched.
  addEventListener('keydown', (e) => {
    const i = stage.engaged;
    if (i == null || Math.abs(stage.focus - (i + 1)) > 0.3 || e.metaKey || e.ctrlKey || e.altKey) return;
    if (stage.slots[i].ctl?.key?.(e.key)) e.preventDefault();
  });

  // The buttons in the words.
  document.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const on = stage.act(b.dataset.act);
    if (typeof on === 'boolean') b.setAttribute('aria-pressed', String(on));
  }));
}
