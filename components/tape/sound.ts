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
  decay: number; // how long this tape has been playing: 0 when it goes in, 1 after six minutes
  // The arrangement for the track under the head (orbit 1 pads and holds, 2 melody, 3 drums and bass).
  mix1: number;
  mix2: number;
  mix3: number;
}

// Each track is a section of the same piece: the intro sparse, make the full band, input the
// melody, log the rhythm, about only the air. Kept at or under 1 (velocity scales gain).
const ARRANGEMENT: [number, number, number][] = [
  [1, 0.8, 0.4],
  [1, 1, 1],
  [0.85, 1, 0.45],
  [0.5, 0.55, 1],
  [1, 0.35, 0.12],
];

export interface Listening {
  speed: number;
  hold: number;
  x: number;
  y: number;
}

interface Tape {
  root: number; // MIDI note of the scale root, for the notes a release scatters
  steps: number[];
  cps: number;
  voice: Record<string, number | string>; // the instrument a released hold scatters
  crackle: number; // surface noise this tape carries even when new
  code: string; // the Strudel pattern; every tape answers the pointer the same way
}

// One tape per palette, each after music from the canon and the log. Every tape follows the same
// rules so the site feels the same whichever is playing: still is quiet, moving fills the rhythm
// and the melody in, holding swells, releasing scatters. Orbits keep reverb and echo settings
// apart: Strudel rebuilds an orbit's reverb whenever its size changes.
const TAPES: Record<string, Tape> = {
  oxide: {
    root: 50,
    steps: [0, 2, 4, 5, 7, 9, 10],
    cps: 0.2,
    voice: { s: 'sine', fmi: 2, fmh: 3.01 },
    crackle: 0.02,
    code: `// tape: oxide. a loop that wears away the longer it plays.
// after William Basinski, Boards of Canada, Oneohtrix Point Never
setcps(.2)
const mode = "D3:mixolydian"

stack(
  // the loop: the same two bars, losing a little more on every pass
  n("<[0,4,7] [-1,3,5]>").scale(mode)
    .s("supersaw").detune(.1).unison(3).attack(1.2).release(4)
    .lpf(ref(() => 1500 - tape.decay * 1000)).gain(.08)
    .degradeBy(ref(() => tape.decay * .5))
    .orbit(1).room(.8).roomsize(9),
  n("[4 5 4 ~ 3 ~ 1 ~]/2").scale(mode)
    .s("sawtooth").attack(.25).release(1.6)
    .lpf(ref(() => 1100 - tape.decay * 600))
    .vib(.6).vibmod(ref(() => .08 + tape.decay * .5))
    .degradeBy(ref(() => tape.decay * .8)).gain(.09)
    .orbit(1).room(.8).roomsize(9),

  // moving: a music box somewhere in the house
  n(irand(8).segment(8).add(ref(() => tape.register))).scale("D4:mixolydian")
    .s("sine").fm(2).fmh(3.01).decay(.5).sustain(0).release(1)
    .degradeBy(ref(() => .95 - tape.stir * .7))
    .pan(ref(() => tape.x)).gain(.16)
    .orbit(2).delay(.5).delaytime(.75).delayfeedback(.45).room(.4).roomsize(4),

  // holding: the loop swells, as if played back too loud
  n("[0,4,7,9]*16").scale(mode).s("supersaw").detune(.2).decay(.3).sustain(0)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1))
    .lpf(ref(() => 300 + tape.hold * 4000)).lpq(5)
    .gain(ref(() => tape.hold * .2))
    .orbit(1).room(.8).roomsize(9),
)`,
  },
  lain: {
    root: 52,
    steps: [0, 2, 3, 5, 7, 8, 10],
    cps: 0.38,
    voice: { s: 'sine', fmi: 3.5, fmh: 4 },
    crackle: 0.01,
    code: `// tape: lain. 3am.
// after HTRK, Angelo Badalamenti, Fishmans
setcps(.38)
const mode = "E3:aeolian"
const beat = () => (.35 + tape.stir * .65) * (.5 + tape.home * .5)

stack(
  // drum machine: slow, dry, a room away
  s("sbd ~ ~ ~ ~ ~ sbd ~").decay(.7).gain(ref(() => beat() * .3)).orbit(3),
  s("~ ~ white ~").decay(.04).sustain(0).bpf(2400)
    .gain(ref(() => beat() * .35)).orbit(3).room(.3).roomsize(2),

  // bass: round and low, mostly the root
  note("<e1 [e1 ~ ~ e1] c1 d1>").s("sine").decay(1.2).sustain(.4).release(.3)
    .shape(.25).lpf(400).gain(.11).orbit(3),

  // guitar on the offbeat, thrown into a dub echo
  n("<[0,2,4] [0,2,4] [-2,0,2] [-1,1,3]>").struct("~ x ~ x").scale(mode)
    .s("triangle").decay(.25).sustain(0).hpf(300).gain(.3)
    .orbit(2).delay(.45).delaytime(.49).delayfeedback(.5).room(.5).roomsize(5),

  // moving: a vibraphone in an empty diner
  n(irand(7).segment(8).add(ref(() => tape.register))).scale("E4:aeolian")
    .s("sine").fm(3.5).fmh(4).decay(.8).sustain(0).release(1.2)
    .degradeBy(ref(() => .95 - tape.stir * .7))
    .pan(ref(() => tape.x)).gain(.14)
    .orbit(2).delay(.3).delaytime(.49).delayfeedback(.5).room(.5).roomsize(5),

  // holding: a chord leaning in, the red room getting louder
  n("[0,2,4,6]*8").scale(mode).s("sawtooth").decay(.2).sustain(0)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1))
    .lpf(ref(() => 250 + tape.hold * 3500)).lpq(6)
    .gain(ref(() => tape.hold * .25))
    .orbit(1).room(.7).roomsize(7),
)`,
  },
  phosphor: {
    root: 57,
    steps: [0, 2, 3, 5, 7, 9, 10],
    cps: 0.45,
    voice: { s: 'square', crush: 8, lpf: 3000 },
    crackle: 0,
    code: `// tape: phosphor. machines that dream.
// after Autechre, Boards of Canada
setcps(.45)
const mode = "A3:dorian"
const beat = () => (.25 + tape.stir * .75) * (.5 + tape.home * .5)

stack(
  // glass pads, slowly changing their minds
  n("<[0,4,9] [2,5,9] [-1,4,7] [0,3,7]>/2").scale(mode)
    .s("supersaw").detune(.25).unison(4).attack(1.5).release(3)
    .lpf(ref(() => 700 + tape.night * 700)).gain(.1)
    .orbit(1).room(.7).roomsize(6),

  // five notes against sixteen steps: it never lines up the same way twice
  n("{0 2 4 7 5}%16".add(ref(() => tape.register))).scale(mode)
    .s("square").decay(.1).sustain(0).lpq(8)
    .lpf(ref(() => 500 + tape.stir * 3500))
    .degradeBy(ref(() => .8 - tape.stir * .7))
    .pan(ref(() => tape.x)).gain(.1)
    .orbit(2).delay(.3).delaytime(.2).delayfeedback(.4).room(.3).roomsize(3),

  // broken beat
  s("sbd(3,8,2)").decay(.35).gain(ref(() => beat() * .3)).orbit(3),
  s("~ white ~ [~ white]").decay(.07).sustain(0).bpf(1700).crush(7)
    .sometimesBy(.25, x => x.ply(2))
    .gain(ref(() => beat() * .35)).orbit(3),
  s("white*16").decay(.015).sustain(0).hpf(9000)
    .degradeBy(ref(() => .8 - tape.stir * .6))
    .gain(ref(() => beat() * .25)).orbit(3),

  // holding: the signal overloads and turns to grit
  n("[0,4,7,11]*8").scale(mode).s("square").decay(.1).sustain(0)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1))
    .coarse(ref(() => 1 + Math.round(tape.hold * 10)))
    .lpf(ref(() => 400 + tape.hold * 5000))
    .gain(ref(() => tape.hold * .22))
    .orbit(1).room(.7).roomsize(6),
)`,
  },
  uv: {
    root: 48,
    steps: [0, 2, 3, 5, 7, 8, 10],
    cps: 0.58,
    voice: { s: 'sawtooth', vowel: 'o', lpf: 2400 },
    crackle: 0.12,
    code: `// tape: uv. a night bus in the rain.
// after Burial, Oneohtrix Point Never
setcps(.58)
const mode = "C3:minor"
const beat = () => (.25 + tape.stir * .75) * (.5 + tape.home * .5)

stack(
  // minor ninths, soft and far away
  n("<[0,4,6,8] [-2,2,4,6] [-3,1,3,5] [-1,3,4,6]>/2").scale(mode)
    .s("supersaw").detune(.2).unison(3).attack(.8).release(2.5)
    .lpf(ref(() => 600 + tape.night * 500)).gain(.07)
    .orbit(1).room(.85).roomsize(8),

  // voices: formants that almost sing, pitched from the pointer height
  n("<[~ 7] [~ 9 ~ 8] [~ ~ 7] [11 ~ 9 ~]>".add(ref(() => tape.register - 3))).scale(mode)
    .s("sawtooth").vowel("<o a o e>").attack(.02).decay(.3).sustain(.2).release(.8)
    .degradeBy(ref(() => .5 - tape.stir * .45))
    .pan(ref(() => tape.x)).gain(.1)
    .orbit(2).delay(.35).delaytime(.31).delayfeedback(.45).room(.7).roomsize(6),

  // two-step: a skipping kick, snares on two and four, shuffled hats
  s("sbd ~ ~ ~ ~ ~ ~ ~ ~ ~ sbd ~ ~ ~ ~ ~").decay(.4)
    .gain(ref(() => beat() * .3)).orbit(3),
  s("~ white ~ white").decay(.1).sustain(0).bpf(1900)
    .gain(ref(() => beat() * .65)).orbit(3).room(.4).roomsize(2),
  s("white*16").swingBy(1/6, 8).decay(.02).sustain(0).hpf(8000)
    .degradeBy(ref(() => .7 - tape.stir * .5))
    .gain(ref(() => beat() * .22)).orbit(3).room(.4).roomsize(2),

  // sub
  n("<0 ~ -2 [-1 ~]>").scale("C1:minor").s("sine").decay(.9).sustain(.3)
    .shape(.2).gain(.16).orbit(3),

  // holding: the voices gather into a choir
  n("[0,2,4,6]*8").scale(mode).s("sawtooth").vowel("a").decay(.25).sustain(0)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1))
    .lpf(ref(() => 400 + tape.hold * 3000))
    .gain(ref(() => tape.hold * .3))
    .orbit(1).room(.85).roomsize(8),
)`,
  },
  mono: {
    root: 48,
    steps: [0, 1, 3, 5, 7, 8, 10],
    cps: 0.58,
    voice: { s: 'square', hpf: 400, lpf: 2400 },
    crackle: 0.04,
    code: `// tape: mono. pressure.
// after The Bug, Coil, Swans, Source Direct
setcps(.58)
const mode = "C3:phrygian"
const beat = () => (.3 + tape.stir * .7) * (.5 + tape.home * .5)

stack(
  // the hum: a low drone that fills the room
  note("<c2 c2 c2 db2>/2").s("sawtooth").attack(2).release(4)
    .lpf(ref(() => 140 + tape.night * 80)).shape(.5).gain(.055)
    .orbit(1).room(.6).roomsize(8),

  // riddim: half-time, three-three-two, heavy
  s("sbd ~ ~ sbd ~ ~ sbd ~").decay(.9).shape(.3)
    .gain(ref(() => beat() * .15)).orbit(3),
  s("~ ~ ~ ~ white ~ ~ ~").decay(.18).sustain(0).bpf(1200)
    .gain(ref(() => beat() * .35)).orbit(3).room(.5).roomsize(3),
  // move fast enough and the hats double into jungle
  s("white*8").ply(ref(() => tape.stir > .6 ? 2 : 1)).decay(.02).sustain(0).hpf(9000)
    .gain(ref(() => beat() * .2 * tape.stir)).orbit(3).room(.5).roomsize(3),

  // dub: one stab, thrown into a long echo
  n("<[~ [0,3]] ~ [~ ~ [0,3] ~] ~>".add(ref(() => tape.register))).scale(mode)
    .s("square").hpf(500).lpf(2400).decay(.08).sustain(0).gain(.08)
    .orbit(2).delay(.6).delaytime(.31).delayfeedback(.7).room(.3).roomsize(4),

  // moving: metal, struck somewhere in the dark
  n(irand(5).segment(8).add(ref(() => tape.register))).scale("C4:phrygian")
    .s("sine").fm(5).fmh(1.41).decay(.25).sustain(0)
    .degradeBy(ref(() => .95 - tape.stir * .6))
    .pan(ref(() => tape.x)).gain(.1)
    .orbit(2).delay(.3).delaytime(.31).delayfeedback(.7).room(.3).roomsize(4),

  // holding: it only gets louder
  n("[0,1,4,7]*8").scale("C2:phrygian").s("sawtooth").decay(.2).sustain(.2)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1))
    .distort(ref(() => tape.hold * 2)).postgain(.2)
    .lpf(ref(() => 200 + tape.hold * 3000))
    .gain(ref(() => tape.hold * .2))
    .orbit(1).room(.6).roomsize(8),
)`,
  },
};

