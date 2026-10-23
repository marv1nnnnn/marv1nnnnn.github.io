// Fidelity follows the era: the picture itself is drawn in the medium of the years of the piece in
// hand. The tape years come through as analog video (lines that wobble, colour bleeding sideways,
// scanlines, grain), the first MP3 years as a few big pixels and a handful of colours, each year after
// a little finer, until the hi-fi headphones and monitors draw clean; the Bluetooth speakers bring
// the blocks back, as their codecs brought the loss back; the cloud at the end breaks into dots. Walking
// the hall, the picture goes from one era to the next.
//
// The scene is drawn to the screen as before, copied into a texture, and drawn again through one
// shader, so the players' screens, tone mapping and antialiasing are untouched underneath.

import * as THREE from 'three';

// Per stop: analog (0..1), pixel size (0..1 of 1..8 px), colour depth lost (0..1), dots (0..1).
export const ERAS = {
  tape: [1, 0, 0, 0],
  early: [0.12, 0.72, 0.85, 0], // the first MP3s: 128 px screens, few colours
  mp3: [0.04, 0.6, 0.8, 0],
  mp4: [0, 0.45, 0.65, 0],
  late: [0, 0.3, 0.48, 0],
  better: [0, 0.14, 0.3, 0],
  hifi: [0, 0, 0.08, 0],
  clean: [0, 0, 0, 0],
  bluetooth: [0, 0.22, 0.32, 0], // convenience: compressed again on the way to the speaker
  slight: [0, 0.06, 0.14, 0],
  stream: [0, 0, 0, 1],
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tFrame, tEra;
  uniform vec2 uRes;
  uniform float uTime, uT, uN, uDpr;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float bayer(vec2 p) {
    vec2 q = mod(p, 4.0);
    float a = mod(q.x + q.y * 4.0, 16.0);
    // the 4 x 4 ordered-dither matrix, row by row
    float m[16];
    m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
    for (int i = 0; i < 16; i++) if (float(i) == a) return m[i] / 16.0;
    return 0.0;
  }
  void main() {
    // the era: the piece you are at, or between two on the way
    vec4 e = texture2D(tEra, vec2((uT + 0.5) / uN, 0.5));
    float analog = e.r, bits = e.b, dots = e.a;
    float pix = (1.0 + e.g * 7.0) * uDpr;
    vec2 px = vUv * uRes;
    vec2 uv = vUv;

    // tape: each line drifts sideways a little, the picture breathes, colour bleeds
    float line = floor(px.y / (2.0 * uDpr));
    float wob = (hash(vec2(line, floor(uTime * 20.0))) - 0.5) * 1.6 + sin(px.y * 0.012 / uDpr + uTime * 1.1) * 1.4;
    uv.x += wob * analog * uDpr / uRes.x;

    // digital: the picture in blocks
    if (pix > 1.5 * uDpr) uv = (floor(uv * uRes / pix) * pix + pix * 0.5) / uRes;

    float bleed = analog * 2.5 * uDpr / uRes.x;
    vec3 col = vec3(
      texture2D(tFrame, uv + vec2(bleed, 0.0)).r,
      texture2D(tFrame, uv).g,
      texture2D(tFrame, uv - vec2(bleed, 0.0)).b);
    if (analog > 0.0) {
      // a soft line, warm and a little faded, with scanlines and grain
      vec3 soft = (texture2D(tFrame, uv + vec2(1.5 * uDpr / uRes.x, 0.0)).rgb + texture2D(tFrame, uv - vec2(1.5 * uDpr / uRes.x, 0.0)).rgb) * 0.5;
      col = mix(col, (col + soft) * 0.5, analog * 0.6);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l) * vec3(1.06, 1.0, 0.88), analog * 0.3);
      col *= 1.0 - analog * 0.22 * step(0.5, fract(px.y / (2.0 * uDpr)));
      col += (hash(px + fract(uTime) * 91.0) - 0.5) * 0.07 * analog;
      // a slow band of bad tracking rolling up the picture
      float band = 1.0 - smoothstep(0.0, 0.035, abs(fract(vUv.y + uTime * 0.04) - 0.5));
      col += band * analog * 0.05;
    }

    // few colours, ordered dither, as on the first colour screens
    if (bits > 0.001) {
      float lv = mix(48.0, 3.0, bits);
      col = floor(col * lv + bayer(floor(px / pix)) * 0.999) / lv;
    }

    // streamed: the picture as dots, each as big as the light there
    if (dots > 0.0) {
      float s = 7.0 * uDpr;
      vec2 c = (floor(px / s) + 0.5) * s;
      vec3 cc = texture2D(tFrame, c / uRes).rgb;
      float r = length(px - c) / (s * 0.5);
      float l = sqrt(dot(cc, vec3(0.299, 0.587, 0.114)));
      float m = 1.0 - smoothstep(l * 1.1, l * 1.1 + 0.2, r);
      col = mix(col, cc * m * 1.6, dots);
    }
    gl_FragColor = vec4(col, 1.0);
  }`;

export class Fidelity {
  constructor(renderer, eras, reduced) {
    this.renderer = renderer;
    this.reduced = reduced;
    this.n = eras.length;
    const lut = new Uint8Array(this.n * 4);
    eras.forEach((e, k) => e.forEach((v, c) => (lut[k * 4 + c] = Math.round(v * 255))));
    const tex = (data, w) => {
      const t = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
      t.magFilter = t.minFilter = THREE.LinearFilter;
      t.needsUpdate = true;
      return t;
    };
    this.frame = new THREE.FramebufferTexture(1, 1);
    this.mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        tFrame: { value: this.frame },
        tEra: { value: tex(lut, this.n) },
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uT: { value: 0 },
        uN: { value: this.n },
        uDpr: { value: 1 },
      },
    });
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.size = new THREE.Vector2();
  }

  resize() {
    this.renderer.getDrawingBufferSize(this.size);
    this.frame.dispose();
    this.frame = this.mat.uniforms.tFrame.value = new THREE.FramebufferTexture(this.size.x, this.size.y);
    this.mat.uniforms.uRes.value.copy(this.size);
    this.mat.uniforms.uDpr.value = this.renderer.getPixelRatio();
  }

  // t: where you are, a stop (0..n-1) or between two
  set(t, time) {
    const u = this.mat.uniforms;
    u.uT.value = Math.min(this.n - 1, Math.max(1, t));
    u.uTime.value = this.reduced ? 0 : time;
  }

  // Draw the scene, then draw it again through the era.
  render(scene, camera) {
    const r = this.renderer;
    r.render(scene, camera);
    r.copyFramebufferToTexture(this.frame);
    r.render(this.scene, this.camera);
  }
}
