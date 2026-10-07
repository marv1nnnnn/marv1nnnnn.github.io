// The line: one carrier down the page, drawn as far as you have read. It comes out of the cassette
// as tape, is spliced onto an earphone cable, goes into the player and out of it as a USB lead,
// coils round the app tighter with every song it learns, and leaves as a wave across the dial.
// It carries what is playing: the sound moves it, a little on a ribbon or a wire, all the way on
// the air.

const TAPE = 0;
const CABLE = 1;
const USB = 2;
const LOOP = 3;
const WAVE = 4;
const HIDDEN = 9;
const ACCENTS = { intro: '#e6a866', tape: '#e6a866', file: '#93bbff', app: '#ff6476', air: '#a6e3a1' };

// centripetal Catmull-Rom through the waypoints, sampled every few pixels
function spline(wps, step = 3) {
  const out = [];
  const P = [wps[0], ...wps, wps[wps.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const d = (a, b) => Math.max(1e-3, Math.hypot(b.x - a.x, b.y - a.y) ** 0.5);
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 0; k < n; k++) {
      const t = t1 + ((t2 - t1) * k) / n;
      const lerp = (a, b, ta, tb) => {
        const w = (t - ta) / (tb - ta || 1);
        return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w };
      };
      const A1 = lerp(p0, p1, t0, t1), A2 = lerp(p1, p2, t1, t2), A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, t0, t2), B2 = lerp(A2, A3, t1, t3);
      const C = lerp(B1, B2, t1, t2);
      out.push({ x: C.x, y: C.y, m: p1.m });
    }
  }
  const last = wps[wps.length - 1];
  out.push({ x: last.x, y: last.y, m: last.m });
  return out;
}

