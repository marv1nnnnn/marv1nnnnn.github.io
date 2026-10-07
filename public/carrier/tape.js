// The tape: side A of a C-60 recorded over an English course. Three songs; the first is the one
// that was played most, worn in its second chorus. It plays at one speed in one direction, winds
// at fourteen times that with the head off the tape, and stops itself at either end. The pencil
// in the supply reel winds it by hand. Every stretch played again wears a little more.

import { Transport } from './audio.js';
import { compose, makeParams, side } from './songs.js';

const WIND = 14; // times the playing speed
const R_MIN = 13;
const R_MAX = 36;
const SPIN = 60; // reel turn per second of tape at a radius of one
const SLOT = 2; // seconds of tape per patch of wear

export function createTape(root, engine, ui) {
  const svg = root.querySelector('.cassette');
  const grip = root.querySelector('.grip');
  const hubL = svg.querySelector('.hub-l');
  const hubR = svg.querySelector('.hub-r');
  const packL = svg.querySelector('.pack-l');
  const packR = svg.querySelector('.pack-r');
  const count = root.querySelector('.count');
  const keys = Object.fromEntries([...root.querySelectorAll('.key')].map((k) => [k.dataset.key, k]));

  const songs = [
    compose(makeParams(1996, 'ballad', { root: 51, bpm: 76, prog: [3, 4, 2, 5], bars: 38, density: 0.62, bright: 0.5 })),
    compose(makeParams(2002, 'lonely', { bars: 26 })),
    compose(makeParams(2004, 'pop', { bars: 30, lead: 'square' })),
  ];
  const tape = side(songs, 3.5);
  const tr = new Transport(engine);
  tr.load(tape, 0);

  // How many times each stretch has been played. The first song came worn; its second chorus
  // most of all (bars 26 to 34 of it).
  const plays = new Float32Array(Math.ceil(tape.length / SLOT) + 1);
  const first = songs[0];
  const bar = (60 / first.params.bpm) * 4;
  for (let s = tape.starts[0]; s < tape.starts[0] + first.length; s += SLOT) plays[Math.floor(s / SLOT)] = 3;
  for (let s = tape.starts[0] + bar * 26; s < tape.starts[0] + bar * 34; s += SLOT) plays[Math.floor(s / SLOT)] = 6;
  let slot = -1;

  let mode = 'stop';
  let active = false;
  let pos = 0;
  let held = false;
  let stoppedByHand = false;
  let zero = 0;
  let aL = 0;
  let aR = 0;
  let last = performance.now();

  const radius = (p) => Math.sqrt(R_MIN ** 2 + p * (R_MAX ** 2 - R_MIN ** 2));
  const counterAt = (p) => {
    // a counter geared to the take-up reel: it runs fast at the start of a side and slows as the
    // reel fills
    const r = radius(p);
    return Math.floor((r - R_MIN) * 14 + p * 60);
  };
  const shown = () => ((counterAt(pos / tape.length) - zero + 1000) % 1000).toString().padStart(3, '0');

  function press(name) {
    for (const [k, el] of Object.entries(keys)) if (el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', String(k === name));
  }

  function setMode(next, sound = true) {
    if (next === mode) return;
    if (mode === 'play') tr.stop();
    mode = next;
    if (sound) engine.clunk(next === 'stop' ? 0.7 : 1);
    press(next === 'stop' ? null : next);
    if (next === 'play' && !held) {
      tr.seek(pos);
      tr.play();
    }
  }

  function play() {
    if (pos >= tape.length - 0.5) {
      // at the end of the side the key will not stay down
      engine.clunk(0.6);
      return;
    }
    stoppedByHand = false;
    setMode('play');
  }

  keys.play.addEventListener('click', () => ui.withSound(play));
  keys.stop.addEventListener('click', () => {
    stoppedByHand = true;
    if (mode === 'stop') engine.clunk(0.5);
    setMode('stop');
  });
  keys.rew.addEventListener('click', () => ui.withSound(() => setMode(mode === 'rew' ? 'stop' : 'rew')));
  keys.ff.addEventListener('click', () => ui.withSound(() => setMode(mode === 'ff' ? 'stop' : 'ff')));
  root.querySelector('.reset').addEventListener('click', () => {
    zero = counterAt(pos / tape.length);
    engine.clunk(0.3);
    count.value = shown();
  });

  // The pencil: turn it clockwise to wind on, anticlockwise to wind back. Holding it holds the reel.
  let grab = null;
  let teeth = 0;
  let pencilSpeed = 0;
  const centre = () => {
    const r = grip.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  grip.addEventListener('pointerdown', (e) => {
    const c = centre();
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    grab = { a: Math.atan2(e.clientY - c.y, e.clientX - c.x), id: e.pointerId };
    grip.classList.add('is-turning');
    held = true;
    if (mode === 'play') tr.stop();
    else if (mode !== 'stop') setMode('stop');
    ui.withSound(() => {});
  });
  grip.addEventListener('pointermove', (e) => {
    if (!grab || e.pointerId !== grab.id) return;
    const c = centre();
    const a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
    let da = a - grab.a;
    if (da > Math.PI) da -= Math.PI * 2;
    if (da < -Math.PI) da += Math.PI * 2;
    grab.a = a;
    const p = pos / tape.length;
    const rl = radius(1 - p);
    const dpos = (da * rl * 3) / SPIN;
    pos = Math.max(0, Math.min(tape.length, pos + dpos));
    aL += (da * 180) / Math.PI;
    pencilSpeed = Math.min(1.5, Math.abs(dpos) * 8);
    teeth += Math.abs(da);
    if (teeth > Math.PI / 3) {
      teeth = 0;
      engine.tick1();
    }
  });
  const release = (e) => {
    if (!grab || e.pointerId !== grab.id) return;
    grab = null;
    held = false;
    pencilSpeed = 0;
    grip.classList.remove('is-turning');
    if (mode === 'play') {
      tr.seek(pos);
      tr.play();
    }
  };
  grip.addEventListener('pointerup', release);
  grip.addEventListener('pointercancel', release);

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const before = pos;
    if (mode === 'play' && !held && active) {
      pos = tr.playing && engine.ctx?.state === 'running' ? tr.position() : pos + dt;
      if (pos >= tape.length) {
        pos = tape.length;
        stoppedByHand = false;
        setMode('stop');
      }
      const s = Math.floor(pos / SLOT);
      if (s !== slot) {
        slot = s;
        plays[s] += 1;
      }
    } else if (mode === 'rew' || mode === 'ff') {
      pos += (mode === 'rew' ? -WIND : WIND) * dt;
      if (pos <= 0 || pos >= tape.length) {
        pos = Math.max(0, Math.min(tape.length, pos));
        setMode('stop');
      }
    }
    const p = pos / tape.length;
    const rl = radius(1 - p);
    const rr = radius(p);
    const moved = pos - before;
    aL += (moved * SPIN * 57.3) / rl / 10;
    aR += (moved * SPIN * 57.3) / rr / 10;
    hubL.setAttribute('transform', `translate(100 78) rotate(${aL.toFixed(1)})`);
    hubR.setAttribute('transform', `translate(220 78) rotate(${aR.toFixed(1)})`);
    packL.setAttribute('r', rl.toFixed(1));
    packR.setAttribute('r', rr.toFixed(1));
    const c = shown();
    if (count.value !== c) count.value = c;
    const wear = mode === 'play' ? Math.min(1, Math.max(0, (plays[Math.floor(pos / SLOT)] - 1) * 0.14)) : 0;
    engine.tapeState({
      wear,
      playing: mode === 'play' && !held,
      winding: mode === 'rew' ? -1 : mode === 'ff' ? 1 : held ? pencilSpeed : 0,
    });
    pencilSpeed *= 0.85;
  }

  return {
    frame,
    // Coming to the tape, it plays unless it was stopped by hand.
    enter() {
      active = true;
      if (!stoppedByHand && mode === 'stop') play();
      else if (mode === 'play') {
        tr.seek(pos);
        tr.play();
      }
    },
    leave() {
      active = false;
      if (mode === 'play') tr.stop();
      if (mode === 'rew' || mode === 'ff') setMode('stop', false);
      engine.tapeState({ wear: 0, playing: false, winding: 0 });
    },
    // where the ribbon comes out, in the page
    port() {
      const r = svg.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.bottom + window.scrollY - 1 };
    },
  };
}
