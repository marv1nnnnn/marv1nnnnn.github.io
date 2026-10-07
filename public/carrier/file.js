// The file: a player the size of a lighter, with a few hundred files copied off someone else's
// computer at whatever bitrate they came in. The first file is the first song on the tape, ripped.
// Most of the names are Chinese written in GBK and read as if they were Latin-1, which is how a
// player of the time showed them.

import { Transport } from './audio.js';
import { compose, makeParams, rng } from './songs.js';

// What the files were called, and what the player made of it.
const NAMES = [
  'Track01.mp3',
  'Î´ÖªÒÕÊõ¼Ò - Î´ÖªÇúÄ¿.mp3', // 未知艺术家 - 未知曲目 (unknown artist - unknown title)
  'ÐÂ½¨ÎÄ¼þ¼Ð/01.mp3', // 新建文件夹 (new folder)
  'ÏÂÔØ (2).mp3', // 下载 (download)
  'Ó¢ÓïÌýÁ¦ Unit 7.mp3', // 英语听力 (English listening)
  '°é×à ÎÞÈËÉù°æ.mp3', // 伴奏 无人声版 (backing track, no vocals)
  'ÎÒµÄ×î°®.mp3', // 我的最爱 (my favourite)
  'ºÃÌý.mp3', // 好听 (sounds good)
  '¸èÇú 23.mp3', // 歌曲 23 (song 23)
  'ÁåÉù.mp3', // 铃声 (ringtone)
  'ÐÂ¸è.mp3', // 新歌 (new song)
  'ÒÑÏÂÔØ.mp3', // 已下载 (downloaded)
  'ÎÒµÄÒôÀÖ/ÐÂ¸è (1).mp3', // 我的音乐/新歌 (my music/new song)
  'ÎçÒ¹µçÌ¨Â¼Òô.mp3', // 午夜电台录音 (recorded off the midnight radio)
  'Audio Track.mp3',
  'Track 05.mp3',
  '01 - Track 1.mp3',
  'untitled.mp3',
  'New Recording 3.mp3',
];
const STYLES = ['ballad', 'pop', 'pop', 'rnb', 'city', 'ringtone', 'lonely', 'ballad'];
const RATES = [64, 96, 128, 128, 128, 128, 160, 192, 64, 32, 112];
const COUNT = 412;

export function createFile(root, engine, ui) {
  const lcd = root.querySelector('.lcd');
  const state = lcd.querySelector('.lcd-state');
  const index = lcd.querySelector('.lcd-index');
  const marquee = lcd.querySelector('.marquee');
  const kbpsEl = lcd.querySelector('.lcd-kbps');
  const time = lcd.querySelector('.lcd-time');
  const tr = new Transport(engine);

  const file = (i) => {
    if (i === 0) return { name: NAMES[0], kbps: 128, params: makeParams(1996, 'ballad', { root: 51, bpm: 76, prog: [3, 4, 2, 5], bars: 38, density: 0.62, bright: 0.5 }) };
    const r = rng(i * 977 + 2006);
    const name = r() < 0.75 ? NAMES[1 + Math.floor(r() * (NAMES.length - 1))].replace(/\d+(?=\D*\.mp3$)/, () => String(1 + Math.floor(r() * 40))) : NAMES[1 + (i % (NAMES.length - 1))];
    const style = STYLES[Math.floor(r() * STYLES.length)];
    return { name, kbps: RATES[Math.floor(r() * RATES.length)], params: makeParams(i * 31 + 7, style, { bars: 20 + Math.floor(r() * 3) * 4 }) };
  };

  let i = 0;
  let cur = null;
  let song = null;
  let mode = 'pause';
  let pausedByHand = false;
  let pos = 0;
  let active = false;
  let vol = 12;
  let shownVol = 0;
  let last = performance.now();

  function load(n) {
    i = (n + COUNT) % COUNT;
    cur = file(i);
    song = compose(cur.params);
    pos = 0;
    tr.load(song, 0);
    engine.setBitrate(cur.kbps);
    index.textContent = `${String(i + 1).padStart(3, '0')}/${COUNT}`;
    kbpsEl.textContent = `${cur.kbps}kbps`;
    marquee.textContent = cur.name;
    marquee.style.setProperty('--marquee', `${Math.max(5, cur.name.length * 0.32)}s`);
    if (mode === 'play' && active) tr.play();
  }

  function setMode(next) {
    mode = next;
    state.textContent = mode === 'play' ? '▶' : '❚❚';
    if (mode === 'play' && active) {
      tr.seek(pos);
      tr.play();
    } else tr.stop();
  }

  load(0);
  const keys = Object.fromEntries([...root.querySelectorAll('.pad button')].map((b) => [b.dataset.key, b]));
  keys.next.addEventListener('click', () => ui.withSound(() => {
    engine.beep();
    load(i + 1);
    pausedByHand = false;
    if (mode !== 'play') setMode('play');
  }));
  keys.prev.addEventListener('click', () => ui.withSound(() => {
    engine.beep(1800);
    // like the players of the time: back to the start, or to the file before if near it
    if (pos > 3) {
      pos = 0;
      tr.seek(0);
    } else load(i - 1);
  }));
  keys.play.addEventListener('click', () => ui.withSound(() => {
    engine.beep(2400);
    pausedByHand = mode === 'play';
    setMode(mode === 'play' ? 'pause' : 'play');
  }));
  const volume = (d) => ui.withSound(() => {
    vol = Math.max(0, Math.min(20, vol + d));
    engine.level('file', (vol / 12) ** 1.6);
    engine.beep(1500 + vol * 40);
    shownVol = 1.6;
  });
  keys['vol+'].addEventListener('click', () => volume(1));
  keys['vol-'].addEventListener('click', () => volume(-1));

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (mode === 'play' && active) {
      pos = tr.playing && engine.ctx?.state === 'running' ? tr.position() : pos + dt;
      if (pos >= song.length) load(i + 1);
    }
    shownVol -= dt;
    const m = Math.floor(pos / 60);
    const s = Math.floor(pos % 60).toString().padStart(2, '0');
    const t = shownVol > 0 ? `VOL ${String(vol).padStart(2, '0')}` : `${m}:${s}`;
    if (time.textContent !== t) time.textContent = t;
  }

  return {
    frame,
    enter() {
      active = true;
      engine.setBitrate(cur.kbps);
      if (mode !== 'play' && !pausedByHand) setMode('play');
      else if (mode === 'play') {
        tr.seek(pos);
        tr.play();
      }
    },
    leave() {
      active = false;
      tr.stop();
    },
  };
}
