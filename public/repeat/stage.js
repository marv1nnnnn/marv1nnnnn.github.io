// The desk, the players standing on it in the order they came, and the camera that walks along
// them as the page scrolls. Units are centimetres, as in the models (scripts/blender/repeat/):
// the players stand on the desk (y = 0) in a row along x, their fronts to +z.
//
// focus runs 0 (the whole row, from above) .. players.length + 1 (the cloud at the end); a whole
// number k >= 1 is player k picked up off the desk and held to the camera. main.js sets it from
// the scroll.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Cloud } from './cloud.js';
import { Grains } from './grains.js';

const GAP = 6.5; // between players on the desk
const CLOUD_W = 12; // the empty place at the end of the row
const PAIR_GAP = 1.4; // between two players held up side by side
const FOV = 30;
const smooth = (t) => t * t * (3 - 2 * t);
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
    scene.fog = new THREE.Fog(0x0b0a09, 120, 260);
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 600);

    // Lay the row out from the sizes the players declare, so nothing moves as the models arrive.
    let x = 0;
    this.slots = players.map((p, index) => {
      const s = { index, x: x + p.size[0] / 2, w: p.size[0], h: p.size[1], d: p.size[2] };
      x += p.size[0] + GAP;
      return s;
    });
    this.cloudX = x + CLOUD_W / 2;
    this.rowW = x + CLOUD_W;
    this.mid = this.rowW / 2;

    this.lamp();
    this.desk();
    this.cloud = new Cloud(this.cloudX);
    scene.add(this.cloud.points);
    this.grains = new Grains(scene, this.slots, players.map((p) => p.songs), this.reduced);

    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.pointer();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  lamp() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xe6ecff, 0x1a130c, 0.5));
    // A desk lamp off to the upper left, warm, its pool falling along the row.
    const key = (this.key = new THREE.SpotLight(0xffe2bd, 9000, 0, 0.62, 0.55, 2));
    key.position.set(-30, 95, 75);
    key.target.position.set(this.mid * 0.75, 0, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 5;
    key.shadow.camera.near = 40;
    key.shadow.camera.far = 260;
    s.add(key, key.target);
    // A cool fill from the right, and a rim from behind so edges and chrome read.
    const fill = new THREE.DirectionalLight(0xbfd2ff, 0.55);
    fill.position.set(this.rowW + 40, 40, 60);
    const rim = new THREE.DirectionalLight(0xfff0e0, 0.9);
    rim.position.set(this.mid, 60, -80);
    s.add(fill, rim);
  }

  // The desk: a dark mat with some grain, and a steel tape measure pulled out along the front of the
  // row, so the sizes can be read off it.
  desk() {
    const grain = document.createElement('canvas');
    grain.width = grain.height = 512;
    const g = grain.getContext('2d');
    g.fillStyle = '#7a7a7a';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26000; i++) {
      const v = 110 + Math.random() * 40;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
    }
    const tex = new THREE.CanvasTexture(grain);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(14, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1d1a17, roughness: 0.92, roughnessMap: tex, bumpMap: tex, bumpScale: 0.04 });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(700, 400), mat);
    desk.rotation.x = -Math.PI / 2;
    desk.position.set(this.mid, 0, -40);
    desk.receiveShadow = true;
    this.scene.add(desk);

    const from = -6, to = Math.ceil(this.rowW + 6);
    const len = to - from;
    const tape = document.createElement('canvas');
    const ppc = 40; // pixels per centimetre
    tape.width = Math.min(8192, len * ppc);
    tape.height = 100;
    const k = tape.width / len;
    const c = tape.getContext('2d');
    c.fillStyle = '#e8c12a';
    c.fillRect(0, 0, tape.width, tape.height);
    c.fillStyle = '#16130e';
    for (let mm = 0; mm <= len * 10; mm++) {
      const xx = (mm / 10) * k;
      const big = mm % 10 === 0, half = mm % 5 === 0;
      c.fillRect(xx - 0.6, 0, 1.2, big ? 34 : half ? 24 : 14);
    }
    c.font = '600 30px "Courier Prime", ui-monospace, monospace';
    c.textAlign = 'center';
    for (let cm = 1; cm < len; cm++) {
      c.fillStyle = cm % 10 === 0 ? '#b3241a' : '#16130e';
      c.fillText(String(cm), cm * k, 76);
    }
    const ttex = new THREE.CanvasTexture(tape);
    ttex.colorSpace = THREE.SRGBColorSpace;
    ttex.anisotropy = 8;
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(len, 2.5),
      new THREE.MeshStandardMaterial({ map: ttex, roughness: 0.42, metalness: 0.25 }),
    );
    strip.rotation.x = -Math.PI / 2;
    // the tape's 0 sits at the first player's left edge
    strip.position.set(from + len / 2, 0.03, 7.5);
    strip.receiveShadow = true;
    this.scene.add(strip);
    this.tapeAt = (x) => new THREE.Vector3(x, 0, 9.4);
  }

  // Load every player; each arrives in its place as soon as it is in.
  load() {
    const loader = new GLTFLoader();
    return Promise.all(this.players.map(async (p, i) => {
      const slot = this.slots[i];
      const holder = (slot.holder = new THREE.Group()); // stands on the desk
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
        slot.back = model.getObjectByName('back');
        if (slot.back) slot.back.userData.home = slot.back.position.clone();
        slot.ctl = (await p.setup(model, { stage: this, slot, THREE, loader })) || {};
        this.cloud.add(i, slot.meshes.filter((m) => !m.userData.prop && m.parent && this.within(m, model)), model);
      } catch (e) {
        console.warn('repeat: could not load', p.file, e);
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
  }

  // Where the camera is for a stop: the whole row from above, a player held up (with the one it is
  // compared with, if any), or the cloud.
  pose(k) {
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const aspect = this.camera.aspect;
    if (k <= 0) {
      // the whole row: square on from above on a wide screen; on a phone, from the front left, so the
      // row runs away into the picture instead of shrinking to a line across it
      if (!this.wide) return { target: new THREE.Vector3(this.mid * 0.82, 6, 0), d: this.rowW * 1.45, elev: 0.5, yaw: -0.74, shift: 0, up: 0.22 };
      const d = Math.max((this.rowW * 1.08) / (2 * tan * aspect), 46 / (2 * tan));
      return { target: new THREE.Vector3(this.mid, 4, 2), d, elev: 0.5, yaw: 0, shift: 0, up: 0.2 };
    }
    if (k > this.players.length) {
      return { target: new THREE.Vector3(this.cloudX, 9, 4), d: Math.max(30 / (2 * tan), 16 / (2 * tan * aspect * (this.wide ? 0.55 : 1))), elev: 0.12, yaw: 0, shift: 1, up: 0 };
    }
    const j = k - 1, s = this.slots[j];
    const c = this.companion(j);
    let w = s.w, h = s.h;
    const at = this.held(j, 1);
    if (c !== null) {
      const cs = this.slots[c];
      w = s.w + cs.w + PAIR_GAP;
      h = Math.max(s.h, cs.h);
      at.x -= (s.w / 2 + cs.w / 2 + PAIR_GAP) / 2;
    }
    const fitH = h / ((this.wide ? 0.62 : 0.4) * 2 * tan);
    const fitW = w / ((this.wide ? 0.5 : 0.8) * 2 * tan * aspect);
    return { target: at, d: Math.max(fitH, fitW, 14), elev: 0.1, yaw: 0, shift: 1, up: 0 };
  }

  // A player's middle when it is held up (amount 1) or standing on the desk (0).
  held(i, amount) {
    const s = this.slots[i];
    const lift = smooth(clamp(amount));
    return new THREE.Vector3(s.x, s.h / 2 + lift * (1.2 + s.h * 0.12), lift * (s.d + 9));
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

    // The camera, between the two stops either side of v.
    const k = Math.floor(v), u = smooth(clamp(v - k));
    const a = this.pose(k), b = this.pose(k + 1);
    const target = a.target.clone().lerp(b.target, u);
    const d = Math.exp(Math.log(a.d) + (Math.log(b.d) - Math.log(a.d)) * u);
    const elev = a.elev + (b.elev - a.elev) * u;
    const yaw = a.yaw + (b.yaw - a.yaw) * u;
    const shift = a.shift + (b.shift - a.shift) * u;
    const up = a.up + (b.up - a.up) * u;
    const cam = this.camera;
    cam.position.set(target.x + Math.sin(yaw) * Math.cos(elev) * d, target.y + Math.sin(elev) * d, target.z + Math.cos(yaw) * Math.cos(elev) * d);
    cam.lookAt(target);
    cam.near = d * 0.2;
    cam.far = d * 8 + 200;
    // Leave room for the words: a player sits right of them on a wide screen, above them on a phone;
    // the whole row sits high, over the opening words.
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

      // In the hand it follows the pointer, the heavier the slower.
      s.yaw ??= 0; s.pitch ??= 0; s.yawT ??= 0; s.pitchT ??= 0;
      if (!s.dragging && amount < 0.5) {
        s.yawT *= Math.exp(-dt * 4);
        s.pitchT *= Math.exp(-dt * 4);
      }
      const follow = 1 - Math.exp(-dt * 26 / Math.sqrt((this.players[i].grams || 60) / 30));
      s.yaw += (s.yawT - s.yaw) * follow;
      s.pitch += (s.pitchT - s.pitch) * follow;

      // Opened up: the back lifts away and the player turns round to show what is inside.
      if (Math.abs(v - (i + 1)) > 0.4) s.openOn = false; // shut again once its own stop is left
      s.openK = (s.openK ?? 0) + ((s.openOn ? 1 : 0) - (s.openK ?? 0)) * (1 - Math.exp(-dt * 3));
      const open = smooth(clamp(s.openK));
      if (s.back) {
        s.back.position.copy(s.back.userData.home).add(new THREE.Vector3(0, s.h * 0.75 * open, -1.2 * open));
        s.back.rotation.x = -0.6 * open;
      }

      const sway = this.reduced ? 0 : Math.sin(t * 0.5 + i) * 0.07 * amount;
      // On the desk each stands a little askew, as things are put down; held, it faces you.
      const askew = [-0.16, 0.12, -0.22, 0.18, -0.1, 0.14, -0.12][i % 7];
      const side = paired ? this.profile * (Math.PI / 2) : 0;
      s.pivot.rotation.set(-0.08 * smooth(amount) + s.pitch, (1 - smooth(amount)) * askew + s.yaw + sway + Math.PI * open + side, 0);
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
    // points are sized in the world: pixels per cm at a cm away
    this.cloud.mat.uniforms.scale.value = (this.h * this.renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    this.cloud.frame(t, dt, clamp(1 - Math.abs(v - (this.players.length + 1))), this.reduced);
    this.grains.frame();
  }

  // The buttons in the words: open up the player in hand, or turn the pair side-on.
  act(name) {
    const s = this.slots[Math.round(this.focus) - 1];
    if (!s) return undefined;
    if (name === 'open') {
      if (!s.back) return undefined;
      s.openOn = !s.openOn;
      return s.openOn;
    }
    if (name === 'profile') {
      this.profileOn = !this.profileOn;
      return this.profileOn;
    }
    return undefined;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.frame(now / 1000, dt);
      this.render();
      this.after?.();
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
  // rest of it turns in the hand. Anything else on the desk is a way to go to that player.
  pointer() {
    const c = this.canvas;
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      const hit = this.hit(e);
      if (!hit) {
        // a block of songs: shuffle it
        const b = this.grains.pick(this.ray.ray);
        if (b !== null) this.grains.shuffle(b);
        return;
      }
      const { h, i, s } = hit;
      if ((s.amount ?? 0) < 0.5) {
        this.onPick?.(i);
        return;
      }
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
        c.style.cursor = hit ? ((hit.s.amount ?? 0) < 0.5 ? 'pointer' : this.pressable(hit.h.object) || hit.s.ctl?.claims?.(this.named(hit.h.object, hit.s).name) ? 'pointer' : 'grab') : '';
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

  // Where a player stands on the screen (CSS pixels), for the labels along the tape.
  onScreen(i) {
    const s = this.slots[i] ?? { x: this.cloudX };
    return this.toScreen(this.tapeAt(s.x));
  }

  // The top of a player's block of songs on the screen.
  blockTop(i) {
    const p = this.grains.top(i);
    if (!p) return null;
    // above the block, or above the player in front of it if the block is lower than the player
    p.y = Math.max(p.y, this.slots[i].h + 1.5);
    return this.toScreen(p);
  }

  toScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: ((p.x + 1) / 2) * this.w, y: ((1 - p.y) / 2) * this.h, behind: p.z > 1 || Math.abs(p.x) > 1.2 || Math.abs(p.y) > 1.2 };
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
