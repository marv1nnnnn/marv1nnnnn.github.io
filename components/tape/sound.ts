// The tape, as sound. Strudel plays the pattern; a small Web Audio deck after it adds what a
// cassette does to music: hiss, crackle with age, wow, dropouts and the spool on page changes.
// Loaded only after the visitor turns sound on, so the first page load never pays for it.

import {
  evaluate,
  getAudioContext,
  getSuperdoughAudioController,
  initAudio,
  initStrudel,
  setAudioContext,
  superdough,
} from '@strudel/web';
import type { TapeEvent } from './engine';

// What the pattern reads through `ref(() => tape.x)`. Written by the provider every frame.
export interface Ear {
  stir: number; // how much the pointer is moving, 0..1
  hold: number; // how long the pointer has been held down, 0..1
  x: number; // pan, 0..1
  register: number; // scale degrees above the root, from the pointer height
  night: number; // 1 at 3am, 0 at 3pm
  home: number; // 1 on the home page, 0 while reading
}

export interface Listening {
  speed: number;
  hold: number;
  x: number;
  y: number;
}

interface Mode {
  scale: string;
  root: number; // MIDI note of the scale root
  steps: number[];
  cps: number;
  pad: string;
  lead: string;
  burst: string;
  sparse: number; // 0 plays every stirred step, 1 almost none
  padGain: number; // levels differ a lot between waveforms; these even them out
  leadGain: number;
}

// One mode per palette: a new tape is a new key, a new tempo and a new instrument.
const MODES: Record<string, Mode> = {
  oxide: { scale: 'D3:dorian', root: 50, steps: [0, 2, 3, 5, 7, 9, 10], cps: 0.45, pad: 'sawtooth', lead: 's("triangle")', burst: 'triangle', sparse: 0.2, padGain: 0.08, leadGain: 0.28 },
  lain: { scale: 'E3:phrygian', root: 52, steps: [0, 1, 3, 5, 7, 8, 10], cps: 0.35, pad: 'sine', lead: 's("sine").hpf(300)', burst: 'sine', sparse: 0.45, padGain: 0.05, leadGain: 0.24 },
  phosphor: { scale: 'A3:minor:pentatonic', root: 57, steps: [0, 3, 5, 7, 10], cps: 0.55, pad: 'square', lead: 's("square").crush(6)', burst: 'square', sparse: 0.1, padGain: 0.045, leadGain: 0.15 },
  uv: { scale: 'F3:lydian', root: 53, steps: [0, 2, 4, 6, 7, 9, 11], cps: 0.4, pad: 'supersaw', lead: 's("triangle")', burst: 'supersaw', sparse: 0.25, padGain: 0.11, leadGain: 0.3 },
  mono: { scale: 'C3:major:pentatonic', root: 48, steps: [0, 2, 4, 7, 9], cps: 0.5, pad: 'sine', lead: 's("sine")', burst: 'sine', sparse: 0.55, padGain: 0.05, leadGain: 0.24 },
};

export function codeFor(palette: string, seed: number) {
  const m = MODES[palette] ?? MODES.oxide;
  return `// tape: ${palette}. \`tape\` is written by the canvas every frame.
setcps(${m.cps})
const mode = "${m.scale}"

stack(
  // bed: slow chords, brighter late at night
  n("<[0,2,4] [-2,0,3] [-1,1,4] [-3,0,2]>/2").scale(mode)
    .s("${m.pad}").attack(1.5).release(3)
    .lpf(ref(() => 380 + tape.night * 520)).gain(${m.padGain})
    .room(.9).roomsize(8),

  // stir: moving plays; height picks the register, speed the density
  n(irand(7).segment(16).add(ref(() => tape.register))).scale(mode)
    .${m.lead}.decay(.25).sustain(0).release(.4)
    .degradeBy(ref(() => .97 - tape.stir * ${(0.85 * (1 - m.sparse)).toFixed(2)}))
    .lpf(ref(() => 900 + tape.stir * 4200)).pan(ref(() => tape.x))
    .gain(${m.leadGain}).delay(.45).delaytime(.375).delayfeedback(.5).room(.5),

  // gather: holding pulls a chord in and it swells
  n("[0,2,4,7]*8").scale(mode).s("sawtooth").decay(.12).sustain(0)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1))
    .lpf(ref(() => 300 + tape.hold * 5200)).lpq(8)
    .gain(ref(() => tape.hold * .3)).room(.7),

  // transport: the heads ticking over, quieter while reading
  s("white(5,16)").decay(.03).sustain(0).hpf(7000)
    .gain(ref(() => (.05 + tape.stir * .12) * (.4 + tape.home * .6))),
).seed(${seed})
`;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function noiseBuffer(ctx: AudioContext, seconds: number, fill: (i: number) => number) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = fill(i);
  return buf;
}

function pinkBuffer(ctx: AudioContext) {
  let b0 = 0, b1 = 0, b2 = 0;
  return noiseBuffer(ctx, 3, () => {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    return (b0 + b1 + b2 + w * 0.1848) * 0.2;
  });
}

function loop(ctx: AudioContext, buffer: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start();
  return src;
}

