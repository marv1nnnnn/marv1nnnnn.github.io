'use client';

import { useEffect, useRef, useState } from 'react';

export type MachineGhostMode = 'home' | 'about' | 'projects' | 'influences';

const VISUAL_SHADER = /* wgsl */ `
struct Params {
  pointer: vec2f,
  texture: vec3f,
  time: f32,
  progress: f32,
  impulse: f32,
  mode: f32,
  aspect: f32,
  seed: f32,
  quality: f32,
  primaryHue: f32,
  accentHue: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), u.x),
             mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0)), u.x), u.y);
}

fn fbm(point: vec2f) -> f32 {
  var p = point;
  var value = 0.0;
  var amplitude = 0.5;
  for (var i = 0; i < 5; i++) {
    if (f32(i) >= params.quality) { break; }
    value += noise(p) * amplitude;
    p = mat2x2f(1.62, 1.18, -1.18, 1.62) * p + 7.3;
    amplitude *= 0.48;
  }
  return value;
}

fn rotate(p: vec2f, angle: f32) -> vec2f {
  let c = cos(angle);
  let s = sin(angle);
  return mat2x2f(c, -s, s, c) * p;
}

fn sdBox(p: vec2f, bounds: vec2f) -> f32 {
  let d = abs(p) - bounds;
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

fn hsl(h: f32, s: f32, l: f32) -> vec3f {
  let rgb = clamp(abs(fract(h + vec3f(0.0, 0.666667, 0.333333)) * 6.0 - 3.0) - 1.0, vec3f(0.0), vec3f(1.0));
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var p = uv - 0.5;
  p.x *= params.aspect;
  let mouse = vec2f(params.pointer.x * params.aspect, -params.pointer.y);
  let primary = hsl(params.primaryHue, 0.2, 0.82);
  let accent = hsl(params.accentHue, 0.82, 0.56);
  let second = hsl(fract(params.accentHue + 0.19), 0.72, 0.5);
  let dark = hsl(params.primaryHue, 0.3, 0.012);
  var color = dark;

  if (params.mode < 0.3) {
    // HOME — a restless particle ocean.
    let warp = (fbm(p * params.texture.x + vec2f(params.time * 0.04, params.seed)) - 0.5) * 0.12;
    var water = 0.0;
    for (var i = 0; i < 5; i++) {
      let fi = f32(i);
      let y = (fi - 2.0) * 0.115 + sin(p.x * (4.0 + fi * 1.7) + params.time * (0.16 + fi * 0.025) + fi) * (0.035 + fi * 0.006);
      water += exp(-abs(p.y + warp - y - params.progress * (fi - 2.0) * 0.055) * (42.0 + fi * 9.0));
    }
    var stars = 0.0;
    for (var layer = 0; layer < 3; layer++) {
      let scale = 11.0 + f32(layer) * 8.0;
      let cell = floor((p + vec2f(params.time * 0.004 * (f32(layer) + 1.0), 0.0)) * scale);
      let local = fract((p + vec2f(params.time * 0.004 * (f32(layer) + 1.0), 0.0)) * scale) - 0.5;
      let point = vec2f(hash21(cell), hash21(cell + 17.3)) - 0.5;
      stars += exp(-length(local - point * 0.62) * 38.0) * smoothstep(0.72, 0.96, hash21(cell + params.seed));
    }
    let clickRadius = (1.0 - clamp(params.impulse / 1.35, 0.0, 1.0)) * 0.6;
    let ripple = exp(-abs(distance(p, mouse) - clickRadius) * 42.0) * params.impulse;
    color += accent * water * 0.34 + primary * stars * 0.45 + second * ripple * 0.4;
    color += second * water * water * 0.1;
    color += primary * pow(max(fbm(p * 3.0 + params.seed) - 0.52, 0.0), 2.0) * 0.24;
  } else if (params.mode < 0.8) {
    // ABOUT — overlapping pieces of moving color, never a dashboard.
    color = hsl(params.primaryHue, 0.24, 0.02);
    for (var i = 0; i < 6; i++) {
      let fi = f32(i);
      var center = vec2f(sin(fi * 2.1 + params.time * 0.07), cos(fi * 1.37 - params.time * 0.055)) * vec2f(0.36, 0.25);
      center += mouse * (0.035 + fi * 0.006);
      var q = rotate(p - center, fi * 0.61 + params.progress * 0.8);
      q /= vec2f(0.18 + fract(fi * 0.31) * 0.18, 0.13 + fract(fi * 0.47) * 0.19);
      let d = length(q) - 1.0 + (fbm(q * 0.9 + fi * 4.0) - 0.5) * 0.22;
      let fill = 1.0 - smoothstep(-0.04, 0.06, d);
      let edge = exp(-abs(d) * 48.0);
      let paper = mix(primary, select(accent, second, i % 2 == 0), 0.55 + 0.25 * sin(fi));
      color = mix(color, paper * (0.45 + edge * 0.65), fill * (0.32 + fi * 0.025));
      color += paper * edge * 0.18;
    }
    let contour = pow(max(sin(fbm(p * 4.2 + params.seed) * 52.0 - params.time * 0.15) * 0.5 + 0.5, 0.0), 22.0);
    color += primary * contour * 0.22;
  } else if (params.mode < 1.5) {
    // PROJECTS — the current image sits inside an endless feedback tunnel.
    let center = mouse * 0.12;
    let q = p - center;
    var blueEcho = 0.0;
    var redEcho = 0.0;
    for (var i = 0; i < 10; i++) {
      let fi = f32(i);
      let depth = fract(fi * 0.117 + params.progress * 0.68 + params.time * 0.018);
      let scale = mix(0.45, 4.2, depth * depth);
      let turn = (depth - 0.5) * 0.18 + sin(params.time * 0.08 + fi) * 0.018;
      let box = abs(sdBox(rotate(q, turn) * scale, vec2f(0.31, 0.205)));
      let echo = exp(-box * (105.0 - depth * 35.0)) * (1.0 - depth);
      blueEcho += echo * smoothstep(0.0, 0.45, depth);
      redEcho += echo * smoothstep(0.72, 0.2, depth);
    }
    let smear = pow(max(sin((p.y + fbm(vec2f(p.x * 2.0, params.time * 0.025))) * 86.0) * 0.5 + 0.5, 0.0), 30.0);
    let aperture = 1.0 - smoothstep(0.0, 0.5, abs(sdBox(q, vec2f(0.31, 0.205))));
    color += accent * blueEcho * 0.32 + second * redEcho * 0.26 + primary * smear * 0.18;
    color += mix(second, accent, aperture) * aperture * 0.12;
    color *= 0.9 + aperture * 0.25;
  } else {
    // INFLUENCES — works gather into a hand-drawn constellation.
    color = hsl(params.primaryHue, 0.3, 0.009);
    var connections = 0.0;
    var nodes = 0.0;
    for (var i = 0; i < 14; i++) {
      let fi = f32(i);
      let angleA = fi * 2.39996 + params.seed + params.time * 0.018;
      let angleB = (fi + 1.0) * 2.39996 + params.seed + params.time * 0.018;
      let radiusA = 0.13 + fract(fi * 0.381) * 0.36;
      let radiusB = 0.13 + fract((fi + 1.0) * 0.381) * 0.36;
      let a = vec2f(cos(angleA), sin(angleA)) * radiusA;
      let b = vec2f(cos(angleB), sin(angleB)) * radiusB;
      let proximity = 1.0 - smoothstep(0.0, 0.32, distance(mouse, a));
      nodes += exp(-distance(p, a) * 105.0) * (1.0 + proximity * 2.5);
      connections += exp(-sdSegment(p, a, b) * 135.0) * 0.55;
    }
    let rings = exp(-abs(length(p) - 0.24) * 115.0) + exp(-abs(length(p) - 0.43) * 90.0) * 0.45;
    let dustCell = floor(p * 25.0);
    let dust = exp(-length(fract(p * 25.0) - 0.5) * 30.0) * smoothstep(0.82, 0.98, hash21(dustCell + params.seed));
    color += primary * connections * 0.19 + accent * nodes * 0.55 + second * rings * 0.2 + primary * dust * 0.28;
    color += accent * nodes * nodes * 0.14;
  }

  let vignette = 1.0 - smoothstep(0.32, 0.9, length((uv - 0.5) * vec2f(1.0, 0.82)));
  let grain = hash21(uv * vec2f(1920.0, 1080.0) + params.time) - 0.5;
  color = color * (0.42 + vignette * 0.66) + grain * 0.014;
  return vec4f(color, 0.98);
}
`;

