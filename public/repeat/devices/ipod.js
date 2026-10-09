// The iPod classic: first a dream behind the glass of a shop's case, then the real thing in the
// hand. Its screen is the 320 x 240 menu, run by the click wheel: turn round it to move, the centre
// to choose, MENU to go back, the other three edges to skip and play. What is on it is everything
// that came before, synced across.

import * as THREE from 'three';
import { screen } from '../stage.js';

const W = 320, H = 240;
const WHEEL_Y = 2.97, WHEEL_R = 1.97, CENTRE_R = 0.73; // scripts/blender/repeat/ipod.py
const TICK = (Math.PI * 2) / 20; // one step of the menu per twentieth of a turn
const FONT = '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Noto Sans CJK SC", sans-serif';

const ALBUMS = [
  { title: '奥斯卡金曲', artist: 'Various Artists', art: 'oscar', songs: ['Auld Lang Syne', 'Scarborough Fair', 'Red River Valley', 'Canon in D'] },
  { title: '英语听力', artist: '未知艺术家', art: 'english', songs: ['Unit 1 Listening', 'Unit 2 Listening', 'Unit 3 Listening', 'Unit 4 Listening'] },
  { title: '新建文件夹 (2)', artist: 'Unknown Artist', art: 'folder', songs: ['Track 01', 'Track 02', 'Track 03', 'Track 04', 'Track 05', 'Track 06', 'Track 07'] },
  { title: 'Unknown Album', artist: 'Unknown Artist', art: 'none', songs: ['01.mp3', '02.mp3', '03.mp3', '下载 (1).mp3', 'AMV_0042'] },
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

// Album art, drawn once: a cover for each album that came over from something older.
function art(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  if (kind === 'oscar') {
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#5e0b12');
    grd.addColorStop(1, '#250307');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 18) {
      g.fillStyle = `rgba(0,0,0,${0.18 + 0.12 * Math.sin(x)})`;
      g.fillRect(x, 0, 9, 256);
    }
    g.fillStyle = '#d8b25a';
    g.font = `700 50px ${FONT}`;
    g.textAlign = 'center';
    g.fillText('奥斯卡', 128, 112);
    g.fillText('金曲', 128, 168);
    g.font = `600 15px ${FONT}`;
    g.fillText('OSCAR GOLDEN HITS', 128, 206);
    g.strokeStyle = '#d8b25a';
    g.lineWidth = 2;
    g.strokeRect(16, 16, 224, 224);
  } else if (kind === 'english') {
    g.fillStyle = '#e9eef2';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#1d58a8';
    g.fillRect(0, 0, 256, 92);
    g.fillStyle = '#fff';
    g.font = `700 34px ${FONT}`;
    g.fillText('ENGLISH', 20, 58);
    g.fillStyle = '#1d58a8';
    g.font = `700 44px ${FONT}`;
    g.fillText('英语听力', 20, 160);
    g.font = `500 18px ${FONT}`;
    g.fillText('Listening · 磁带同步', 22, 196);
    g.fillStyle = '#e7a21c';
    g.beginPath();
    g.arc(214, 214, 26, 0, Math.PI * 2);
    g.fill();
  } else if (kind === 'folder') {
    g.fillStyle = '#d4d0c8';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#e8b730';
    g.fillRect(48, 70, 70, 28);
    g.fillStyle = '#f6cd4d';
    g.fillRect(48, 88, 160, 110);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.fillRect(48, 190, 160, 8);
    g.fillStyle = '#222';
    g.font = `500 17px ${FONT}`;
    g.textAlign = 'center';
    g.fillText('新建文件夹 (2)', 128, 230);
  } else {
    const grd = g.createLinearGradient(0, 0, 256, 256);
    grd.addColorStop(0, '#f2f2f2');
    grd.addColorStop(1, '#c9c9c9');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#a9a9a9';
    g.beginPath();
    g.ellipse(102, 176, 26, 19, -0.4, 0, Math.PI * 2);
    g.ellipse(176, 158, 26, 19, -0.4, 0, Math.PI * 2);
    g.fill();
    g.fillRect(118, 62, 10, 112);
    g.fillRect(192, 46, 10, 112);
    g.beginPath();
    g.moveTo(118, 62);
    g.lineTo(202, 40);
    g.lineTo(202, 66);
    g.lineTo(118, 88);
    g.fill();
  }
  return c;
}
const ARTS = {};
const cover = (kind) => (ARTS[kind] ??= art(kind));

