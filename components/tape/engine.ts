// The tape: one flow field shared by every page. Pages only change its parameters.

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
  oxide: { name: 'oxide', bg: [7, 9, 12], line: [196, 206, 216], alt: [96, 140, 170], hot: [108, 224, 255], ink: '#D7DEE5', muted: '#8E99A4', faint: '#5D6873' },
  lain: { name: 'lain', bg: [10, 10, 11], line: [232, 232, 232], alt: [130, 130, 130], hot: [226, 35, 48], ink: '#EDEDED', muted: '#9A9A9A', faint: '#666666' },
  phosphor: { name: 'phosphor', bg: [5, 9, 7], line: [150, 220, 170], alt: [80, 140, 100], hot: [226, 255, 170], ink: '#CFEBD7', muted: '#7FA58A', faint: '#4F6B57' },
  uv: { name: 'uv', bg: [10, 8, 18], line: [205, 198, 255], alt: [120, 105, 200], hot: [255, 92, 214], ink: '#E4E0FF', muted: '#9690BF', faint: '#5F5A85' },
  mono: { name: 'mono', bg: [0, 0, 0], line: [255, 255, 255], alt: [140, 140, 140], hot: [255, 255, 255], ink: '#FFFFFF', muted: '#9A9A9A', faint: '#5E5E5E' },
};
export const DEFAULT_PALETTE = 'oxide';

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

type Noise = (x: number, y: number, z: number) => number;