export default function MachineGhostScene({
  mode,
  progress = 0,
  mediaUrl,
  exposure = 1,
}: {
  mode: MachineGhostMode;
  progress?: number;
  mediaUrl?: string;
  exposure?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const [renderer, setRenderer] = useState<'fallback' | 'webgpu'>('fallback');
  progressRef.current = progress;

  useEffect(() => {
    const container = host.current;
    if (!container || !('gpu' in navigator) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let cleanup = () => {};

    void import('vgpu').then(async ({ clock, effect, frameLoop, init, surface }) => {
      const gpu = await init();
      if (disposed) return gpu.dispose();

      const mobile = matchMedia('(max-width: 767px)').matches;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      container.prepend(canvas);
      cleanup = () => { canvas.remove(); gpu.dispose(); };

      const target = surface(gpu, canvas, { dpr: [1, mobile ? 1 : 1.5] });
      const modeValue = mode === 'home' ? 0 : mode === 'about' ? 0.6 : mode === 'projects' ? 1 : 2;
      const values = {
        pointer: [0, 0],
        texture: [2.15, 1.12, 2],
        time: 0,
        progress: 0,
        impulse: 0,
        mode: modeValue,
        aspect: innerWidth / innerHeight,
        seed: 0,
        quality: mobile ? 3 : 5,
        primaryHue: 0.1,
        accentHue: 0.61,
      };
      const visual = effect(gpu, VISUAL_SHADER, { label: 'route-visual', set: { params: values } });
      const timer = clock(gpu);
      let impulse = 0;
      let smoothProgress = progressRef.current;

      const onPointer = (event: PointerEvent) => {
        values.pointer = [event.clientX / innerWidth - 0.5, event.clientY / innerHeight - 0.5];
      };
      const onPointerDown = (event: PointerEvent) => {
        onPointer(event);
        impulse = 1.35;
      };
      const applyPreset = (value: unknown) => {
        const preset = value as { seed?: number; texture?: number[]; hue?: number; accentHue?: number } | null;
        if (!preset || typeof preset.seed !== 'number' || typeof preset.hue !== 'number' || typeof preset.accentHue !== 'number'
          || !Number.isFinite(preset.seed) || !Number.isFinite(preset.hue) || !Number.isFinite(preset.accentHue)
          || !Array.isArray(preset.texture) || preset.texture.length !== 3 || !preset.texture.every(Number.isFinite)) return;
        values.seed = preset.seed;
        values.texture = preset.texture;
        values.primaryHue = preset.hue;
        values.accentHue = preset.accentHue;
        impulse = 0;
      };
      const randomize = (event: Event) => applyPreset((event as CustomEvent).detail);
      const resize = () => { values.aspect = innerWidth / innerHeight; };

      addEventListener('pointermove', onPointer, { passive: true });
      addEventListener('pointerdown', onPointerDown, { passive: true });
      addEventListener('machine-ghost-random', randomize);
      addEventListener('resize', resize);
      try { applyPreset(JSON.parse(localStorage.getItem('machine-ghost-preset') ?? 'null')); } catch {}

      const loop = frameLoop(gpu, (frame) => {
        smoothProgress += (progressRef.current - smoothProgress) * 0.06;
        impulse *= 0.93;
        visual.set({ params: {
          pointer: values.pointer,
          texture: values.texture,
          time: timer.time,
          progress: smoothProgress,
          impulse,
          mode: values.mode,
          aspect: values.aspect,
          seed: values.seed,
          quality: values.quality,
          primaryHue: values.primaryHue,
          accentHue: values.accentHue,
        } });
        frame.pass(target, visual);
      }, { fps: mobile ? 30 : 60 });

      setRenderer('webgpu');
      cleanup = () => {
        loop.stop();
        removeEventListener('pointermove', onPointer);
        removeEventListener('pointerdown', onPointerDown);
        removeEventListener('machine-ghost-random', randomize);
        removeEventListener('resize', resize);
        canvas.remove();
        gpu.dispose();
      };
    }).catch(() => {
      cleanup();
      cleanup = () => {};
      setRenderer('fallback');
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [mode]);

  const isVideo = !!mediaUrl && /\.(mov|mp4|webm)(?:$|\?)/i.test(mediaUrl);

  return (
    <div ref={host} className="machine-ghost" data-mode={mode} data-renderer={renderer} aria-hidden="true">
      <div className="machine-ghost__residue" />
      {mediaUrl && (
        <div className="machine-ghost__projection" style={{ opacity: Math.max(0, Math.min(exposure, 1)) }}>
          {isVideo
            ? <video src={mediaUrl} autoPlay muted loop playsInline preload="metadata" />
            : <img src={mediaUrl} alt="" />}
        </div>
      )}
      <div className="machine-ghost__fallback" />
    </div>
  );
}
