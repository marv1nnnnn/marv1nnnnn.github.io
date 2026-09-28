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
  // What the composer (below) has arrived at: the motif (scale degrees, null a rest), the chord
  // (a degree the harmony moves by), how busy the melody is, and a slow drift of register.
  motif: (number | null)[];
  chord: number;
  density: number;
  drift: number;
  // Which of the artists on the label leads now (-1 while the sound is off), how far through
  // their section the tape is (0..1), and each one's weight, crossfading between sections.
  lead: number;
  phase: number;
  focus: number[];
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
  leads: number; // how many of the artists on the label take turns
  section: number; // cycles each one leads for
  voice: Record<string, number | string>; // the instrument a released hold scatters
  crackle: number; // surface noise this tape carries even when new
  deck: DeckProfile;
  evolve: Evolve;
  code: string; // the Strudel pattern
}

// One tape per palette, each after the artists written on its label. The tape plays them one
// at a time, a section each (`section` cycles, then the next leads; `tape.focus` crossfades and
// the label marks who leads), over a ground they share. Each section is built from what that
// music is made of (its tempo, groove, instruments and habits), not a general mood. Samples:
// tidal-drum-machines, Dirt-Samples, VCSL, the Salamander piano. The pointer still plays along:
// moving brings more in, holding builds, releasing lets go. Orbits keep reverb and echo settings
// apart (Strudel rebuilds an orbit's reverb whenever its size changes) and carry the
// arrangement: 1 the ground (pads, drones, holds), 2 the melody, 3 the rhythm. Unpitched
// samples play at their own pitch at note 36, so a note there transposes from it.
const HEAD = `const motif = (k, by = 0) => n(run(k).fmap((i) => tape.motif[i % tape.motif.length] ?? 0).add(by))
  .mask(run(k).fmap((i) => (tape.motif[i % tape.motif.length] === null ? 0 : 1)))
const plays = () => .9 - tape.density * (.55 + tape.stir * .45)
const on = (k) => tape.focus[k] ?? 0
const chord = () => tape.chord`;