// Improved Perlin noise, seeded.
function makeNoise(rand: () => number): Noise {
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

interface Particle { x: number; y: number; life: number; alt: boolean; heat: number }
interface Pointer { x: number; y: number; vx: number; vy: number; down: boolean; since: number }
export interface Obstacle { cx: number; cy: number; hw: number; hh: number }

export class Tape {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private noise: Noise = makeNoise(rng(1));
  private t = Math.random() * 10;
  private parts: Particle[] = [];
  private density = 1;
  private pointers = new Map<number, Pointer>();
  private bursts: { x: number; y: number; age: number; power: number }[] = [];
  private dropouts: { y: number; age: number }[] = [];
  private ff = 0;
  private ffDir = -1;
  private frames = 0;
  scene: Scene = HOME_SCENE;
  palette: Palette = PALETTES[DEFAULT_PALETTE];
  obstacle: Obstacle | null = null;
  coarse: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.coarse = matchMedia('(pointer: coarse)').matches;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.floor(this.W * dpr);
    this.canvas.height = Math.floor(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.clear();
    const n = Math.min(this.coarse ? 1600 : 2600, Math.floor((this.W * this.H) / 650));
    while (this.parts.length < n) this.parts.push(this.spawn({ x: 0, y: 0, life: 0, alt: false, heat: 0 }));
    this.parts.length = n;
  }

  clear() {
    this.ctx.fillStyle = `rgb(${this.palette.bg})`;
    this.ctx.fillRect(0, 0, this.W, this.H);
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

  // A page change plays as fast-forward (deeper into the site) or rewind (back up).
  seek(direction: -1 | 1, duration = 700) {
    this.ffDir = direction;
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / duration);
      this.ff = Math.sin(Math.PI * k);
      if (k < 1) requestAnimationFrame(tick);
      else this.ff = 0;
    };
    requestAnimationFrame(tick);
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
      if (held > 180) this.bursts.push({ x: p.x, y: p.y, age: 0, power: Math.min(1, held / 1400) });
      p.down = false;
    }
    if (forget) this.pointers.delete(id);
  }

  forgetIdle() {
    for (const [id, p] of this.pointers) if (!p.down) this.pointers.delete(id);
  }

  erase(y: number) {
    this.dropouts.push({ y, age: 0 });
  }

  private spawn(p: Particle) {
    p.x = Math.random() * this.W;
    p.y = Math.random() * this.H;
    p.life = 60 + Math.random() * 260;
    p.alt = Math.random() < 0.07;
    p.heat = 0;
    return p;
  }

  frame() {
    const { ctx, W, H, scene, palette: pal } = this;
    const bg = pal.bg;
    const night = nightness();
    this.density += (scene.density - this.density) * 0.04;

    ctx.fillStyle = `rgba(${bg}, ${scene.fade + this.ff * 0.08})`;
    ctx.fillRect(0, 0, W, H);
    // A faint fade alone never fully clears: 8-bit rounding leaves a grey haze that builds up
    // over minutes. A stronger pass every few frames pulls the residue back to the background.
    if (++this.frames % 12 === 0) {
      ctx.fillStyle = `rgba(${bg}, 0.06)`;
      ctx.fillRect(0, 0, W, H);
    }

    // Tape damage grows with the age of what is on screen.
    if (Math.random() < 0.02 + scene.age * 0.06) {
      ctx.fillStyle = `rgba(${bg}, ${0.5 + scene.age * 0.3})`;
      ctx.fillRect(0, Math.random() * H, W, 1 + Math.random() * Math.random() * (36 + scene.age * 60));
    }
    if (Math.random() < 0.01 + scene.age * 0.03) {
      ctx.fillStyle = `rgba(${pal.line}, 0.06)`;
      ctx.fillRect(0, Math.random() * H, W, 1);
    }
    for (let i = this.dropouts.length - 1; i >= 0; i--) {
      const d = this.dropouts[i];
      const h = 18 + d.age * 5;
      ctx.fillStyle = `rgba(${bg}, ${0.5 - d.age * 0.03})`;
      ctx.fillRect(0, d.y - h / 2, W, h);
      if (d.age === 0) {
        ctx.fillStyle = `rgba(${pal.hot}, 0.5)`;
        ctx.fillRect(0, d.y, W, 1);
      }
      if (++d.age > 14) this.dropouts.splice(i, 1);
    }

    const now = performance.now();
    const active = [...this.pointers.values()].map((p) => {
      const q = { x: p.x, y: p.y, vx: p.vx, vy: p.vy, speed: Math.hypot(p.vx, p.vy), down: p.down, hold: p.down ? Math.min(1, (now - p.since) / 1400) : 0 };
      p.vx *= 0.92;
      p.vy *= 0.92;
      return q;
    });
    for (let i = this.bursts.length - 1; i >= 0; i--) if (++this.bursts[i].age > 45) this.bursts.splice(i, 1);
    const holding = active.reduce((m, q) => Math.max(m, q.hold), 0);

    const R = this.coarse ? 110 : 150;
    const R2 = R * R;
    const ob = this.obstacle;
    const ff = this.ff;
    const lineP = new Path2D(), altP = new Path2D(), hotP = new Path2D();
    const n = Math.floor(this.parts.length * Math.min(1, this.density + ff));

    for (let i = 0; i < n; i++) {
      const p = this.parts[i];
      const a = this.noise(p.x * 0.0017, p.y * 0.0017, this.t) * TAU * 1.7;
      let vx = Math.cos(a) * 1.35, vy = Math.sin(a) * 1.35;
      let touch = 0;

      for (const q of active) {
        const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
        if (d2 > R2 * 9) continue;
        const d = Math.sqrt(d2) + 0.001;
        const f = Math.exp(-d2 / R2);
        const swirl = f * (1.6 + Math.min(q.speed, 40) * 0.09);
        vx += (-dy / d) * swirl + q.vx * f * 0.3;
        vy += (dx / d) * swirl + q.vy * f * 0.3;
        if (q.down) {
          // Holding builds a crescendo: the pull and the glow keep growing.
          const g = Math.exp(-d2 / (R2 * (3 + q.hold * 3))) * (1.2 + q.hold * 3.2);
          vx -= (dx / d) * g;
          vy -= (dy / d) * g;
          touch = Math.max(touch, g * 0.5);
        }
        touch = Math.max(touch, f * (0.4 + Math.min(q.speed, 30) / 30));
      }
      for (const b of this.bursts) {
        const dx = p.x - b.x, dy = p.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > R2 * 20) continue;
        const d = Math.sqrt(d2) + 0.001;
        const k = Math.exp(-d2 / (R2 * (4 + b.power * 4))) * (3 + b.power * 10) * (1 - b.age / 45);
        vx += (dx / d) * k;
        vy += (dy / d) * k;
        touch = Math.max(touch, k * 0.25);
      }
      // Lines part around the title of whatever is being read.
      if (ob) {
        const ex = (p.x - ob.cx) / ob.hw, ey = (p.y - ob.cy) / ob.hh;
        const e = ex * ex + ey * ey;
        if (e < 1.6) {
          const k = (1.6 - e) * 2.4;
          vx += ex * k;
          vy += ey * k;
        }
      }
      if (ff > 0) {
        vx += this.ffDir * ff * 22;
        vy *= 1 - ff * 0.8;
        touch = Math.max(touch, ff * 0.6);
      }

      p.heat = Math.min(1, p.heat * 0.965 + touch * 0.35);
      const nx = p.x + vx, ny = p.y + vy;
      const path = p.heat > 0.3 ? hotP : p.alt ? altP : lineP;
      path.moveTo(p.x, p.y);
      path.lineTo(nx, ny);
      p.x = nx;
      p.y = ny;
      p.life -= 1;
      if (p.life <= 0 || nx < -30 || ny < -30 || nx > W + 30 || ny > H + 30) {
        this.spawn(p);
        if (ff > 0.2) p.x = this.ffDir < 0 ? W + 10 : -10;
      }
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${pal.line}, ${0.15 + night * 0.08})`;
    ctx.stroke(lineP);
    ctx.strokeStyle = `rgba(${pal.alt}, ${0.24 + night * 0.12})`;
    ctx.stroke(altP);
    ctx.lineWidth = 1.2 + holding * 0.6;
    ctx.strokeStyle = `rgba(${pal.hot}, ${0.38 + night * 0.1 + holding * 0.35})`;
    ctx.stroke(hotP);
    this.t += 0.0009;
  }
}
