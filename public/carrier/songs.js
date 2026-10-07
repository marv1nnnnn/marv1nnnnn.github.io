// The songs. None of them is a real song: each is written here from a seed, in the manner of what
// played on the carrier of its time (a karaoke-tape ballad on the royal-road chords, a ringtone,
// a city-pop shuffle), and laid out as a list of timed notes, so a tape can be wound to any point
// in one and played from there.

export const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

const pick = (r, list) => list[Math.floor(r() * list.length)];
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10] };
const semis = (scale, d) => {
  const n = scale.length;
  const o = Math.floor(d / n);
  return scale[((d % n) + n) % n] + 12 * o;
};

// Chord roots as scale degrees (0 = I). The royal road (IV V iii vi) is the one every ballad of
// the time leant on; the canon came close behind.
const PROGRESSIONS = {
  major: [[3, 4, 2, 5], [0, 4, 5, 2, 3, 0, 3, 4], [0, 5, 3, 4], [5, 3, 0, 4], [1, 4, 0, 0], [3, 4, 0, 5]],
  minor: [[0, 5, 2, 6], [0, 3, 6, 2], [5, 6, 0, 0], [0, 6, 5, 4]],
  dorian: [[0, 3], [0, 0, 3, 6], [1, 0]],
};

// Sixteen steps a bar. K kick, S snare, H hat, O open hat, P shaker.
const GROOVES = {
  ballad: { K: 'x.......x.x.....', S: '....x.......x...', H: 'x.x.x.x.x.x.x.x.' },
  pop: { K: 'x.....x.x.......', S: '....x.......x...', H: 'xxxxxxxxxxxxxxxx' },
  rnb: { K: 'x..x......x..x..', S: '....x.......x...', H: 'x.x.x.x.x.x.x.xx' },
  disco: { K: 'x...x...x...x...', S: '....x.......x...', H: 'x.x.x.x.x.x.x.x.', O: '..x...x...x...x.' },
  shuffle: { K: 'x.....x...x.....', S: '....x.......x...', P: 'x.xxx.xxx.xxx.xx' },
  chip: { K: 'x...x...x...x...', S: '........x.......' },
  none: {},
};
const BASSLINES = {
  ballad: 'R.......F.......',
  pop: 'R.R...R.R.R...R.',
  rnb: 'R..R....R.....A.',
  disco: 'R.r.R.r.R.r.R.r.',
  shuffle: 'R.....R.F...R...',
  chip: 'R...R...R...R...',
};

export const STYLES = {
  ballad: { bpm: [72, 84], scale: 'major', groove: 'ballad', bass: 'ballad', keys: 'arp', lead: 'flute', pad: true, swing: 0 },
  pop: { bpm: [96, 116], scale: 'major', groove: 'pop', bass: 'pop', keys: 'stab', lead: 'square', pad: false, swing: 0 },
  rnb: { bpm: [84, 94], scale: 'dorian', groove: 'rnb', bass: 'rnb', keys: 'hold', lead: 'bell', pad: true, swing: 0.22 },
  city: { bpm: [104, 114], scale: 'major', groove: 'disco', bass: 'disco', keys: 'stab', lead: 'saw', pad: true, swing: 0 },
  ringtone: { bpm: [116, 132], scale: 'major', groove: 'chip', bass: 'chip', keys: 'chip', lead: 'square', pad: false, swing: 0 },
  lonely: { bpm: [66, 76], scale: 'minor', groove: 'shuffle', bass: 'shuffle', keys: 'hold', lead: 'flute', pad: true, swing: 0.15 },
};