// The part after Strudel: everything a tape machine adds on its way to the speakers.
class Deck {
  readonly input: GainNode;
  private wow: DelayNode;
  private warp: DelayNode;
  private dry: GainNode;
  private wet: GainNode;
  private tone: BiquadFilterNode;
  private duck: GainNode;
  private gate: GainNode;
  private master: GainNode;
  private hiss: GainNode;
  private crackle: GainNode;
  private wowDepth: GainNode;
  private white: AudioBuffer;
  private click: AudioBuffer;

  constructor(private ctx: AudioContext) {
    const g = (v: number) => new GainNode(ctx, { gain: v });
    this.input = g(1);
    this.wow = new DelayNode(ctx, { maxDelayTime: 1, delayTime: 0.02 });
    this.warp = new DelayNode(ctx, { maxDelayTime: 1, delayTime: 0 });
    this.dry = g(1);
    this.wet = g(0);
    this.tone = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 16000, Q: 0.5 });
    this.duck = g(1);
    this.gate = g(1);
    this.master = g(0);
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -10, knee: 6, ratio: 12, attack: 0.003, release: 0.25 });

    this.input.connect(this.wow).connect(this.dry).connect(this.tone);
    this.input.connect(this.warp).connect(this.wet).connect(this.tone);
    this.tone.connect(this.duck).connect(this.gate).connect(this.master).connect(limiter).connect(ctx.destination);

    // Wow (slow) and flutter (fast): the delay line drifts, so the pitch drifts with it.
    this.wowDepth = g(0.0012);
    const wow = new OscillatorNode(ctx, { frequency: 0.45 });
    const flutter = new OscillatorNode(ctx, { frequency: 6.3 });
    wow.connect(this.wowDepth).connect(this.wow.delayTime);
    flutter.connect(g(0.00008)).connect(this.wow.delayTime);
    wow.start();
    flutter.start();

    this.white = noiseBuffer(ctx, 2, () => Math.random() * 2 - 1);
    this.click = noiseBuffer(ctx, 0.004, (i) => (Math.random() * 2 - 1) * Math.exp(-i / 20));

    this.hiss = g(0);
    loop(ctx, pinkBuffer(ctx))
      .connect(new BiquadFilterNode(ctx, { type: 'highpass', frequency: 2500 }))
      .connect(this.hiss)
      .connect(this.tone);
    this.crackle = g(0);
    const pops = noiseBuffer(ctx, 5, () => (Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 0.8 : 0));
    loop(ctx, pops).connect(new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 4000 })).connect(this.crackle).connect(this.tone);
  }

  fade(to: number, seconds = 0.6) {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(to, t + seconds);
  }

  // Reading pages play the same tape, quieter and darker; older pages are more worn.
  set(home: boolean, wear: number, night: number) {
    const t = this.ctx.currentTime;
    this.duck.gain.setTargetAtTime(home ? 1 : 0.4, t, 0.4);
    this.tone.frequency.setTargetAtTime(home ? 16000 - wear * 6000 : 5200 - wear * 3000, t, 0.4);
    this.hiss.gain.setTargetAtTime(0.012 + wear * 0.02 + night * 0.006, t, 0.4);
    this.crackle.gain.setTargetAtTime(wear * 0.25, t, 0.4);
    this.wowDepth.gain.setTargetAtTime(0.0008 + wear * 0.003, t, 0.4);
  }

  // Fast-forward (deeper into the site) runs the tape fast and high; rewind runs it slow and low.
  seek(direction: -1 | 1, seconds = 0.7) {
    const { ctx } = this;
    const t = ctx.currentTime;
    const up = direction < 0;
    const span = 0.42;
    this.warp.delayTime.cancelScheduledValues(t);
    this.warp.delayTime.setValueAtTime(up ? span : 0, t);
    this.warp.delayTime.linearRampToValueAtTime(up ? 0 : span, t + seconds);
    for (const [node, a, b] of [[this.wet, 1, 0], [this.dry, 0, 1]] as const) {
      node.gain.cancelScheduledValues(t);
      node.gain.setTargetAtTime(a, t, 0.02);
      node.gain.setTargetAtTime(b, t + seconds, 0.06);
    }
    // The spool itself: filtered noise sweeping with the tape speed.
    const src = ctx.createBufferSource();
    src.buffer = this.white;
    const band = new BiquadFilterNode(ctx, { type: 'bandpass', Q: 3 });
    band.frequency.setValueAtTime(up ? 500 : 3200, t);
    band.frequency.exponentialRampToValueAtTime(up ? 4200 : 280, t + seconds);
    const env = new GainNode(ctx, { gain: 0 });
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.09, t + seconds * 0.3);
    env.gain.linearRampToValueAtTime(0, t + seconds);
    src.connect(band).connect(env).connect(this.gate);
    src.start(t);
    src.stop(t + seconds + 0.05);
  }

  // A dropout: the signal is simply gone for a moment, with a click on each edge.
  dropout(seconds = 0.14) {
    const t = this.ctx.currentTime;
    const gate = this.gate.gain;
    gate.cancelScheduledValues(t);
    gate.setValueAtTime(1, t);
    gate.linearRampToValueAtTime(0, t + 0.004);
    gate.setValueAtTime(0, t + seconds);
    gate.linearRampToValueAtTime(1, t + seconds + 0.03);
    for (const at of [t, t + seconds]) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.click;
      src.connect(new GainNode(this.ctx, { gain: 0.25 })).connect(this.master);
      src.start(at);
    }
  }
}

