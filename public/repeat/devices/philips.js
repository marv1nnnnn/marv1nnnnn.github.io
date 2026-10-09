// Philips SA28 (2008), "可爱四方小石头": a 4 cm square of mirror on a lanyard. The whole face is the
// key, pressed at an edge; its OLED shows through the mirror only where lit. ⇄ on the top steps the
// play mode: in order, repeat one (its grain lights), shuffle (the block deals itself out again).

import { screen } from '../stage.js';

const W = 128, H = 64;
const FACE_Y = 2.0; // the face's middle, up from the bottom edge (scripts/blender/repeat/philips.py)
const FONT = '"PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const MODES = ['顺序播放', '单曲循环', '随机播放'];
const FILES = ['我的音乐/01.mp3', '我的音乐/最近/新歌.mp3', '下载/未知歌曲.mp3', '新建文件夹/Track05.mp3', 'MP3/歌.wma'];
const SONGS = 512;

export default {
  id: 'philips',
  file: 'models/philips.glb',
  size: [4.0, 4.0, 1.5],
  grams: 26,
  songs: SONGS,
  capacity: '2GB',
  async setup(model, { stage, slot }) {
    const scr = screen(model.getObjectByName('screen'), W, H, { scale: 4, additive: true });
    const g = scr.ctx;
    const st = { playing: false, track: 19, el: 120, mode: 0, vol: 18, volT: 0, touched: false, hold: false };

    function mode(k) {
      st.mode = k;
      stage.grains.light(slot.index, k === 1 ? st.track : -1);
      if (k === 2) stage.grains.shuffle(slot.index);
    }

    function step(dir) {
      st.track = (st.track + dir + SONGS) % SONGS;
      st.el = 0;
      if (st.mode === 1) stage.grains.light(slot.index, st.track);
    }

    function press(name, info) {
      st.touched = true;
      if (name === 'btn_play') st.playing = !st.playing;
      else if (name === 'btn_loop') mode((st.mode + 1) % MODES.length);
      else if (name === 'btn_vol_up') { st.vol = Math.min(30, st.vol + 1); st.volT = 1.2; }
      else if (name === 'btn_vol_down') { st.vol = Math.max(0, st.vol - 1); st.volT = 1.2; }
      else if (name === 'face' && info?.local) {
        // which edge of the mirror was pressed
        const x = info.local.x, y = info.local.y - FACE_Y;
        if (Math.abs(x) > Math.abs(y)) step(x > 0 ? 1 : -1);
        else { st.vol = Math.max(0, Math.min(30, st.vol + (y > 0 ? 1 : -1))); st.volT = 1.2; }
      }
    }

    function draw(t) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#f2f6ff';
      g.textBaseline = 'top';
      g.font = `400 9px ${FONT}`;
      g.fillText(`♫ ${st.track + 1}/${SONGS}`, 2, 1);
      g.fillText(['→', '↻1', '⇄'][st.mode], 92, 1);
      // battery
      g.strokeStyle = '#f2f6ff';
      g.strokeRect(110, 2, 14, 7);
      g.fillRect(111, 3, 10, 5);
      const name = FILES[st.track % FILES.length];
      g.font = `700 12px ${FONT}`;
      const w = g.measureText(name).width;
      const x = w > W - 4 && st.playing ? 2 - ((t * 22) % (w + 24)) : 2;
      g.save();
      g.beginPath();
      g.rect(0, 14, W, 18);
      g.clip();
      g.fillText(name, x, 16);
      if (w > W - 4) g.fillText(name, x + w + 24, 16);
      g.restore();
      g.font = `400 9px ${FONT}`;
      g.fillText(MODES[st.mode], 2, 34);
      const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      g.fillText(`${st.playing ? '▶' : '‖'} ${mm(st.el)} / 4:12`, 2, 48);
      g.fillRect(70, 52, 54 * Math.min(1, st.el / 252), 3);
      g.strokeRect(70, 51.5, 54, 4);
      if (st.volT > 0) {
        g.fillStyle = '#000';
        g.fillRect(0, 32, W, 32);
        g.fillStyle = '#f2f6ff';
        g.fillText(`音量 ${st.vol}`, 2, 36);
        g.fillRect(2, 50, (W - 4) * (st.vol / 30), 6);
      }
      scr.show();
    }

    return {
      press,
      key(k) {
        const map = { ' ': 'btn_play', Enter: 'btn_play', l: 'btn_loop', s: 'btn_loop', ArrowUp: 'btn_vol_up', ArrowDown: 'btn_vol_down' };
        if (k === 'ArrowRight' || k === 'ArrowLeft') { step(k === 'ArrowRight' ? 1 : -1); stage.tap(model.getObjectByName('face')); return true; }
        if (!map[k]) return false;
        press(map[k]);
        stage.tap(model.getObjectByName(map[k]));
        return true;
      },
      frame(t, dt, amount) {
        if (!st.touched && amount > 0.9) st.playing = true;
        if (st.playing) {
          st.el += dt;
          if (st.el > 252) (st.mode === 1 ? (st.el = 0) : step(st.mode === 2 ? 1 + Math.floor(Math.random() * 40) : 1));
        }
        st.volT = Math.max(0, st.volT - dt);
        if (amount > 0.01 || !st.drawn) { st.drawn = true; draw(t); }
      },
    };
  },
};
