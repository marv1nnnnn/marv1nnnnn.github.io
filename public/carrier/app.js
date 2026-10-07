// The app: a radio that learns you. Its catalogue is a field of songs laid out by how they feel
// (energy across, mood up and down), and what it plays you is drawn from a circle in that field.
// A heart pulls the circle to the song and shrinks it; the bin clears the songs around one and
// shrinks it a little; a skip shrinks it; a song played to the end shrinks it too. When the circle
// is small enough every song is made the same way, and at the end it is the same song.

import { Transport } from './audio.js';
import { compose, makeParams, rng } from './songs.js';

const SIZE = 640;
const R0 = 1.05;
const R_MIN = 0.02;

function catalogue() {
  const r = rng(2012);
  const gauss = () => (r() + r() + r() - 1.5) / 1.5;
  const centres = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * Math.PI * 2 + r() * 0.5;
    const d = 0.25 + r() * 0.5;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 0.12 + r() * 0.16 };
  });
  const pts = [];
  while (pts.length < SIZE) {
    const c = r() < 0.18 ? { x: 0, y: 0, s: 0.6 } : centres[Math.floor(r() * centres.length)];
    const x = c.x + gauss() * c.s;
    const y = c.y + gauss() * c.s;
    if (x * x + y * y < 0.96) pts.push({ x, y, id: pts.length, gone: false });
  }
  return pts;
}

// A song from where it lies in the field, or, once the circle is small, from the circle's centre.
function paramsFor(p, centre, radius) {
  const near = radius < 0.3 ? centre : p;
  const x = near.x;
  const y = near.y;
  const style = x < -0.5 ? 'lonely' : x < -0.05 ? 'ballad' : x < 0.35 ? 'rnb' : x < 0.7 ? 'city' : 'pop';
  const seed = radius < 0.09 ? centre.id * 13 + 5 : p.id * 13 + 5;
  return makeParams(seed, style, {
    bpm: Math.round(70 + (x + 1) * 28),
    root: 50 + (Math.floor((x * 7 + y * 5 + 10) * 3) % 10),
    scale: style === 'rnb' ? 'dorian' : y < -0.2 ? 'minor' : 'major',
    bright: (y + 1) / 2,
    bars: 20,
    lead: style === 'ballad' ? (y > 0.2 ? 'bell' : 'flute') : undefined,
  });
}

