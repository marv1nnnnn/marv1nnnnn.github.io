// The sound: one small synth, and the four carriers it passes through on the way to the ear.
//
//   music ─┬─ tape: wow and flutter, the head's saturation and its dull top, hiss, dropouts
//          ├─ file: the codec in mp3-worklet.js, at the file's bitrate
//          └─ app: clean, loud, compressed, nothing in the way
//   air: the stations' live streams and the static between them
//
// Only the carrier in view is open; the others are at nothing.

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

export class Engine {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.carrier = null;
    this.transports = new Set();
    this.levels = { tape: 1, file: 1, app: 1, air: 1 };
    this.listeners = new Set();
  }

  async start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
    this.ctx = ctx;
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -8;
    limit.knee.value = 6;
    limit.ratio.value = 12;
    limit.attack.value = 0.003;
    limit.release.value = 0.2;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.6;
    this.master.connect(limit).connect(this.analyser).connect(ctx.destination);

    this.music = ctx.createGain();
    this.music.gain.value = 0.55;
    this.out = {};
    for (const name of ['tape', 'file', 'app', 'air']) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.master);
      this.out[name] = g;
    }
    this.buildTape();
    await this.buildFile();
    this.buildApp();
    this.buildAir();
    this.timer = window.setInterval(() => this.tick(), 25);
    this.started = true;
    if (this.carrier) this.open(this.carrier, true);
  }

  // Which carrier the music goes through.
  open(name, force = false) {
    if (!force && name === this.carrier) return;
    this.carrier = name;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [k, g] of Object.entries(this.out)) {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(k === name ? this.levels[k] : 0, t, k === name ? 0.25 : 0.08);
    }
  }

  // The volume of one carrier (the player's own volume keys).
  level(name, v) {
    this.levels[name] = v;
    if (this.ctx && this.carrier === name) this.out[name].gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setVolume(v) {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tick() {
    for (const t of this.transports) t.tick();
    this.tickTape();
  }

  // ---- the tape --------------------------------------------------------------------------------

  buildTape() {
    const ctx = this.ctx;
    const input = ctx.createGain();
    // wow and flutter: the capstan and the reels, never quite steady
    const delay = ctx.createDelay(0.1);
    delay.delayTime.value = 0.012;
    const wow = ctx.createOscillator();
    wow.frequency.value = 0.55;
    const wowDepth = ctx.createGain();
    wowDepth.gain.value = 0.0011;
    wow.connect(wowDepth).connect(delay.delayTime);
    const flutter = ctx.createOscillator();
    flutter.frequency.value = 7.3;
    const flutterDepth = ctx.createGain();
    flutterDepth.gain.value = 0.00007;
    flutter.connect(flutterDepth).connect(delay.delayTime);
    wow.start();
    flutter.start();
    // the head: a bump at the bottom, saturation, a dull top
    const bump = ctx.createBiquadFilter();
    bump.type = 'peaking';
    bump.frequency.value = 95;
    bump.gain.value = 3;
    const drive = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(x * 1.8) / Math.tanh(1.8);
    }
    drive.curve = curve;
    drive.oversample = '2x';
    const top = ctx.createBiquadFilter();
    top.type = 'lowpass';
    top.frequency.value = 7800;
    top.Q.value = 0.4;
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 4000;
    shelf.gain.value = -4;
    // dropouts: where the oxide is worn the level dips for a moment
    const drop = ctx.createGain();
    input.connect(delay).connect(bump).connect(drive).connect(top).connect(shelf).connect(drop).connect(this.out.tape);
    // hiss, louder where the tape is worn
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noise;
    hiss.loop = true;
    const hissBand = ctx.createBiquadFilter();
    hissBand.type = 'highpass';
    hissBand.frequency.value = 2500;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0;
    hiss.connect(hissBand).connect(hissGain).connect(this.out.tape);
    hiss.start();
    // the motor, heard while it winds
    const motor = ctx.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.value = 70;
    const motorBand = ctx.createBiquadFilter();
    motorBand.type = 'bandpass';
    motorBand.frequency.value = 900;
    motorBand.Q.value = 1.2;
    const whir = ctx.createBufferSource();
    whir.buffer = this.noise;
    whir.loop = true;
    const motorGain = ctx.createGain();
    motorGain.gain.value = 0;
    motor.connect(motorBand);
    whir.connect(motorBand);
    motorBand.connect(motorGain).connect(this.out.tape);
    motor.start();
    whir.start();
    this.tape = { input, delay, wowDepth, top, drop, hissGain, motor, motorGain, wear: 0, playing: false, winding: 0 };
    this.music.connect(input);
  }

  // Called by the tape deck: how worn the tape is under the head, whether it plays, how fast it winds.
  tapeState({ wear = 0, playing = false, winding = 0 }) {
    if (!this.tape) return;
    Object.assign(this.tape, { wear, playing, winding });
  }

  tickTape() {
    const tp = this.tape;
    if (!tp) return;
    const t = this.ctx.currentTime;
    const w = Math.min(1, tp.wear);
    tp.hissGain.gain.setTargetAtTime(tp.playing ? 0.006 + 0.02 * w : tp.winding ? 0.002 : 0, t, 0.05);
    tp.top.frequency.setTargetAtTime(7800 - 4200 * w, t, 0.2);
    tp.wowDepth.gain.setTargetAtTime(0.0011 + 0.0022 * w, t, 0.3);
    const speed = Math.abs(tp.winding);
    tp.motorGain.gain.setTargetAtTime(speed ? 0.012 + 0.02 * Math.min(1, speed) : 0, t, 0.04);
    tp.motor.frequency.setTargetAtTime(55 + 60 * Math.min(1.5, speed), t, 0.1);
    if (tp.playing && w > 0.15 && Math.random() < 0.012 * w) {
      const g = tp.drop.gain;
      const len = 0.05 + Math.random() * 0.12;
      g.cancelScheduledValues(t);
      g.setValueAtTime(1, t);
      g.linearRampToValueAtTime(0.25, t + 0.015);
      g.linearRampToValueAtTime(1, t + len);
    }
  }

  // A button going down on a tape deck: a clunk.
  clunk(heavy = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18 * heavy, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random(), 0.08);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.08);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.25 * heavy, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.12);
  }

  // A tooth of the reel going past the pencil.
  tick1() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200 + Math.random() * 800;
    f.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random(), 0.03);
  }

  // The little beep a player of the time made under the thumb.
  beep(freq = 2100) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.025, t);
    g.gain.setValueAtTime(0, t + 0.035);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.05);
  }

  // ---- the file --------------------------------------------------------------------------------

  async buildFile() {
    const ctx = this.ctx;
    try {
      await ctx.audioWorklet.addModule(new URL('./mp3-worklet.js', import.meta.url));
      this.codec = new AudioWorkletNode(ctx, 'mp3ish', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
    } catch {
      // No worklets: a plain low-pass is the least a file did to the sound.
      this.codec = ctx.createBiquadFilter();
      this.codec.type = 'lowpass';
      this.codec.frequency.value = 15000;
    }
    const level = ctx.createGain();
    level.gain.value = 1.05;
    this.music.connect(this.codec).connect(level).connect(this.out.file);
  }

  setBitrate(kbps) {
    const p = this.codec?.parameters?.get?.('kbps');
    if (p) p.setValueAtTime(kbps, this.ctx.currentTime);
  }

  // ---- the app ---------------------------------------------------------------------------------

  buildApp() {
    const ctx = this.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.15;
    const air = ctx.createBiquadFilter();
    air.type = 'highshelf';
    air.frequency.value = 6000;
    air.gain.value = 3;
    const make = ctx.createGain();
    make.gain.value = 1.1;
    this.music.connect(comp).connect(air).connect(make).connect(this.out.app);
  }

  // ---- the air ---------------------------------------------------------------------------------

  buildAir() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 9000;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(hp).connect(lp).connect(g).connect(this.out.air);
    src.start();
    // The stations come in through this: the FM band stops at 15 kHz, and every station is
    // pressed a little louder by its own processor.
    this.band = ctx.createBiquadFilter();
    this.band.type = 'lowpass';
    this.band.frequency.value = 15000;
    const press = ctx.createDynamicsCompressor();
    press.threshold.value = -20;
    press.ratio.value = 3;
    this.band.connect(press).connect(this.out.air);
    this.static = { gain: g, lp };
  }

  // How much static, and how muffled (a station half tuned in).
  setStatic(level, muffle = 0) {
    if (!this.static) return;
    const t = this.ctx.currentTime;
    this.static.gain.gain.setTargetAtTime(0.11 * level, t, 0.03);
    this.static.lp.frequency.setTargetAtTime(9000 - 6000 * muffle, t, 0.05);
    if (level > 0.2 && Math.random() < 0.06 * level) this.crackle(level);
  }

  crackle(level) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12 * level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    src.connect(g).connect(this.out.air);
    src.start(t, Math.random(), 0.02);
  }

  // A station's stream through the band: the element goes to the air chain when the stream allows
  // it (CORS), and straight to the speakers when it does not, with its volume set on the element.
  attach(el) {
    try {
      const node = this.ctx.createMediaElementSource(el);
      const g = this.ctx.createGain();
      g.gain.value = 0;
      node.connect(g).connect(this.band);
      return g;
    } catch {
      return null;
    }
  }

  // ---- levels for the line ---------------------------------------------------------------------

  wave(buf) {
    if (!this.analyser) return false;
    this.analyser.getFloatTimeDomainData(buf);
    return true;
  }
}