// Every layer also answers the arrangement of the track it is heard on, through its orbit.
export function codeFor(palette: string, seed: number) {
  const code = (TAPES[palette] ?? TAPES.oxide).code.replace(/\.orbit\(([123])\)/g, '.velocity(ref(() => tape.mix$1)).orbit($1)');
  return `${code}.seed(${seed})\n`;
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

// Freeze a parameter where it is now, so the next ramp starts from there.
function hold(p: AudioParam, t: number) {
  if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
  else {
    const v = p.value;
    p.cancelScheduledValues(t);
    p.setValueAtTime(v, t);
  }
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
  private run: GainNode;
  private spool: GainNode;
  private spoolBand: BiquadFilterNode;
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

    // While the tape winds the music is lifted off the head; hiss and crackle stay.
    this.run = g(1);
    this.input.connect(this.run);
    this.run.connect(this.wow).connect(this.dry).connect(this.tone);
    this.run.connect(this.warp).connect(this.wet).connect(this.tone);
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

    // The spool: filtered noise whose pitch follows the winding speed.
    this.spool = g(0);
    this.spoolBand = new BiquadFilterNode(ctx, { type: 'bandpass', Q: 3, frequency: 600 });
    loop(ctx, this.white).connect(this.spoolBand).connect(this.spool).connect(this.gate);
  }

  fade(to: number, seconds = 0.6) {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(to, t + seconds);
  }

  // Reading pages play the same tape, quieter and darker; older pages are more worn.
  set(home: boolean, wear: number, night: number, crackle: number) {
    const t = this.ctx.currentTime;
    this.duck.gain.setTargetAtTime(home ? 1 : 0.4, t, 0.4);
    this.tone.frequency.setTargetAtTime(home ? 16000 - wear * 6000 : 5200 - wear * 3000, t, 0.4);
    this.hiss.gain.setTargetAtTime(0.012 + wear * 0.02 + night * 0.006, t, 0.4);
    this.crackle.gain.setTargetAtTime(wear * 0.25 + crackle, t, 0.4);
    this.wowDepth.gain.setTargetAtTime(0.0008 + wear * 0.003, t, 0.4);
  }

  // Winding: the music drops out, the spool spins up, fast-forward higher than rewind.
  scan(direction: -1 | 1) {
    const t = this.ctx.currentTime;
    const ff = direction < 0;
    this.holdAll(t);
    this.dry.gain.setTargetAtTime(1, t, 0.02);
    this.wet.gain.setTargetAtTime(0, t, 0.02);
    this.run.gain.setTargetAtTime(0, t, 0.03);
    this.spool.gain.setTargetAtTime(0.06, t, 0.05);
    this.spoolBand.frequency.setTargetAtTime(ff ? 3400 : 1900, t, 0.25);
  }

  // Back to play: the spool stops and the tape comes up to speed, the pitch rising into place.
  land(at?: number) {
    const t = at ?? this.ctx.currentTime;
    if (at === undefined) this.holdAll(t);
    this.spool.gain.setTargetAtTime(0, t, 0.04);
    this.spoolBand.frequency.setTargetAtTime(300, t, 0.08);
    this.run.gain.setTargetAtTime(1, t, 0.02);
    // The delay grows fast, then settles: the pitch starts near half and rises to normal.
    const span = 0.05;
    this.warp.delayTime.setValueAtTime(0, t);
    this.warp.delayTime.setTargetAtTime(span, t, 0.1);
    this.wet.gain.setTargetAtTime(1, t, 0.005);
    this.dry.gain.setTargetAtTime(0, t, 0.005);
    this.wet.gain.setTargetAtTime(0, t + 0.4, 0.03);
    this.dry.gain.setTargetAtTime(1, t + 0.4, 0.03);
  }

  private holdAll(t: number) {
    for (const p of [this.run.gain, this.spool.gain, this.spoolBand.frequency, this.warp.delayTime, this.wet.gain, this.dry.gain]) hold(p, t);
  }

  // A wind of known length, from one track to another.
  wind(direction: -1 | 1, seconds: number) {
    this.scan(direction);
    this.land(this.ctx.currentTime + seconds);
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
  readonly ear: Ear = { stir: 0, hold: 0, x: 0.5, register: 3, night: 0.5, home: 1, decay: 0, mix1: 1, mix2: 0.8, mix3: 0.4 };
  private deck: Deck;
  private tape: Tape = TAPES.oxide;
  private palette = 'oxide';
  private loadedAt = 0;
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
    this.palette = TAPES[palette] ? palette : 'oxide';
    this.tape = TAPES[this.palette];
    this.loadedAt = performance.now();
    this.ear.decay = 0;
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

  update(l: Listening, night: number, track = 0) {
    const e = this.ear;
    const [a, b, c] = ARRANGEMENT[track] ?? ARRANGEMENT[0];
    e.mix1 += (a - e.mix1) * 0.05;
    e.mix2 += (b - e.mix2) * 0.05;
    e.mix3 += (c - e.mix3) * 0.05;
    const target = clamp(l.speed / 24) * (this.home ? 1 : 0.35);
    // Quick to wake up, slow to settle, like a meter.
    e.stir += (target - e.stir) * (target > e.stir ? 0.25 : 0.02);
    e.hold += (l.hold - e.hold) * 0.3;
    e.x = l.x;
    e.register = Math.round((1 - clamp(l.y)) * 7);
    e.night = night;
    e.home = this.home ? 1 : 0;
    const now = performance.now();
    e.decay = clamp((now - this.loadedAt) / 360_000);
    if (now - this.lastSet > 200) {
      this.lastSet = now;
      this.setDeck();
    }
  }

  scene(home: boolean, wear: number) {
    this.home = home;
    this.wear = wear;
    this.setDeck();
  }

  private setDeck() {
    this.deck.set(this.home, this.wear, this.ear.night, this.tape.crackle + this.ear.decay * 0.04);
  }

  event(e: TapeEvent) {
    if (e.type === 'seek') this.deck.wind(e.direction, e.seconds);
    else if (e.type === 'scan') this.deck.scan(e.direction);
    else if (e.type === 'land') this.deck.land();
    else if (e.type === 'erase') this.deck.dropout();
    else if (e.type === 'burst') this.burst(e.power, e.x);
  }

  // Releasing a hold scatters the gathered chord in the tape's own voice: more power, more notes,
  // wider and longer. Bursts get an orbit of their own so their echo never disturbs the pattern.
  private burst(power: number, x: number) {
    const { tape } = this;
    const t = this.ctx.currentTime + 0.03;
    const count = 3 + Math.round(power * 5);
    const len = tape.steps.length;
    for (let i = 0; i < count; i++) {
      const degree = this.ear.register + i * 2;
      const note = tape.root + 12 + tape.steps[degree % len] + 12 * Math.floor(degree / len);
      superdough(
        {
          lpf: 1800 + power * 6000,
          ...tape.voice,
          note,
          gain: (0.16 + power * 0.14) * (this.home ? 1 : 0.5),
          attack: 0.003,
          decay: 0.3 + power * 0.8,
          sustain: 0,
          release: 1,
          pan: clamp(x + (Math.random() - 0.5) * (0.2 + power * 0.8)),
          orbit: 4,
          room: 0.4 + power * 0.5,
          roomsize: 6,
          delay: 0.3,
          delaytime: 0.25,
          delayfeedback: 0.35,
        },
        t + i * (0.09 - power * 0.06),
        0.4 + power,
        tape.cps,
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
