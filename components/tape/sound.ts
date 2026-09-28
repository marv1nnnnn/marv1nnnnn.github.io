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
  decay: number; // how worn this tape is: 0 when it goes in, 1 when worn out (Tape.wears)
  // The arrangement for the track under the head (orbit 1 pads and holds, 2 melody, 3 drums and bass).
  mix1: number;
  mix2: number;
  mix3: number;
  // What the composer (below) has arrived at: the motif (scale degrees, null a rest), the chord
  // (a degree the harmony moves by), how busy the melody is, and a slow drift of register.
  motif: (number | null)[];
  chord: number;
  density: number;
  drift: number;
}

// How a tape's melody and harmony evolve on their own. Every cycle a few steps of the motif may
// change (a step, a leap, a rest), faster when the pointer stirs; every few cycles the chord
// moves on along its own table; now and then an earlier motif comes back.
interface Evolve {
  length: number;
  range: [number, number]; // scale degrees the motif stays within
  rest: number; // how likely a changed step falls silent
  mutate: number; // chance per cycle that a step changes, before the pointer adds to it
  every: number; // cycles per chord
  chords: Record<number, number[]>; // where each chord may go next
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), (s >>> 0) / 4294967296);
}

class Composer {
  private rand: () => number;
  private memory: (number | null)[][] = [];
  private last = -1;

  constructor(private e: Evolve, seed: number, private ear: Ear) {
    this.rand = rng(seed);
    // Start from a short walk through the scale.
    let d = Math.round((e.range[0] + e.range[1]) / 2);
    ear.motif = Array.from({ length: e.length }, (_, i) => {
      if (i > 0 && this.rand() < e.rest) return null;
      d = this.clamp(d + Math.round((this.rand() - 0.5) * 4));
      return d;
    });
    ear.chord = 0;
    ear.density = 0.6;
    ear.drift = 0;
  }

  private clamp(d: number) {
    return Math.max(this.e.range[0], Math.min(this.e.range[1], d));
  }

  // Called often; acts once per new cycle.
  tick(cycle: number, stir: number) {
    const c = Math.floor(cycle);
    if (c === this.last) return;
    this.last = c;
    const { e, ear } = this;
    const r = this.rand;
    const motif = [...ear.motif];
    const tries = 1 + Math.floor(stir * 3);
    for (let k = 0; k < tries; k++) {
      if (r() > e.mutate + stir * 0.35) continue;
      const i = Math.floor(r() * motif.length);
      const here = motif[i];
      const near = motif[(i + motif.length - 1) % motif.length] ?? motif[(i + 1) % motif.length] ?? here ?? 0;
      if (here === null) motif[i] = this.clamp(near + (r() < 0.5 ? -1 : 1));
      else if (r() < e.rest) motif[i] = null;
      else motif[i] = this.clamp(here + (r() < 0.7 ? (r() < 0.5 ? -1 : 1) : r() < 0.5 ? -3 : 2));
    }
    // Remember a phrase every eight cycles; sometimes go back to one.
    if (c % 8 === 7) {
      this.memory = [...this.memory.slice(-3), motif];
      if (this.memory.length > 1 && r() < 0.25) motif.splice(0, motif.length, ...this.memory[Math.floor(r() * this.memory.length)]);
    }
    ear.motif = motif;
    if (c % e.every === 0) {
      const next = e.chords[ear.chord] ?? [0];
      ear.chord = next[Math.floor(r() * next.length)];
    }
    ear.density = 0.55 + 0.3 * Math.sin(c / 11) + (r() - 0.5) * 0.2;
    ear.drift = Math.round(2 * Math.sin(c / 23));
  }
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
  wears: number; // seconds of play before the tape is worn out (touching it wears it faster)
  voice: Record<string, number | string>; // the instrument a released hold scatters
  crackle: number; // surface noise this tape carries even when new
  deck: DeckProfile;
  evolve: Evolve;
  code: string; // the Strudel pattern
}