const TAPES: Record<string, Tape> = {
  haze: {
    root: 50,
    steps: [0, 2, 4, 5, 7, 9, 10],
    cps: 0.2,
    leads: 3,
    section: 16,
    voice: { s: 'glockenspiel' },
    crackle: 0.02,
    deck: { wow: 2.6, hiss: 1.8, drive: 0.05, bright: 0.75 },
    evolve: { length: 8, range: [0, 8], rest: 0.4, mutate: 0.08, every: 4, chords: { 0: [3, 5, 4], 3: [0, 4], 5: [3, 0], 4: [0, 5] } },
    code: `// tape: haze. a loop that wears away the longer it plays.
// after William Basinski, Boards of Canada, Oneohtrix Point Never
setcps(.2)
${HEAD}

stack(
  // Basinski: a few seconds of a brass loop, round and round and never changed, only worn:
  // the top goes first, then whole passes drop out. It runs under the others too.
  note("<[d3,a3,f#4] [b2,f#3,d4]>").s("sax_vib").attack(1.2).release(2.5)
    .lpf(ref(() => 1900 - tape.decay * 1300)).degradeBy(ref(() => tape.decay * .45))
    .gain(ref(() => .22 + on(0) * .3)).orbit(1).room(.85).roomsize(9),
  note("<[~ f#4 e4 ~] [d4 ~ ~ ~]>").s("sax_vib").attack(.4).release(2).lpf(ref(() => 1700 - tape.decay * 1100))
    .degradeBy(ref(() => tape.decay * .5)).gain(ref(() => on(0) * .3)).orbit(1).room(.85).roomsize(9),
  s("padlong").loopAt(8).lpf(1100).gain(.2).orbit(1).room(.85).roomsize(9),

  // Boards of Canada: a dusty half-time beat off an old sampler, a chord that cannot hold its
  // pitch, a simple tune (the composer's), and a voice counting in another room
  s("bd ~ sd ~ ~ bd sd ~ bd [~ bd] sd ~ ~ ~ sd ~").bank("AkaiMPC60").lpf(2400).crush(10)
    .gain(ref(() => on(1) * (.5 + tape.stir * .2) * (.5 + tape.home * .5))).orbit(3),
  s("[~ hh]*8").bank("AkaiMPC60").hpf(5000).lpf(9000).gain(ref(() => on(1) * .14)).orbit(3),
  n("[0,2,4,6]".add(ref(chord))).scale("D3:major").s("supersaw").detune(.4).lpf(1200)
    .attack(1).release(2).vib(.35).vibmod(.3).gain(ref(() => on(1) * .1)).orbit(1).room(.85).roomsize(9),
  motif(8, ref(() => tape.chord + tape.drift)).scale("D4:major pentatonic").s("sawtooth").lpf(1800)
    .attack(.04).decay(.5).sustain(.3).release(.8).vib(5).vibmod(.12).degradeBy(ref(plays))
    .gain(ref(() => on(1) * .15)).orbit(2).delay(.35).delaytime(.625).delayfeedback(.4).room(.4).roomsize(4),
  s("numbers").n(irand(9)).struct("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~").slow(2).degradeBy(.35).speed(.92).hpf(500).lpf(3200)
    .gain(ref(() => on(1) * .3)).orbit(2).delay(.35).delaytime(.625).delayfeedback(.4).room(.4).roomsize(4),

  // Oneohtrix Point Never: an eccojam, one chord of the loop slowed down and caught repeating,
  // and glassy FM arpeggios off a workstation preset
  note("[f#4,a4,d5]*4").s("piano").speed(.8).clip(.35).lpf(2600).sometimesBy(.3, (x) => x.ply(2))
    .gain(ref(() => on(2) * .3)).orbit(2).delay(.35).delaytime(.625).delayfeedback(.4).room(.4).roomsize(4),
  n("0 2 4 7 9 7 4 2 0 2 4 7 9 11 9 7".add(ref(() => tape.chord + tape.drift))).scale("D4:major pentatonic").s("sine")
    .fm(ref(() => 1.5 + tape.stir * 3)).fmh(3.01).decay(.25).sustain(0).degradeBy(ref(() => .15 + plays() * .4))
    .pan(sine.slow(4)).gain(ref(() => on(2) * .2)).orbit(2).delay(.35).delaytime(.625).delayfeedback(.4).room(.4).roomsize(4),

  // moving: the hand on the reel scrubs through the pad
  s("padlong*8").begin(ref(() => tape.x * .9)).end(ref(() => tape.x * .9 + .03))
    .gain(ref(() => tape.stir * .6)).pan(ref(() => tape.x))
    .orbit(2).delay(.35).delaytime(.625).delayfeedback(.4).room(.4).roomsize(4),
  // holding: the moment freezes, grains of it piling up
  s("padlong*32").begin(ref(() => tape.x * .9)).end(ref(() => tape.x * .9 + .012))
    .degradeBy(ref(() => tape.hold > .02 ? .15 : 1)).pan(rand)
    .gain(ref(() => tape.hold * .55))
    .orbit(1).room(.85).roomsize(9),
)`,
  },
  '3am': {
    root: 53,
    steps: [0, 2, 3, 5, 7, 9, 10],
    cps: 0.3,
    leads: 3,
    section: 20,
    voice: { s: 'vibraphone_soft' },
    crackle: 0.012,
    deck: { wow: 1, hiss: 0.9, drive: 0.1, bright: 0.8 },
    evolve: { length: 8, range: [0, 9], rest: 0.35, mutate: 0.12, every: 2, chords: { 0: [3, 6, 2], 3: [0, 4, 6], 6: [0, 2], 2: [3, 4], 4: [0] } },
    code: `// tape: 3am. a diner, the red room.
// after HTRK, Angelo Badalamenti, Fishmans
setcps(.3)
${HEAD}
const mode = "F3:dorian"
const beat = () => (.6 + tape.stir * .4) * (.5 + tape.home * .5)

stack(
  // under all three: an electric piano, slow minor ninths
  n("[0,2,4,8]".add(ref(chord))).scale(mode).s("fmpiano").someCyclesBy(.3, (x) => x.struct("x ~ ~ [~ x]"))
    .attack(.02).release(2.5).gain(.24).orbit(1).room(.6).roomsize(6),

  // HTRK: a drum machine left almost empty, a long dub bass, breath close to the microphone,
  // and one guitar chord left ringing
  s("bd ~ ~ bd ~ ~ ~ ~, ~ ~ ~ ~ cp ~ ~ ~").bank("LinnDrum").lpf(3000).gain(ref(() => on(0) * beat() * .5)).orbit(3),
  n("<0 ~ -2 [~ -3]>".add(ref(chord))).scale("F2:minor").s("sine").decay(1.4).sustain(.5).shape(.35).lpf(400)
    .gain(ref(() => on(0) * .5)).orbit(3),
  s("breath").struct("<~ x ~ ~>").speed(.85).hpf(300).gain(ref(() => on(0) * .35)).orbit(1).room(.6).roomsize(6),
  note("[29,36,44,51]").s("gtr").n(0).struct("<x ~ ~ ~>").slow(2).release(3).lpf(2600)
    .gain(ref(() => on(0) * .22)).orbit(1).room(.6).roomsize(6),

  // Badalamenti: slow dark jazz: a walking bass, brushes swung in triplets, claps on two and
  // four, and far behind, the long synth chord of the Twin Peaks theme
  n("<[0 2 4 5] [7 5 4 2] [0 -1 -3 -2] [0 2 4 6]>".add(ref(chord))).scale("F2:dorian").s("triangle")
    .decay(.35).sustain(.3).lpf(700).shape(.2).gain(ref(() => on(1) * .45)).orbit(3),
  s("framedrum*8").n(irand(18)).swingBy(1 / 3, 4).hpf(2400).decay(.12).gain(ref(() => on(1) * beat() * .3)).orbit(3),
  s("~ clap ~ clap").n(irand(10)).hpf(1500).decay(.12).gain(ref(() => on(1) * .2)).orbit(1).room(.6).roomsize(6),
  n("[0,2,4]".add(ref(chord))).scale("F4:dorian").s("supersaw").detune(.2).lpf(1400).attack(2.5).release(3)
    .gain(ref(() => on(1) * .08)).orbit(1).room(.6).roomsize(6),
  // the vibraphone plays the composer's tune in all three, and leads here
  motif(8, ref(() => tape.chord + tape.drift + tape.register - 3)).scale("F4:dorian").s("vibraphone_soft")
    .degradeBy(ref(plays)).sometimesBy(.2, (x) => x.off(1 / 16, (y) => y.add(n(2)))).pan(ref(() => tape.x))
    .gain(ref(() => .14 + on(1) * .26)).orbit(2).delay(.5).delaytime(.625).delayfeedback(.5).room(.5).roomsize(5),

  // Fishmans: a one-drop, the organ skank on the offbeat thrown into the dub echo, a bass line
  // that bounces, and a melodica singing the tune an octave up
  s("~ ~ bd ~, ~ ~ rs ~, [hh hh:1]*4").gain(ref(() => on(2) * beat() * .3)).orbit(3),
  n("[2,4,6]".add(ref(chord))).struct("~ x ~ x").scale("F3:dorian").s("organ_4inch").clip(.2)
    .gain(ref(() => on(2) * .25)).orbit(2).delay(.5).delaytime(.625).delayfeedback(.5).room(.5).roomsize(5),
  n("<[0 ~ ~ 0 ~ 2 4 ~] [0 ~ ~ 0 ~ -1 -3 ~]>".add(ref(chord))).scale("F2:dorian").s("triangle")
    .lpf(450).decay(.3).sustain(.5).shape(.3).gain(ref(() => on(2) * .45)).orbit(3),
  motif(8, ref(() => tape.chord + tape.drift)).scale("F4:dorian").s("harmonica_soft").attack(.05).release(.4)
    .degradeBy(ref(plays)).gain(ref(() => on(2) * .26)).orbit(2).delay(.5).delaytime(.625).delayfeedback(.5).room(.5).roomsize(5),

  // holding: the organ leans in
  n("[0,2,4,7]".add(ref(chord))).scale(mode).s("pipeorgan_quiet").attack(.4).release(1.5)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .5))
    .orbit(1).room(.6).roomsize(6),
)`,
  },
  nightbus: {
    root: 57,
    steps: [0, 2, 3, 5, 7, 8, 10],
    cps: 0.5625,
    leads: 2,
    section: 32,
    voice: { s: 'square', crush: 6, lpf: 3200 },
    crackle: 0.045,
    deck: { wow: 0.25, hiss: 0.35, drive: 0.15, bright: 1 },
    evolve: { length: 16, range: [-2, 9], rest: 0.5, mutate: 0.25, every: 4, chords: { 0: [5, 3, 6], 5: [3, 6], 3: [0, 6], 6: [0, 5] } },
    code: `// tape: night bus. broken machines, rain on the window.
// after Autechre, Burial
setcps(.5625)
${HEAD}
const beat = () => (.55 + tape.stir * .45) * (.5 + tape.home * .5)

stack(
  // under both: the sub, and a minor pad
  n("<0 [~ 0] 0 [0 ~]>".add(ref(chord))).scale("A1:minor").s("sine").decay(.6).sustain(.3).shape(.3).gain(.32).orbit(3),
  n("[0,2,4,8]".add(ref(chord))).scale("A3:minor").s("supersaw").detune(.15).lpf(1200)
    .attack(.6).release(2).gain(ref(() => .05 + on(1) * .04)).orbit(1).room(.75).roomsize(7),

  // Autechre: the grid comes apart: a kick whose euclidean pattern turns every bar, hats that
  // stutter, metallic FM at an inharmonic ratio playing the composer's line, clicks
  s("bd").bank("RolandTR909").euclidRot("<5 7 3 9 5 11>", 16, "<0 3 6 1>").crush(9).lpf(4000)
    .gain(ref(() => on(0) * beat() * .6)).orbit(3),
  s("hh*16").bank("RolandTR909").sometimesBy(.25, (x) => x.ply(3)).degradeBy(.4).speed(rand.range(.8, 1.6)).hpf(5000)
    .pan(rand).gain(ref(() => on(0) * beat() * .22)).orbit(3),
  motif(16, ref(() => tape.chord + tape.drift)).scale("A3:minor").s("sine").fm(ref(() => 3 + tape.stir * 9)).fmh(1.414)
    .decay(.09).sustain(0).degradeBy(ref(plays)).sometimesBy(.2, (x) => x.jux(rev))
    .gain(ref(() => on(0) * .2)).orbit(2).delay(.3).delaytime(.1875).delayfeedback(.4),
  s("click*16").n(irand(4)).degradeBy(.55).speed(rand.range(.5, 2)).pan(rand)
    .gain(ref(() => on(0) * .22)).orbit(2).delay(.3).delaytime(.1875).delayfeedback(.4),

  // Burial: rain and a record's crackle, a 2-step whose hats shuffle behind the beat, a lighter
  // struck now and then, and a voice pitched into the key, cut up, far away
  s("pink").hpf(2500).lpf(7000).attack(.3).release(.3).gain(ref(() => on(1) * .05)).orbit(1).room(.75).roomsize(7),
  s("bd ~ ~ ~ ~ ~ ~ ~ ~ ~ bd ~ ~ ~ ~ ~").bank("AkaiMPC60").lpf(3500).gain(ref(() => on(1) * beat() * .9)).orbit(3),
  s("~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~ sd ~ ~ [~ sd]").bank("AkaiMPC60").n(1).gain(ref(() => on(1) * beat() * .55)).orbit(3),
  s("hh*16").bank("AkaiMPC60").swingBy(1 / 5, 8).degradeBy(.3).hpf(6000).gain(ref(() => on(1) * beat() * .3)).orbit(3),
  s("cabasa*16").n(irand(6)).swingBy(1 / 5, 8).hpf(4000).gain(ref(() => on(1) * .1)).orbit(3),
  s("lighter").n(irand(33)).struct("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ x ~").degradeBy(.4)
    .gain(ref(() => on(1) * .35)).orbit(1).room(.75).roomsize(7),
  motif(8, ref(() => tape.chord + tape.drift)).scale("A1:minor").s("diphone").n(irand(38).segment(1).slow(2))
    .clip(1).sometimesBy(.2, (x) => x.speed(-1)).degradeBy(ref(plays)).ply(ref(() => tape.hold > .3 ? 4 : 1))
    .gain(ref(() => on(1) * .5)).orbit(1).room(.75).roomsize(7),

  // moving, in both: the bleeps, whose rhythm follows where the pointer is
  s("bleep").n(irand(13)).euclidRot(ref(() => 3 + Math.round(tape.x * 8)), 16, ref(() => tape.register))
    .speed(rand.range(.5, 2)).crush(7).pan(rand).sometimesBy(.25, (x) => x.hurry(2))
    .gain(ref(() => tape.stir * .3)).orbit(2).delay(.3).delaytime(.1875).delayfeedback(.4),
)`,
  },
  ritual: {
    root: 40,
    steps: [0, 1, 3, 5, 7, 8, 10],
    cps: 0.28,
    leads: 2,
    section: 20,
    voice: { s: 'tubularbells' },
    crackle: 0.015,
    deck: { wow: 1.3, hiss: 1, drive: 0.2, bright: 0.85 },
    evolve: { length: 8, range: [0, 7], rest: 0.55, mutate: 0.15, every: 4, chords: { 0: [1, 0, 3], 1: [0], 3: [1, 0] } },
    code: `// tape: ritual. musick to play in the dark.
// after Coil, Xiu Xiu
setcps(.28)
${HEAD}
const beat = () => (.55 + tape.stir * .45) * (.5 + tape.home * .5)

stack(
  // under both: an organ pedal, and a didgeridoo breathing under it
  n("0".add(ref(chord))).scale("E1:phrygian").s("pipeorgan_quiet_pedal").attack(2).release(4).gain(.32).orbit(1).room(.9).roomsize(9),
  s("didgeridoo").n("<0 3 5 3>").slow(2).lpf(800).gain(.22).orbit(1).room(.9).roomsize(9),

  // Coil: a Time Machines drone, two saws a hair apart and the filter breathing; glass bowls
  // bowed; a gong played backwards, swelling into nothing; a bowed psaltery singing the tune
  note("[40,40.12,47]").slow(4).s("sawtooth").attack(3).release(4).lpf(sine.slow(8).range(250, 900)).lpq(4)
    .gain(ref(() => on(0) * .2)).orbit(1).room(.9).roomsize(9),
  n("<0 ~ 4 ~ ~ 2 ~ ~>".add(ref(chord))).scale("E4:phrygian").s("wineglass_slow").attack(.5).release(3)
    .gain(ref(() => on(0) * .45)).orbit(1).room(.9).roomsize(9),
  s("gong").n(irand(7)).struct("<~ ~ ~ x>").speed(-1).gain(ref(() => on(0) * .45)).orbit(1).room(.9).roomsize(9),
  motif(8, ref(() => tape.chord + tape.drift)).slow(2).scale("E4:phrygian").s("triangle").vib(4).vibmod(.2).lpf(2200).attack(.3).release(1.5)
    .degradeBy(ref(plays)).gain(ref(() => on(0) * .3)).orbit(2).room(.6).roomsize(7),
  n("<0 ~ 4 ~ [1 0] ~ ~ ~>".add(ref(chord))).scale("E3:phrygian").s("tubularbells")
    .someCyclesBy(.25, (x) => x.rev()).gain(ref(() => .1 + on(0) * .12)).orbit(2).room(.6).roomsize(7),

  // Xiu Xiu: gamelan-like bars in two interlocking parts, a harmonium wheezing, a cheap drum
  // machine too loud and too stiff, and outbursts: noise that breaks in on its own
  n("0 2 [4 2] 0 ~ 5 4 ~".add(ref(chord))).scale("E4:phrygian").s("balafon").gain(ref(() => on(1) * .3)).orbit(2).room(.6).roomsize(7),
  motif(8, ref(() => tape.chord + tape.drift + 4)).scale("E4:phrygian").s("handchimes").degradeBy(ref(plays))
    .pan(ref(() => tape.x)).gain(ref(() => on(1) * .2)).orbit(2).room(.6).roomsize(7),
  n("[0,2,4]".add(ref(chord))).scale("E3:phrygian").s("organ_4inch").struct("x ~ ~ x ~ ~ x ~").attack(.3).release(1)
    .gain(ref(() => on(1) * .2)).orbit(1).room(.9).roomsize(9),
  s("bd ~ sd ~ bd bd sd ~").bank("KorgMinipops").sometimesBy(.15, (x) => x.ply(2)).someCyclesBy(.2, (x) => x.fast(2))
    .gain(ref(() => on(1) * beat() * .6)).orbit(3),
  s("industrial*8").n(irand(32)).mask("<0!11 1 0!6 [1 0]>").distort(2.5).postgain(.25)
    .gain(ref(() => on(1) * .5)).orbit(3),

  // pushed hard, in both, it breaks: noise, all at once
  s("industrial*4").n(irand(32)).degradeBy(ref(() => tape.stir > .72 ? .15 : 1))
    .distort(2).postgain(.3).gain(.6).orbit(3),
  // holding: bowed bars in a cluster, pulling tighter
  n("[0,1,3,4]".add(ref(() => tape.chord + 7))).scale("E3:phrygian").s("vibraphone_bowed").attack(.8).release(2)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .6))
    .orbit(1).room(.9).roomsize(9),
)`,
  },
  pressure: {
    root: 36,
    steps: [0, 1, 3, 5, 7, 8, 10],
    cps: 0.35,
    leads: 3,
    section: 24,
    voice: { s: 'sawtooth', distort: 1.5, lpf: 1600, delayfeedback: 0.7 },
    crackle: 0.03,
    deck: { wow: 0.8, hiss: 0.8, drive: 0.7, bright: 0.7 },
    evolve: { length: 8, range: [0, 5], rest: 0.6, mutate: 0.1, every: 8, chords: { 0: [0, 1, 0, 3], 1: [0], 3: [0] } },
    code: `// tape: pressure. weight, repetition.
// after The Bug, Swans, Source Direct
setcps(.35)
${HEAD}
const beat = () => (.6 + tape.stir * .4) * (.5 + tape.home * .5)

stack(
  // under all three: the sub, saturated
  n("<0 0 [0 ~ ~ 1] 0>".add(ref(chord))).scale("C1:phrygian").s("sine").decay(.8).sustain(.4).shape(.5).gain(.2).orbit(3),

  // The Bug: a dancehall riddim on an 808 into the red, a bass that distorts the room, a dub
  // stab thrown into the delay
  s("bd ~ ~ bd ~ ~ bd ~, ~ ~ ~ sd ~ ~ sd ~").bank("RolandTR808").n(3).distort(1.2).postgain(.5)
    .gain(ref(() => on(0) * beat() * .55)).orbit(3),
  s("hh*8").bank("RolandTR808").ply(ref(() => tape.stir > .6 ? 2 : 1)).gain(ref(() => on(0) * beat() * .25)).orbit(3),
  n("<0 [0 ~ ~ 0] 0 [~ 0 1 ~]>".add(ref(chord))).scale("C2:phrygian").s("sawtooth").lpf(ref(() => 220 + tape.stir * 400))
    .decay(.6).sustain(.5).distort(2).postgain(.4).gain(ref(() => on(0) * .2)).orbit(3),
  motif(8, ref(() => tape.chord + 14)).slow(2).scale("C2:phrygian").s("sawtooth").decay(.15).sustain(0).lpf(1500)
    .degradeBy(ref(plays)).gain(ref(() => on(0) * .2)).orbit(2).delay(.6).delaytime(.4286).delayfeedback(.65),

  // Swans: one chord, struck again and again for as long as it takes, louder and brighter all
  // through the section, a drum pounding with it, bells ringing over it
  note("[24,31,36]*4").s("gtr").n(2).clip(1).lpf(ref(() => 500 + tape.phase * 4000 + tape.stir * 1500))
    .gain(ref(() => on(1) * (.05 + tape.phase * .2))).orbit(1).room(.4).roomsize(4),
  s("dist*4").n("<0 0 4 4>").speed(.5).lpf(ref(() => 700 + tape.stir * 3200))
    .gain(ref(() => on(1) * (.04 + tape.phase * .12))).orbit(1).room(.4).roomsize(4),
  s("timpani*4").n(12).gain(ref(() => on(1) * (.1 + tape.phase * .25))).orbit(3),
  n("<0 [~ 4] 3 [~ 1]>").scale("C4:phrygian").s("tubularbells").gain(ref(() => on(1) * .2)).orbit(1).room(.4).roomsize(4),

  // Source Direct: the amen cut up at twice the tempo, cold and tight, a chord a long way off,
  // a stab now and then
  s("amencutup*16").n(run(16).add("<0 16>")).sometimesBy(.3, (x) => x.n(irand(32))).someCyclesBy(.15, (x) => x.hurry(2))
    .clip(1).hpf(120).lpf(ref(() => 5000 + tape.stir * 6000)).gain(ref(() => on(2) * beat() * .45)).orbit(3),
  n("[0,2,4]".add(ref(chord))).scale("C3:phrygian").s("supersaw").detune(.2).lpf(900).attack(1).release(3)
    .gain(ref(() => on(2) * .08)).orbit(1).room(.4).roomsize(4),
  s("stab").n(irand(23)).struct("~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ ~ ~").degradeBy(.5).lpf(2500)
    .gain(ref(() => on(2) * .25)).orbit(2).delay(.6).delaytime(.4286).delayfeedback(.65),

  // holding, in all three: the siren
  note(sine.range(72, 84).fast(4).segment(16)).s("square").lpf(3000)
    .degradeBy(ref(() => tape.hold > .02 ? 0 : 1)).gain(ref(() => tape.hold * .16))
    .orbit(2).delay(.6).delaytime(.4286).delayfeedback(.65),
)`,
  },
  bent: {
    root: 45,
    steps: [0, 1, 3, 6, 7, 9, 10],
    cps: 0.5,
    leads: 1,
    section: 64,
    voice: { s: 'square', crush: 4, coarse: 6, lpf: 5000 },
    crackle: 0.05,
    deck: { wow: 1.6, hiss: 1.2, drive: 1, bright: 1 },
    evolve: { length: 16, range: [-7, 14], rest: 0.4, mutate: 0.5, every: 1, chords: { 0: [1, 3, 5, 6], 1: [0, 4], 3: [0, 6], 4: [1], 5: [0, 3], 6: [0, 1] } },
    code: `// tape: bent. bent circuits, Beijing.
// after fRUITYSPACE and the shows there, 2016-2021
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
  readonly ear: Ear = { stir: 0, hold: 0, x: 0.5, register: 3, night: 0.5, home: 1, decay: 0, mix1: 1, mix2: 0.8, mix3: 0.4, motif: [0], chord: 0, density: 0.6, drift: 0, lead: -1, phase: 0, focus: [1] };
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
  private firstLead = 0;
  private playing = true;

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
    // Start with any one of the artists; the focus jumps there, as a new tape starts mid-side.
    this.firstLead = Math.floor(Math.random() * this.tape.leads);
    this.ear.focus = Array.from({ length: this.tape.leads }, (_, k) => (k === this.firstLead ? 1 : 0));
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
    const { leads, section } = this.tape;
    const lead = (Math.floor(cycle / section) + this.firstLead) % leads;
    e.lead = this.playing ? lead : -1;
    e.phase = (cycle / section) % 1;
    // A few seconds of crossfade as one hands over to the next.
    e.focus = e.focus.map((w, k) => w + ((k === lead ? 1 : 0) - w) * 0.012);
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
    this.playing = false;
    this.ear.lead = -1;
    this.deck.fade(0, 0.3);
    clearTimeout(this.suspending);
    this.suspending = window.setTimeout(() => this.ctx.suspend(), 320);
  }

  async resume(palette = this.palette) {
    clearTimeout(this.suspending);
    this.playing = true;
    await this.ctx.resume();
    this.deck.fade(0.8, 0.6);
    // The visitor may have changed tapes while the sound was off.
    await this.newTape(palette);
  }
}
