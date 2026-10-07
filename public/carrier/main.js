// carrier: what the music came on, as one line down the page. This file lays the line out between
// the four carriers, tells the sound which one is in view, and keeps the sound on or off as the
// rest of the site does (`tape-sound` in localStorage: it starts at the first touch unless it was
// turned off).

import { Engine } from './audio.js';
import { createLine, MATERIAL as M } from './line.js';
import { createTape } from './tape.js';
import { createFile } from './file.js';
import { createApp } from './app.js';
import { createAir } from './air.js';

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const engine = new Engine();

const pref = () => {
  try {
    return localStorage.getItem('tape-sound');
  } catch {
    return null;
  }
};
const setPref = (v) => {
  try {
    localStorage.setItem('tape-sound', v);
  } catch {}
};

let soundOn = pref() !== 'off';
let starting = null;
const soundBtn = document.querySelector('.sound');
const startBtn = document.querySelector('.start');

function showSound() {
  soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundBtn.querySelector('span').textContent = soundOn ? 'on' : 'off';
  startBtn.setAttribute('aria-pressed', String(soundOn && !!engine.ctx));
}

function start() {
  if (!soundOn) return Promise.resolve();
  if (!starting) {
    starting = engine
      .start()
      .then(() => {
        engine.open(CARRIER[era], true);
        devices[era]?.enter();
        showSound();
      })
      .catch(() => {});
  } else engine.resume();
  return starting;
}

const ui = {
  soundOn: () => soundOn && !!engine.ctx && engine.ctx.state === 'running',
  // Run something that makes a sound once the sound is going (or at once, silently, if it is off).
  withSound(fn) {
    if (!soundOn) fn();
    else start().then(fn);
  },
  relayout: () => queueRoute(),
};

const devices = {
  tape: createTape(document.querySelector('.deck'), engine, ui),
  file: createFile(document.querySelector('.stick'), engine, ui),
  app: createApp(document.querySelector('.app'), engine, ui),
  air: createAir(document.querySelector('.radio'), engine, ui),
};
const CARRIER = { intro: null, tape: 'tape', file: 'file', app: 'app', air: 'air' };
document.querySelector('.station-links').innerHTML = devices.air.links();

// ---- sound on and off --------------------------------------------------------------------------

const firstTouch = () => {
  if (soundOn) start();
};
window.addEventListener('pointerdown', firstTouch, { capture: true });
window.addEventListener('keydown', (e) => {
  if (!e.metaKey && !e.ctrlKey && !e.altKey) firstTouch();
}, { capture: true });

soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  setPref(soundOn ? 'on' : 'off');
  if (soundOn) start().then(() => engine.resume());
  else engine.suspend();
  showSound();
});

startBtn.addEventListener('click', () => {
  if (!soundOn) {
    soundOn = true;
    setPref('on');
  }
  start().then(showSound);
  document.getElementById('tape').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    devices[era]?.leave();
    engine.suspend();
  } else {
    if (soundOn) engine.resume();
    devices[era]?.enter();
  }
});

// ---- which carrier is in view ------------------------------------------------------------------

const sections = [...document.querySelectorAll('main [data-era]')];
let era = 'intro';
function whichEra() {
  const mid = window.innerHeight * 0.5;
  let found = null;
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) found = s.dataset.era;
  }
  if (!found) {
    const lastSection = sections[sections.length - 1].getBoundingClientRect();
    found = lastSection.bottom <= mid ? sections[sections.length - 1].dataset.era : 'intro';
  }
  return found;
}
function checkEra() {
  const next = whichEra();
  if (next === era) return;
  devices[era]?.leave();
  era = next;
  html.dataset.era = era;
  line.accent(era);
  engine.open(CARRIER[era]);
  devices[era]?.enter();
}

// ---- the line ----------------------------------------------------------------------------------

const line = createLine(document.querySelector('canvas.line'), engine, reduced);

const box = (el) => {
  const r = el.getBoundingClientRect();
  const sy = window.scrollY;
  return { l: r.left, r: r.right, t: r.top + sy, b: r.bottom + sy, x: r.left + r.width / 2, y: r.top + sy + r.height / 2, w: r.width, h: r.height };
};
const port = (name) => box(document.querySelector(`[data-port="${name}"]`));

