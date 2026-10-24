// The iPod classic. Its screen is the 320 x 240 menu, run by the click wheel: turn round it to move,
// the centre to choose, MENU to go back, the other three edges to skip and play. On it, post-punk.

import { screen } from '../stage.js';

const W = 320, H = 240;
const WHEEL_Y = 2.97, WHEEL_R = 1.97, CENTRE_R = 0.73; // scripts/blender/fidelity/ipod.py
const TICK = (Math.PI * 2) / 20; // one step of the menu per twentieth of a turn
const FONT = '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Noto Sans CJK SC", sans-serif';

const ALBUMS = [
  { title: 'Unknown Pleasures', artist: 'Joy Division', art: 'pleasures', songs: ['Disorder', 'Day of the Lords', 'Candidate', 'Insight', 'New Dawn Fades', "She's Lost Control", 'Shadowplay', 'Wilderness', 'Interzone', 'I Remember Nothing'] },
  { title: 'Entertainment!', artist: 'Gang of Four', art: 'entertainment', songs: ['Ether', "Natural's Not in It", 'Not Great Men', 'Damaged Goods', 'Return the Gift', 'Guns Before Butter', 'I Found That Essence Rare', 'Glass', 'Contract', "At Home He's a Tourist", '5.45', 'Anthrax'] },
  { title: 'Pink Flag', artist: 'Wire', art: 'pinkflag', songs: ['Reuters', 'Field Day for the Sundays', 'Three Girl Rhumba', 'Ex Lion Tamer', 'Lowdown', 'Start to Move', 'Brazil', "It's So Obvious"] },
  { title: 'Seventeen Seconds', artist: 'The Cure', art: 'seventeen', songs: ['A Reflection', 'Play for Today', 'Secrets', 'In Your House', 'Three', 'The Final Sound', 'A Forest', 'M', 'At Night', 'Seventeen Seconds'] },
  { title: 'Этажи', artist: 'Molchat Doma', art: 'etazhi', songs: ['Тоска', 'Судно (Борис Рыжий)', 'Клетка'] },
];
const SONGS = ALBUMS.flatMap((a) => a.songs.map((title) => ({ title, album: a })));
const length = (s) => 150 + ((s.title.length * 37 + s.album.title.length * 11) % 140);

const MENUS = {
  iPod: ['Music', 'Videos', 'Photos', 'Podcasts', 'Extras', 'Settings', 'Shuffle Songs', 'Now Playing'],
  Music: ['Cover Flow', 'Playlists', 'Artists', 'Albums', 'Songs', 'Genres', 'Composers', 'Audiobooks', 'Search'],
  Albums: ALBUMS.map((a) => a.title),
  Artists: [...new Set(ALBUMS.map((a) => a.artist))],
  Songs: SONGS.map((s) => s.title),
  Playlists: ['On-The-Go', 'Purchased', 'Recently Added', 'Top 25 Most Played'],
  Settings: ['About', 'Shuffle', 'Repeat', 'EQ', 'Brightness', 'Clicker'],
  Extras: ['Clock', 'Games', 'Contacts', 'Calendar', 'Notes', 'Stopwatch'],
};

