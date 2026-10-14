// The last place in the row has no player in it. After the Zune the music came from nowhere you
// could hold, so what stands there is a cloud of points taken off the surfaces of every player before
// it, drifting from one shape to the next and never settling: a mix, in a cloud.

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const N = 9000; // points per shape
const SIZE = 12; // how tall each shape stands in the cloud, cm
const HOLD = 3.2; // seconds a shape holds before it goes
const MOVE = 3.4; // seconds to become the next

export class Cloud {
  constructor(x) {
    this.shapes = [];
    this.order = [];
    const geo = new THREE.BufferGeometry();
    this.a = new Float32Array(N * 3);
    this.b = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const tint = new Float32Array(N * 3);
    // the cloud is the songs: each point takes a colour from the blocks on the desk
    const songs = ['#e94e3c', '#f2c14e', '#3fa7d6', '#8a5cf6', '#59cd90', '#ee6c9b', '#f2f2f2', '#ff6b2a', '#d42f8a', '#94643f', '#f08a2c', '#4aa0ff'];
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      seed[i] = Math.random();
      c.set(songs[Math.floor(Math.random() * songs.length)]);
      tint.set([c.r, c.g, c.b], i * 3);
    }
    // Until the players are in, a loose haze where the cloud will be.
    for (let i = 0; i < N * 3; i += 3) {
      const r = 3 + Math.random() * 4, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      this.a[i] = this.b[i] = r * Math.sin(p) * Math.cos(t);
      this.a[i + 1] = this.b[i + 1] = r * Math.cos(p) * 0.7;
      this.a[i + 2] = this.b[i + 2] = r * Math.sin(p) * Math.sin(t) * 0.6;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.a, 3));
    geo.setAttribute('b', new THREE.BufferAttribute(this.b, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        mixT: { value: 0 },
        time: { value: 0 },
        scatter: { value: 0.4 },
        opacity: { value: 0.25 },
        scale: { value: 600 },
        colA: { value: new THREE.Color(0xffd9a8) },
        colB: { value: new THREE.Color(0xa8c8ff) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 b;
        attribute float seed;
        attribute vec3 tint;
        uniform float mixT, time, scatter, scale;
        varying float vSeed;
        varying float vMix;
        varying vec3 vTint;
        void main() {
          // each point leaves and lands at its own moment, so the shapes come apart in drifts
          float m = smoothstep(seed * 0.45, seed * 0.45 + 0.55, mixT);
          vec3 p = mix(position, b, m);
          float s = sin(3.14159 * m) * (0.9 + scatter) + scatter * 0.5;
          float ph = seed * 43.0 + time * (0.25 + seed * 0.35);
          p += s * vec3(sin(ph) * 2.6 + sin(p.y * 0.4 + time * 0.5), cos(ph * 1.3) * 1.8 + 1.2 * s, sin(ph * 0.7) * 2.2);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(1.5, (0.09 + 0.07 * fract(seed * 7.0)) * scale / -mv.z);
          vSeed = seed;
          vMix = m;
          vTint = tint;
        }`,
      fragmentShader: /* glsl */ `
        uniform float opacity;
        uniform vec3 colA, colB;
        varying float vSeed;
        varying float vMix;
        varying vec3 vTint;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = dot(c, c);
          if (d > 0.25) discard;
          float a = (1.0 - d * 4.0) * opacity * (0.55 + 0.45 * fract(vSeed * 13.0));
          gl_FragColor = vec4(mix(vTint, mix(colA, colB, vSeed), 0.25), a);
        }`,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.position.set(x, SIZE / 2 + 1.5, 0);
    this.points.frustumCulled = false;
    this.geo = geo;
    this.from = -1;
  }

  // Take a player's surface: N points spread by area over its meshes, centred and scaled to SIZE.
  add(i, meshes, model) {
    if (!meshes.length) return;
    model.updateWorldMatrix(true, true);
    const inv = model.matrixWorld.clone().invert();
    const parts = meshes
      .filter((m) => m.geometry.index || m.geometry.attributes.position.count >= 3)
      .map((m) => {
        const s = new MeshSurfaceSampler(m).build();
        return { s, area: s.distribution[s.distribution.length - 1], mat: inv.clone().multiply(m.matrixWorld) };
      })
      .filter((p) => p.area > 0);
    const total = parts.reduce((t, p) => t + p.area, 0);
    const pts = new Float32Array(N * 3);
    const v = new THREE.Vector3();
    const box = new THREE.Box3();
    let n = 0;
    for (let k = 0; k < N; k++) {
      // pick a part by area, then a point on it
      let r = Math.random() * total, p = parts[0];
      for (const q of parts) {
        if ((r -= q.area) <= 0) { p = q; break; }
      }
      p.s.sample(v);
      v.applyMatrix4(p.mat);
      pts.set([v.x, v.y, v.z], n);
      box.expandByPoint(v);
      n += 3;
    }
    const c = box.getCenter(new THREE.Vector3());
    const k = SIZE / Math.max(box.max.y - box.min.y, (box.max.x - box.min.x) * 0.9);
    for (let j = 0; j < N * 3; j += 3) {
      pts[j] = (pts[j] - c.x) * k;
      pts[j + 1] = (pts[j + 1] - c.y) * k;
      pts[j + 2] = (pts[j + 2] - c.z) * k;
    }
    this.shapes[i] = pts;
    this.order = this.shapes.map((s, j) => (s ? j : -1)).filter((j) => j >= 0);
  }

  frame(t, dt, amount, reduced) {
    const u = this.mat.uniforms;
    u.time.value = t;
    u.opacity.value = 0.3 + 0.6 * amount;
    u.scatter.value = 0.12 + 0.5 * (1 - amount);
    this.points.rotation.y = reduced ? 0 : Math.sin(t * 0.15) * 0.5;
    const n = this.order.length;
    if (!n) return;
    const period = HOLD + MOVE;
    const step = Math.floor(t / period);
    const from = this.order[step % n], to = this.order[(step + 1) % n];
    if (step !== this.from) {
      this.from = step;
      this.a.set(this.shapes[from]);
      this.b.set(this.shapes[to]);
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.b.needsUpdate = true;
    }
    const k = (t - step * period - HOLD) / MOVE;
    u.mixT.value = reduced ? (k > 0.5 ? 1 : 0) : Math.min(1, Math.max(0, k));
  }
}