export function createApp(root, engine, ui) {
  const canvas = root.querySelector('.taste');
  const g = canvas.getContext('2d');
  const shareEl = root.querySelector('.share');
  const titleEl = root.querySelector('.app-title');
  const whyEl = root.querySelector('.app-why');
  const keys = Object.fromEntries([...root.querySelectorAll('.app-keys button')].map((b) => [b.dataset.key, b]));
  const tr = new Transport(engine);

  const pts = catalogue();
  const taste = { x: 0, y: 0, r: R0 };
  const target = { x: 0, y: 0, r: R0 };
  const hearted = [];
  const recent = [];
  let cur = null;
  let song = null;
  let pos = 0;
  let active = false;
  let loved = false;
  let last = performance.now();
  const pick = rng(2019);

  const inside = (p, t = target) => !p.gone && (p.x - t.x) ** 2 + (p.y - t.y) ** 2 <= t.r * t.r;
  const share = () => pts.filter((p) => inside(p)).length / SIZE;
  const centrePoint = () => {
    let best = null;
    let bd = Infinity;
    for (const p of pts) {
      if (p.gone) continue;
      const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  };

  function next() {
    let pool = pts.filter((p) => inside(p) && !recent.includes(p.id));
    if (!pool.length) pool = pts.filter((p) => inside(p));
    if (!pool.length) pool = [centrePoint()];
    cur = pool[Math.floor(pick() * pool.length)];
    recent.push(cur.id);
    if (recent.length > 6) recent.shift();
    song = compose(paramsFor(cur, centrePoint(), target.r));
    pos = 0;
    tr.load(song, 0);
    if (active) tr.play();
    loved = false;
    keys.love.classList.remove('is-on');
    keys.love.setAttribute('aria-pressed', 'false');
    titleEl.textContent = `No. ${String(cur.id).padStart(4, '0')}`;
    const h = hearted[hearted.length - 1];
    whyEl.textContent = target.r < 0.09 ? 'made for you' : h ? `because you ♥ No. ${String(h.id).padStart(4, '0')}` : 'picked for you';
    const s = share() * 100;
    shareEl.textContent = `${s < 10 ? s.toFixed(1) : Math.round(s)}%`;
  }

  function narrow(f) {
    target.r = Math.max(R_MIN, target.r * f);
  }

  keys.love.setAttribute('aria-pressed', 'false');
  keys.love.addEventListener('click', () => ui.withSound(() => {
    if (loved) return;
    loved = true;
    keys.love.classList.add('is-on');
    keys.love.setAttribute('aria-pressed', 'true');
    hearted.push(cur);
    target.x += (cur.x - target.x) * 0.7;
    target.y += (cur.y - target.y) * 0.7;
    narrow(0.6);
    engine.beep(1200);
    const s = share() * 100;
    shareEl.textContent = `${s < 10 ? s.toFixed(1) : Math.round(s)}%`;
  }));
  keys.bin.addEventListener('click', () => ui.withSound(() => {
    for (const p of pts) if ((p.x - cur.x) ** 2 + (p.y - cur.y) ** 2 < 0.2 * 0.2) p.gone = true;
    narrow(0.88);
    engine.beep(600);
    next();
  }));
  keys.skip.addEventListener('click', () => ui.withSound(() => {
    narrow(0.85);
    engine.beep(1800);
    next();
  }));

  // the field, drawn round
  let size = 0;
  function paint(now) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    if (w !== size) {
      size = w;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
    }
    const R = (size / 2) * 0.92;
    const c = size / 2;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    g.beginPath();
    g.arc(c, c, size / 2 - 1, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255, 255, 255, 0.025)';
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    g.stroke();
    // the circle it draws from
    g.beginPath();
    g.arc(c + taste.x * R, c + taste.y * R, Math.max(2, taste.r * R), 0, Math.PI * 2);
    g.fillStyle = 'rgba(255, 77, 99, 0.09)';
    g.fill();
    g.strokeStyle = 'rgba(255, 90, 110, 0.75)';
    g.lineWidth = 1;
    g.stroke();
    for (const p of pts) {
      const x = c + p.x * R;
      const y = c + p.y * R;
      if (p.gone) {
        g.fillStyle = 'rgba(255, 255, 255, 0.05)';
      } else if (inside(p, taste)) g.fillStyle = 'rgba(255, 220, 225, 0.75)';
      else g.fillStyle = 'rgba(200, 190, 180, 0.3)';
      g.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
    }
    for (const p of hearted) {
      g.beginPath();
      g.arc(c + p.x * R, c + p.y * R, 2.6, 0, Math.PI * 2);
      g.fillStyle = '#ff4d63';
      g.fill();
    }
    if (cur) {
      const pulse = 4 + Math.sin(now / 180) * 1.5;
      g.beginPath();
      g.arc(c + cur.x * R, c + cur.y * R, pulse, 0, Math.PI * 2);
      g.strokeStyle = '#fff';
      g.lineWidth = 1.2;
      g.stroke();
    }
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = 1 - Math.exp(-dt * 3);
    taste.x += (target.x - taste.x) * k;
    taste.y += (target.y - taste.y) * k;
    taste.r += (target.r - taste.r) * k;
    if (Math.abs(target.r - taste.r) > 0.002) ui.relayout();
    if (active && song) {
      pos = tr.playing && engine.ctx?.state === 'running' ? tr.position() : pos + dt;
      if (pos >= song.length) {
        // it learns from silence too: a song you let play is a song you wanted
        narrow(0.8);
        next();
      }
    }
    paint(now);
  }

  next();

  return {
    frame,
    enter() {
      active = true;
      tr.seek(pos);
      tr.play();
    },
    leave() {
      active = false;
      tr.stop();
    },
    // How tightly the line coils round the field: from not at all to many turns.
    tightness() {
      return 1 - (taste.r - R_MIN) / (R0 - R_MIN);
    },
  };
}