// Album art, drawn once, after the covers rather than copies of them.
function art(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  if (kind === 'pleasures') {
    // a pulsar's successive pulses, stacked, each hiding the ones behind
    g.fillStyle = '#000';
    g.fillRect(0, 0, 256, 256);
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.strokeStyle = '#f2f2f2';
    g.lineWidth = 1.3;
    for (let r = 0; r < 40; r++) {
      // each pulse its own height, with a second peak beside the first, and noise mostly in the middle
      const y0 = 50 + r * 4.4, pts = [], a = 10 + 30 * rnd(), a2 = 14 * rnd(), c2 = (rnd() - 0.5) * 1.4;
      for (let x = 58; x <= 198; x += 2) {
        const u = (x - 128) / 26;
        const peak = a * Math.exp(-u * u) + a2 * Math.exp(-((u - c2) ** 2) * 4) + (rnd() - 0.5) * (0.8 + 4 * Math.exp(-u * u * 0.6));
        pts.push([x, y0 - Math.max(0, peak)]);
      }
      const line = () => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); };
      line();
      g.lineTo(198, 256);
      g.lineTo(58, 256);
      g.fill();
      line();
      g.stroke();
    }
  } else if (kind === 'entertainment') {
    g.fillStyle = '#c51f24';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#111';
    g.font = `900 23px ${FONT}`;
    g.fillText('GANG OF FOUR', 22, 46);
    g.font = `900 40px ${FONT}`;
    g.fillText('ENTER-', 22, 166);
    g.fillText('TAINMENT!', 22, 206);
    g.fillStyle = '#f4ecdc';
    g.fillRect(150, 60, 70, 70);
    g.fillStyle = '#c51f24';
    g.beginPath();
    g.arc(185, 95, 22, 0, Math.PI * 2);
    g.fill();
  } else if (kind === 'pinkflag') {
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#d98ca2');
    grd.addColorStop(1, '#f4d3dc');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#7e7a76';
    g.fillRect(0, 214, 256, 42);
    g.fillStyle = '#f7f3ee';
    g.fillRect(150, 58, 3, 160);
    g.fillStyle = '#e36a8a';
    g.fillRect(153, 58, 40, 24);
  } else if (kind === 'seventeen') {
    g.fillStyle = '#b8bcb6';
    g.fillRect(0, 0, 256, 256);
    g.filter = 'blur(5px)';
    for (let k = 0; k < 14; k++) {
      g.fillStyle = `rgba(${40 + k * 4}, ${48 + k * 4}, ${44 + k * 3}, 0.75)`;
      g.fillRect(10 + k * 18 + (k % 3) * 5, 30 + (k % 4) * 12, 6 + (k % 2) * 5, 230);
    }
    g.filter = 'none';
    g.fillStyle = '#2b2d2b';
    g.font = `500 15px ${FONT}`;
    g.fillText('THE CURE', 18, 238);
  } else {
    // a block of flats against a grey sky
    g.fillStyle = '#9aa2a7';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#4a5054';
    g.fillRect(40, 70, 176, 186);
    g.fillStyle = '#c9cfd2';
    for (let y = 82; y < 250; y += 16) for (let x = 50; x < 206; x += 14) g.fillRect(x, y, 8, 9);
  }
  return c;
}
const ARTS = {};
const cover = (kind) => (ARTS[kind] ??= art(kind));

