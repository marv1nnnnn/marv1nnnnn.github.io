// 酷比魔方 C30 (2010), metal grey, bought for its TF slot. Its three-line OLED shows through the
// mirror only where it is lit. Before the card it holds 4 GB; put the card in (it lies beside the
// player) and the block of songs behind it fills to 12 GB. M switches to shuffle, and the block
// deals itself out again.

import * as THREE from 'three';
import { screen } from '../stage.js';

const W = 128, H = 48;
const FONT = '"PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const INSIDE = 1024; // 4 GB of songs
const ALL = 3072; // with the 8 GB card
const NAMES = ['新建文件夹/01.mp3', '我的音乐/未知歌曲.mp3', 'TF/下载 (3).mp3', 'TF/Track12.mp3', '新建文件夹 (2)/最爱.mp3'];

export default {
  id: 'cube',
  file: 'models/cube.glb',
  size: [2.7, 7.5, 1.5],
  grams: 37,
  songs: ALL,
  capacity: '4GB + 8GB TF',
  async setup(model, { stage, slot }) {
    const scr = screen(model.getObjectByName('screen'), W, H, { scale: 4, additive: true });
    const g = scr.ctx;
    const tf = model.getObjectByName('tf');
    const mouth = model.getObjectByName('tf_slot');
    const dial = model.getObjectByName('dial');
    stage.grains.hold(slot.index, INSIDE);
    const st = { card: 'out', t: 0, playing: false, shuffle: false, track: 3, vol: 16, volT: 0, touched: false };
    // the card's way in: from where it lies, round to the mouth of the slot, then home
    const rest = { p: tf?.position.clone(), q: tf?.quaternion.clone() };
    const home = { p: mouth?.position.clone(), q: mouth?.quaternion.clone() };
    const outside = home.p ? home.p.clone().add(new THREE.Vector3(0, 0, -1.6).applyQuaternion(home.q)) : null;

    function insert() {
      if (st.card !== 'out' || !tf || !mouth) return;
      st.card = 'going';
      st.t = 0;
    }

    function draw(time) {
      g.fillStyle = '#000';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#cfe8ff';
      g.textBaseline = 'top';
      g.font = `400 10px ${FONT}`;
      if (st.card === 'reading') {
        g.fillText('读卡中...', 4, 4);
        g.strokeStyle = '#cfe8ff';
        g.strokeRect(4, 22, W - 8, 8);
        g.fillRect(6, 24, (W - 12) * Math.min(1, st.t / 1.4), 4);
        g.fillText('TF 8GB', 4, 34);
      } else {
        const n = st.card === 'in' ? ALL : INSIDE;
        g.fillText(st.card === 'in' ? `共 ${n} 首 · TF 8GB` : `共 ${n} 首 · TF 未插入`, 4, 2);
        const name = NAMES[st.track % NAMES.length];
        const w = g.measureText(name).width;
        const x = w > W - 8 && st.playing ? 4 - ((time * 20) % (w + 24)) : 4;
        g.save();
        g.beginPath();
        g.rect(0, 16, W, 16);
        g.clip();
        g.fillText(name, x, 18);
        if (w > W - 8) g.fillText(name, x + w + 24, 18);
        g.restore();
        g.fillText(`${st.playing ? '▶' : '‖'} ${String(st.track + 1).padStart(4, '0')}/${n}  ${st.shuffle ? '随机' : '顺序'}`, 4, 34);
        if (st.volT > 0) {
          g.fillStyle = '#000';
          g.fillRect(70, 32, 58, 16);
          g.fillStyle = '#cfe8ff';
          g.fillText(`音量 ${st.vol}`, 74, 34);
        }
      }
      scr.show();
    }

    function press(name, info) {
      st.touched = true;
      if (name === 'btn_play' || name === 'btn_center') st.playing = !st.playing;
      else if (name === 'btn_m') {
        st.shuffle = !st.shuffle;
        if (st.shuffle) stage.grains.shuffle(slot.index);
      } else if (name === 'dial' && info?.local && dial) {
        const a = Math.atan2(info.local.y - dial.position.y, info.local.x - dial.position.x);
        const n = st.card === 'in' ? ALL : INSIDE;
        if (a > Math.PI / 4 && a < (3 * Math.PI) / 4) { st.vol = Math.min(31, st.vol + 1); st.volT = 1.2; }
        else if (a < -Math.PI / 4 && a > (-3 * Math.PI) / 4) { st.vol = Math.max(0, st.vol - 1); st.volT = 1.2; }
        else st.track = (st.track + (info.local.x > dial.position.x ? 1 : -1) + n) % n;
      }
    }

    return {
      claims: (name) => name === 'tf' && st.card === 'out',
      claim(name) {
        if (name !== 'tf') return false;
        insert();
        return true;
      },
      press,
      key(k) {
        if (k === 't') { insert(); return true; }
        const map = { ' ': 'btn_play', Enter: 'btn_play', m: 'btn_m', s: 'btn_m' };
        if (!map[k]) return false;
        press(map[k]);
        stage.tap(model.getObjectByName(map[k]));
        return true;
      },
      frame(t, dt, amount, sub) {
        if (!st.touched && amount > 0.9) st.playing = true;
        if (!st.touched && sub > 0.55 && amount > 0.9) insert();
        st.volT = Math.max(0, st.volT - dt);
        if (st.card === 'going') {
          st.t += dt;
          const k1 = Math.min(1, st.t / 0.9), e1 = k1 * k1 * (3 - 2 * k1);
          const k2 = Math.min(1, Math.max(0, (st.t - 0.9) / 0.5));
          if (k2 <= 0) {
            tf.position.lerpVectors(rest.p, outside, e1);
            tf.position.y += Math.sin(Math.PI * e1) * 1.5;
            tf.quaternion.slerpQuaternions(rest.q, home.q, e1);
          } else tf.position.lerpVectors(outside, home.p, k2 * k2);
          if (st.t > 1.4) { st.card = 'reading'; st.t = 0; }
        } else if (st.card === 'reading') {
          st.t += dt;
          if (st.t > 1.4) {
            st.card = 'in';
            stage.grains.hold(slot.index, ALL);
          }
        }
        if (st.playing && Math.random() < dt * 0.02) st.track++;
        if (amount > 0.01 || !st.drawn) { st.drawn = true; draw(t); }
      },
    };
  },
};
