// 步步高 变速王 BK-898: first English listening tapes, later a tape of Oscar hits. The cassette in it
// is the site's own (public/models/cassette.glb) with a label drawn for each tape. Play latches and
// the reels turn; stop, and stop again, opens the door and the other tape goes in. 复读 sets A, then
// B, and the stretch between repeats, its grain on the desk lit; 变速 steps the speed.

import * as THREE from 'three';
import { screen } from '../stage.js';

// public/models/cassette.glb, as components/tape/cassette3d.ts reads it
const LABEL = { w: 8.6, h: 4.2, y: 0.45 };
const WIN = { w: 6.8, h: 2.0 };
const HUB_Y = 0.3;
const PACK = { min: 0.8, max: 2.4 };
const SPEEDS = [-2, -1, 0, 1, 2];
const SIDE = 1800; // seconds of tape on a side
const SONGS = 12; // grains per tape in the block behind it

const TAPES = [
  { name: '英语听力', paper: '#f1eee4', stripe: '#2756a8', ink: '#1d2a44', title: '英语听力', sub: 'ENGLISH LISTENING · 第三册', foot: 'Unit 1 — Unit 6 · 听力原文见课本', side: 'A' },
  { name: '奥斯卡金曲', paper: '#5c0d14', stripe: '#d8b25a', ink: '#f3dfa6', title: '奥斯卡金曲', sub: 'OSCAR GOLDEN HITS · 珍藏版', foot: '魂断蓝桥 · 毕业生 · 愤怒的葡萄 · 凡夫俗子', side: 'A' },
];

function drawLabel(t) {
  const c = document.createElement('canvas');
  c.width = 1376;
  c.height = 672;
  const g = c.getContext('2d');
  const W = c.width, H = c.height, px = W / LABEL.w;
  g.fillStyle = t.paper;
  g.beginPath();
  g.roundRect(0, 0, W, H, 18);
  g.fill();
  g.fillStyle = t.stripe;
  g.fillRect(0, 34, W, 18);
  g.fillRect(0, H - 70, W, 10);
  const wx = (LABEL.w / 2 - WIN.w / 2 - 0.12) * px;
  const wy = (LABEL.h / 2 + LABEL.y - HUB_Y - WIN.h / 2 - 0.12) * px;
  const ww = (WIN.w + 0.24) * px, wh = (WIN.h + 0.24) * px;
  g.fillStyle = '#1b1b1d';
  g.beginPath();
  g.roundRect(wx - 10, wy - 10, ww + 20, wh + 20, 0.62 * px + 10);
  g.fill();
  g.fillStyle = t.ink;
  g.font = '700 92px "Courier Prime", monospace';
  g.fillText(t.side, 56, 168);
  g.font = '700 74px "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", serif';
  g.fillText(t.title, 150, 160);
  g.font = '400 26px "Courier Prime", monospace';
  g.globalAlpha = 0.75;
  g.fillText(t.sub, 152, 196);
  g.globalAlpha = 1;
  g.font = '400 30px "Songti SC", "Noto Serif CJK SC", serif';
  g.fillText(t.foot, 60, wy + wh + 80);
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.roundRect(wx, wy, ww, wh, 0.62 * px);
  g.fill();
  g.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = 8;
  return tex;
}

// Seven-segment digits for the LCD.
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
function digit(g, ch, x, y, w, h, on, off) {
  const t = w * 0.18;
  const seg = {
    a: [x + t, y, w - 2 * t, t], d: [x + t, y + h - t, w - 2 * t, t], g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
    f: [x, y + t, t, h / 2 - t], b: [x + w - t, y + t, t, h / 2 - t], e: [x, y + h / 2, t, h / 2 - t], c: [x + w - t, y + h / 2, t, h / 2 - t],
  };
  for (const k of 'abcdefg') {
    g.fillStyle = (SEG[ch] ?? '').includes(k) ? on : off;
    g.fillRect(...seg[k]);
  }
}