export default {
  id: 'ipod',
  file: 'models/ipod.glb',
  size: [6.18, 10.35, 1.05],
  grams: 140,
  songs: 40960,
  capacity: '160GB',
  async setup(model, { stage, slot }) {
    const scr = screen(model.getObjectByName('screen'), W, H, { scale: 3 });
    const g = scr.ctx;
    // The shop's case: an acrylic box on a black plinth, round the iPod where it stands.
    const caseGroup = new THREE.Group();
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 12.6, 3.6),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.1, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
    );
    glass.position.y = 6.3 + 0.6;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    edges.position.copy(glass.position);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.6, 4), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35, transparent: true }));
    plinth.position.y = 0.3;
    plinth.castShadow = plinth.receiveShadow = true;
    caseGroup.add(glass, edges, plinth);
    model.position.y += 0.6; // stands on the plinth until it is bought
    model.parent.add(caseGroup);
    caseGroup.position.y = -slot.h / 2 - 0.6;
    slot.meshes.push(glass);
    glass.userData.prop = true;

    const st = {
      bought: false,
      open: 0, // the case lifting off
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
      if (!st.bought) return;
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
      if (!st.bought) return;
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
      if (!st.bought) return;
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
      g.drawImage(cover(a.art), half - 20 + Math.sin(t * 0.13) * 14, 21 - (s - (H - 21)) / 2, s, s);
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

    function off() {
      const grd = g.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, '#0c0e10');
      grd.addColorStop(1, '#020203');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
    }

    function draw() {
      if (!st.bought || st.open < 0.95) off();
      else if (st.view === 'now' && st.playing) now();
      else if (st.view === 'cover') flow();
      else menu();
      scr.show();
    }

    function buy() {
      if (st.bought) return;
      st.bought = true;
      slot.meshes.splice(slot.meshes.indexOf(glass), 1);
    }

    return {
      // The wheel (and the print on it) takes drags round it; anywhere else turns the iPod.
      claims: (name) => !st.bought || name === 'wheel' || name === 'legend',
      claim(name, { local }) {
        if (!st.bought) {
          buy();
          return true;
        }
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
        else if (k === 'Enter' || k === ' ') { if (!st.bought) buy(); else choose(); }
        else if (k === 'Escape' || k === 'Backspace') back();
        else if (k === 'ArrowRight') step(1);
        else if (k === 'ArrowLeft') step(-1);
        else return false;
        return true;
      },
      frame(t, dt, amount, sub) {
        // Scrolling on through its stop buys it, as does a touch on the glass.
        if ((sub > 0.5 && amount > 0.9) || stage.shown > slot.index + 1.5) buy();
        st.open += ((st.bought ? 1 : 0) - st.open) * (1 - Math.exp(-dt * 2.2));
        caseGroup.position.y = -slot.h / 2 - 0.6 + st.open * 16;
        caseGroup.visible = st.open < 0.99;
        glass.material.opacity = 0.1 * (1 - st.open);
        edges.material.opacity = 0.35 * (1 - st.open);
        plinth.material.opacity = 1 - st.open;
        model.position.y = -slot.h / 2 + 0.6 * (1 - st.open);
        if (st.playing) st.elapsed = Math.min(length(st.playing), st.elapsed + dt);
        if (st.playing && st.elapsed >= length(st.playing)) skip(1);
        st.cf += (st.cfSel - st.cf) * (1 - Math.exp(-dt * 9));
        if (amount > 0.01 || st.key !== 'drawn') {
          draw();
          st.key = amount > 0.01 ? '' : 'drawn';
        }
      },
      get bought() { return st.bought; },
    };
  },
};
