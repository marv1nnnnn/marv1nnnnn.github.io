// 清华紫光 MQ-908 (2008): the first MP4, nearly all screen, three touch keys under it. Its screen
// is the MP4 of the time: a carousel of glossy icons, a video squeezed down to a few pixels, an
// e-book of .txt files.

import { screen } from '../stage.js';

const W = 432, H = 240;
const FONT = '"PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const ITEMS = [
  ['音乐', '♫', '#ff7a1a', '#c2410c'],
  ['视频', '▶', '#2f8bff', '#1746b8'],
  ['图片', '▣', '#30c46a', '#167a3d'],
  ['电子书', '≡', '#f5c518', '#b8860b'],
  ['录音', '●', '#ef4444', '#991b1b'],
  ['收音机', '((·))', '#a855f7', '#6b21a8'],
  ['游戏', '✚', '#14b8a6', '#0f766e'],
  ['设置', '⚙', '#94a3b8', '#475569'],
];
const BOOKS = ['小说.txt', '英语单词.txt', '歌词大全.txt', '笑话.txt'];

export default {
  id: 'unis',
  file: 'models/unis.glb',
  size: [8.8, 5.52, 1.05],
  grams: 80, // not published: about 51 cm³ of a metal-backed 3" player of 2008
  roughly: true,
  songs: 512,
  capacity: '2GB',
  async setup(model, { stage }) {
    const scr = screen(model.getObjectByName('screen'), W, H, { scale: 2 });
    const g = scr.ctx;
    const st = { view: 'menu', sel: 1, cur: 1, t0: 0, touched: false, book: 0 };
    // the video is drawn small and blown up, as a converted AMV was
    const tiny = document.createElement('canvas');
    tiny.width = 108;
    tiny.height = 60;
    const tg = tiny.getContext('2d');

    function status() {
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(0, 0, W, 20);
      g.fillStyle = '#d6e6ff';
      g.font = `400 12px ${FONT}`;
      g.textBaseline = 'middle';
      g.fillText('清华紫光', 8, 10);
      g.fillText('14:32', W / 2 - 16, 10);
      g.strokeStyle = '#d6e6ff';
      g.strokeRect(W - 30, 5, 20, 10);
      g.fillStyle = '#7cf06a';
      g.fillRect(W - 29, 6, 14, 8);
      g.textBaseline = 'alphabetic';
    }

    function icon(x, y, s, item, on) {
      const [, glyph, c1, c2] = item;
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      g.shadowColor = on ? c1 : 'transparent';
      g.shadowBlur = on ? 18 : 0;
      const grd = g.createLinearGradient(0, -36, 0, 36);
      grd.addColorStop(0, c1);
      grd.addColorStop(1, c2);
      g.fillStyle = grd;
      g.beginPath();
      g.roundRect(-36, -36, 72, 72, 16);
      g.fill();
      g.shadowBlur = 0;
      // the gloss across the top half
      const gl = g.createLinearGradient(0, -36, 0, 0);
      gl.addColorStop(0, 'rgba(255,255,255,0.55)');
      gl.addColorStop(1, 'rgba(255,255,255,0.05)');
      g.fillStyle = gl;
      g.beginPath();
      g.roundRect(-34, -34, 68, 34, [14, 14, 4, 4]);
      g.fill();
      g.fillStyle = '#fff';
      g.font = `700 ${glyph.length > 2 ? 18 : 34}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(glyph, 0, 3);
      g.restore();
    }

    function menu() {
      const grd = g.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.4, W * 0.7);
      grd.addColorStop(0, '#1e3a8a');
      grd.addColorStop(1, '#050a1a');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      status();
      ITEMS.forEach((it, k) => {
        const d = k - st.cur;
        if (Math.abs(d) > 2.6) return;
        const s = 1.25 - Math.min(1, Math.abs(d)) * 0.45;
        icon(W / 2 + d * 118, 112 - Math.abs(d) * 6, s, it, Math.abs(d) < 0.5);
      });
      g.fillStyle = '#fff';
      g.font = `700 20px ${FONT}`;
      g.textAlign = 'center';
      g.fillText(ITEMS[st.sel][0], W / 2, 206);
      g.fillStyle = 'rgba(214,230,255,0.6)';
      g.font = `400 11px ${FONT}`;
      g.fillText('◀◀  M 进入  ▶▶', W / 2, 228);
      g.textAlign = 'left';
    }

    function video(t) {
      // a sunset sea, a boat, gulls: a few dozen pixels blown up, colours banded
      const k = t - st.t0;
      const sky = tg.createLinearGradient(0, 0, 0, 34);
      sky.addColorStop(0, '#2a1650');
      sky.addColorStop(1, '#ff8a3d');
      tg.fillStyle = sky;
      tg.fillRect(0, 0, 108, 34);
      tg.fillStyle = '#ffd36b';
      tg.beginPath();
      tg.arc(70, 30 + Math.sin(k * 0.05) * 2, 9, 0, Math.PI * 2);
      tg.fill();
      for (let y = 34; y < 60; y++) {
        tg.fillStyle = `rgb(${20 + (y - 34) * 2},${40 + (y - 34) * 3},${90 + (y - 34) * 3})`;
        tg.fillRect(0, y, 108, 1);
        if ((y + Math.floor(k * 6)) % 3 === 0) {
          tg.fillStyle = 'rgba(255,190,110,0.5)';
          tg.fillRect(60 + Math.sin(y + k * 2) * 8, y, 18 - (y - 34) * 0.4, 1);
        }
      }
      tg.fillStyle = '#120a1e';
      const bx = ((k * 6) % 140) - 20;
      tg.fillRect(bx, 37, 12, 2);
      tg.fillRect(bx + 5, 30, 1, 7);
      tg.fillRect(bx + 1, 32, 4, 4);
      for (let i = 0; i < 3; i++) {
        const gx = ((k * 9 + i * 30) % 120) - 6, gy = 10 + i * 5 + Math.sin(k * 4 + i) * 2;
        tg.fillRect(gx, gy, 2, 1);
        tg.fillRect(gx + 2, gy - 1, 2, 1);
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(tiny, 0, 0, W, H);
      g.imageSmoothingEnabled = true;
      g.fillStyle = 'rgba(0,0,0,0.55)';
      g.fillRect(0, H - 26, W, 26);
      g.fillStyle = '#fff';
      g.font = `400 12px ${FONT}`;
      g.fillText('海边.amv', 10, H - 9);
      const p = (k % 94) / 94;
      g.fillStyle = 'rgba(255,255,255,0.3)';
      g.fillRect(90, H - 14, W - 170, 3);
      g.fillStyle = '#2f8bff';
      g.fillRect(90, H - 14, (W - 170) * p, 3);
      g.fillText(`00:${String(Math.floor(k % 94)).padStart(2, '0')}`, W - 70, H - 9);
    }

    function music(t) {
      g.fillStyle = '#061226';
      g.fillRect(0, 0, W, H);
      status();
      g.fillStyle = '#fff';
      g.font = `700 18px ${FONT}`;
      g.fillText('未知艺术家 - 曲目 07', 20, 60);
      g.fillStyle = '#8fb3ff';
      g.font = `400 12px ${FONT}`;
      g.fillText('007 / 512   MP3 128kbps   EQ: 超重低音', 20, 82);
      for (let k = 0; k < 32; k++) {
        const h = (0.3 + 0.7 * Math.abs(Math.sin(t * 2.3 + k * 0.7) * Math.cos(t * 1.1 + k * 0.33))) * 90;
        const grd = g.createLinearGradient(0, 200 - h, 0, 200);
        grd.addColorStop(0, '#ff7a1a');
        grd.addColorStop(1, '#2f8bff');
        g.fillStyle = grd;
        g.fillRect(20 + k * 12.3, 200 - h, 9, h);
      }
    }

    function books() {
      g.fillStyle = '#f3ecd8';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#5b4a2a';
      g.fillRect(0, 0, W, 22);
      g.fillStyle = '#fff';
      g.font = `700 12px ${FONT}`;
      g.fillText('电子书', 10, 15);
      BOOKS.forEach((b, k) => {
        g.fillStyle = k === st.book ? '#c2410c' : '#3a2f1c';
        g.font = `${k === st.book ? 700 : 400} 16px ${FONT}`;
        g.fillText(`${k === st.book ? '▶ ' : '   '}${b}`, 20, 56 + k * 34);
      });
    }

    function other(t) {
      g.fillStyle = '#050a1a';
      g.fillRect(0, 0, W, H);
      status();
      icon(W / 2, H / 2 - 6, 1.4, ITEMS[st.sel], true);
      g.fillStyle = 'rgba(214,230,255,0.7)';
      g.font = `400 12px ${FONT}`;
      g.textAlign = 'center';
      g.fillText('M 返回', W / 2, H - 16);
      g.textAlign = 'left';
    }

    function press(name) {
      st.touched = true;
      if (name === 'btn_m') {
        if (st.view !== 'menu') { st.view = 'menu'; return; }
        st.view = ['music', 'video', 'other', 'books'][st.sel] ?? 'other';
        st.t0 = performance.now() / 1000;
        return;
      }
      const dir = name === 'btn_next' ? 1 : name === 'btn_prev' ? -1 : 0;
      if (!dir) return;
      if (st.view === 'menu') st.sel = (st.sel + dir + ITEMS.length) % ITEMS.length;
      else if (st.view === 'books') st.book = (st.book + dir + BOOKS.length) % BOOKS.length;
    }

    return {
      press,
      key(k) {
        const map = { ArrowRight: 'btn_next', ArrowLeft: 'btn_prev', Enter: 'btn_m', ' ': 'btn_m', Escape: 'btn_m', m: 'btn_m' };
        if (!map[k]) return false;
        press(map[k]);
        stage.tap(model.getObjectByName(map[k]));
        return true;
      },
      frame(t, dt, amount, sub) {
        // scrolled to and left alone, it plays the video
        if (!st.touched && amount > 0.9 && sub > 0.45 && st.view === 'menu') { st.sel = 1; st.view = 'video'; st.t0 = t; }
        let d = st.sel - st.cur;
        if (d > ITEMS.length / 2) d -= ITEMS.length;
        if (d < -ITEMS.length / 2) d += ITEMS.length;
        st.cur += d * (1 - Math.exp(-dt * 10));
        if (amount > 0.01 || !st.drawn) {
          st.drawn = true;
          if (st.view === 'menu') menu();
          else if (st.view === 'video') video(t);
          else if (st.view === 'music') music(t);
          else if (st.view === 'books') books();
          else other(t);
          scr.show();
        }
      },
    };
  },
};