function route() {
  const vw = document.documentElement.clientWidth;
  const narrow = vw < 820;
  const W = [];
  const add = (x, y, m) => W.push({ x, y, m });
  const loop = (cx, cy, r, from, turns, m, rIn = r) => {
    const n = Math.ceil(turns * 18);
    for (let k = 0; k <= n; k++) {
      const a = from + (k / n) * turns * Math.PI * 2;
      const rr = r + ((rIn - r) * k) / n;
      add(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, m);
    }
  };

  // the tape, out of the cassette, between it and the keys, and away
  const T = devices.tape.port();
  const deck = box(document.querySelector('.deck'));
  const keys = box(document.querySelector('.transport'));
  const fileIn = port('file-in');
  const fileOut = port('file-out');
  const tapeSec = box(document.getElementById('tape'));
  const fileSec = box(document.getElementById('file'));
  const appSec = box(document.getElementById('app'));
  const airIn = port('air-in');
  const airOut = port('air-out');
  const gapY = (keys.t + T.y) / 2;
  add(T.x, T.y, M.TAPE);
  add(T.x + 14, gapY, M.TAPE);
  if (narrow) {
    const edge = vw - 9;
    add(edge - 26, gapY + 4, M.TAPE);
    add(edge, gapY + 26, M.TAPE);
    add(edge, tapeSec.b - 40, M.TAPE);
    // spliced onto an earphone cable, which tangles, as they did
    add(edge - 30, fileSec.t + 10, M.CABLE);
    loop(vw * 0.72, fileIn.t - 120, 18, -Math.PI / 2, 1, M.CABLE);
    add(fileIn.x + 6, fileIn.t - 60, M.CABLE);
  } else {
    const side = deck.r + 46;
    add(deck.r + 10, gapY + 6, M.TAPE);
    add(side, gapY + 40, M.TAPE);
    add(side, keys.b + 60, M.TAPE);
    add(side - 60, tapeSec.b - 50, M.TAPE);
    const mid = (side + fileIn.x) / 2;
    add(mid + 80, tapeSec.b + 10, M.CABLE);
    loop(mid, tapeSec.b + 60, 24, -Math.PI / 2, 1, M.CABLE);
    add(fileIn.x + 30, fileIn.t - 90, M.CABLE);
  }
  add(fileIn.x, fileIn.t - 26, M.CABLE);
  add(fileIn.x, fileIn.t, M.HIDDEN);
  // through the player, and out of it as a USB lead
  add(fileOut.x, fileOut.b, M.USB);
  add(fileOut.x, fileOut.b + (narrow ? 12 : 40), M.USB);

  // round the app, tighter the more it has learned: a coil that hugs the phone
  const card = box(document.querySelector('.app'));
  const tight = devices.app.tightness();
  const spare = narrow ? Math.max(8, (vw - card.w) / 2 - 6) : 74;
  const inner = narrow ? 5 : 16;
  const turns = 0.9 + tight * 5.5;
  const coilTop = card.t - spare;
  if (narrow) {
    add(fileOut.x + 30, fileOut.b + 30, M.USB);
    add(vw - 9, fileOut.b + 56, M.USB);
    add(vw - 9, fileSec.b - 40, M.USB);
    add(vw - 9, appSec.t + 30, M.USB);
    add(card.x + 40, coilTop - 60, M.USB);
  } else {
    add(fileOut.x + 40, fileSec.b - 60, M.USB);
    add((fileOut.x + card.x) / 2, appSec.t + 40, M.USB);
    add(card.x - 30, coilTop - 70, M.USB);
  }
  const n = Math.ceil(turns * 40);
  const curve = (v) => Math.sign(v) * Math.abs(v) ** (1 / 3);
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const a = -Math.PI / 2 + t * turns * Math.PI * 2;
    const m = spare + (inner - spare) * t;
    add(card.x + curve(Math.cos(a)) * (card.w / 2 + m), card.y + curve(Math.sin(a)) * (card.h / 2 + m), M.LOOP);
  }
  // and out through the phone, under it, as a wave
  add(card.x, card.y, M.HIDDEN);
  add(card.x, card.b - 4, M.WAVE);
  const left = narrow ? 9 : Math.max(16, airIn.x - 40);
  if (narrow) {
    add(card.x - 40, card.b + 26, M.WAVE);
    add(left, card.b + 60, M.WAVE);
  } else add(card.x, card.b + 50, M.WAVE);
  add(left + (narrow ? 0 : 10), appSec.b - 80, M.WAVE);
  add(left, airIn.y - 140, M.WAVE);
  add(airIn.x, airIn.y, M.WAVE);
  add(airOut.x, airOut.y, M.WAVE);
  add(vw + 80, airOut.y, M.WAVE);
  line.set(W);
}

let routeQueued = false;
function queueRoute() {
  if (routeQueued) return;
  routeQueued = true;
  requestAnimationFrame(() => {
    routeQueued = false;
    route();
  });
}
new ResizeObserver(queueRoute).observe(document.querySelector('main'));
window.addEventListener('resize', queueRoute);
document.fonts?.ready.then(queueRoute);

// ---- the loop ----------------------------------------------------------------------------------

function frame(now) {
  checkEra();
  for (const d of Object.values(devices)) d.frame(now);
  line.draw(now, soundOn && !!engine.ctx);
  requestAnimationFrame(frame);
}

html.dataset.era = era;
showSound();
route();
requestAnimationFrame(frame);
