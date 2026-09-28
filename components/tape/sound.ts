// The tape, as sound. Strudel plays the pattern; a small Web Audio deck after it adds what a
// cassette does to music: hiss, crackle with age, wow, dropouts and the spool on page changes.
// Loaded only after the visitor turns sound on, so the first page load never pays for it.

import {
  evaluate,
  getAudioContext,
  getSuperdoughAudioController,
  initAudio,
  initStrudel,
  samples,
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

// How the deck colours a tape on its way out: wow and hiss relative to the usual, a drive into
// the output stage (0 clean, 1 into the red), and how much top end survives.
interface DeckProfile { wow: number; hiss: number; drive: number; bright: number }

interface Tape {
  root: number; // MIDI note of the scale root, for the notes a release scatters
  steps: number[];
  cps: number;
  voice: Record<string, number | string>; // the instrument a released hold scatters
  crackle: number; // surface noise this tape carries even when new
  deck: DeckProfile;
  code: string; // the Strudel pattern
}

// One tape per palette, each a different kind of music from the canon and the log, with its own
// instruments (samples: tidal-drum-machines, Dirt-Samples, VCSL, the Salamander piano), its own
// tempo, and its own idea of what the pointer is: a hand on the reel, a bass player, a
// sequencer, a ritual, a sound system, a bent circuit. What they share: still is quiet, moving
// brings the music in, holding builds, releasing lets go. Orbits keep reverb and echo settings
// apart (Strudel rebuilds an orbit's reverb whenever its size changes) and carry the arrangement:
// 1 the ground (pads, drones, holds), 2 the melody, 3 the rhythm.
const TAPES: Record<string, Tape> = {
  oxide: {
    root: 50,
    steps: [0, 2, 4, 5, 7, 9, 10],
    cps: 0.22,
    voice: { s: 'glockenspiel' },
    crackle: 0.02,
    deck: { wow: 2.6, hiss: 1.8, drive: 0.05, bright: 0.75 },
    code: `// tape: oxide. a loop that wears away the longer it plays.
// after William Basinski, Boards of Canada, Oneohtrix Point Never
setcps(.22)

stack(
  // the loop: two piano chords, losing a little more on every pass
  note("<[d3,a3,e4,f#4] [b2,f#3,d4,a4]>").s("piano").clip(1)
    .attack(.3).release(3).lpf(ref(() => 2600 - tape.decay * 1800))
    .degradeBy(ref(() => tape.decay * .5)).gain(.55)
    .orbit(1).room(.8).roomsize(9),
  // under it, a long pad, very slow
  s("padlong").loopAt(8).lpf(1100).gain(.3).orbit(1).room(.8).roomsize(9),

  // moving: the hand on the reel scrubs through the pad
  s("padlong*8").begin(ref(() => tape.x * .9)).end(ref(() => tape.x * .9 + .03))
    .gain(ref(() => tape.stir * .7)).pan(ref(() => tape.x))
    .orbit(2).delay(.4).delaytime(.68).delayfeedback(.45).room(.4).roomsize(4),
  // and a music box in the next room
  n(irand(8).segment(4).add(ref(() => tape.register))).scale("D5:major pentatonic")
    .s("glockenspiel").degradeBy(ref(() => .9 - tape.stir * .6)).gain(.22)
    .orbit(2).delay(.4).delaytime(.68).delayfeedback(.45).room(.4).roomsize(4),

  // holding: the moment freezes, grains of it piling up
  s("padlong*32").begin(ref(() => tape.x * .9)).end(ref(() => tape.x * .9 + .012))
    .degradeBy(ref(() => tape.hold > .02 ? .15 : 1)).pan(rand)
    .gain(ref(() => tape.hold * .55))
    .orbit(1).room(.8).roomsize(9),
)`,
  },
  lain: {
    root: 53,
    steps: [0, 2, 3, 5, 7, 9, 10],
    cps: 0.3,
    voice: { s: 'vibraphone_soft' },
    crackle: 0.012,
    deck: { wow: 1, hiss: 0.9, drive: 0.1, bright: 0.8 },
    code: `// tape: lain. 3am, a diner, the red room.
// after HTRK, Angelo Badalamenti, Fishmans
setcps(.3)
const mode = "F3:dorian"
const beat = () => (.4 + tape.stir * .6) * (.5 + tape.home * .5)

stack(
  // brushes and a soft kick, a room away
  s("bassdrum2 ~ ~ ~ ~ ~ bassdrum2 ~").n(3).lpf(900).gain(ref(() => beat() * .55)).orbit(3),
  s("[~ snare_low]*2").n(irand(20)).hpf(1800).decay(.12).gain(ref(() => beat() * .3)).orbit(3).room(.3).roomsize(2),
  s("hihat*8").n(irand(15)).hpf(7000).postgain(perlin.range(.4, 1)).gain(ref(() => beat() * .16)).orbit(3).room(.3).roomsize(2),

  // moving: the bass starts to walk
  n("<[0 2 4 5] [4 3 2 0] [-3 -1 0 2] [3 2 1 -1]>").scale("F1:dorian").s("triangle")
    .decay(.35).sustain(.25).lpf(600).shape(.2)
    .degradeBy(ref(() => .85 - tape.stir * .85)).gain(.5).orbit(3),

  // the electric piano, slow ninths
  n("<[0,2,4,8] [-1,1,3,5] [-2,0,2,6] [-3,-1,1,5]>").scale(mode).s("fmpiano")
    .attack(.02).release(2.5).gain(.3).orbit(1).room(.6).roomsize(6),
  // Fishmans: a kalimba skank on the offbeat, thrown into the echo
  n("<[4,6] [3,5]>").struct("~ x ~ x").scale("F4:dorian").s("kalimba").gain(.28)
    .orbit(2).delay(.5).delaytime(.5).delayfeedback(.55).room(.5).roomsize(5),
  // and a vibraphone, when the pointer moves
  n(irand(7).segment(8).add(ref(() => tape.register))).scale("F4:dorian").s("vibraphone_soft")
    .degradeBy(ref(() => .95 - tape.stir * .7)).pan(ref(() => tape.x)).gain(.4)
    .orbit(2).delay(.5).delaytime(.5).delayfeedback(.55).room(.5).roomsize(5),

  // holding: the organ leans in
  n("[0,2,4,7]").scale(mode).s("pipeorgan_quiet").attack(.4).release(1.5)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .5))
    .orbit(1).room(.6).roomsize(6),
)`,
  },
  phosphor: {
    root: 57,
    steps: [0, 2, 3, 5, 7, 8, 10],
    cps: 0.5625,
    voice: { s: 'square', crush: 6, lpf: 3200 },
    crackle: 0.03,
    deck: { wow: 0.25, hiss: 0.35, drive: 0.15, bright: 1 },
    code: `// tape: phosphor. broken machines, a night bus, rain.
// after Autechre, Burial
setcps(.5625)
const beat = () => (.3 + tape.stir * .7) * (.5 + tape.home * .5)

stack(
  // 2-step on a crunchy sampler: kick, a late snare, hats pushed off the grid
  s("bd ~ ~ ~ ~ ~ ~ ~ ~ ~ bd ~ ~ ~ ~ ~").bank("AkaiMPC60").lpf(3500).gain(ref(() => beat() * .9)).orbit(3),
  s("~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~ sd ~ ~ [~ sd]").bank("AkaiMPC60").n(1).gain(ref(() => beat() * .55)).orbit(3).room(.3).roomsize(2),
  s("hh*16").bank("AkaiMPC60").swingBy(1/6, 8).degradeBy(.35).hpf(6000).gain(ref(() => beat() * .35)).orbit(3).room(.3).roomsize(2),
  // the sub
  note("<a0 [~ a0] f0 [g0 ~]>").s("sine").decay(.6).sustain(.3).gain(.35).orbit(3),

  // ghost vocals, pitched down and cut up; the pointer's height pitches them
  s("diphone").n("<3 9 14 21>").chop(8).speed(ref(() => .55 + tape.register * .06))
    .degradeBy(ref(() => .85 - tape.stir * .6)).ply(ref(() => tape.hold > .3 ? 4 : 1))
    .gain(.55).orbit(1).room(.75).roomsize(7),
  // pad: minor ninths behind rain on the window
  n("<[0,2,4,8] [-2,0,3,5]>").scale("A3:minor").s("supersaw").detune(.15).lpf(1200)
    .attack(.6).release(2).gain(.07).orbit(1).room(.75).roomsize(7),

  // moving: the machines; where the pointer is rewrites their rhythm
  s("bleep").n(irand(13)).euclidRot(ref(() => 3 + Math.round(tape.x * 8)), 16, ref(() => tape.register))
    .speed(rand.range(.5, 2)).crush(7).pan(rand)
    .gain(ref(() => .06 + tape.stir * .3))
    .orbit(2).delay(.3).delaytime(.1875).delayfeedback(.4),
)`,
  },
  uv: {
    root: 40,
    steps: [0, 1, 4, 5, 7, 8, 10],
    cps: 0.28,
    voice: { s: 'tubularbells' },
    crackle: 0.015,
    deck: { wow: 1.3, hiss: 1, drive: 0.2, bright: 0.85 },
    code: `// tape: uv. musick to play in the dark.
// after Coil, Xiu Xiu
setcps(.28)
const mode = "E3:phrygian dominant"
const beat = () => (.25 + tape.stir * .75) * (.5 + tape.home * .5)

stack(
  // the drone: an organ pedal, and a didgeridoo breathing under it
  note("<e1 [e1 f1]>").s("pipeorgan_quiet_pedal").attack(2).release(4).gain(.4).orbit(1).room(.9).roomsize(9),
  s("didgeridoo").n("<0 3 5 3>").slow(2).lpf(800).gain(.3).orbit(1).room(.9).roomsize(9),
  // the ritual: a gong, bells far apart
  s("gong").n(irand(7)).struct("x ~ ~ ~").slow(2).gain(.28).orbit(1).room(.9).roomsize(9),
  n("<0 ~ 4 ~ [1 0] ~ ~ ~>").scale("E3:phrygian dominant").s("tubularbells").gain(.25)
    .orbit(2).room(.6).roomsize(7),

  // a cheap drum machine, stiff and too loud
  s("bd ~ sd ~ bd bd sd ~").bank("KorgMinipops").gain(ref(() => beat() * .55)).orbit(3),
  // moving: a glockenspiel, unsure of itself
  n(irand(7).segment(8).add(ref(() => tape.register))).scale("E5:phrygian dominant")
    .s("glockenspiel").degradeBy(ref(() => .95 - tape.stir * .7)).pan(ref(() => tape.x)).gain(.3)
    .orbit(2).room(.6).roomsize(7),
  // pushed hard, it breaks: noise, all at once
  s("industrial*4").n(irand(32)).degradeBy(ref(() => tape.stir > .72 ? .15 : 1))
    .distort(2).postgain(.3).gain(.6).orbit(3),

  // holding: bowed bars in a cluster, pulling tighter
  n("[0,1,3,4]").scale(mode).add(7).s("vibraphone_bowed").attack(.8).release(2)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .6))
    .orbit(1).room(.9).roomsize(9),
)`,
  },
  mono: {
    root: 36,
    steps: [0, 1, 3, 5, 7, 8, 10],
    cps: 0.35,
    voice: { s: 'sawtooth', distort: 1.5, lpf: 1600, delayfeedback: 0.7 },
    crackle: 0.03,
    deck: { wow: 0.8, hiss: 0.8, drive: 0.7, bright: 0.7 },
    code: `// tape: mono. pressure.
// after The Bug, Swans, Source Direct
setcps(.35)
const mode = "C2:phrygian"
const beat = () => (.35 + tape.stir * .65) * (.5 + tape.home * .5)

stack(
  // 3-3-2 on an 808, the kick into the red
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR808").n(3).distort(1.2).postgain(.5).gain(ref(() => beat())).orbit(3),
  s("~ ~ rim ~ ~ ~ rim ~").bank("RolandTR808").gain(ref(() => beat() * .5)).orbit(3).room(.3).roomsize(2),
  s("hh*8").bank("RolandTR808").ply(ref(() => tape.stir > .6 ? 2 : 1)).gain(ref(() => beat() * .35 * tape.stir)).orbit(3).room(.3).roomsize(2),
  // the sub, saturated
  note("<c1 c1 [c1 ~ ~ db1] c1>").s("sine").decay(.8).sustain(.4).shape(.5).gain(.4).orbit(3),

  // Swans: the same chord, again and again, heavier the more it is pushed
  s("dist*4").n("<0 0 4 4>").speed(.5).lpf(ref(() => 700 + tape.stir * 3200))
    .gain(ref(() => .12 + tape.stir * .4)).orbit(1).room(.4).roomsize(4),
  // a dub stab thrown into the delay
  n("<[0,3,7] ~ ~ ~>").scale(mode).add(14).s("sawtooth").decay(.15).sustain(0).lpf(1500).gain(.2)
    .orbit(2).delay(.6).delaytime(.4286).delayfeedback(.65),

  // holding: the siren
  note(sine.range(72, 84).fast(4).segment(16)).s("square").lpf(3000)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .16))
    .orbit(2).delay(.6).delaytime(.4286).delayfeedback(.65),
)`,
  },
  noise: {
    root: 45,
    steps: [0, 1, 3, 6, 7, 9, 10],
    cps: 0.5,
    voice: { s: 'square', crush: 4, coarse: 6, lpf: 5000 },
    crackle: 0.05,
    deck: { wow: 1.6, hiss: 1.2, drive: 1, bright: 1 },
    code: `// tape: noise. bent circuits, Beijing.
// after fRUITYSPACE and the shows there, 2016-2021
setcps(.5)
const beat = () => (.2 + tape.stir * .8) * (.5 + tape.home * .5)

stack(
  // a Casio with its pitch pin shorted: where the pointer is bends it
  s("casio*8").n(irand(3)).speed(ref(() => .4 + tape.x * 2.6)).crush(ref(() => 3 + tape.register))
    .degradeBy(ref(() => .75 - tape.stir * .65)).gain(.35).orbit(2),
  s("toys").n(irand(13)).struct("x ~ x x ~ ~ x ~").speed(rand.range(.5, 3)).coarse(4).gain(.22)
    .orbit(2).delay(.25).delaytime(.125).delayfeedback(.6),
  // a drum machine losing its clock
  s("bd sd [~ bd] sd").bank("CasioSK1").degradeBy(.3).speed(perlin.range(.8, 1.4))
    .gain(ref(() => beat() * .6)).orbit(3),
  // harsh: the moving hand is the noise
  s("noise2*16").n(irand(8)).hpf(ref(() => 200 + tape.register * 400)).distort(3).postgain(.2)
    .gain(ref(() => tape.stir * tape.stir * .5)).orbit(3),
  s("glitch2*8").n(irand(8)).degradeBy(.5).gain(ref(() => .06 + tape.stir * .3)).orbit(2),

  // holding: feedback, the mixer turned back on itself
  note(ref(() => 50 + tape.register * 7)).segment(16).s("sawtooth")
    .lpf(ref(() => 400 + tape.hold * 6000)).lpq(18).distort(ref(() => tape.hold * 3)).postgain(.2)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .35)).orbit(1),
  // and under everything, the hum of the room
  note("a0").s("sine").gain(.08).orbit(1),
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
  private shaper: WaveShaperNode;
  private driveNow = -1;
  private profile: DeckProfile = { wow: 1, hiss: 1, drive: 0, bright: 1 };
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
    // The output stage: some tapes are driven into it (see DeckProfile.drive).
    this.shaper = new WaveShaperNode(ctx, { oversample: '2x' });
    this.tone.connect(this.shaper).connect(this.duck).connect(this.gate).connect(this.master).connect(limiter).connect(ctx.destination);

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
  set(home: boolean, wear: number, night: number, crackle: number, profile = this.profile) {
    this.profile = profile;
    const t = this.ctx.currentTime;
    const p = profile;
    this.duck.gain.setTargetAtTime(home ? 1 : 0.45, t, 0.4);
    this.tone.frequency.setTargetAtTime((home ? 16000 - wear * 6000 : 7000 - wear * 3000) * p.bright, t, 0.4);
    this.hiss.gain.setTargetAtTime((0.012 + wear * 0.02 + night * 0.006) * p.hiss, t, 0.4);
    this.crackle.gain.setTargetAtTime(wear * 0.25 + crackle, t, 0.4);
    this.wowDepth.gain.setTargetAtTime((0.0008 + wear * 0.003) * p.wow, t, 0.4);
    if (p.drive !== this.driveNow) {
      this.driveNow = p.drive;
      // tanh saturation, level-matched so a clean tape and a driven one sit at the same loudness.
      const k = 0.5 + p.drive * 5;
      const curve = new Float32Array(1025);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(k * x) / Math.tanh(k);
      }
      this.shaper.curve = curve;
    }
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
    // The sample banks the tapes play (only their indexes load here; each sound loads when first
    // played). They come from the projects' own GitHub repositories, as on strudel.cc.
    const dough = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
    await Promise.all([
      samples('github:tidalcycles/dirt-samples'),
      samples(`${dough}/tidal-drum-machines.json`),
      samples(`${dough}/vcsl.json`),
      samples(`${dough}/piano.json`),
    ]).catch((err) => console.warn('some sample banks did not load', err));
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
    this.setDeck();
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
    this.deck.set(this.home, this.wear, this.ear.night, this.tape.crackle + this.ear.decay * 0.04, this.tape.deck);
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
