// The Zune HD, off 闲鱼 with a new battery, the last player: lighter and smaller than the iPod it
// replaced, which is held up beside it at its stop. Its screen is the Zune's own: the menu in huge
// lowercase words that slide under the finger, and now playing with the artist's name drifting
// across the back, and a shuffle that deals the block of songs behind it out again.

import { screen } from '../stage.js';

const W = 272, H = 480;
const FONT = '"Segoe UI", "Segoe UI Light", "Helvetica Neue", Helvetica, "PingFang SC", "Noto Sans CJK SC", sans-serif';
const MENU = ['music', 'videos', 'pictures', 'podcasts', 'radio', 'marketplace', 'internet', 'apps', 'settings'];
const ARTISTS = ['奥斯卡金曲', '英语听力', '新建文件夹 (2)', 'Unknown Artist', 'NTS'];

export default {
  id: 'zune',
  file: 'models/zune.glb',
  size: [5.27, 10.21, 0.89],
  grams: 74,
  songs: 8192,
  capacity: '32GB',
  companion: 'ipod',
  async setup(model, { stage }) {
    const panel = model.getObjectByName('screen');
    const scr = screen(panel, W, H, { scale: 2 });
    // where the panel is on the face, so a touch through the glass over it lands on the right pixel
    panel.geometry.computeBoundingBox();
    const area = panel.geometry.boundingBox.clone().translate(panel.position);
    const uvAt = (p) => p && { x: (p.x - area.min.x) / (area.max.x - area.min.x), y: (p.y - area.min.y) / (area.max.y - area.min.y) };
    const g = scr.ctx;
    const st = { view: 'menu', scroll: 0, scrollT: 0, sel: 0, drag: null, artist: 0, t0: 0, shuffle: false, moved: 0 };
    const self = stage.slots.findIndex((s) => s.model === model);

    function menu(t) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      // the wallpaper: a slow orange-to-magenta glow, as the HD's backgrounds were
      const grd = g.createRadialGradient(W * 0.9, H * 0.15, 10, W * 0.9, H * 0.15, H * 0.9);
      grd.addColorStop(0, 'rgba(236, 0, 140, 0.55)');
      grd.addColorStop(0.45, 'rgba(255, 102, 0, 0.18)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.font = `400 13px ${FONT}`;
      g.textBaseline = 'alphabetic';
      g.fillText('12:00', 14, 22);
      g.fillText('▮▮▮', W - 42, 22);
      g.font = `300 52px ${FONT}`;
      MENU.forEach((m, i) => {
        const y = 110 + i * 62 - st.scroll;
        if (y < 20 || y > H + 50) return;
        g.fillStyle = i === st.sel ? '#fff' : 'rgba(255,255,255,0.42)';
        g.fillText(m, 12, y);
      });
    }

    function playing(t) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      const name = ARTISTS[st.artist % ARTISTS.length];
      // the artist's name, huge and pale, drifting across the back
      g.save();
      g.globalAlpha = 0.18;
      g.fillStyle = '#fff';
      g.font = `700 150px ${FONT}`;
      const w = g.measureText(name).width;
      g.fillText(name, W - ((t * 22) % (w + W)), 300);
      g.restore();
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.8)');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff';
      g.font = `300 30px ${FONT}`;
      g.fillText(name.toLowerCase(), 14, 380);
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.font = `400 15px ${FONT}`;
      g.fillText(`song ${1 + ((st.artist * 7) % 128)} of 8,192`, 14, 404);
      const k = ((t - st.t0) % 200) / 200;
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(14, 424, W - 28, 3);
      g.fillStyle = '#ff2a8a';
      g.fillRect(14, 424, (W - 28) * k, 3);
      // shuffle, bottom left
      g.font = `400 14px ${FONT}`;
      g.fillStyle = st.shuffle ? '#ff2a8a' : 'rgba(255,255,255,0.7)';
      g.fillText('shuffle', 14, 460);
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillText('‹ back', W - 62, 460);
    }

    function tap(u, v) {
      const x = u * W, y = (1 - v) * H;
      if (st.view === 'menu') {
        const i = Math.round((y - 110 + st.scroll + 20) / 62);
        if (i >= 0 && i < MENU.length) {
          st.sel = i;
          if (MENU[i] === 'music') { st.view = 'playing'; st.t0 = performance.now() / 1000; }
        }
        return;
      }
      if (y > 440 && x < 90) {
        st.shuffle = !st.shuffle;
        stage.grains.shuffle(self);
        st.artist = Math.floor(Math.random() * ARTISTS.length);
      } else if (y > 440 && x > W - 90) st.view = 'menu';
      else st.artist++;
    }

    return {
      claims: (name) => name === 'screen' || name === 'glass',
      claim(name, { local }) {
        if (name !== 'screen' && name !== 'glass') return false;
        st.drag = { uv: uvAt(local), scroll: st.scrollT };
        st.moved = 0;
        return true;
      },
      drag(name, { dy }) {
        if (!st.drag) return;
        st.moved = Math.max(st.moved, Math.abs(dy));
        // a finger's drag across the panel, in panel pixels (it is about 7 cm tall on screen)
        st.scrollT = Math.max(0, Math.min(MENU.length * 62 - 300, st.drag.scroll - dy * 1.6));
      },
      drop() {
        const uv = st.drag?.uv;
        if (uv && st.moved < 6 && uv.x >= 0 && uv.x <= 1 && uv.y >= 0 && uv.y <= 1) tap(uv.x, uv.y);
        st.drag = null;
      },
      press(name) {
        if (name === 'btn_home') st.view = 'menu';
      },
      key(k) {
        if (k === 'ArrowDown') st.scrollT = Math.min(MENU.length * 62 - 300, st.scrollT + 62);
        else if (k === 'ArrowUp') st.scrollT = Math.max(0, st.scrollT - 62);
        else if (k === 'Enter') { st.view = 'playing'; st.t0 = performance.now() / 1000; }
        else if (k === 'Escape' || k === 'Backspace') st.view = 'menu';
        else if (k === 's') { stage.grains.shuffle(self); st.shuffle = true; }
        else return false;
        return true;
      },
      frame(t, dt, amount) {
        st.scroll += (st.scrollT - st.scroll) * (1 - Math.exp(-dt * 10));
        if (amount < 0.01 && st.drawn) return;
        st.drawn = true;
        if (st.view === 'menu') menu(t);
        else playing(t);
        scr.show();
      },
    };
  },
};