// ---- the band ----------------------------------------------------------------------------------

// Plays a timeline of notes ({events, length}) through the music bus from any point in it.
export class Transport {
  constructor(engine) {
    this.engine = engine;
    this.timeline = { events: [], length: 0 };
    this.playing = false;
    this.pos0 = 0;
    this.t0 = 0;
    this.idx = 0;
    this.rate = 1;
    this.bus = null;
    this.onEnd = null;
    engine.transports.add(this);
  }

  load(timeline, pos = 0) {
    const was = this.playing;
    this.stop();
    this.timeline = timeline;
    this.pos0 = pos;
    if (was) this.play();
  }

  position() {
    if (!this.playing || !this.engine.ctx) return this.pos0;
    return this.pos0 + Math.max(0, this.engine.ctx.currentTime - this.t0) * this.rate;
  }

  seek(pos) {
    const was = this.playing;
    if (was) this.stop();
    this.pos0 = Math.max(0, Math.min(this.timeline.length, pos));
    if (was) this.play();
  }

  play() {
    const e = this.engine;
    if (this.playing || !e.ctx) return;
    this.playing = true;
    this.t0 = e.ctx.currentTime + 0.06;
    const ev = this.timeline.events;
    let lo = 0;
    let hi = ev.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ev[mid].t < this.pos0) lo = mid + 1;
      else hi = mid;
    }
    this.idx = lo;
    this.bus = e.ctx.createGain();
    this.bus.connect(e.music);
  }

  stop() {
    if (!this.playing) return;
    this.pos0 = this.position();
    this.playing = false;
    const bus = this.bus;
    this.bus = null;
    if (bus && this.engine.ctx) {
      const t = this.engine.ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.02);
      window.setTimeout(() => bus.disconnect(), 400);
    }
  }

  tick() {
    if (!this.playing) return;
    const e = this.engine;
    const ctx = e.ctx;
    const ahead = this.position() + 0.15;
    const ev = this.timeline.events;
    while (this.idx < ev.length && ev[this.idx].t < ahead) {
      const n = ev[this.idx++];
      const when = this.t0 + (n.t - this.pos0) / this.rate;
      if (when >= ctx.currentTime - 0.01) play(e, this.bus, n, Math.max(when, ctx.currentTime));
    }
    if (this.position() >= this.timeline.length) {
      this.stop();
      this.pos0 = this.timeline.length;
      this.onEnd?.();
    }
  }
}