export default {
  id: 'ipod',
  era: 'better',
  name: 'iPod classic',
  got: 2013, // the year he got it
  file: 'models/ipod.glb',
  size: [6.18, 10.35, 1.05],
  grams: 140,
  songs: 40960,
  capacity: '160GB',
  async setup(model, { stage }) {
    const scr = screen(model.getObjectByName('screen'), W, H, { scale: 3 });
    const g = scr.ctx;
    const st = {
      stack: [{ menu: 'iPod', sel: 0, top: 0 }],
      view: 'menu',
      playing: null,
      elapsed: 0,
      cf: 0, // cover flow position, eased
      cfSel: 0,
      turn: 0, // rotation round the wheel not yet spent on a step
      last: null,
      moved: 0,
      key: '',
    };
    const here = () => st.stack[st.stack.length - 1];

    function play(song) {
      st.playing = song;
      st.elapsed = 0;
      st.view = 'now';
    }

    function step(dir) {
      if (st.view === 'cover') {
        st.cfSel = Math.max(0, Math.min(ALBUMS.length - 1, st.cfSel + dir));
        return;
      }
      if (st.view === 'now') return;
      const h = here();
      const n = MENUS[h.menu].length;
      h.sel = Math.max(0, Math.min(n - 1, h.sel + dir));
      if (h.sel < h.top) h.top = h.sel;
      if (h.sel > h.top + 8) h.top = h.sel - 8;
    }

    function choose() {
      if (st.view === 'cover') {
        const a = ALBUMS[st.cfSel];
        play(SONGS.find((s) => s.album === a));
        return;
      }
      if (st.view === 'now') return;
      const h = here();
      const item = MENUS[h.menu][h.sel];
      if (h.menu === 'Songs') return play(SONGS[h.sel]);
      if (h.menu === 'Albums') return play(SONGS.find((s) => s.album === ALBUMS[h.sel]));
      if (item === 'Cover Flow') { st.view = 'cover'; return; }
      if (item === 'Now Playing') { if (st.playing) st.view = 'now'; return; }
      if (item === 'Shuffle Songs') return play(SONGS[Math.floor(Math.random() * SONGS.length)]);
      if (MENUS[item]) st.stack.push({ menu: item, sel: 0, top: 0 });
    }

    function back() {
      if (st.view !== 'menu') { st.view = 'menu'; return; }
      if (st.stack.length > 1) st.stack.pop();
    }

    function skip(dir) {
      if (!st.playing) return;
      const i = SONGS.indexOf(st.playing);
      play(SONGS[(i + dir + SONGS.length) % SONGS.length]);
    }

    // --- drawing -------------------------------------------------------------------------------
    function bar(title) {
      const grd = g.createLinearGradient(0, 0, 0, 20);
      grd.addColorStop(0, '#fdfdfd');
      grd.addColorStop(1, '#cfd3d8');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, 20);
      g.fillStyle = '#8b9096';
      g.fillRect(0, 20, W, 1);
      g.fillStyle = '#111';
      g.font = `700 13px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(title, W / 2, 10.5);
      // battery
      g.strokeStyle = '#555';
      g.lineWidth = 1;
      g.strokeRect(W - 30, 5, 21, 10);
      g.fillStyle = '#555';
      g.fillRect(W - 9, 8, 2, 4);
      const lg = g.createLinearGradient(0, 6, 0, 14);
      lg.addColorStop(0, '#9be36a');
      lg.addColorStop(1, '#3e9a1f');
      g.fillStyle = lg;
      g.fillRect(W - 29, 6, 15, 8);
      if (st.playing) {
        g.fillStyle = '#2a6fd6';
        g.beginPath();
        g.moveTo(9, 5);
        g.lineTo(17, 10);
        g.lineTo(9, 15);
        g.fill();
      }
      g.textAlign = 'left';
    }

    function menu() {
      const h = here();
      const items = MENUS[h.menu];
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      bar(h.menu);
      const half = 160, row = 24;
      // right half: the art of what is (or was last) playing, slowly drifting
      const a = (st.playing ?? SONGS[0]).album;
      const t = performance.now() / 1000;
      g.save();
      g.beginPath();
      g.rect(half, 21, W - half, H - 21);
      g.clip();
      const z = 1.25 + 0.08 * Math.sin(t * 0.2);
      const s = (H - 21) * z;
      g.drawImage(cover(a.art), half - (s - (W - half)) / 2 + Math.sin(t * 0.13) * 14, 21 - (s - (H - 21)) / 2, s, s);
      g.fillStyle = 'rgba(0,0,0,0.04)';
      g.fillRect(half, 21, 2, H);
      g.restore();
      g.fillStyle = '#fff';
      g.fillRect(0, 21, half, H);
      for (let i = h.top; i < Math.min(items.length, h.top + 9); i++) {
        const y = 21 + (i - h.top) * row;
        if (i === h.sel) {
          const grd = g.createLinearGradient(0, y, 0, y + row);
          grd.addColorStop(0, '#6fb0f7');
          grd.addColorStop(1, '#1f6ad8');
          g.fillStyle = grd;
          g.fillRect(0, y, half, row);
        }
        g.fillStyle = i === h.sel ? '#fff' : '#000';
        g.font = `700 13px ${FONT}`;
        g.textBaseline = 'middle';
        let label = items[i];
        while (g.measureText(label).width > half - 26 && label.length > 2) label = label.slice(0, -2) + '…';
        g.fillText(label, 7, y + row / 2 + 1);
        const deeper = MENUS[items[i]] || items[i] === 'Cover Flow';
        if (deeper) {
          g.strokeStyle = i === h.sel ? '#fff' : '#777';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(half - 13, y + 7);
          g.lineTo(half - 8, y + row / 2);
          g.lineTo(half - 13, y + row - 7);
          g.stroke();
        }
      }
      if (items.length > 9) {
        const track = H - 21, k = 9 / items.length;
        g.fillStyle = '#e8e8e8';
        g.fillRect(half - 5, 21, 5, track);
        g.fillStyle = '#8a8f96';
        g.fillRect(half - 5, 21 + (h.top / items.length) * track, 5, track * k);
      }
    }

    function now() {
      const s = st.playing;
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      bar('Now Playing');
      const art = cover(s.album.art);
      g.drawImage(art, 16, 38, 120, 120);
      // the glossy reflection below the cover
      g.save();
      g.translate(0, 38 + 240);
      g.scale(1, -1);
      g.globalAlpha = 0.18;
      g.drawImage(art, 16, 0, 120, 120);
      g.restore();
      const fade = g.createLinearGradient(0, 158, 0, 200);
      fade.addColorStop(0, 'rgba(255,255,255,0.4)');
      fade.addColorStop(1, '#fff');
      g.fillStyle = fade;
      g.fillRect(16, 158, 120, 42);
      g.fillStyle = '#000';
      g.textBaseline = 'alphabetic';
      g.font = `400 11px ${FONT}`;
      g.fillText(`${SONGS.indexOf(s) + 1} of ${SONGS.length}`, 150, 56);
      g.font = `700 15px ${FONT}`;
      g.fillText(s.title, 150, 86);
      g.font = `400 13px ${FONT}`;
      g.fillStyle = '#333';
      g.fillText(s.album.artist, 150, 108);
      g.fillText(s.album.title, 150, 128);
      const len = length(s);
      const k = Math.min(1, st.elapsed / len);
      const grd = g.createLinearGradient(0, 196, 0, 206);
      grd.addColorStop(0, '#d8dbe0');
      grd.addColorStop(1, '#f8f9fa');
      g.fillStyle = grd;
      g.fillRect(16, 196, W - 32, 9);
      const bg = g.createLinearGradient(0, 196, 0, 206);
      bg.addColorStop(0, '#79b8fa');
      bg.addColorStop(1, '#1f6ad8');
      g.fillStyle = bg;
      g.fillRect(16, 196, (W - 32) * k, 9);
      g.strokeStyle = '#9aa0a8';
      g.strokeRect(16.5, 196.5, W - 33, 8);
      const mm = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
      g.fillStyle = '#000';
      g.font = `700 11px ${FONT}`;
      g.fillText(mm(st.elapsed), 16, 224);
      g.textAlign = 'right';
      g.fillText(`-${mm(len - st.elapsed)}`, W - 16, 224);
      g.textAlign = 'left';
    }

    // Cover Flow: the covers stand in a row in perspective, the chosen one face on, drawn in thin
    // vertical slices so the side ones lean away.
    function flow() {
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#000');
      bg.addColorStop(1, '#1b1b1b');
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      const order = ALBUMS.map((a, i) => i).sort((a, b) => Math.abs(b - st.cf) - Math.abs(a - st.cf));
      for (const i of order) {
        const d = i - st.cf;
        const side = Math.max(-1, Math.min(1, d));
        const cx = W / 2 + side * 70 + (d - side) * 26;
        const size = 120;
        const lean = Math.abs(side);
        const w = size * (1 - 0.55 * lean);
        const img = cover(ALBUMS[i].art);
        const slices = 24;
        for (let k = 0; k < slices; k++) {
          const u = k / slices;
          // the far edge is shorter
          const far = side > 0 ? u : 1 - u;
          const hh = size * (1 - 0.22 * lean * far);
          const x = cx - w / 2 + u * w;
          const y = 92 - hh / 2;
          g.drawImage(img, u * 256, 0, 256 / slices + 1, 256, x, y, w / slices + 0.6, hh);
          g.globalAlpha = 0.22;
          g.drawImage(img, u * 256, 256 - 64, 256 / slices + 1, 64, x, y + hh + 2 + hh * 0.25, w / slices + 0.6, -hh * 0.25);
          g.globalAlpha = 1;
        }
        g.fillStyle = `rgba(0,0,0,${0.45 * lean})`;
        g.fillRect(cx - w / 2, 92 - size / 2, w, size);
      }
      const a = ALBUMS[st.cfSel];
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.font = `700 13px ${FONT}`;
      g.fillText(a.title, W / 2, 205);
      g.fillStyle = '#aaa';
      g.font = `400 12px ${FONT}`;
      g.fillText(a.artist, W / 2, 222);
      g.textAlign = 'left';
    }

    function draw() {
      if (st.view === 'now' && st.playing) now();
      else if (st.view === 'cover') flow();
      else menu();
      scr.show();
    }

    return {
      // The wheel (and the print on it) takes drags round it; anywhere else turns the iPod.
      claims: (name) => name === 'wheel' || name === 'legend',
      claim(name, { local }) {
        if (name !== 'wheel' && name !== 'legend') return false;
        st.last = local ? Math.atan2(local.y - WHEEL_Y, local.x) : null;
        st.moved = 0;
        st.turn = 0;
        return true;
      },
      drag(name, { local }) {
        if (!local || st.last === null) return;
        const a = Math.atan2(local.y - WHEEL_Y, local.x);
        let d = a - st.last;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        st.last = a;
        st.moved += Math.abs(d);
        st.turn += d;
        // clockwise (the angle falling) goes down the list
        while (st.turn <= -TICK) { st.turn += TICK; step(1); }
        while (st.turn >= TICK) { st.turn -= TICK; step(-1); }
      },
      drop(name, { local }) {
        if (st.moved > 0.25 || !local) return;
        const x = local.x, y = local.y - WHEEL_Y, r = Math.hypot(x, y);
        if (r < CENTRE_R || r > WHEEL_R + 0.2) return;
        stage.tap(model.getObjectByName('wheel'));
        const a = Math.atan2(y, x);
        if (a > Math.PI / 4 && a < (3 * Math.PI) / 4) back();
        else if (a < -Math.PI / 4 && a > (-3 * Math.PI) / 4) { if (st.playing) st.view = 'now'; }
        else skip(x > 0 ? 1 : -1);
      },
      press(name) {
        if (name === 'btn_center') choose();
      },
      key(k) {
        if (k === 'ArrowDown') step(1);
        else if (k === 'ArrowUp') step(-1);
        else if (k === 'Enter' || k === ' ') choose();
        else if (k === 'Escape' || k === 'Backspace') back();
        else if (k === 'ArrowRight') step(1);
        else if (k === 'ArrowLeft') step(-1);
        else return false;
        return true;
      },
      frame(t, dt, amount) {
        if (st.playing) st.elapsed = Math.min(length(st.playing), st.elapsed + dt);
        if (st.playing && st.elapsed >= length(st.playing)) skip(1);
        st.cf += (st.cfSel - st.cf) * (1 - Math.exp(-dt * 9));
        if (amount > 0.01 || st.key !== 'drawn') {
          draw();
          st.key = amount > 0.01 ? '' : 'drawn';
        }
      },
    };
  },
};
