// 纽曼 M520 (2005): the first player of his own. 512 MB, a 1.5" colour screen, keys in an orange ring.
// Its screen is the MP3 of the time: a file name sliding across, an equaliser jumping, the volume,
// and an A-B key, as on the repeater before it.

import { screen } from '../stage.js';

const W = 128, H = 160;
const FONT = '"PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
// What was on it: copied from a classmate's computer, named however it came.
const FILES = ['01.mp3', '02.mp3', '未知歌曲.mp3', 'Track03.mp3', '新歌.mp3', '下载 (1).mp3', 'ÎÄ¼þ.mp3', '05.wma'];
const MENU = ['音乐', '录音', '电子书', '图片', '设置'];

export default {
  id: 'newsmy',
  file: 'models/newsmy.glb',
  size: [4.2, 6.2, 1.3],
  grams: 35,
  songs: 128,
  capacity: '512MB',
  async setup(model, { stage, slot }) {
    const scr = screen(model.getObjectByName('screen'), W, H, { scale: 3 });
    const g = scr.ctx;
    const st = { view: 'play', track: 2, playing: false, vol: 18, volT: 0, sel: 0, el: 0, a: null, b: null, touched: false, eq: new Array(10).fill(0) };

    function bar(text) {
      const grd = g.createLinearGradient(0, 0, 0, 16);
      grd.addColorStop(0, '#2c7be5');
      grd.addColorStop(1, '#0d3f94');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, 16);
      g.fillStyle = '#fff';
      g.font = `700 10px ${FONT}`;
      g.textBaseline = 'middle';
      g.fillText(text, 4, 8.5);
      // battery
      g.strokeStyle = '#fff';
      g.strokeRect(W - 20, 4, 14, 8);
      g.fillStyle = '#8ef06a';
      g.fillRect(W - 19, 5, 9, 6);
      g.textBaseline = 'alphabetic';
    }

    function play(t) {
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, '#0b1830');
      grd.addColorStop(1, '#162f5c');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      bar('音乐');
      // the file name, sliding when it is too long
      const name = FILES[st.track % FILES.length];
      g.font = `400 13px ${FONT}`;
      const w = g.measureText(name).width;
      g.fillStyle = '#ffd34d';
      g.save();
      g.beginPath();
      g.rect(4, 22, W - 8, 20);
      g.clip();
      const x = w > W - 8 && st.playing ? 4 - ((t * 24) % (w + 30)) : 4;
      g.fillText(name, x, 37);
      if (w > W - 8) g.fillText(name, x + w + 30, 37);
      g.restore();
      g.fillStyle = '#9fb7de';
      g.font = `400 10px ${FONT}`;
      g.fillText(`${String(st.track + 1).padStart(3, '0')}/128`, 4, 54);
      g.fillText('128kbps', W - 44, 54);
      // the equaliser
      for (let k = 0; k < st.eq.length; k++) {
        const h = st.eq[k];
        for (let y = 0; y < h; y++) {
          g.fillStyle = y > 8 ? '#ff5a3c' : y > 5 ? '#ffd34d' : '#4ce07a';
          g.fillRect(8 + k * 11.5, 116 - y * 5, 9, 3.5);
        }
      }
      const mm = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      g.fillStyle = '#fff';
      g.font = `700 11px ${FONT}`;
      g.fillText(`${mm(st.el)} / 03:45`, 4, 134);
      g.fillStyle = '#2b4677';
      g.fillRect(4, 140, W - 8, 4);
      g.fillStyle = '#ffd34d';
      g.fillRect(4, 140, (W - 8) * Math.min(1, st.el / 225), 4);
      g.font = `400 10px ${FONT}`;
      g.fillStyle = '#9fb7de';
      g.fillText(st.playing ? '▶ 播放' : '‖ 暂停', 4, 156);
      if (st.a !== null) {
        g.fillStyle = '#ff5a3c';
        g.fillText(st.b !== null ? 'A-B' : 'A-', 54, 156);
      }
      g.fillStyle = '#9fb7de';
      g.fillText(`音量 ${st.vol}`, W - 44, 156);
      if (st.volT > 0) {
        g.fillStyle = 'rgba(0,0,0,0.7)';
        g.fillRect(14, 64, W - 28, 30);
        g.fillStyle = '#fff';
        g.fillText('音量', 20, 78);
        g.fillStyle = '#ffd34d';
        g.fillRect(20, 84, ((W - 40) * st.vol) / 31, 5);
      }
    }

    function menu() {
      g.fillStyle = '#0b1830';
      g.fillRect(0, 0, W, H);
      bar('主菜单');
      MENU.forEach((m, k) => {
        const y = 22 + k * 26;
        if (k === st.sel) {
          g.fillStyle = '#f08a2c';
          g.fillRect(2, y, W - 4, 24);
        }
        g.fillStyle = k === st.sel ? '#fff' : '#9fb7de';
        g.font = `700 13px ${FONT}`;
        g.fillText(m, 30, y + 17);
        g.fillStyle = ['#4ce07a', '#ff5a3c', '#ffd34d', '#6fb0f7', '#c0c0c0'][k];
        g.fillRect(10, y + 6, 12, 12);
      });
    }

    function press(name) {
      st.touched = true;
      if (name === 'btn_menu') { st.view = st.view === 'menu' ? 'play' : 'menu'; return; }
      if (st.view === 'menu') {
        if (name === 'btn_prev' || name === 'btn_vol_down') st.sel = (st.sel + MENU.length - 1) % MENU.length;
        else if (name === 'btn_next' || name === 'btn_vol_up') st.sel = (st.sel + 1) % MENU.length;
        else if (name === 'btn_play') st.view = 'play';
        return;
      }
      if (name === 'btn_play') st.playing = !st.playing;
      else if (name === 'btn_next') { st.track = (st.track + 1) % 128; st.el = 0; }
      else if (name === 'btn_prev') { st.track = (st.track + 127) % 128; st.el = 0; }
      else if (name === 'btn_vol_up') { st.vol = Math.min(31, st.vol + 1); st.volT = 1.2; }
      else if (name === 'btn_vol_down') { st.vol = Math.max(0, st.vol - 1); st.volT = 1.2; }
      else if (name === 'btn_ab') {
        if (st.a === null) st.a = st.el;
        else if (st.b === null) st.b = Math.max(st.el, st.a + 2);
        else { st.a = st.b = null; stage.grains.light(slot.index, -1); }
      }
    }

    return {
      press,
      key(k) {
        const map = { ' ': 'btn_play', Enter: 'btn_play', ArrowRight: 'btn_next', ArrowLeft: 'btn_prev', ArrowUp: 'btn_vol_up', ArrowDown: 'btn_vol_down', m: 'btn_menu', a: 'btn_ab' };
        if (!map[k]) return false;
        press(map[k]);
        stage.tap(model.getObjectByName(map[k]));
        return true;
      },
      frame(t, dt, amount) {
        if (!st.touched && amount > 0.9) st.playing = true;
        if (st.playing) {
          st.el += dt;
          if (st.b !== null && st.el >= st.b) st.el = st.a;
          if (st.el > 225) { st.el = 0; st.track = (st.track + 1) % 128; }
          for (let k = 0; k < st.eq.length; k++) st.eq[k] += ((Math.random() * 11 * (0.5 + 0.5 * Math.sin(t * 3 + k))) - st.eq[k]) * 0.3;
        } else st.eq = st.eq.map((v) => v * 0.9);
        if (st.b !== null) stage.grains.light(slot.index, st.track);
        st.volT = Math.max(0, st.volT - dt);
        if (amount > 0.01 || !st.drawn) {
          st.drawn = true;
          if (st.view === 'menu') menu();
          else play(t);
          scr.show();
        }
      },
    };
  },
};