// ---- the instruments ---------------------------------------------------------------------------

function env(g, t, a, peak, d, sus, end, r) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setTargetAtTime(peak * sus, t + a, d);
  g.gain.setTargetAtTime(0, end, r);
}

function play(e, bus, n, t) {
  const ctx = e.ctx;
  const out = bus;
  const v = n.v ?? 0.5;
  switch (n.i) {
    case 'K': {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.9 * v, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.4);
      break;
    }
    case 'S': {
      const src = ctx.createBufferSource();
      src.buffer = e.noise;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1900;
      f.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.42 * v, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      src.connect(f).connect(g).connect(out);
      src.start(t, Math.random(), 0.22);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.3 * v, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(og).connect(out);
      o.start(t);
      o.stop(t + 0.12);
      break;
    }
    case 'H':
    case 'O':
    case 'P': {
      const src = ctx.createBufferSource();
      src.buffer = e.noise;
      const f = ctx.createBiquadFilter();
      f.type = n.i === 'P' ? 'bandpass' : 'highpass';
      f.frequency.value = n.i === 'P' ? 6000 : 7500;
      const g = ctx.createGain();
      const len = n.i === 'O' ? 0.22 : n.i === 'P' ? 0.06 : 0.035;
      g.gain.setValueAtTime(0.16 * v, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + len);
      src.connect(f).connect(g).connect(out);
      src.start(t, Math.random(), len + 0.02);
      break;
    }
    case 'bass': {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = mtof(n.m);
      const s = ctx.createOscillator();
      s.frequency.value = mtof(n.m);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(900, t);
      f.frequency.setTargetAtTime(300, t, 0.08);
      const g = ctx.createGain();
      env(g, t, 0.006, 0.42 * v, 0.25, 0.6, t + n.d, 0.04);
      o.connect(f);
      s.connect(f);
      f.connect(g).connect(out);
      o.start(t);
      s.start(t);
      o.stop(t + n.d + 0.3);
      s.stop(t + n.d + 0.3);
      break;
    }
    case 'keys':
    case 'lead':
    case 'chip':
    case 'pad': {
      const ms = Array.isArray(n.m) ? n.m : [n.m];
      const kind = n.k ?? (n.i === 'lead' ? 'flute' : n.i === 'pad' ? 'pad' : n.i === 'chip' ? 'chip' : 'ep');
      for (const m of ms) tone(e, out, kind, mtof(m), t, n.d, v / Math.sqrt(ms.length));
      break;
    }
  }
}