export default {
  id: 'repeater',
  file: 'models/repeater.glb',
  size: [11.6, 13.7, 3.0],
  grams: 300, // not published: estimated from the BK-919's 166 g by volume, without batteries
  roughly: true,
  songs: 24,
  capacity: '两盘磁带',
  async setup(model, { stage, slot, loader }) {
    const self = slot.index;
    const scr = screen(model.getObjectByName('screen'), 200, 90, { scale: 3 });
    const g = scr.ctx;
    const door = model.getObjectByName('door');
    const holder = model.getObjectByName('cassette_slot');
    const spindles = ['spindleL', 'spindleR'].map((n) => model.getObjectByName(n));
    const key = (n) => model.getObjectByName(n);

    // Two tapes: one in the well, the other lying on the desk beside the repeater.
    const gltf = await loader.loadAsync('/models/cassette.glb');
    const tapes = TAPES.map((t, k) => {
      const root = k === 0 ? gltf.scene : gltf.scene.clone(true);
      root.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = o.receiveShadow = true;
        const m = o.material;
        if (m.name === 'label') o.material = new THREE.MeshStandardMaterial({ map: drawLabel(t), roughness: 0.82, alphaTest: 0.5, side: THREE.DoubleSide });
        else if (m.name === 'window') o.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.04, clearcoat: 1, depthWrite: false });
        else if (m.name === 'tape') { o.material = m.clone(); o.material.roughness = 0.6; }
        o.userData.prop = true;
      });
      const pencil = root.getObjectByName('pencil');
      if (pencil) pencil.visible = false;
      return { ...t, root, hubL: root.getObjectByName('hubL'), hubR: root.getObjectByName('hubR'), packL: root.getObjectByName('packL'), packR: root.getObjectByName('packR'), wound: k === 0 ? 0.18 : 0.05 };
    });
    const desk = new THREE.Group(); // where the spare lies, in the scene, beside the repeater
    stage.scene.add(desk);
    desk.position.set(slot.x + slot.w / 2 + 6.2, 0.62, 6);
    desk.rotation.y = -0.35;

    const put = (tape, where) => {
      where.add(tape.root);
      tape.root.position.set(0, 0, 0);
      tape.root.rotation.set(where === holder ? Math.PI / 2 : 0, 0, 0);
    };
    let inside = 0;
    put(tapes[0], holder);
    put(tapes[1], desk);

    const st = {
      mode: 'stop', // stop | play | ff | rew
      paused: false,
      speed: 2, // index into SPEEDS
      a: null, b: null, loops: 0,
      doorK: 0, doorOpen: false,
      swap: null, // the exchange in progress: seconds since it began
      touched: false,
      note: '', noteT: 0,
      hub: 0,
    };

    function latch() {
      for (const n of ['key_play', 'key_ff', 'key_rew', 'key_rec']) {
        const o = key(n);
        if (o) o.userData.latch = false;
      }
      const on = { play: 'key_play', ff: 'key_ff', rew: 'key_rew' }[st.mode];
      if (on && key(on)) key(on).userData.latch = true;
    }
    function set(mode) {
      st.mode = mode;
      latch();
    }
    function say(text) {
      st.note = text;
      st.noteT = 1.6;
    }
    function startSwap() {
      st.swap = 0;
      set('stop');
      st.a = st.b = null;
      stage.grains.light(self, -1);
    }

    function press(name) {
      st.touched = true;
      if (st.swap !== null) return;
      if (name === 'key_play' || name === 'btn_auto') { if (st.doorOpen) st.doorOpen = false; set('play'); st.paused = false; }
      else if (name === 'key_ff' || name === 'btn_forward') { if (name === 'btn_forward') tapes[inside].wound = Math.min(1, tapes[inside].wound + 0.01); else set('ff'); }
      else if (name === 'key_rew' || name === 'btn_back') { if (name === 'btn_back') tapes[inside].wound = Math.max(0, tapes[inside].wound - 0.01); else set('rew'); }
      else if (name === 'key_stop') {
        if (st.mode !== 'stop') set('stop');
        else startSwap();
      } else if (name === 'key_rec') say('REC');
      else if (name === 'btn_ab') {
        const w = tapes[inside].wound;
        if (st.a === null) { st.a = w; say('A-'); }
        else if (st.b === null) { st.b = Math.max(w, st.a + 0.004); st.loops = 0; say('A-B'); if (st.mode !== 'play') set('play'); }
        else { st.a = st.b = null; stage.grains.light(self, -1); say('---'); }
      } else if (name === 'btn_speed') {
        st.speed = (st.speed + 1) % SPEEDS.length;
        say(`SP${SPEEDS[st.speed] > 0 ? '+' : ''}${SPEEDS[st.speed]}`);
      } else if (name === 'btn_compare') say('对比');
      else if (name === 'btn_follow') say('跟读');
    }

    function lcd() {
      g.fillStyle = '#a3ad98';
      g.fillRect(0, 0, 200, 90);
      const on = '#1d2219', off = 'rgba(29,34,25,0.08)';
      const t = tapes[inside];
      const count = String(Math.floor(t.wound * 999)).padStart(3, '0');
      [...count].forEach((ch, k) => digit(g, ch, 92 + k * 34, 22, 26, 48, on, off));
      g.fillStyle = on;
      g.font = '700 15px "Courier Prime", monospace';
      g.fillStyle = st.a !== null ? on : off;
      g.fillText(st.b !== null ? 'A-B' : 'A-', 10, 26);
      g.fillStyle = st.b !== null ? on : off;
      g.fillText(`x${Math.min(99, st.loops)}`, 10, 46);
      g.fillStyle = SPEEDS[st.speed] !== 0 ? on : off;
      g.fillText(`变速${SPEEDS[st.speed] > 0 ? '+' : ''}${SPEEDS[st.speed]}`, 10, 66);
      g.fillStyle = on;
      const icon = { play: '▶', ff: '▶▶', rew: '◀◀', stop: '■' }[st.mode];
      g.fillText(icon, 10, 84);
      if (st.noteT > 0) {
        g.font = '700 14px "Courier Prime", "Songti SC", monospace';
        g.fillText(st.note, 92, 86);
      } else {
        g.font = '400 12px "Songti SC", "Noto Serif CJK SC", serif';
        g.fillText(t.name, 92, 86);
      }
      scr.show();
    }

    return {
      press,
      key(k) {
        const map = { ' ': 'key_play', Enter: 'key_play', s: 'key_stop', Escape: 'key_stop', ArrowRight: 'key_ff', ArrowLeft: 'key_rew', a: 'btn_ab', b: 'btn_ab', v: 'btn_speed' };
        if (!map[k]) return false;
        press(map[k]);
        stage.tap(key(map[k]));
        return true;
      },
      frame(t, dt, amount, sub) {
        // Scrolled to and not touched: it plays; past half its stop, the Oscar tape goes in.
        if (!st.touched && amount > 0.9 && st.mode === 'stop' && st.swap === null && !(inside === 0 && sub > 0.55)) set('play');
        if (!st.touched && inside === 0 && sub > 0.55 && amount > 0.9 && st.swap === null) startSwap();

        const tape = tapes[inside];
        const rate = { play: 1 + SPEEDS[st.speed] * 0.15, ff: 14, rew: -14, stop: 0 }[st.mode];
        if (st.swap === null && rate) {
          tape.wound = Math.min(1, Math.max(0, tape.wound + (rate * dt) / SIDE * (st.mode === 'play' ? 6 : 1)));
          if (tape.wound <= 0 || tape.wound >= 1) set('stop');
          if (st.b !== null && st.mode === 'play' && tape.wound >= st.b) {
            tape.wound = st.a;
            st.loops++;
          }
          st.hub -= rate * dt * 3.2;
        }
        // The stretch being repeated lights its grain.
        if (st.b !== null) stage.grains.light(self, inside * SONGS + Math.min(SONGS - 1, Math.floor(st.a * SONGS)));

        // Reels and spindles; the packs grow and shrink with how far the tape has gone.
        for (const tp of tapes) {
          const rL = Math.sqrt(PACK.min ** 2 + (1 - tp.wound) * (PACK.max ** 2 - PACK.min ** 2));
          const rR = Math.sqrt(PACK.min ** 2 + tp.wound * (PACK.max ** 2 - PACK.min ** 2));
          tp.packL?.scale.set(rL, 1, rL);
          tp.packR?.scale.set(rR, 1, rR);
        }
        const tl = tape.hubL, tr = tape.hubR;
        const rL = Math.sqrt(PACK.min ** 2 + (1 - tape.wound) * (PACK.max ** 2 - PACK.min ** 2));
        const rR = Math.sqrt(PACK.min ** 2 + tape.wound * (PACK.max ** 2 - PACK.min ** 2));
        if (tl) tl.rotation.y = st.hub * (PACK.max / rL) * 0.5;
        if (tr) tr.rotation.y = st.hub * (PACK.max / rR) * 0.5;
        spindles.forEach((s, k) => { if (s) s.rotation.z = k ? (tr?.rotation.y ?? 0) : (tl?.rotation.y ?? 0); });

        // The exchange: the door opens, the tape in it comes out and lies down on the desk, the other
        // rises from the desk into the well, and the door shuts.
        if (st.swap !== null) {
          st.swap += dt;
          const s = st.swap;
          st.doorOpen = s < 2.3;
          if (s > 0.55 && tapes[inside].root.parent === holder) {
            // hand over in world space, so nothing jumps
            const out = tapes[inside], into = tapes[1 - inside];
            out.root.getWorldPosition(out.from = new THREE.Vector3());
            into.root.getWorldPosition(into.from = new THREE.Vector3());
            stage.scene.attach(out.root);
            stage.scene.attach(into.root);
            st.outQ = out.root.quaternion.clone();
            st.inQ = into.root.quaternion.clone();
          }
          if (s > 0.55 && s < 2.0) {
            const k = Math.min(1, (s - 0.55) / 1.3), e = k * k * (3 - 2 * k);
            const out = tapes[inside], into = tapes[1 - inside];
            const deskAt = desk.getWorldPosition(new THREE.Vector3());
            const slotAt = holder.getWorldPosition(new THREE.Vector3());
            // both swing out in front of the repeater on their way, where they can be seen
            const arc = Math.sin(Math.PI * e);
            out.root.position.lerpVectors(out.from, deskAt, e).add(new THREE.Vector3(0, arc * 4, arc * 7));
            into.root.position.lerpVectors(into.from, slotAt, e).add(new THREE.Vector3(0, arc * 6, arc * 9));
            out.root.quaternion.slerpQuaternions(st.outQ, desk.getWorldQuaternion(new THREE.Quaternion()), e);
            const inQ = holder.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
            into.root.quaternion.slerpQuaternions(st.inQ, inQ, e);
          }
          if (s >= 2.0 && tapes[inside].root.parent !== desk) {
            put(tapes[inside], desk);
            inside = 1 - inside;
            put(tapes[inside], holder);
          }
          if (s > 2.8) {
            st.swap = null;
            if (!st.touched) set('play');
          }
        }
        st.doorK += ((st.doorOpen ? 1 : 0) - st.doorK) * (1 - Math.exp(-dt * 6));
        if (door) door.rotation.x = 0.5 * st.doorK;
        st.noteT = Math.max(0, st.noteT - dt);
        if (amount > 0.01 || !st.drawn) { lcd(); st.drawn = true; }
      },
      get tape() { return tapes[inside].name; },
    };
  },
};
