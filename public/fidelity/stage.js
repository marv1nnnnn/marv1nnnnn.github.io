// The gallery: the players on plinths in the order they came, along one wall of a dark hall, each in
// its own pool of light, and you walking past them at eye height as the page scrolls. Units are
// centimetres, as in the models (scripts/blender/fidelity/): the players stand on the plinth tops
// (y = 0, a metre off the floor) in a row along x, their fronts to +z, where the walk runs.
//
// focus runs 0 (at the door) .. players.length + 1 (the cloud at the end); a whole number k >= 1 is
// player k picked up off its plinth and held to you. main.js sets it from the scroll; a drag looks
// round (look), and walking on brings the eyes back to the way ahead.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Cloud } from './cloud.js';
import { Grains, footOf, BEHIND } from './grains.js';
import { Fidelity, ERAS } from './fidelity.js';

const STEP = 170; // from plinth to plinth
const PAD = 3; // plinth to spare round what stands on it
const TOP = 36; // a plinth top at the least, square
const PLINTH_H = 100;
const EYE = 60; // eye height above the plinth tops: 160 cm off the floor
const WALK = 140; // the line people walk, out from the plinths' fronts
const WALL = 45; // from the plinths' backs to the wall
const PX = 4; // cm to a pixel, for the light on the floor and wall
const KEY = 5200;
const KEY_AT = new THREE.Vector3(-35, 55, 70); // the key light, from the camera's mark
const CLOUD_W = 12; // the empty plinth at the end of the row
const PAIR_GAP = 1.4; // between two players held up side by side
const FOV = 30; // a piece in hand, as through a long lens
const SEE = 52; // walking: the eyes' own
const smooth = (t) => t * t * (3 - 2 * t);
// through b (u = 0) to c (u = 1), in the line a..d makes: Catmull-Rom
const cr = (a, b, c, d, u) => b + 0.5 * u * (c - a + u * (2 * a - 5 * b + 4 * c - d + u * (3 * (b - c) + d - a)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export class Stage {
  constructor(canvas, players, { onPick } = {}) {
    this.canvas = canvas;
    this.players = players; // the controllers in devices/*.js, in order
    this.onPick = onPick;
    this.focus = 0;
    this.progress = []; // how far through each player's own stop the page is, 0..1 (main.js)
    this.profile = 0; // the pair turned side-on, eased
    this.profileOn = false;
    this.engaged = null; // the player last touched, which gets the keys
    this.shown = 0; // focus, eased
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    const gl = r.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    this.lowPower = /swiftshader|llvmpipe|software|softpipe/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '');
    r.shadowMap.enabled = !this.lowPower;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x0b0a09);
    scene.fog = new THREE.Fog(0x0b0a09, 140, 300); // set from the camera's distance (frame)
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
    pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 4000);
    this.camera.rotation.order = 'YXZ'; // turn, then look up or down
    this.look = { yaw: 0, pitch: 0 }; // where the eyes have been dragged from the way ahead
    this.walking = 0; // how fast, eased: the step in the eyes

    // Lay the row out from the sizes the players declare, so nothing moves as the models arrive: a
    // plinth for each, a step apart, wide enough for the player and its block of songs, deep enough
    // for the deepest block behind its player.
    this.slots = players.map((p, index) => {
      const pw = Math.max(TOP, Math.max(p.size[0], footOf(p.songs)) + 2 * PAD);
      // up: how tall it stands in the hand; what lies flat (earphones) is tilted up to show its face
      return { index, x: index * STEP, pw, w: p.size[0], h: p.size[1], d: p.size[2], up: p.flat ? p.size[2] : p.size[1] };
    });
    this.cloudX = players.length * STEP;
    this.mid = this.cloudX / 2;
    // the front edge: room for the repeater's spare tape, or the deepest thing standing there
    this.front = Math.max(11, ...players.map((p) => p.size[2] / 2 + PAD + 2));
    this.rear = Math.min(this.front - TOP, -(Math.max(...players.map((p) => p.size[2] / 2 + BEHIND + footOf(p.songs))) + PAD));
    this.walkZ = this.front + WALK;
    this.wallZ = this.rear - WALL;

    this.lamp();
    this.plinths();
    this.room();
    this.cloud = new Cloud(this.cloudX);
    scene.add(this.cloud.points);
    this.grains = new Grains(scene, this.slots, players, this.reduced);

    // one era per stop: the door, each piece, and the cloud
    this.fidelity = new Fidelity(r, [ERAS.tape, ...players.map((p) => ERAS[p.era] ?? ERAS.clean), ERAS.stream], this.reduced);
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.pointer();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  lamp() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xe6ecff, 0x1a130c, 0.12));
    // The light on the player in hand, from up front left: it aims where the camera does and comes
    // up as a player is lifted off its plinth (frame).
    const key = (this.key = new THREE.SpotLight(0xffe2bd, 0, 0, 0.42, 0.7, 2));
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 5;
    key.shadow.camera.near = 20;
    key.shadow.camera.far = 300;
    s.add(key, key.target);
    // Straight down from the ceiling onto the plinths; their tops carry the pools of light (plinths).
    const top = new THREE.DirectionalLight(0xfff0dc, 0.6);
    top.position.set(this.mid, 100, 10);
    top.target.position.set(this.mid, 0, 0);
    s.add(top, top.target);
    // A faint rim from behind, so dark edges and chrome still read.
    const rim = new THREE.DirectionalLight(0xfff0e0, 0.5);
    rim.position.set(this.mid, 60, -80);
    s.add(rim);
  }

  // The plinths, a pool of light on each top as if from a pinspot, the sides falling away into the
  // dark below (one light for the whole gallery: a spot a plinth is too many lights for a phone);
  // and under each player the soft shadow the light from above casts, which fades as it is lifted.
  plinths() {
    const pool = document.createElement('canvas');
    pool.width = pool.height = 128;
    const pg = pool.getContext('2d');
    const pgrd = pg.createRadialGradient(64, 64, 0, 64, 64, 90);
    pgrd.addColorStop(0, '#fff');
    pgrd.addColorStop(0.45, '#d8d8d8');
    pgrd.addColorStop(1, '#3a3a3a');
    pg.fillStyle = pgrd;
    pg.fillRect(0, 0, 128, 128);
    const poolTex = new THREE.CanvasTexture(pool);
    poolTex.colorSpace = THREE.SRGBColorSpace;
    const side = new THREE.MeshStandardMaterial({ color: 0x6e6a64, roughness: 0.9, vertexColors: true, envMapIntensity: 0.2 });
    const lit = new THREE.MeshStandardMaterial({ color: 0x6e6a64, roughness: 0.9, map: poolTex, envMapIntensity: 0.2 });
    const mats = [side, side, lit, side, side, side]; // BoxGeometry's faces: +x -x +y -y +z -z
    const plinth = (x, w) => {
      const g = new THREE.BoxGeometry(w, PLINTH_H, this.front - this.rear, 1, 12, 1);
      const pos = g.attributes.position;
      const col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) col.fill(0.05 + 0.95 * ((pos.getY(i) + PLINTH_H / 2) / PLINTH_H) ** 6, i * 3, i * 3 + 3);
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const m = new THREE.Mesh(g, mats);
      m.position.set(x, -PLINTH_H / 2, (this.rear + this.front) / 2);
      m.receiveShadow = true;
      this.scene.add(m);
    };
    this.slots.forEach((t) => plinth(t.x, t.pw));
    plinth(this.cloudX, Math.max(TOP, CLOUD_W + 2 * PAD));

    const blob = document.createElement('canvas');
    blob.width = blob.height = 64;
    const g = blob.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(blob);
    this.slots.forEach((t) => {
      t.blob = new THREE.Mesh(new THREE.PlaneGeometry(t.w + 2, t.d + 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      t.blob.rotation.x = -Math.PI / 2;
      t.blob.position.set(t.x, 0.02, 0);
      this.scene.add(t.blob);
    });
  }

  // The hall: a floor with the light spilling off each plinth onto it, the wall behind washed above
  // each, and on the wall over each its number and the year it came. Drawn once (no light of its
  // own: a lamp a plinth is too many for a phone).
  room() {
    const x0 = -STEP * 2.5, x1 = this.cloudX + STEP * 2, xs = [...this.slots.map((t) => t.x), this.cloudX];
    const surface = (w, h, draw) => {
      const c = document.createElement('canvas');
      c.width = Math.ceil(w / PX);
      c.height = Math.ceil(h / PX);
      const g = c.getContext('2d');
      g.scale(1 / PX, 1 / PX);
      draw(g);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
    };
    const glow = (g, x, y, rx, ry, a) => {
      g.save();
      g.translate(x, y);
      g.scale(1, ry / rx);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      grd.addColorStop(0, `rgba(255, 238, 214, ${a})`);
      grd.addColorStop(1, 'rgba(255, 238, 214, 0)');
      g.fillStyle = grd;
      g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      g.restore();
    };
    // the floor, seen from above with the wall at the top of the picture
    const fd = this.walkZ + 500 - this.wallZ;
    const floor = surface(x1 - x0, fd, (g) => {
      g.fillStyle = '#16140f';
      g.fillRect(0, 0, x1 - x0, fd);
      xs.forEach((x) => glow(g, x - x0, this.front + 30 - this.wallZ, 120, 80, 0.13));
    });
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((x0 + x1) / 2, -PLINTH_H, this.wallZ + fd / 2);
    const wh = 380;
    const wall = surface(x1 - x0, wh, (g) => {
      g.fillStyle = '#121010';
      g.fillRect(0, 0, x1 - x0, wh);
      xs.forEach((x) => glow(g, x - x0, wh - PLINTH_H - 60, 85, 170, 0.1));
    });
    wall.position.set((x0 + x1) / 2, wh / 2 - PLINTH_H, this.wallZ);
    this.scene.add(floor, wall);

    // the lettering, once the site's type is in
    const years = [...this.players.map((p) => String(p.got)), '2017 –'];
    const marks = xs.map((x, i) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(48, 24), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      m.position.set(x, 62, this.wallZ + 0.5);
      this.scene.add(m);
      return { c, tex, n: String(i + 1).padStart(2, '0'), year: years[i] };
    });
    const type = ['44px "Courier Prime"', '112px "Libre Caslon Text"'];
    Promise.all(type.map((f) => document.fonts.load(f))).catch(() => {}).then(() => marks.forEach(({ c, tex, n, year }) => {
      const g = c.getContext('2d');
      g.fillStyle = '#b3a998';
      g.textAlign = 'center';
      g.font = type[0];
      g.fillText(n, 256, 60);
      g.font = type[1];
      g.fillText(year, 256, 200);
      tex.needsUpdate = true;
    }));
  }

  // Load every player; each arrives in its place as soon as it is in.
  load() {
    const loader = new GLTFLoader();
    return Promise.all(this.players.map(async (p, i) => {
      const slot = this.slots[i];
      const holder = (slot.holder = new THREE.Group()); // stands on the plinth
      const pivot = (slot.pivot = new THREE.Group()); // turns about the player's middle
      holder.position.set(slot.x, 0, 0);
      pivot.position.y = slot.h / 2;
      holder.add(pivot);
      this.scene.add(holder);
      try {
        const gltf = await loader.loadAsync(p.file);
        const model = gltf.scene;
        model.position.y = -slot.h / 2;
        pivot.add(model);
        slot.model = model;
        slot.meshes = [];
        model.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            slot.meshes.push(o);
            const m = o.material;
            if (m && m.transparent) { o.castShadow = false; m.depthWrite = false; }
          }
          if (o.userData && o.userData.press) o.userData.rest = o.position.clone();
        });
        slot.ctl = (await p.setup(model, { stage: this, slot, THREE, loader })) || {};
        this.cloud.add(i, slot.meshes.filter((m) => !m.userData.prop && m.parent && this.within(m, model)), model);
      } catch (e) {
        console.warn('fidelity: could not load', p.file, e);
        slot.meshes = [];
      }
    }));
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.w = w;
    this.h = h;
    this.renderer.setPixelRatio(this.lowPower ? 0.6 : Math.min(devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.wide = w / h > 1.05;
    this.fidelity?.resize();
  }

  // The camera's marks along the walk, every half stop (j = 2 × focus): at the door, a piece in hand
  // and the cloud on the whole stops; on the halves, on the walk between two, eyes on the next.
  mark(j) {
    const n = this.players.length;
    const at = (k) => (k <= 0 ? -STEP : k > n ? this.cloudX : this.slots[k - 1].x);
    // a phone held upright sees a narrow slice: wider, and turned to the next piece
    const see = this.wide ? SEE : 64;
    if (j <= 0) return { pos: new THREE.Vector3(-STEP * 1.9, EYE, this.walkZ + 40), yaw: this.wide ? -1.0 : -0.85, pitch: -0.14, shift: 0, up: this.wide ? 0.08 : 0.2, d: 600, fov: see };
    if (j % 2) return { pos: new THREE.Vector3((at((j - 1) / 2) + at((j + 1) / 2)) / 2, EYE, this.walkZ), yaw: this.wide ? -0.72 : -0.55, pitch: -0.2, shift: 0, up: this.wide ? 0 : 0.12, d: 500, fov: see };
    const { target, d, elev, shift, up } = this.pose(j / 2);
    return { pos: target.clone().add(new THREE.Vector3(0, Math.sin(elev) * d, Math.cos(elev) * d)), yaw: 0, pitch: -elev, shift, up, d, fov: FOV };
  }

  // What the camera looks at for a stop, from how far and how high: a player held up (with the one
  // it is compared with, if any), or the cloud.
  pose(k) {
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const aspect = this.camera.aspect;
    if (k > this.players.length) {
      return { target: new THREE.Vector3(this.cloudX, 9, 4), d: Math.max(30 / (2 * tan), 16 / (2 * tan * aspect * (this.wide ? 0.55 : 1))), elev: 0.12, shift: 1, up: 0 };
    }
    const j = k - 1, s = this.slots[j];
    const c = this.companion(j);
    let w = s.w, h = s.up;
    const at = this.held(j, 1);
    if (c !== null) {
      const cs = this.slots[c];
      w = s.w + cs.w + PAIR_GAP;
      h = Math.max(s.up, cs.up);
      at.x -= (s.w / 2 + cs.w / 2 + PAIR_GAP) / 2;
    }
    const fitH = h / ((this.wide ? 0.62 : 0.4) * 2 * tan);
    const fitW = w / ((this.wide ? 0.5 : 0.8) * 2 * tan * aspect);
    return { target: at, d: Math.max(fitH, fitW, 14), elev: 0.1, shift: 1, up: 0 };
  }

  // A player's middle when it is held up (amount 1) or standing on its plinth (0).
  held(i, amount) {
    const s = this.slots[i];
    const lift = smooth(clamp(amount));
    return new THREE.Vector3(s.x, s.h / 2 + lift * (1.2 + s.up * 0.12 + (s.up - s.h) / 2), lift * (s.d + 9));
  }

  // The player another is held up beside (the Zune has the iPod it replaced next to it), or null.
  companion(j) {
    const id = this.players[j]?.companion;
    if (!id) return null;
    const c = this.players.findIndex((p) => p.id === id);
    return c >= 0 ? c : null;
  }

  // Where player c is held, beside player j, as j's stop comes up (a).
  beside(j, c, a) {
    const s = this.slots[j], cs = this.slots[c];
    const to = this.held(c, 1);
    to.x = s.x - (s.w / 2 + cs.w / 2 + PAIR_GAP);
    to.z = this.held(j, 1).z;
    return this.held(c, 0).lerp(to, smooth(clamp(a)));
  }

  frame(t, dt) {
    const f = this.focus;
    this.shown += (f - this.shown) * (1 - Math.exp(-dt * (this.reduced ? 30 : 7)));
    if (Math.abs(f - this.shown) < 1e-4) this.shown = f;
    const v = this.shown;

    // The camera, along the walk through the marks either side of v.
    const last = 2 * (this.players.length + 1);
    const j = Math.floor(v * 2), u = v * 2 - j;
    const m = [j - 1, j, j + 1, j + 2].map((q) => this.mark(Math.min(last, Math.max(0, q))));
    const along = (f) => cr(f(m[0]), f(m[1]), f(m[2]), f(m[3]), u);
    const d = Math.exp(along((p) => Math.log(p.d)));
    const yaw = along((p) => p.yaw), pitch = along((p) => p.pitch);
    const shift = along((p) => p.shift), up = along((p) => p.up);
    const cam = this.camera;
    cam.position.set(along((p) => p.pos.x), along((p) => p.pos.y), along((p) => p.pos.z));
    // what it looks at before the eyes wander: the piece in hand, or the way ahead
    const target = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(d).add(cam.position);
    // Walking brings the eyes back to the way ahead, and puts a step in them.
    const moved = Math.abs(v - (this.was ?? v));
    this.was = v;
    this.walking += (clamp((moved / Math.max(dt, 1e-3)) * 1.5) - this.walking) * (1 - Math.exp(-dt * 4));
    this.look.yaw *= Math.exp(-moved * 5);
    this.look.pitch *= Math.exp(-moved * 5);
    if (!this.reduced) cam.position.y += Math.sin(v * Math.PI * 6) * 0.8 * this.walking;
    cam.rotation.set(pitch + this.look.pitch, yaw + this.look.yaw, 0);
    cam.fov = along((p) => p.fov);
    cam.near = Math.min(10, d * 0.2);
    this.scene.fog.near = d * 1.2;
    this.scene.fog.far = d * 3.5;
    // Leave room for the words: a player sits right of them on a wide screen, above them on a phone;
    // the hall sits high, over the opening words.
    if (this.wide) cam.setViewOffset(this.w, this.h, -this.w * 0.15 * shift, this.h * up, this.w, this.h);
    else cam.setViewOffset(this.w, this.h, 0, this.h * (0.25 * shift + up), this.w, this.h);
    cam.updateProjectionMatrix();

    // Side-on for the comparison, only while its stop is in hand.
    const here = Math.round(v) - 1;
    if (this.companion(here) === null || Math.abs(v - (here + 1)) > 0.3) this.profileOn = false;
    this.profile += ((this.profileOn ? 1 : 0) - this.profile) * (1 - Math.exp(-dt * 3));

    // Each player: lifted as the focus nears it, turned to the camera, swaying a little.
    this.slots.forEach((s, i) => {
      if (!s.holder) return;
      let amount = clamp(1 - Math.abs(v - (i + 1)));
      let p = this.held(i, amount);
      let paired = this.companion(i) !== null && amount > 0;
      this.players.forEach((q, j) => {
        if (j === i || this.companion(j) !== i) return;
        const aj = clamp(1 - Math.abs(v - (j + 1)));
        if (aj > amount) {
          amount = aj;
          p = this.beside(j, i, aj);
          paired = true;
        }
      });
      s.amount = amount;
      s.holder.position.set(p.x, p.y - s.h / 2, p.z);
      s.blob.material.opacity = 1 - smooth(amount);

      // In the hand it follows the pointer, the heavier the slower.
      s.yaw ??= 0; s.pitch ??= 0; s.yawT ??= 0; s.pitchT ??= 0;
      if (!s.dragging && amount < 0.5) {
        s.yawT *= Math.exp(-dt * 4);
        s.pitchT *= Math.exp(-dt * 4);
      }
      const follow = 1 - Math.exp(-dt * 26 / Math.sqrt(Math.min(this.players[i].grams || 60, 3000) / 30));
      s.yaw += (s.yawT - s.yaw) * follow;
      s.pitch += (s.pitchT - s.pitch) * follow;

      const sway = this.reduced ? 0 : Math.sin(t * 0.5 + i) * 0.07 * amount;
      // On its plinth each stands a little askew; held, it faces you.
      const askew = [-0.16, 0.12, -0.22, 0.18, -0.1, 0.14, -0.12][i % 7];
      const side = paired ? this.profile * (Math.PI / 2) : 0;
      const tilt = this.players[i].flat ? 1.25 : -0.08;
      s.pivot.rotation.set(tilt * smooth(amount) + s.pitch, (1 - smooth(amount)) * askew + s.yaw + sway + side, 0);
      // Pressed parts travel in and come back out.
      if (s.model) {
        for (const m of s.meshes) {
          const o = this.pressable(m);
          if (!o || !o.userData.rest) continue;
          // a mechanical key the player latched (play, wind) stays down until it lets go
          const want = o === s.down || o.userData.latch ? 1 : 0;
          o.userData.k = (o.userData.k ?? 0) + (want - (o.userData.k ?? 0)) * (1 - Math.exp(-dt * 30));
          const depth = o.userData.press * o.userData.k;
          o.position.copy(o.userData.rest);
          // into the body from the front (glTF -Z), or as the part says: 'z' down, 'x' / '-x' sideways
          const axis = o.userData.axis;
          if (axis === 'z') o.position.y -= depth;
          else if (axis === 'x' || axis === '+x') o.position.x += depth;
          else if (axis === '-x') o.position.x -= depth;
          else o.position.z -= depth;
        }
      }
      s.ctl?.frame?.(t, dt, amount, this.progress[i] ?? 0);
    });
    const held = Math.max(0, ...this.slots.map((s) => s.amount ?? 0));
    this.key.intensity = KEY * smooth(held);
    this.key.target.position.copy(target);
    this.key.position.copy(target).add(KEY_AT);
    // points are sized in the world: pixels per cm at a cm away
    this.cloud.mat.uniforms.scale.value = (this.h * this.renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    this.cloud.frame(t, dt, clamp(1 - Math.abs(v - (this.players.length + 1))), this.reduced);
    // the picture in the medium of the piece you are at
    this.fidelity.set(v, t);
    this.grains.frame();
  }

  // The button in the words: turn the pair side-on.
  act(name) {
    if (!this.slots[Math.round(this.focus) - 1]) return undefined;
    if (name === 'profile') {
      this.profileOn = !this.profileOn;
      return this.profileOn;
    }
    return undefined;
  }

  render() {
    this.fidelity.render(this.scene, this.camera);
  }

  start() {
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.frame(now / 1000, dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // A quick press and release, for a part the player's own logic decided was clicked.
  tap(o) {
    if (o && o.userData.press) o.userData.k = 1;
  }

  within(o, root) {
    for (let p = o; p; p = p.parent) if (p === root) return true;
    return false;
  }

  // The object a press acts on: the mesh or the nearest ancestor that has a `press` travel.
  pressable(o) {
    for (let p = o; p && p.type !== 'Scene'; p = p.parent) if (p.userData && p.userData.press) return p;
    return null;
  }

  named(o, slot) {
    for (let p = o; p && p !== slot.model; p = p.parent) if (p.name && p.name !== 'Scene') return p;
    return o;
  }

  hit(e) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    let best = null;
    this.slots.forEach((s, i) => {
      if (!s.meshes?.length) return;
      const h = this.ray.intersectObjects(s.meshes, false)[0];
      if (h && (!best || h.distance < best.h.distance)) best = { h, i, s };
    });
    return best;
  }

  // The pointer as a point on the held player's front plane, in the player's own coordinates.
  local(e, s) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    s.model.updateWorldMatrix(true, false);
    const inv = s.model.matrixWorld.clone().invert();
    const ray = this.ray.ray.clone().applyMatrix4(inv);
    const p = new THREE.Vector3();
    return ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -(s.frontZ ?? s.d / 2)), p) ? p : null;
  }

  // Touch and mouse: a held player's parts are pressed, its wheel or screen may take a drag, and the
  // rest of it turns in the hand. Anywhere else a drag looks round, and a tap goes to the piece under
  // it, or shuffles a block of songs.
  pointer() {
    const c = this.canvas;
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      const hit = this.hit(e);
      if (!hit || (hit.s.amount ?? 0) < 0.5) {
        drag = { look: true, x: e.clientX, y: e.clientY, yaw: this.look.yaw, pitch: this.look.pitch, pick: hit ? hit.i : null, moved: false };
        c.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      const { h, i, s } = hit;
      const part = this.named(h.object, s);
      const press = this.pressable(h.object);
      const ctl = s.ctl;
      const claim = ctl.claim?.(part.name, { uv: h.uv, point: s.model.worldToLocal(h.point.clone()), local: this.local(e, s) });
      if (press && !claim) {
        s.down = press;
        ctl.press?.(press.name, { uv: h.uv, local: this.local(e, s) });
      }
      this.engaged = i;
      drag = { s, x: e.clientX, y: e.clientY, yaw: s.yawT, pitch: s.pitchT, part: claim ? part.name : null, press: claim ? null : press };
      if (!claim && !press) s.dragging = true;
      c.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) {
        const hit = this.hit(e);
        c.style.cursor = hit ? ((hit.s.amount ?? 0) < 0.5 ? 'pointer' : this.pressable(hit.h.object) || hit.s.ctl?.claims?.(this.named(hit.h.object, hit.s).name) ? 'pointer' : 'grab') : 'grab';
        return;
      }
      if (drag.look) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.moved ||= Math.hypot(dx, dy) > 6;
        if (!drag.moved) return;
        c.style.cursor = 'grabbing';
        // the hall follows the hand, as far as a turn of the head
        this.look.yaw = clamp(drag.yaw + (dx / this.w) * 2.4, -1.3, 1.3);
        this.look.pitch = clamp(drag.pitch + (dy / this.h) * 1.4, -0.45, 0.45);
        return;
      }
      const { s } = drag;
      if (drag.part) {
        s.ctl.drag?.(drag.part, { local: this.local(e, s), dx: e.clientX - drag.x, dy: e.clientY - drag.y });
        return;
      }
      if (drag.press) return;
      c.style.cursor = 'grabbing';
      s.yawT = drag.yaw + ((e.clientX - drag.x) / this.w) * 5;
      s.pitchT = clamp(drag.pitch + ((e.clientY - drag.y) / this.h) * 3, -1.1, 1.1);
    });
    const up = (e) => {
      if (!drag) return;
      if (drag.look) {
        if (!drag.moved && e.type === 'pointerup') {
          if (drag.pick !== null) this.onPick?.(drag.pick);
          else if (!this.hit(e)) {
            const b = this.grains.pick(this.ray.ray);
            if (b !== null) this.grains.shuffle(b);
          }
        }
        drag = null;
        c.style.cursor = '';
        return;
      }
      const { s } = drag;
      if (drag.part) s.ctl.drop?.(drag.part, { local: this.local(e, s), dx: e.clientX - drag.x, dy: e.clientY - drag.y });
      if (drag.press) s.ctl.release?.(drag.press.name);
      s.down = null;
      s.dragging = false;
      drag = null;
      c.style.cursor = '';
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
  }
}

// A canvas the page draws a player's display into, mapped onto its `screen` quad (glTF UVs start at
// the top, so no flip). `pixels` keeps a small display's pixels square and sharp.
export function screen(mesh, w, h, { scale = 2, pixels = false, glow = 1, additive = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = 8;
  if (pixels) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
  }
  // additive: a display behind a mirror, where black is the mirror and only lit pixels show
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, ...(additive ? { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } : {}) });
  mat.color.setScalar(glow);
  if (mesh) mesh.material = mat;
  return { canvas, ctx, tex, w, h, mat, show() { tex.needsUpdate = true; } };
}