function tone(e, out, kind, f, t, d, v) {
  const ctx = e.ctx;
  const end = t + d;
  const g = ctx.createGain();
  g.connect(out);
  const stopAt = (o, extra) => {
    o.start(t);
    o.stop(end + extra);
  };
  if (kind === 'ep' || kind === 'bell') {
    // two-operator FM: the electric piano of every ballad of the time, or a bell
    const ratio = kind === 'bell' ? 3.5 : 1;
    const c = ctx.createOscillator();
    c.frequency.value = f;
    const m = ctx.createOscillator();
    m.frequency.value = f * ratio;
    const idx = ctx.createGain();
    idx.gain.setValueAtTime(f * (kind === 'bell' ? 2.2 : 1.6), t);
    idx.gain.setTargetAtTime(f * 0.25, t, kind === 'bell' ? 0.3 : 0.15);
    m.connect(idx).connect(c.frequency);
    const tine = ctx.createOscillator();
    tine.frequency.value = f * 14;
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(f * 0.9, t);
    tg.gain.setTargetAtTime(0, t, 0.02);
    tine.connect(tg).connect(c.frequency);
    c.connect(g);
    env(g, t, 0.004, 0.32 * v, kind === 'bell' ? 0.8 : 0.5, 0.35, end, 0.25);
    stopAt(c, 1.2);
    stopAt(m, 1.2);
    stopAt(tine, 1.2);
  } else if (kind === 'flute') {
    // the lead line on a karaoke tape: a sine with a breath of triangle and a late vibrato
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vd = ctx.createGain();
    vd.gain.setValueAtTime(0, t);
    vd.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.5, d));
    vib.connect(vd);
    vd.connect(o.frequency);
    vd.connect(o2.frequency);
    o.connect(g);
    o2.connect(g2).connect(g);
    env(g, t, 0.04, 0.3 * v, 0.3, 0.8, end, 0.08);
    stopAt(o, 0.5);
    stopAt(o2, 0.5);
    stopAt(vib, 0.5);
  } else if (kind === 'square' || kind === 'chip') {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = kind === 'chip' ? 5000 : 2600;
    o.connect(lp).connect(g);
    env(g, t, 0.005, (kind === 'chip' ? 0.16 : 0.13) * v, 0.15, kind === 'chip' ? 0.2 : 0.7, end, 0.03);
    stopAt(o, 0.3);
  } else if (kind === 'saw') {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200, t);
    lp.frequency.setTargetAtTime(1400, t, 0.2);
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      stopAt(o, 0.3);
    }
    lp.connect(g);
    env(g, t, 0.01, 0.12 * v, 0.2, 0.7, end, 0.06);
  } else if (kind === 'pad') {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1300;
    for (const det of [-9, 8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      stopAt(o, 1.2);
    }
    lp.connect(g);
    env(g, t, 0.45, 0.13 * v, 0.6, 0.85, end, 0.4);
  }
}