export class TapeSound {
  readonly ear: Ear = { stir: 0, hold: 0, x: 0.5, register: 3, night: 0.5, home: 1 };
  private deck: Deck;
  private mode: Mode = MODES.oxide;
  private palette = 'oxide';
  code = '';
  private home = true;
  private wear = 0;
  private lastSet = 0;
  private suspending = 0;

  private constructor(private ctx: AudioContext) {
    this.deck = new Deck(ctx);
    (window as unknown as { tape: Ear }).tape = this.ear;
  }

  static async create(ctx: AudioContext, palette: string) {
    setAudioContext(ctx);
    await initStrudel();
    await initAudio();
    const sound = new TapeSound(getAudioContext());
    // Superdough sends everything to the speakers; send it through the deck instead. It rebuilds
    // its output on reset, so keep the rerouting in place when that happens.
    const out = getSuperdoughAudioController().output as unknown as { destinationGain: GainNode; initializeAudio: () => void };
    const init = out.initializeAudio.bind(out);
    out.initializeAudio = () => {
      init();
      out.destinationGain.disconnect();
      out.destinationGain.connect(sound.deck.input);
    };
    out.destinationGain.disconnect();
    out.destinationGain.connect(sound.deck.input);
    await sound.load(palette);
    sound.deck.fade(0.8, 1.5);
    return sound;
  }

  async load(palette: string) {
    this.palette = MODES[palette] ? palette : 'oxide';
    this.mode = MODES[this.palette];
    this.code = codeFor(this.palette, Math.floor(Math.random() * 1000));
    await evaluate(this.code);
  }

  // A new tape: the old one cuts out, the new one goes in with a clunk and starts playing.
  async newTape(palette: string) {
    if (palette === this.palette) return;
    this.deck.dropout(0.2);
    superdough({ s: 'sbd', gain: 0.3, decay: 0.3 }, this.ctx.currentTime + 0.22, 0.3);
    await this.load(palette);
  }

  update(l: Listening, night: number) {
    const e = this.ear;
    const target = clamp(l.speed / 24) * (this.home ? 1 : 0.35);
    // Quick to wake up, slow to settle, like a meter.
    e.stir += (target - e.stir) * (target > e.stir ? 0.25 : 0.02);
    e.hold += (l.hold - e.hold) * 0.3;
    e.x = l.x;
    e.register = Math.round((1 - clamp(l.y)) * 7);
    e.night = night;
    e.home = this.home ? 1 : 0;
    const now = performance.now();
    if (now - this.lastSet > 200) {
      this.lastSet = now;
      this.deck.set(this.home, this.wear, night);
    }
  }

  scene(home: boolean, wear: number) {
    this.home = home;
    this.wear = wear;
    this.deck.set(home, wear, this.ear.night);
  }

  event(e: TapeEvent) {
    if (e.type === 'seek') this.deck.seek(e.direction);
    else if (e.type === 'erase') this.deck.dropout();
    else if (e.type === 'burst') this.burst(e.power, e.x);
  }

  // Releasing a hold scatters the gathered chord: more power, more notes, wider and longer.
  private burst(power: number, x: number) {
    const { mode } = this;
    const t = this.ctx.currentTime + 0.03;
    const count = 3 + Math.round(power * 5);
    const len = mode.steps.length;
    for (let i = 0; i < count; i++) {
      const degree = this.ear.register + i * 2;
      const note = mode.root + 12 + mode.steps[degree % len] + 12 * Math.floor(degree / len);
      superdough(
        {
          s: mode.burst,
          note,
          gain: (0.16 + power * 0.14) * (this.home ? 1 : 0.5),
          attack: 0.003,
          decay: 0.3 + power * 0.8,
          sustain: 0,
          release: 1,
          pan: clamp(x + (Math.random() - 0.5) * (0.2 + power * 0.8)),
          lpf: 1800 + power * 6000,
          room: 0.5 + power * 0.4,
          roomsize: 3 + power * 6,
          delay: 0.3,
          delaytime: 0.25,
          delayfeedback: 0.35,
        },
        t + i * (0.09 - power * 0.06),
        0.4 + power,
        mode.cps,
      );
    }
  }

  // Fade out, then suspend the context so nothing runs while it is silent.
  pause() {
    this.deck.fade(0, 0.3);
    clearTimeout(this.suspending);
    this.suspending = window.setTimeout(() => this.ctx.suspend(), 320);
  }

  async resume(palette = this.palette) {
    clearTimeout(this.suspending);
    await this.ctx.resume();
    this.deck.fade(0.8, 0.6);
    // The visitor may have changed tapes while the sound was off.
    await this.newTape(palette);
  }
}