export function createLine(canvas, engine, reduced) {
  const g = canvas.getContext('2d');
  let pts = [];
  let reach = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let splices = [];
  let waveFrom = 0;
  const buf = new Float32Array(2048);
  const env = new Float32Array(256);
  let envAt = 0;
  let level = 0;
  let pseudo = 0;
  let accent = ACCENTS.intro;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  // Waypoints in page coordinates, each with the material of the stretch after it.
  function set(wps) {
    pts = spline(wps);
    let s = 0;
    let top = -Infinity;
    reach = new Float32Array(pts.length);
    splices = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[Math.min(pts.length - 1, i + 1)];
      const r = pts[Math.max(0, i - 1)];
      const dx = q.x - r.x, dy = q.y - r.y;
      const l = Math.hypot(dx, dy) || 1;
      p.nx = -dy / l;
      p.ny = dx / l;
      if (i) s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      p.s = s;
      // the coil is drawn whole once the line reaches it, so it can be seen tightening
      if (p.m !== LOOP) top = Math.max(top, p.y);
      reach[i] = top;
      if (i && p.m !== pts[i - 1].m && p.m !== HIDDEN && pts[i - 1].m !== HIDDEN) splices.push(i);
    }
    waveFrom = pts.find((p) => p.m === WAVE)?.s ?? 0;
  }

  function sampleAudio(soundy) {
    if (soundy && engine.wave(buf)) {
      let sum = 0;
      for (let i = 0; i < buf.length; i += 4) sum += buf[i] * buf[i];
      level += (Math.sqrt(sum / (buf.length / 4)) - level) * 0.3;
    } else {
      buf.fill(0);
      level *= 0.9;
    }
    // a stream that will not let itself be heard by the page still moves the wave a little
    pseudo += (Math.random() - 0.5) * 0.02;
    pseudo = Math.max(0, Math.min(0.08, pseudo));
    envAt = (envAt + 1) % env.length;
    env[envAt] = Math.max(level, engine.airLevel ? pseudo * engine.airLevel : 0);
  }

  function draw(time, soundy) {
    resize();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!pts.length) return;
    sampleAudio(soundy);
    const sy = window.scrollY;
    const head = reduced ? Infinity : sy + H * 0.74;
    let end = pts.length - 1;
    if (head !== Infinity) {
      let lo = 0, hi = pts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (reach[mid] <= head) lo = mid;
        else hi = mid - 1;
      }
      end = lo;
    }
    const t = time / 1000;
    const still = reduced;
    // the visible stretch
    const runs = [];
    let run = null;
    for (let i = 0; i <= end; i++) {
      const p = pts[i];
      const y = p.y - sy;
      const visible = y > -60 && y < H + 60;
      if (!visible || p.m === HIDDEN) {
        run = null;
        continue;
      }
      if (!run || run.m !== p.m) {
        run = { m: p.m, pts: [] };
        if (runs.length && i > 0 && pts[i - 1].m !== HIDDEN) run.pts.push(at(pts[i - 1], sy, t, still));
        runs.push(run);
      }
      run.pts.push(at(p, sy, t, still));
    }
    for (const r of runs) paint(r);
    // the splices: a strip of tape where one carrier was joined onto the next
    for (const i of splices) {
      if (i > end) continue;
      const p = pts[i];
      const y = p.y - sy;
      if (y < -20 || y > H + 20) continue;
      g.save();
      g.translate(p.x, y);
      g.rotate(Math.atan2(p.nx, -p.ny));
      g.fillStyle = 'rgba(236, 228, 210, 0.85)';
      g.fillRect(-7, -4, 14, 8);
      g.restore();
    }
    // the head of the line, where you are
    if (end < pts.length - 1) {
      const p = at(pts[end], sy, t, still);
      g.beginPath();
      g.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      g.fillStyle = accent;
      g.shadowColor = accent;
      g.shadowBlur = 12;
      g.fill();
      g.shadowBlur = 0;
    }
  }

  // A point moved by what the line carries.
  function at(p, sy, t, still) {
    let d = 0;
    let w = 1;
    if (!still) {
      const sig = buf[Math.floor(p.s * 1.7) % buf.length];
      if (p.m === TAPE) {
        d = sig * 9 + Math.sin(p.s / 70 + t * 0.9) * 1.6;
        w = Math.abs(Math.cos(p.s / 34 + t * 0.15));
      } else if (p.m === CABLE) {
        d = sig * 7 + Math.sin(p.s / 90 + t * 0.6) * 0.8;
      } else if (p.m === USB) {
        d = sig * 3;
      } else if (p.m === LOOP) {
        d = sig * 12;
      } else if (p.m === WAVE) {
        const back = Math.floor((p.s - waveFrom) / 7);
        const e = env[(envAt - back + env.length * 64) % env.length];
        const amp = Math.min(18, 2 + e * 60);
        d = Math.sin(p.s * 0.75 - t * 9) * amp;
      }
    } else if (p.m === TAPE) {
      w = Math.abs(Math.cos(p.s / 34));
    }
    return { x: p.x + p.nx * d, y: p.y - sy + p.ny * d, w, nx: p.nx, ny: p.ny };
  }

  function stroke(points, width, color) {
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.lineWidth = width;
    g.strokeStyle = color;
    g.stroke();
  }

  function paint(r) {
    const P = r.pts;
    if (P.length < 2) return;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (r.m === TAPE) {
      // a ribbon that twists: wide where it faces you, a hairline where it is edge on
      g.beginPath();
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        const hw = 0.6 + 3.2 * p.w;
        g[i ? 'lineTo' : 'moveTo'](p.x + p.nx * hw, p.y + p.ny * hw);
      }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        const hw = 0.6 + 3.2 * p.w;
        g.lineTo(p.x - p.nx * hw, p.y - p.ny * hw);
      }
      g.closePath();
      g.fillStyle = '#4a3020';
      g.fill();
      // the sheen, where it faces the lamp
      g.beginPath();
      let on = false;
      for (const p of P) {
        if (p.w > 0.82) {
          g[on ? 'lineTo' : 'moveTo'](p.x, p.y);
          on = true;
        } else on = false;
      }
      g.lineWidth = 1.4;
      g.strokeStyle = 'rgba(176, 124, 84, 0.75)';
      g.stroke();
    } else if (r.m === CABLE) {
      const shade = P.map((p) => ({ x: p.x + 1.2, y: p.y + 1.8 }));
      stroke(shade, 2.6, 'rgba(0, 0, 0, 0.55)');
      stroke(P, 2.2, '#e8e5de');
    } else if (r.m === USB) {
      stroke(P, 3.6, '#6f747b');
      stroke(P, 1.2, 'rgba(255, 255, 255, 0.25)');
    } else if (r.m === LOOP) {
      stroke(P, 6, 'rgba(255, 77, 99, 0.12)');
      stroke(P, 1.6, '#ff5a6e');
    } else if (r.m === WAVE) {
      stroke(P, 6, 'rgba(166, 227, 161, 0.1)');
      stroke(P, 1.3, '#b2ecad');
    }
  }

  return {
    set,
    draw,
    resize,
    accent(era) {
      accent = ACCENTS[era] ?? accent;
    },
  };
}

export const MATERIAL = { TAPE, CABLE, USB, LOOP, WAVE, HIDDEN };
