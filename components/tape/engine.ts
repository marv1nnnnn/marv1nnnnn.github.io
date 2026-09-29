// The desk the cassette lies on: iron filings over a slow magnetic field, shared by every page.
// Pages only change its parameters. The pointer is a magnet: filings turn to it as it passes,
// gather under it while it is held, and scatter when it lets go.

export type RGB = [number, number, number];

export interface Palette {
  name: string;
  bg: RGB;
  line: RGB;
  alt: RGB;
  hot: RGB;
  ink: string;
  muted: string;
  faint: string;
}

export const PALETTES: Record<string, Palette> = {
  haze: { name: 'haze', bg: [10, 8, 6], line: [224, 208, 186], alt: [156, 122, 88], hot: [255, 178, 92], ink: '#E9DECF', muted: '#A49584', faint: '#6B5F52' },
  '3am': { name: '3am', bg: [10, 10, 11], line: [232, 232, 232], alt: [130, 130, 130], hot: [226, 35, 48], ink: '#EDEDED', muted: '#9A9A9A', faint: '#666666' },
  nightbus: { name: 'nightbus', bg: [6, 8, 12], line: [182, 198, 222], alt: [92, 112, 152], hot: [255, 150, 60], ink: '#D6DFEB', muted: '#8A96A7', faint: '#566071' },
  ritual: { name: 'ritual', bg: [10, 8, 18], line: [205, 198, 255], alt: [120, 105, 200], hot: [255, 92, 214], ink: '#E4E0FF', muted: '#9690BF', faint: '#5F5A85' },
  pressure: { name: 'pressure', bg: [0, 0, 0], line: [255, 255, 255], alt: [140, 140, 140], hot: [255, 255, 255], ink: '#FFFFFF', muted: '#9A9A9A', faint: '#5E5E5E' },
  bent: { name: 'bent', bg: [12, 9, 8], line: [226, 210, 196], alt: [150, 96, 70], hot: [255, 86, 36], ink: '#EFE3D8', muted: '#A08E80', faint: '#65574D' },
};
// Each tape's world: how its filings lie and move, and the lamp over the desk (globals.css reads
// the lamp through CSS variables that TapeProvider sets).
export interface World {
  field: 'loops' | 'rain' | 'rings' | 'glitch';
  speed: number; // how fast the field changes (1 usual)
  scale: number; // how tight its loops are (lower is wider)
  len: number; // filing length
  width: number; // filing weight
  alpha: number;
  density: number;
  pulse: number; // a heavy beat the filings throb to (0 none)
  lamp: string; // CSS colour of the lamp
  lampAt: string; // where it hangs
  lamp2: string; // a second light, or transparent
  lamp2At: string;
  shade: number; // how far the corners fall into dark
}

export const WORLDS: Record<string, World> = {
  haze: { field: 'loops', speed: 0.5, scale: 0.7, len: 1.5, width: 1, alpha: 0.8, density: 0.85, pulse: 0, lamp: 'rgba(255, 196, 120, 0.14)', lampAt: '28% 14%', lamp2: 'transparent', lamp2At: '50% 50%', shade: 0.62 },
  '3am': { field: 'loops', speed: 0.7, scale: 1.25, len: 1.1, width: 1, alpha: 0.9, density: 0.6, pulse: 0, lamp: 'rgba(226, 40, 50, 0.12)', lampAt: '74% 10%', lamp2: 'rgba(255, 220, 190, 0.035)', lamp2At: '20% 80%', shade: 0.72 },
  nightbus: { field: 'rain', speed: 1, scale: 1, len: 1.7, width: 0.9, alpha: 1, density: 1, pulse: 0, lamp: 'rgba(255, 150, 60, 0.11)', lampAt: '84% 6%', lamp2: 'rgba(90, 130, 255, 0.08)', lamp2At: '10% 92%', shade: 0.66 },
  ritual: { field: 'rings', speed: 0.6, scale: 1, len: 1.1, width: 1, alpha: 1, density: 0.9, pulse: 0, lamp: 'rgba(170, 110, 255, 0.13)', lampAt: '50% 108%', lamp2: 'transparent', lamp2At: '50% 50%', shade: 0.74 },
  pressure: { field: 'loops', speed: 0.9, scale: 0.5, len: 0.8, width: 2, alpha: 1.25, density: 1.15, pulse: 1, lamp: 'rgba(255, 255, 255, 0.1)', lampAt: '50% -4%', lamp2: 'transparent', lamp2At: '50% 50%', shade: 0.8 },
  bent: { field: 'glitch', speed: 1.6, scale: 1.4, len: 1, width: 1, alpha: 1.1, density: 1, pulse: 0, lamp: 'rgba(255, 90, 40, 0.11)', lampAt: '22% 28%', lamp2: 'rgba(255, 255, 255, 0.03)', lamp2At: '80% 70%', shade: 0.6 },
};