// One tape per palette, each one kind of music taken as far as it goes, from the canon and the
// log: its tempo, its groove, its instruments and its habits, and a form of its own (long masks
// like "<1!24 0!8>" bring parts in and out over minutes). Samples: tidal-drum-machines,
// Dirt-Samples, VCSL, the Salamander piano. The pointer plays along: moving brings more in,
// holding builds, releasing lets go. Orbits keep reverb and echo settings apart (Strudel rebuilds
// an orbit's reverb whenever its size changes) and carry the arrangement: 1 the ground (pads,
// drones, holds), 2 the melody, 3 the rhythm. Unpitched samples play at their own pitch at note
// 36, so a note there transposes from it. Transpose inside n(): Strudel ignores .add(number) on a
// control pattern such as n(...).
const HEAD = `const motif = (k, by = 0) => n(run(k).fmap((i) => tape.motif[i % tape.motif.length] ?? 0).add(by))
  .mask(run(k).fmap((i) => (tape.motif[i % tape.motif.length] === null ? 0 : 1)))
const plays = () => .9 - tape.density * (.55 + tape.stir * .45)
const chord = () => tape.chord`;

const TAPES: Record<string, Tape> = {
  haze: {
    root: 50,
    steps: [0, 2, 4, 5, 7, 9, 11],
    cps: 0.15,
    wears: 540,
    voice: { s: 'sax_vib', attack: 0.3, lpf: 1400 },
    crackle: 0.02,
    deck: { wow: 3, hiss: 2, drive: 0.05, bright: 0.7 },
    evolve: { length: 8, range: [0, 6], rest: 0.5, mutate: 0.02, every: 64, chords: { 0: [0] } },
    code: `// tape: haze. a loop that wears away.
// A few seconds of a brass band, looped, round and round and never changed. Each pass the oxide
// flakes off in the same places a little more, until only a few slices are left. Touching the
// tape wears it faster; a finger on the reel slows it.
setcps(.15)
${HEAD}
// where the oxide is thinnest: each of the loop's 32 slices has its own point on the way out
const wear = [.95, .4, .7, .22, .85, .55, .3, .9, .62, .18, .77, .45, .99, .35, .68, .26, .82, .5, .14, .73, .6, .92, .38, .24, .88, .57, .3, .7, .47, .97, .2, .65]
const left = (i) => Math.max(0, Math.min(1, (wear[i] - tape.decay) * 6))
const slice = (g) => run(32).slow(2).fmap((i) => g * left(i))
const reel = () => 1 - tape.hold * .22
const dark = () => 2600 - tape.decay * 1900

stack(
  // the loop: two chords, cut into slices that follow on from each other
  note("<[d3,a3,f#4] [b2,f#3,d4]>").struct("x*16").s("sax_vib").begin(run(16).fmap((i) => i / 16 * .55))
    .attack(.12).release(1.1).speed(ref(reel)).lpf(ref(dark)).gain(slice(.7))
    .orbit(1).room(.9).roomsize(10),
  // and the horn line over it, eroding in the same places
  note("<[a4!6 f#4!5 e4!5] [d4!16]>").s("sax_vib").begin(run(16).fmap((i) => i / 16 * .55))
    .attack(.1).release(.9).speed(ref(reel)).lpf(ref(dark)).gain(slice(.75))
    .orbit(2).room(.9).roomsize(10),
  // under it, the organ that the band stood in front of
  note("<d2 b1>").s("pipeorgan_quiet").attack(2).release(4).speed(ref(reel))
    .gain(ref(() => .35 * (1 - tape.decay * .8))).orbit(1).room(.9).roomsize(10),
)`,
  },
  '3am': {
    root: 53,
    steps: [0, 2, 3, 5, 7, 9, 10],
    cps: 0.27,
    wears: 360,
    voice: { s: 'vibraphone_soft' },
    crackle: 0.012,
    deck: { wow: 1, hiss: 0.9, drive: 0.1, bright: 0.8 },
    evolve: { length: 8, range: [0, 9], rest: 0.3, mutate: 0.12, every: 2, chords: { 0: [3, 5, 1], 3: [0, 4, 6], 5: [1, 3], 1: [4, 0], 4: [0], 6: [0] } },
    code: `// tape: 3am. a diner, the red room.
// Slow dark jazz: an upright bass walking, brushes swung in triplets, fingers snapping on two
// and four, an electric piano and a vibraphone. Then the room goes red: the drums stop, a long
// synth chord swells and a low guitar twangs through the echo. Then the band comes back.
setcps(.27)
${HEAD}
const combo = "<1!16 0!8 1!8>"
const room = "<0!16 1!8 0!8>"

stack(
  // the upright: quarter notes, walking; half notes in the red room
  n("<[0 2 4 5] [7 5 4 2] [0 -1 -3 -2] [-3 -1 0 1]>".add(ref(chord))).scale("F2:dorian").s("triangle")
    .lpf(ref(() => 600 + tape.stir * 500)).decay(.45).sustain(.15).release(.2).shape(.25).mask(combo)
    .gain(.5).orbit(3),
  n("<[0 ~ -3 ~] [0 ~ ~ ~]>".add(ref(chord))).scale("F2:dorian").s("triangle").lpf(500).decay(1.2).sustain(.3)
    .shape(.25).mask(room).gain(.45).orbit(3),
  // brushes: the ride figure in triplets, and the swirl under it
  s("pink*4").struct("[x ~ ~] [x ~ x] [x ~ ~] [x ~ x]").bpf(3600).decay(.12).sustain(0)
    .postgain("[1 ~ ~] [1.5 ~ .8] [1 ~ ~] [1.5 ~ .8]").mask(combo)
    .gain(ref(() => .09 + tape.stir * .05)).orbit(3),
  s("pink*2").attack(.4).release(.5).bpf(1800).mask(combo).gain(.035).orbit(3),
  // fingers snapping on two and four, all night
  s("~ clap ~ clap").n(irand(10)).hpf(2200).lpf(8000).decay(.07).gain(.26).orbit(1).room(.6).roomsize(6),
  // the electric piano comps on the and of two and on four
  n("[0,2,4,6,8]".add(ref(chord))).scale("F3:dorian").s("fmpiano").struct("~ [~ ~ x] ~ x").release(1.2)
    .mask(combo).gain(.2).orbit(1).room(.6).roomsize(6),
  // the vibraphone plays the tune, swung
  motif(8, ref(() => tape.chord + tape.drift + tape.register - 3)).scale("F4:dorian").s("vibraphone")
    .swingBy(1 / 3, 4).degradeBy(ref(plays)).sometimesBy(.15, (x) => x.off(1 / 12, (y) => y.add(n(2))))
    .pan(ref(() => tape.x)).mask(combo).gain(.34)
    .orbit(2).delay(.2).delaytime(.6173).delayfeedback(.3).room(.5).roomsize(5),

  // the red room: the long synth chord, and the guitar low on its strings
  n("[0,2,4,6]".add(ref(chord))).scale("F3:dorian").slow(2).s("supersaw").detune(.25)
    .lpf(ref(() => 900 + tape.stir * 1200)).attack(3).release(4).mask(room).gain(.12).orbit(1).room(.6).roomsize(6),
  note("<[29 ~ ~ ~] [32 ~ 31 29] [27 ~ ~ ~] [24 ~ ~ ~]>").s("gtr").n(0).vib(5.5).vibmod(.15)
    .mask(room).gain(.42).orbit(2).delay(.2).delaytime(.6173).delayfeedback(.3).room(.5).roomsize(5),

  // holding: the chord swells up, wherever the band is
  n("[0,2,4,6,9]".add(ref(chord))).scale("F3:dorian").s("supersaw").detune(.25).lpf(1600).attack(.8).release(2)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .2))
    .orbit(1).room(.6).roomsize(6),
)`,
  },
  nightbus: {
    root: 57,
    steps: [0, 2, 3, 5, 7, 8, 10],
    cps: 0.575,
    wears: 360,
    voice: { s: 'supersaw', detune: 0.3, lpf: 1400 },
    crackle: 0.07,
    deck: { wow: 0.5, hiss: 0.6, drive: 0.15, bright: 0.85 },
    evolve: { length: 8, range: [0, 7], rest: 0.5, mutate: 0.15, every: 4, chords: { 0: [5, 3], 5: [3, 6], 3: [0, 6], 6: [0, 5] } },
    code: `// tape: night bus. rain, the last bus home.
// UK garage at 138, heard through a wall: a 2-step with the hats shuffling behind the beat, a
// woodblock clack, a lighter struck, a sub you feel more than hear, a minor chord that never
// resolves, and a voice pitched out of itself, far off in the reverb. Rain and crackle over
// everything. Every so often the drums fall away and only the weather and the voice are left.
setcps(.575)
${HEAD}
const drums = "<1!24 0!8>"
const beat = () => (.6 + tape.stir * .4) * (.5 + tape.home * .5)

stack(
  // the weather
  s("pink").hpf(3000).lpf(9000).attack(.5).release(.5).gain(.045).orbit(1).room(.8).roomsize(8),
  s("wind").n(irand(10)).slow(4).lpf(1400).gain(.12).orbit(1).room(.8).roomsize(8),
  // the chord that never resolves
  n("[0,2,4,8]".add(ref(chord))).scale("A3:minor").slow(2).s("supersaw").detune(.2).lpf(1100)
    .attack(1).release(3).gain(.07).orbit(1).room(.8).roomsize(8),

  // 2-step: the kick skips, the clack lands on two and four, hats and shaker shuffle
  s("bd ~ ~ ~ ~ ~ ~ ~ ~ ~ bd ~ ~ ~ ~ ~").bank("AkaiMPC60").someCyclesBy(.3, (x) => x.struct("x ~ ~ ~ ~ ~ ~ x ~ ~ x ~ ~ ~ ~ ~"))
    .lpf(3000).crush(10).mask(drums).gain(ref(() => beat() * .85)).orbit(3),
  s("~ ~ ~ ~ tok ~ ~ ~ ~ ~ ~ ~ tok ~ ~ [~ tok]").n(irand(4)).speed(.9).mask(drums)
    .gain(ref(() => beat() * .45)).orbit(1).room(.8).roomsize(8),
  s("hh*16").bank("AkaiMPC60").swingBy(1 / 5, 8).degradeBy(ref(() => .45 - tape.stir * .3)).hpf(6000).crush(10)
    .mask(drums).gain(ref(() => beat() * .28)).orbit(3),
  s("cabasa*16").n(irand(6)).swingBy(1 / 5, 8).hpf(4000).mask(drums).gain(.09).orbit(3),
  s("lighter").n(irand(33)).struct("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ x ~").slow(2).degradeBy(.3)
    .gain(.3).orbit(1).room(.8).roomsize(8),
  // the sub
  n("<0 [~ ~ 0 ~] 0 [0 ~ ~ ~]>".add(ref(chord))).scale("A1:minor").s("sine").decay(.8).sustain(.6).shape(.3)
    .mask(drums).gain(.32).orbit(3),

  // the voice: a word cut short and pitched into the key; held, it catches and stutters
  motif(8, ref(() => tape.chord + tape.drift)).scale("A1:minor").s("yeah").n(irand(31).segment(1).slow(2)).clip(.7)
    .degradeBy(ref(plays)).ply(ref(() => tape.hold > .3 ? 4 : 1)).sometimesBy(.15, (x) => x.speed(-1))
    .gain(.4).orbit(2).delay(.35).delaytime(.326).delayfeedback(.45).room(.8).roomsize(8),
  s("diphone").n(irand(38)).struct("~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~").slow(2).speed(.72).degradeBy(.4)
    .gain(.35).orbit(2).delay(.35).delaytime(.326).delayfeedback(.45).room(.8).roomsize(8),
)`,
  },
  ritual: {
    root: 40,
    steps: [0, 1, 3, 5, 7, 8, 10],
    cps: 0.25,
    wears: 360,
    voice: { s: 'tubularbells' },
    crackle: 0.015,
    deck: { wow: 1.3, hiss: 1, drive: 0.2, bright: 0.85 },
    evolve: { length: 16, range: [0, 7], rest: 0.45, mutate: 0.1, every: 8, chords: { 0: [1, 0, 3], 1: [0], 3: [1, 0] } },
    code: `// tape: ritual. to play in the dark.
// A drone tuned by ear, not by the keyboard (a fifth and a seventh from the harmonic series),
// two saws a hair apart beating against each other. Over it a sequence bubbling through an old
// filter, glass bowls, bells, a gong played backwards, a heartbeat, a voice slowed until it is
// no longer words. Pushed hard, it breaks.
setcps(.25)
${HEAD}

stack(
  // the drone
  note("[40,40.08,47.02,49.69]").slow(4).s("sawtooth").attack(4).release(6).vib(.12).vibmod(.06)
    .lpf(sine.slow(16).range(220, 760)).lpq(6).gain(ref(() => .09 + tape.hold * .08)).orbit(1).room(.9).roomsize(9),
  note("28").slow(4).s("sine").attack(4).release(6).gain(.22).orbit(1).room(.9).roomsize(9),
  // the sequence, after the first minute
  motif(16, ref(chord)).scale("E3:phrygian").s("triangle").decay(.12).sustain(0).lpf(perlin.slow(4).range(400, 2400))
    .degradeBy(ref(() => plays() * .6)).mask("<0!8 1!24>").pan(sine.slow(8)).gain(.16)
    .orbit(2).delay(.4).delaytime(.6).delayfeedback(.6).room(.5).roomsize(6),
  // glass, bells, the gong backwards
  n("<0 ~ 4 ~ ~ 2 ~ ~>".add(ref(chord))).scale("E4:phrygian").s("wineglass_slow").attack(.5).release(3)
    .gain(.36).orbit(1).room(.9).roomsize(9),
  n("<~ 0 ~ ~ [1 0] ~ ~ 4>".add(ref(chord))).scale("E3:phrygian").s("tubularbells").gain(.16).orbit(1).room(.9).roomsize(9),
  s("gong").n(irand(7)).struct("<~ ~ ~ x>").speed(-1).gain(.36).orbit(1).room(.9).roomsize(9),
  // the heartbeat, which comes and goes
  s("bassdrum2 ~ ~ ~ bassdrum2 ~ ~ ~").n(5).lpf(300).mask("<0!4 1!12 0!4 1!12>")
    .gain(ref(() => .3 + tape.stir * .2)).orbit(3),
  // the voice
  s("speech").n(irand(7)).struct("<~ x ~ ~ ~ ~ x ~>").speed(.6).sometimesBy(.4, (x) => x.speed(-.6))
    .gain(.18).orbit(1).room(.9).roomsize(9),

  // pushed hard, it breaks: noise, all at once
  s("industrial*4").n(irand(32)).degradeBy(ref(() => tape.stir > .72 ? .15 : 1))
    .distort(2).postgain(.3).gain(.5).orbit(3),
  // holding: bowed bars in a cluster, pulling tighter
  n("[0,1,3,4]".add(ref(() => tape.chord + 7))).scale("E3:phrygian").s("vibraphone_bowed").attack(.8).release(2)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .6))
    .orbit(1).room(.9).roomsize(9),
)`,
  },
  pressure: {
    root: 36,
    steps: [0, 1, 3, 5, 7, 8, 10],
    cps: 0.3,
    wears: 360,
    voice: { s: 'sawtooth', distort: 1.5, lpf: 1600, delayfeedback: 0.7 },
    crackle: 0.03,
    deck: { wow: 0.8, hiss: 0.8, drive: 0.7, bright: 0.7 },
    evolve: { length: 8, range: [0, 5], rest: 0.6, mutate: 0.08, every: 8, chords: { 0: [0, 1, 0, 3], 1: [0], 3: [0] } },
    code: `// tape: pressure. speaker stacks, too loud.
// A dancehall riddim slowed into dub: the kick in threes, the snare thrown into the echo, and a
// bass so big and so distorted it is the room. A stab on the offbeat, a siren now and then.
// Every sixteen bars the drums drop out and the bass holds the floor alone, then back in.
setcps(.3)
${HEAD}
const drums = "<1!12 0!2 1!2>"
const beat = () => (.6 + tape.stir * .4) * (.5 + tape.home * .5)

stack(
  // the riddim
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR808").n(3).distort(1.5).postgain(.5).mask(drums)
    .gain(ref(() => beat() * .3)).orbit(3),
  s("~ hh ~ hh ~ hh ~ hh").bank("RolandTR808").mask(drums).gain(ref(() => beat() * .12)).orbit(3),
  s("~ ~ [sd,cp] ~ ~ ~ [sd,cp] ~").bank("RolandTR808").distort(1).postgain(.6).mask(drums)
    .gain(ref(() => beat() * .22)).orbit(2).delay(.5).delaytime(.625).delayfeedback(.62),

  // the bass: a sub and a saw an octave up, both into the red
  n("<[0 ~ ~ 0 ~ ~ -2 ~] [0 ~ ~ 0 ~ 3 1 ~]>".add(ref(chord))).scale("C1:phrygian").s("sine")
    .decay(.9).sustain(.7).shape(.7).gain(0.15).orbit(3),
  n("<[0 ~ ~ 0 ~ ~ -2 ~] [0 ~ ~ 0 ~ 3 1 ~]>".add(ref(chord))).scale("C2:phrygian").s("sawtooth")
    .lpf(ref(() => 170 + tape.stir * 300)).decay(.9).sustain(.6).distort(3).postgain(.35).gain(0.11).orbit(3),

  // the stab on the offbeat, into the echo
  n("[0,3]".add(ref(() => tape.chord + 14))).scale("C2:phrygian").struct("~ ~ ~ ~ ~ x ~ ~").s("sawtooth")
    .decay(.15).sustain(0).lpf(1600).distort(1.5).postgain(.5).degradeBy(ref(() => .4 - tape.stir * .4))
    .gain(0.1).orbit(2).delay(.5).delaytime(.625).delayfeedback(.62),
  // the siren: once in a while on its own, and whenever it is held
  note(sine.range(72, 84).fast(4).segment(16)).s("square").lpf(3000).mask("<0!15 1>")
    .gain(0.05).orbit(2).delay(.5).delaytime(.625).delayfeedback(.62),
  note(sine.range(72, 84).fast(4).segment(16)).s("square").lpf(3000)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .1))
    .orbit(2).delay(.5).delaytime(.625).delayfeedback(.62),
)`,
  },
  bent: {
    root: 45,
    steps: [0, 1, 3, 6, 7, 9, 10],
    cps: 0.5,
    wears: 360,
    voice: { s: 'square', crush: 4, coarse: 6, lpf: 5000 },
    crackle: 0.05,
    deck: { wow: 1.6, hiss: 1.2, drive: 1, bright: 1 },
    evolve: { length: 16, range: [-7, 14], rest: 0.4, mutate: 0.5, every: 1, chords: { 0: [1, 3, 5, 6], 1: [0, 4], 3: [0, 6], 4: [1], 5: [0, 3], 6: [0, 1] } },
    code: `// tape: bent. bent circuits, Beijing.
// Circuit-bent toys and a Casio with its pitch pin shorted, a drum machine losing its clock, and
// harsh noise from the moving hand, the way it was played in small rooms in Beijing.
setcps(.5)
const beat = () => (.2 + tape.stir * .8) * (.5 + tape.home * .5)
const motif = (k, by = 0) => n(run(k).fmap((i) => tape.motif[i % tape.motif.length] ?? 0).add(by))
  .mask(run(k).fmap((i) => (tape.motif[i % tape.motif.length] === null ? 0 : 1)))
const plays = () => 1 - tape.density * (.35 + tape.stir * .65)

stack(
  // a Casio with its pitch pin shorted: where the pointer is bends it
  motif(16, ref(() => tape.chord)).scale("A3:chromatic").s("square").decay(.08).sustain(0)
    .degradeBy(ref(plays)).coarse(ref(() => 1 + Math.round(tape.x * 12))).sometimesBy(.3, (x) => x.hurry(2)).gain(.12).orbit(2),
  s("casio*8").n(irand(3)).speed(ref(() => .4 + tape.x * 2.6)).crush(ref(() => 3 + tape.register))
    .degradeBy(ref(() => .75 - tape.stir * .65)).gain(.35).orbit(2),
  s("toys").n(irand(13)).struct("x ~ x x ~ ~ x ~").speed(rand.range(.5, 3)).coarse(4).gain(.22)
    .orbit(2).delay(.25).delaytime(.125).delayfeedback(.6),
  // a drum machine losing its clock
  s("bd sd [~ bd] sd").bank("CasioSK1").degradeBy(.3).speed(perlin.range(.8, 1.4)).sometimesBy(.25, (x) => x.ply(3)).rarely((x) => x.rev())
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
  const code = (TAPES[palette] ?? TAPES.haze).code.replace(/\.orbit\(([123])\)/g, '.velocity(ref(() => tape.mix$1)).orbit($1)');
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
  readonly ear: Ear = { stir: 0, hold: 0, x: 0.5, register: 3, night: 0.5, home: 1, decay: 0, mix1: 1, mix2: 0.8, mix3: 0.4, motif: [0], chord: 0, density: 0.6, drift: 0 };
  private composer: Composer | null = null;
  private deck: Deck;
  private tape: Tape = TAPES.haze;
  private palette = 'haze';
  private loadedAt = 0;
  code = '';
  private home = true;
  private wear = 0;
  private lastSet = 0;
  private suspending = 0;
  private lastUpdate = 0;

  private constructor(private ctx: AudioContext) {
    this.deck = new Deck(ctx);
    (window as unknown as { tape: Ear }).tape = this.ear;
  }

  static async create(ctx: AudioContext, palette: string) {
    setAudioContext(ctx);
    await initStrudel();
    await initAudio();
    // The sample banks the tapes play (only their indexes load here; each sound loads when first
    // played). They come from the projects' own GitHub repositories, as on strudel.cc. Some VCSL
    // folders have a comma in their name, which GitHub sends in an unquoted Content-Disposition
    // that Chrome refuses: the tapes avoid those instruments (snare_*, kalimba, steinway).
    const dough = 'https://raw.githubusercontent.com/felixroos/dough-samples/main';
    await Promise.all([
      samples('https://raw.githubusercontent.com/tidalcycles/dirt-samples/master/strudel.json'),
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
    this.palette = TAPES[palette] ? palette : 'haze';
    this.tape = TAPES[this.palette];
    this.loadedAt = performance.now();
    this.ear.decay = 0;
    const seed = Math.floor(Math.random() * 1000);
    this.composer = new Composer(this.tape.evolve, seed + 1, this.ear);
    this.code = codeFor(this.palette, seed);
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
    const cycle = ((performance.now() - this.loadedAt) / 1000) * this.tape.cps;
    this.composer?.tick(cycle, e.stir);

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
    // Playing wears the tape, and touching it wears it faster; it never quite wears through.
    const dt = Math.min(0.2, (now - (this.lastUpdate || now)) / 1000);
    this.lastUpdate = now;
    e.decay = Math.min(0.97, e.decay + (dt / this.tape.wears) * (1 + e.stir * 3));
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
      const degree = this.ear.register + this.ear.chord + i * 2;
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