// One phrase of melody over two bars: steps, lengths and degrees above the chord's root.
function phrase(r, density) {
  const notes = [];
  const cells = [[[0, 4]], [[0, 2], [2, 2]], [[0, 3], [3, 1]], [[2, 2]], [], [[0, 1], [1, 1], [2, 2]], [[0, 6]]];
  let step = 0;
  let rel = pick(r, [0, 2, 4]);
  while (step < 28) {
    let cell = r() < density ? pick(r, cells.slice(0, 6)) : r() < 0.5 ? [] : cells[6];
    if (step % 8 === 0 && !cell.length && r() < 0.6) cell = [[0, 4]];
    for (const [s, d] of cell) {
      const at = step + s;
      if (at >= 28) break;
      const moves = [-1, -1, -1, 1, 1, 1, -2, 2, 0, 3, -3, 4];
      rel += pick(r, moves);
      if (at % 8 === 0) rel = [0, 2, 4, 7].reduce((a, b) => (Math.abs(b - rel) < Math.abs(a - rel) ? b : a));
      rel = Math.max(-3, Math.min(9, rel));
      notes.push({ s: at, d, rel });
    }
    step += 4;
  }
  // and come to rest
  notes.push({ s: 28, d: 4, rel: pick(r, [0, 2, 4]) });
  return notes;
}

const vary = (r, notes) =>
  notes.map((n, i) => (i >= notes.length - 3 && r() < 0.6 ? { ...n, rel: n.rel + pick(r, [-2, -1, 1, 2]) } : { ...n }));

// Song parameters: a style, a key, a seed. `near` pulls parameters toward a point in the app's
// taste space (energy, mood), which is how the app's songs come out alike.
export function makeParams(seed, style, extra = {}) {
  const r = rng(seed);
  const st = STYLES[style];
  const scale = extra.scale ?? st.scale;
  return {
    ...st,
    seed,
    style,
    bpm: extra.bpm ?? Math.round(st.bpm[0] + r() * (st.bpm[1] - st.bpm[0])),
    root: extra.root ?? 50 + Math.floor(r() * 10),
    scale,
    prog: extra.prog ?? pick(r, PROGRESSIONS[scale]),
    density: extra.density ?? 0.45 + r() * 0.4,
    bars: extra.bars ?? 28,
    bright: extra.bright ?? 0.3 + r() * 0.5,
    ...(extra.lead ? { lead: extra.lead } : {}),
    ...(extra.groove ? { groove: extra.groove } : {}),
  };
}