export const DEFAULT_PALETTE = 'haze';
// Tapes renamed in 2026-09; a visitor's saved choice follows its tape to the new name.
export const RENAMED: Record<string, string> = { oxide: 'haze', lain: '3am', phosphor: 'nightbus', uv: 'ritual', mono: 'pressure', noise: 'bent' };

export interface Scene {
  seed: string;
  density: number;
  fade: number;
  age: number;
  home: boolean;
}

export const HOME_SCENE: Scene = { seed: 'home', density: 1, fade: 0.009, age: 0, home: true };
export const PAGE_SCENE: Scene = { seed: 'page', density: 0.45, fade: 0.02, age: 0.1, home: false };

const TAU = Math.PI * 2;

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Noise = (x: number, y: number, z: number) => number;

// Improved Perlin noise, seeded.
export function makeNoise(rand: () => number): Noise {
  const p = new Uint8Array(512);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (h: number, x: number, y: number, z: number) => {
    h &= 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  };
  return (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u), lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u), lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v),
      w,
    );
  };
}

// Wear: 0 for this week, 1 for about five and a half years ago.
export function wearOf(date: string, now = Date.now()) {
  const years = (now - Date.parse(date)) / (365.25 * 864e5);
  return Math.max(0, Math.min(1, years / 5.5));
}

// Brightness follows the visitor's clock: brightest at 3am, dimmest at 3pm.
export function nightness(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  return 0.5 + 0.5 * Math.cos(((h - 3) / 24) * TAU);
}

// A filing rests at (hx, hy); it is pushed and pulled from there and springs back.
interface Filing { hx: number; hy: number; x: number; y: number; vx: number; vy: number; a: number; len: number; tone: number; heat: number }
interface Pointer { x: number; y: number; vx: number; vy: number; down: boolean; since: number }
export interface Obstacle { cx: number; cy: number; hw: number; hh: number }

// What the tape tells the sound: the moments worth hearing.
export type TapeEvent =
  | { type: 'burst'; x: number; y: number; power: number }
  | { type: 'erase'; y: number }
  | { type: 'seek'; direction: -1 | 1; seconds: number }
  | { type: 'scan'; direction: -1 | 1 }
  | { type: 'land' };

export class Tape {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private noise: Noise = makeNoise(rng(1));
  private t = Math.random() * 10;
  private filings: Filing[] = [];
  private slide = 0; // how far the filings have slid sideways while the tape winds
  private fall = 0; // how far the rain has run down (the rain field)
  private tears: { y: number; h: number; shift: number; life: number }[] = [];
  private density = 1;
  private pointers = new Map<number, Pointer>();
  private bursts: { x: number; y: number; age: number; power: number }[] = [];
  private dropouts: { y: number; age: number }[] = [];
  private ff = 0;
  private ffDir = -1;
  private scanning = false;
  private winds = 0;
  private frames = 0;
  private heard = { x: 0.5, y: 0.5 };
  scene: Scene = HOME_SCENE;
  palette: Palette = PALETTES[DEFAULT_PALETTE];
  obstacle: Obstacle | null = null;
  coarse: boolean;
  onEvent: ((e: TapeEvent) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.coarse = matchMedia('(pointer: coarse)').matches;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // The canvas is as tall as the large viewport (globals.css), so it keeps its size while a
    // phone's address bar comes and goes.
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    if (w === this.W && h === this.H && this.filings.length) return;
    this.W = w;
    this.H = h;
    this.canvas.width = Math.floor(this.W * dpr);
    this.canvas.height = Math.floor(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.clear();
    // Scattered evenly (jittered grid), the same every time for a given size.
    const n = Math.min(this.coarse ? 1100 : 2000, Math.floor((this.W * this.H) / 560));
    const cols = Math.max(1, Math.round(Math.sqrt((n * this.W) / this.H)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const r = rng(hash('filings'));
    this.filings = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const hx = ((i + r()) * this.W) / cols, hy = ((j + r()) * this.H) / rows;
        this.filings.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, a: r() * Math.PI, len: 2.5 + r() * r() * 8, tone: r(), heat: 0 });
      }
    }
    // Draw order shuffled, so a thinner density drops filings evenly rather than whole rows.
    for (let i = this.filings.length - 1; i > 0; i--) {
      const k = Math.floor(r() * (i + 1));
      [this.filings[i], this.filings[k]] = [this.filings[k], this.filings[i]];
    }
  }

  // The canvas is transparent: the desk itself is drawn by the page background (globals.css).
  clear() {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }

  setScene(scene: Scene) {
    this.scene = scene;
    this.noise = makeNoise(rng(hash(scene.seed)));
  }

  reseed(seed: string) {
    this.noise = makeNoise(rng(hash(seed)));
  }

  setPalette(p: Palette) {
    this.palette = p;
    this.clear();
  }

  // Winding between tracks: fast-forward (-1, further along the tape) or rewind (1). The field
  // streaks for the length of the wind, then the tape lands and plays again.
  seek(direction: -1 | 1, duration = 700) {
    this.ffDir = direction;
    this.scanning = false;
    this.onEvent?.({ type: 'seek', direction, seconds: duration / 1000 });
    const t0 = performance.now();
    const from = this.ff;
    const run = ++this.winds;
    const tick = () => {
      if (run !== this.winds) return;
      const k = Math.min(1, (performance.now() - t0) / duration);
      // Up to speed quickly, hold, then slow down into the landing.
      const up = Math.min(1, k / 0.2);
      const down = Math.min(1, (1 - k) / 0.3);
      this.ff = Math.max(from * (1 - up), Math.min(up, down));
      if (k < 1) requestAnimationFrame(tick);
      else this.ff = 0;
    };
    requestAnimationFrame(tick);
  }

  // Holding fast-forward or rewind: the tape winds until land() or the next seek().
  scan(direction: -1 | 1) {
    this.ffDir = direction;
    this.scanning = true;
    this.onEvent?.({ type: 'scan', direction });
    const run = ++this.winds;
    const tick = () => {
      if (run !== this.winds) return;
      if (this.scanning) {
        this.ff += (1 - this.ff) * 0.12;
        requestAnimationFrame(tick);
      } else {
        this.ff *= 0.85;
        if (this.ff > 0.01) requestAnimationFrame(tick);
        else this.ff = 0;
      }
    };
    requestAnimationFrame(tick);
  }

  land() {
    if (!this.scanning) return;
    this.scanning = false;
    this.onEvent?.({ type: 'land' });
  }

  pointerDown(id: number, x: number, y: number, gathers: boolean) {
    const p = this.pointers.get(id) ?? { x, y, vx: 0, vy: 0, down: false, since: 0 };
    Object.assign(p, { x, y, down: gathers, since: performance.now() });
    this.pointers.set(id, p);
  }

  pointerMove(id: number, x: number, y: number) {
    const p = this.pointers.get(id) ?? { x, y, vx: 0, vy: 0, down: false, since: 0 };
    p.vx = p.vx * 0.6 + (x - p.x) * 0.4;
    p.vy = p.vy * 0.6 + (y - p.y) * 0.4;
    p.x = x;
    p.y = y;
    this.pointers.set(id, p);
  }

  pointerUp(id: number, forget: boolean) {
    const p = this.pointers.get(id);
    if (p?.down) {
      const held = performance.now() - p.since;
      if (held > 180) {
        const power = Math.min(1, held / 1400);
        this.bursts.push({ x: p.x, y: p.y, age: 0, power });
        this.onEvent?.({ type: 'burst', x: p.x / this.W, y: p.y / this.H, power });
      }
      p.down = false;
    }
    if (forget) this.pointers.delete(id);
  }

  forgetIdle() {
    for (const [id, p] of this.pointers) if (!p.down) this.pointers.delete(id);
  }

  erase(y: number) {
    this.dropouts.push({ y, age: 0 });
    this.onEvent?.({ type: 'erase', y: y / this.H });
  }

  // The pointer as the sound hears it: the fastest one sets the position, the longest hold wins.
  listen() {
    const now = performance.now();
    let speed = 0, hold = 0, x = this.heard.x, y = this.heard.y;
    for (const p of this.pointers.values()) {
      const s = Math.hypot(p.vx, p.vy);
      if (p.down) hold = Math.max(hold, Math.min(1, (now - p.since) / 1400));
      if (s >= speed) {
        speed = s;
        x = p.x / this.W;
        y = p.y / this.H;
      }
    }
    this.heard = { x, y };
    return { speed, hold, x, y };
  }

  frame() {
    const { ctx, W, H, scene, palette: pal } = this;
    const night = nightness();
    this.density += (scene.density - this.density) * 0.04;
    ctx.clearRect(0, 0, W, H);

    for (let i = this.dropouts.length - 1; i >= 0; i--) if (++this.dropouts[i].age > 14) this.dropouts.splice(i, 1);
    const now = performance.now();
    const active = [...this.pointers.values()].map((p) => {
      const q = { x: p.x, y: p.y, vx: p.vx, vy: p.vy, speed: Math.hypot(p.vx, p.vy), down: p.down, hold: p.down ? Math.min(1, (now - p.since) / 1400) : 0 };
      p.vx *= 0.92;
      p.vy *= 0.92;
      return q;
    });
    for (let i = this.bursts.length - 1; i >= 0; i--) if (++this.bursts[i].age > 45) this.bursts.splice(i, 1);

    const R = this.coarse ? 120 : 160;
    const R2 = R * R;
    const ob = this.obstacle;
    const ff = this.ff;
    this.slide += this.ffDir * ff * 26;
    const shadow = new Path2D(), body = new Path2D(), bright = new Path2D(), hot = new Path2D();
    const world = WORLDS[pal.name] ?? WORLDS[DEFAULT_PALETTE];
    const n = Math.floor(this.filings.length * Math.min(1, (this.density + ff * 0.5) * world.density));
    if (world.field === 'rain') this.fall += 0.5 + ff * 4;
    // The bent tape tears: a band of the desk jumps sideways for a few frames.
    if (world.field === 'glitch') {
      if (Math.random() < (this.coarse ? 0.008 : 0.03)) this.tears.push({ y: Math.random() * H, h: 6 + Math.random() * 40, shift: (Math.random() - 0.5) * 160, life: 3 + Math.floor(Math.random() * 6) });
      this.tears = this.tears.filter((t) => --t.life > 0);
    }
    // Reading on a phone the desk keeps still: no throb, and the filings dim, so a page scrolling
    // over bright moving lines does not flicker. The throb itself is slow and slight everywhere.
    const reading = this.coarse && !scene.home;
    const throb = world.pulse && !reading ? 1 + world.pulse * 0.12 * Math.pow(Math.max(0, Math.sin(now / 420)), 6) : 1;
    const cx0 = W / 2, cy0 = H * 0.52;
    // Older pages: the filings have drifted more and rusted a little.
    const drift = 1 + scene.age * 1.5;

    for (let i = 0; i < n; i++) {
      const f = this.filings[i];
      // Where it is drawn: its own position, slid along with the tape while it winds.
      let px = (f.x + this.slide) % W;
      if (px < 0) px += W;
      let py = f.y;
      if (world.field === 'rain') py = (f.y + this.fall * (0.6 + f.tone * 0.8)) % H;
      for (const t of this.tears) if (Math.abs(py - t.y) < t.h / 2) px = (px + t.shift + W) % W;

      // The field: slow, large loops like lines of force; or rain; or rings round the middle.
      const k = 0.0019 * world.scale;
      const wander = this.noise(px * k, py * k, this.t);
      let base = wander * TAU * 1.2;
      if (world.field === 'rain') base = Math.PI / 2 + 0.32 + wander * 0.35;
      else if (world.field === 'rings') base = Math.atan2(py - cy0, px - cx0) + Math.PI / 2 + wander * 0.3;
      else if (world.field === 'glitch' && f.tone > 0.97) base += (Math.random() - 0.5) * 3;
      let fx = Math.cos(base) * drift, fy = Math.sin(base) * drift;
      let touch = 0;

      for (const q of active) {
        const dx = px - q.x, dy = py - q.y, d2 = dx * dx + dy * dy;
        if (d2 > R2 * 12) continue;
        const d = Math.sqrt(d2) + 0.001;
        // The magnet: filings point at it, more strongly the closer it is.
        const pull = (R2 * 1.4) / (d2 + R2 * 0.18);
        fx += (dx / d) * pull;
        fy += (dy / d) * pull;
        const g = Math.exp(-d2 / R2);
        // Moving drags the nearest filings along.
        f.vx += q.vx * g * 0.05;
        f.vy += q.vy * g * 0.05;
        if (q.down) {
          // Holding draws them in, harder the longer it is held.
          const k = Math.exp(-d2 / (R2 * (1.5 + q.hold * 3))) * (0.35 + q.hold * 1.3);
          f.vx -= (dx / d) * k;
          f.vy -= (dy / d) * k;
          touch = Math.max(touch, k);
        }
        touch = Math.max(touch, g * (0.3 + Math.min(q.speed, 30) / 30));
      }
      for (const b of this.bursts) {
        const dx = px - b.x, dy = py - b.y, d2 = dx * dx + dy * dy;
        if (d2 > R2 * 20) continue;
        const d = Math.sqrt(d2) + 0.001;
        const k = Math.exp(-d2 / (R2 * (3 + b.power * 4))) * (2 + b.power * 7) * (1 - b.age / 45) * (b.age < 6 ? 1 : 0.2);
        f.vx += (dx / d) * k;
        f.vy += (dy / d) * k;
        touch = Math.max(touch, k * 0.3);
      }
      if (ff > 0) {
        fx += this.ffDir * ff * 40;
        touch = Math.max(touch, ff * 0.3);
      }

      // Spring home, with friction.
      f.vx = (f.vx + (f.hx - f.x) * 0.018) * 0.86;
      f.vy = (f.vy + (f.hy - f.y) * 0.018) * 0.86;
      f.x += f.vx;
      f.y += f.vy;
      // A filing has no head or tail: turn the short way round (mod half a turn).
      let da = Math.atan2(fy, fx) - f.a;
      da -= Math.PI * Math.round(da / Math.PI);
      f.a += da * (0.08 + touch * 0.25);
      f.heat = Math.min(1, f.heat * 0.95 + touch * 0.3);

      // Hidden under the title being read, and in a fresh dropout.
      if (ob) {
        const ex = (px - ob.cx) / ob.hw, ey = (py - ob.cy) / ob.hh;
        if (ex * ex + ey * ey < 1) continue;
      }
      let gone = false;
      for (const d of this.dropouts) if (Math.abs(py - d.y) < 10 + d.age * 3) gone = true;
      if (gone) continue;

      const len = f.len * world.len * throb * (1 + ff * 2.5) * (1 + f.heat * 0.4);
      const cx = Math.cos(f.a) * len * 0.5, cy = Math.sin(f.a) * len * 0.5;
      shadow.moveTo(px - cx + 0.8, py - cy + 1.4);
      shadow.lineTo(px + cx + 0.8, py + cy + 1.4);
      const path = f.heat > 0.35 ? hot : f.tone > 0.82 ? bright : body;
      path.moveTo(px - cx, py - cy);
      path.lineTo(px + cx, py + cy);
    }

    ctx.lineCap = 'round';
    const a = world.alpha * (reading ? 0.4 : 1);
    ctx.lineWidth = 1.3 * world.width;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.stroke(shadow);
    ctx.lineWidth = world.width;
    ctx.strokeStyle = `rgba(${pal.line}, ${(0.2 + night * 0.06) * a})`;
    ctx.stroke(body);
    ctx.strokeStyle = `rgba(${pal.line}, ${(0.42 + night * 0.08) * a})`;
    ctx.stroke(bright);
    ctx.lineWidth = 1.2 * world.width;
    ctx.strokeStyle = `rgba(${pal.hot}, ${Math.min(1, (0.55 + night * 0.1) * a)})`;
    ctx.stroke(hot);
    // A dropout leaves a thin bright scar for a moment.
    for (const d of this.dropouts) {
      if (d.age > 3) continue;
      ctx.fillStyle = `rgba(${pal.hot}, ${0.5 - d.age * 0.12})`;
      ctx.fillRect(0, d.y, W, 1);
    }
    this.t += 0.0004 * world.speed;
  }
}