// The notes of a song, with their times in seconds from its start.
export function compose(p) {
  const r = rng(p.seed * 7 + 3);
  const scale = SCALES[p.scale];
  const beat = 60 / p.bpm;
  const sx = beat / 4;
  const ev = [];
  const at = (bar, step) => {
    let t = (bar * 16 + step) * sx;
    if (step % 4 === 2) t += p.swing * sx;
    else if (step % 2 === 1) t += p.swing * 0.5 * sx;
    return t;
  };
  const chordAt = (bar) => p.prog[bar % p.prog.length];
  const groove = GROOVES[p.groove];
  const bassline = BASSLINES[p.bass];
  // AABA over eight bars: a motif, the motif again a little changed, an answer, the motif again.
  const a = phrase(r, p.density);
  const b = phrase(r, Math.min(1, p.density + 0.2));
  const form = [a, vary(r, a), b, vary(r, a)];
  const chorusLift = 2;
  const intro = 2;
  const outro = 2;
  const body = p.bars - intro - outro;
  for (let bar = 0; bar < p.bars; bar++) {
    const deg = chordAt(bar);
    const inBody = bar >= intro && bar < intro + body;
    const section = inBody ? Math.floor((bar - intro) / 8) % 2 : -1; // 0 verse, 1 chorus
    const chord = [0, 2, 4, 6].map((x) => p.root + semis(scale, deg + x));
    const ending = bar >= p.bars - outro;
    const level = ending ? 1 - (bar - (p.bars - outro)) / outro : 1;
    // drums
    if (inBody || (bar === intro - 1 && p.groove !== 'none')) {
      for (const [part, line] of Object.entries(groove)) {
        for (let s = 0; s < 16; s++) {
          if (line[s] !== 'x') continue;
          if (!inBody && s < 8) continue; // the fill into the song
          const v = (part === 'H' || part === 'P' ? (s % 4 === 0 ? 0.5 : 0.32) : 0.8) * (0.85 + r() * 0.3) * (section === 1 ? 1.1 : 1);
          ev.push({ t: at(bar, s), i: part, v });
        }
      }
      if (section === 1 && (bar - intro) % 8 === 7) for (let s = 12; s < 16; s++) ev.push({ t: at(bar, s), i: 'S', v: 0.45 + 0.1 * (s - 12) });
    }
    // bass
    if (bar >= 1 && !ending) {
      for (let s = 0; s < 16; s++) {
        const c = bassline[s];
        if (c === '.') continue;
        const m = c === 'R' ? chord[0] - 12 : c === 'r' ? chord[0] : c === 'F' ? chord[2] - 12 : chord[0] - 13;
        const d = (bassline.slice(s + 1).search(/[^.]/) + 1 || 16 - s) * sx;
        ev.push({ t: at(bar, s), i: 'bass', m, d: Math.min(d, beat * 2) * 0.9, v: 0.75 });
      }
    }
    if (ending && bar === p.bars - outro) ev.push({ t: at(bar, 0), i: 'bass', m: chord[0] - 12, d: beat * 6, v: 0.7 });
    // keys
    const voicing = chord.map((m) => m + 12);
    if (p.keys === 'arp') {
      const order = [0, 1, 2, 3, 2, 1, 2, 3];
      for (let s = 0; s < 16; s += 2) ev.push({ t: at(bar, s), i: 'keys', m: voicing[order[s / 2]] + (s >= 8 && r() < 0.3 ? 12 : 0), d: sx * 6, v: 0.42 * level });
    } else if (p.keys === 'stab') {
      for (const s of [0, 6, 10]) ev.push({ t: at(bar, s), i: 'keys', m: voicing, d: sx * 3, v: 0.32 * level });
    } else if (p.keys === 'hold') {
      for (const s of [0, 7, 12]) ev.push({ t: at(bar, s), i: 'keys', m: s ? voicing.slice(1) : voicing, d: sx * (s ? 4 : 7), v: 0.3 * level });
    } else if (p.keys === 'chip') {
      for (let s = 0; s < 16; s++) ev.push({ t: at(bar, s), i: 'chip', m: voicing[s % 3] + 12, d: sx * 0.8, v: 0.16 * level });
    }
    if (p.pad && (inBody || ending)) ev.push({ t: at(bar, 0), i: 'pad', m: voicing.slice(0, 3), d: 16 * sx, v: (section === 1 ? 0.24 : 0.15) * level });
    // melody
    if (inBody) {
      const k = Math.floor((bar - intro) / 2) % 4;
      const second = (bar - intro) % 2;
      // each note above the root of its own bar's chord, so the strong beats land on chord tones
      const lift = section === 1 ? chorusLift : 0;
      for (const n of form[k]) {
        if ((n.s >= 16) !== !!second) continue;
        let m = p.root + 12 + semis(scale, deg + n.rel + lift) + (p.bright > 0.7 ? 12 : 0);
        while (m > 86) m -= 12;
        while (m < 60) m += 12;
        ev.push({ t: at(bar, n.s % 16), i: 'lead', k: p.lead, m, d: n.d * sx * 0.95, v: 0.5 });
      }
    }
  }
  ev.sort((x, y) => x.t - y.t);
  return { params: p, events: ev, length: p.bars * 16 * sx + 2.5 };
}

// A side of a tape: songs one after another, with a gap of hiss between them.
export function side(songs, gap = 4) {
  const events = [];
  const starts = [];
  let t = 2;
  for (const s of songs) {
    starts.push(t);
    for (const e of s.events) events.push({ ...e, t: e.t + t });
    t += s.length + gap;
  }
  return { events, length: t, starts, songs };
}
