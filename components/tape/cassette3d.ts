// The home cassette in WebGL: the model is built in Blender (scripts/blender/cassette.py) and
// loaded as public/models/cassette.glb. The label is drawn here, so it can show the tracks and
// the counter. Loaded only on the home page, after first paint.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LOOKS, type TapeLook } from './tapes';

// Must match scripts/blender/cassette.py (centimetres, cassette face +Z, long side X).
const HUB_X = 2.1;
const HUB_Y = 0.3;
const WIN = { w: 6.8, h: 2.0 };
const LABEL = { w: 8.6, h: 4.2, y: 0.45 };
const PACK = { min: 0.8, max: 2.4 };
// How far the pencil leans off the hub axis: well over on the home page, nearly upright when docked.
const TILT_HOME = THREE.MathUtils.degToRad(64);
const TILT_DOCK = THREE.MathUtils.degToRad(28);

// side: which side is up (sides.ts); print: the small print under the tape's name.
export interface LabelInfo { side: 'A' | 'B'; tracks: string[]; current: number; count: string; print: string }

const PRINT_A = 'marv1nnnnn · C-60 · NORMAL BIAS 120µs';

export class CassetteScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 1, 200);
  private rig = new THREE.Group(); // tilt and float
  private space = new THREE.Group(); // cassette coordinates: x long side, y up, z out of the face
  private hubL?: THREE.Object3D;
  private hubR?: THREE.Object3D;
  private packL?: THREE.Object3D;
  private packR?: THREE.Object3D;
  private pencil?: THREE.Object3D;
  private hits: THREE.Object3D[] = [];
  private label = document.createElement('canvas');
  private labelTex: THREE.CanvasTexture;
  private labelKey = '';
  private ray = new THREE.Raycaster();
  private face = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.6);
  private raf = 0;
  private t0 = performance.now();
  private width = 1;
  private height = 1;
  // Set by the page every frame.
  pencilAngle = 0.45;
  hubAngleL = 0;
  hubAngleR = 0;
  wound = 0; // 0..1, how much tape has moved to the right reel
  still = false;
  info: LabelInfo = { side: 'A', tracks: [], current: 0, count: '000', print: PRINT_A };
  // What the label shows: info, except while the cassette is turning over and the old side is
  // still up.
  private shown: LabelInfo = this.info;
  private loaded = false;
  // How far the cassette is turned over on its long axis, from the side that is up: 0 lies flat,
  // ±π/2 is on edge. Held by the page while a hand turns it (yawHeld); let go, it settles on the
  // nearer side, and a change of side in info turns it the rest of the way over.
  yawHeld: number | null = null;
  private yaw = 0;
  // Bumped when the label's fonts arrive, so it is written again in them.
  private fontsIn = 0;
  private look: TapeLook = LOOKS.haze;
  private mats: Record<string, THREE.MeshStandardMaterial[]> = {};
  private swapT0 = -1;
  private pencilHits: THREE.Object3D[] = [];
  private m = 0; // 0 on the home page, 1 docked in the top bar
  private lastFrame = performance.now();
  private renderKey = '';
  // The top-bar slot the cassette docks into, in CSS pixels; null keeps it on the home page.
  dock: { x: number; y: number; w: number; h: number } | null = null;
  private pending: TapeLook | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Software WebGL (no GPU): draw small, without shadows, and only when something changes.
    const gl = this.renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    this.lowPower = /swiftshader|llvmpipe|software|softpipe/i.test(name);
    this.renderer.shadowMap.enabled = !this.lowPower;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // The light moves with the cassette, so shadows only change when the pencil or the hubs do.
    this.renderer.shadowMap.autoUpdate = false;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.7;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
    key.position.set(-8, 14, 18);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    this.space.add(key, key.target);
    this.scene.add(new THREE.HemisphereLight(0xdde6ff, 0x1a1410, 0.35));

    this.label.width = 1376;
    this.label.height = 672;
    this.labelTex = new THREE.CanvasTexture(this.label);
    this.labelTex.colorSpace = THREE.SRGBColorSpace;
    this.labelTex.anisotropy = 8;
    this.labelTex.flipY = false; // glTF UVs start at the top
    if (document.fonts) {
      Promise.all(['84px "Reenie Beanie"', '700 40px "Courier Prime"', '400 24px "Courier Prime"'].map((f) => document.fonts.load(f)))
        .then(() => { this.fontsIn++; })
        .catch(() => {});
    }

    this.rig.add(this.space);
    this.scene.add(this.rig);
  }

  async load(url: string) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    // glTF is Y-up: turn it back so the cassette face points at the camera.
    model.rotation.x = Math.PI / 2;
    this.space.add(model);
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const m = mesh.material as THREE.MeshStandardMaterial;
      (this.mats[m.name] ??= []).includes(m) || this.mats[m.name].push(m);
      if (m.name === 'window') {
        // Thin clear plastic: mostly reflections. Plain transparency, no transmission pass.
        mesh.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.04, clearcoat: 1, depthWrite: false });
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
      // Inside the shell the key light only gets in through the window; keep the reels evenly lit.
      if (m.name === 'tape' || m.name === 'hub') mesh.receiveShadow = false;
      if (m.name === 'tape') {
        // Oxide on a tight pack: dark and satin, not a mirror.
        m.roughness = 0.6;
        m.envMapIntensity = 0.25;
      }
      if (m.name === 'label') {
        mesh.material = new THREE.MeshStandardMaterial({ map: this.labelTex, roughness: 0.82, alphaTest: 0.5, side: THREE.DoubleSide });
      }
      this.hits.push(mesh);
    });
    this.hubL = model.getObjectByName('hubL');
    this.hubR = model.getObjectByName('hubR');
    this.packL = model.getObjectByName('packL');
    this.packR = model.getObjectByName('packR');
    // The pencil turns on the right hub: its point sits in the hub, just below the face.
    const pencil = model.getObjectByName('pencil');
    pencil?.traverse((o) => (o as THREE.Mesh).isMesh && this.pencilHits.push(o));
    if (pencil) {
      const pivot = new THREE.Group();
      pivot.position.set(HUB_X, HUB_Y, 0.05);
      this.space.add(pivot);
      pivot.add(pencil);
      pencil.position.set(0, 0, 0);
      this.pencil = pencil;
    }
    this.applyLook();
    this.layout();
    this.shown = this.info;
    this.loaded = true;
    this.frame();
  }

  // Dress the cassette as another tape: shell plastic, hubs, oxide and the label.
  setLook(look: TapeLook) {
    this.look = look;
    this.applyLook();
  }

  // Eject, change, and put the new one in.
  swap(look: TapeLook) {
    this.pending = look;
    this.swapT0 = performance.now();
  }

  private applyLook() {
    const L = this.look;
    for (const m of this.mats.shell ?? []) {
      m.color.set(L.shell);
      m.transparent = L.shellOpacity < 1;
      m.opacity = L.shellOpacity;
      m.roughness = L.shellOpacity < 1 ? 0.12 : 0.32;
      m.needsUpdate = true;
    }
    for (const m of this.mats.shell_matte ?? []) m.color.set(L.shell).multiplyScalar(0.8);
    for (const m of this.mats.hub ?? []) m.color.set(L.hub);
    for (const m of this.mats.tape ?? []) m.color.set(L.oxide);
    this.labelKey = '';
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setPixelRatio(this.lowPower ? 0.4 : this.still && this.slowFrames > 8 ? 0.6 : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.layout();
  }

  // Frame the cassette: about 40% of a wide screen, most of a phone's width, a little above centre.
  private layout() {
    const aspect = this.width / this.height;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const want = aspect > 1 ? 0.4 : 0.78;
    const byWidth = 10.04 / (want * 2 * Math.tan(fov / 2) * aspect);
    const byHeight = 6.4 / (0.42 * 2 * Math.tan(fov / 2));
    const d = Math.max(byWidth, byHeight);
    this.camera.position.set(0, -d * 0.05, d);
    this.camera.lookAt(0, aspect > 1 ? -0.4 : -1.6, 0);
    this.camera.near = d * 0.3;
    this.camera.far = d * 3;
    this.camera.updateProjectionMatrix();
  }

  // The pointer, as an angle around the right hub on the cassette face. Null when it misses both
  // the cassette and the pencil (the field behind should get that touch instead).
  angleAt(x: number, y: number, requireHit: boolean) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    if (requireHit && this.ray.intersectObjects(this.hits, false).length === 0) return null;
    const inv = new THREE.Matrix4().copy(this.space.matrixWorld).invert();
    const local = this.ray.ray.clone().applyMatrix4(inv);
    const p = new THREE.Vector3();
    if (!local.intersectPlane(this.face, p)) return null;
    return Math.atan2(p.y - HUB_Y, p.x - HUB_X);
  }

  // What is under the pointer: the pencil, the cassette, or nothing.
  hitAt(x: number, y: number): 'pencil' | 'cassette' | null {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camera);
    const hit = this.ray.intersectObjects(this.hits, false)[0];
    if (!hit) return null;
    return this.pencilHits.includes(hit.object) ? 'pencil' : 'cassette';
  }

  // The docked pose: where the slot's centre lands on the z=0 plane, and the scale that makes the
  // cassette as wide as the slot.
  private dockPose() {
    const d = this.dock;
    if (!d || !this.width) return null;
    const ndc = new THREE.Vector2(((d.x + d.w / 2) / this.width) * 2 - 1, -((d.y + d.h / 2) / this.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), p)) return null;
    const a = p.clone().project(this.camera);
    const b = p.clone().add(new THREE.Vector3(1, 0, 0)).project(this.camera);
    const ppu = Math.abs(b.x - a.x) * 0.5 * this.width;
    return { p, s: (d.w * 0.94) / (10.04 * ppu) };
  }

  // Turning over. In hand, the cassette follows the hand (the page changes the side as it passes
  // on edge). Let go on the side asked for, it settles flat; otherwise it goes on over the way it
  // was leaning, and the other label comes round as it passes on edge.
  private turnOver(dt: number) {
    if (this.yawHeld !== null) {
      this.yaw = this.yawHeld;
      this.shown = this.info;
      return;
    }
    if (this.info.side === this.shown.side) {
      this.yaw *= Math.exp(-dt * 9);
      if (Math.abs(this.yaw) < 0.002) this.yaw = 0;
      return;
    }
    if (!this.loaded || this.still) {
      this.shown = this.info;
      this.yaw = 0;
      return;
    }
    const dir = this.yaw < 0 ? -1 : 1;
    this.yaw += dir * dt * 8;
    if (Math.abs(this.yaw) >= Math.PI / 2) {
      this.shown = this.info;
      this.yaw -= dir * Math.PI;
    }
  }

  // Whether a point lands on the take-up reel (or the pencil in it), which winds the tape; the rest
  // of the shell turns the cassette over.
  onReel(x: number, y: number) {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camera);
    const local = this.ray.ray.clone().applyMatrix4(new THREE.Matrix4().copy(this.space.matrixWorld).invert());
    const p = new THREE.Vector3();
    return !!local.intersectPlane(this.face, p) && Math.hypot(p.x - HUB_X, p.y - HUB_Y) < PACK.max;
  }

  // How many screen pixels the cassette is wide, for turning it by hand.
  widthPx() {
    const at = (x: number) => new THREE.Vector3(x, 0, 0.3).applyMatrix4(this.space.matrixWorld).project(this.camera);
    const a = at(-5), b = at(5);
    return Math.max(1, Math.hypot(((b.x - a.x) / 2) * this.width, ((b.y - a.y) / 2) * this.height));
  }

  start() {
    const loop = () => {
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // Move toward the pose for where we are, then draw if anything on screen changed. Docked and
  // still, nothing is drawn at all.
  private frame() {
    const now = performance.now();
    const dt = Math.min(0.3, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const target = this.dock ? 1 : 0;
    this.m += (target - this.m) * (1 - Math.exp(-dt * 5.5));
    if (Math.abs(target - this.m) < 0.0005) this.m = target;
    this.turnOver(dt);
    const moving = this.m !== target || this.swapT0 >= 0 || this.yaw !== 0 || this.info.side !== this.shown.side || (this.m < 1 && !this.still && !this.lowPower);
    const d = this.dock;
    const key = `${this.m}|${this.pencilAngle.toFixed(4)}|${this.hubAngleL.toFixed(3)}|${this.wound.toFixed(4)}|${this.info.side}|${this.yaw.toFixed(4)}|${this.info.count}|${this.info.current}|${this.fontsIn}|${this.look.name}|${d ? `${d.x},${d.y},${d.w}` : ''}|${this.width}x${this.height}`;
    if (!moving && key === this.renderKey) return;
    this.renderKey = key;
    const t0 = performance.now();
    this.render();
    // A slow machine (software WebGL, an old phone) gives up the idle float and draws only when
    // something actually changes, so the page around it stays responsive.
    this.cost = this.cost * 0.8 + (performance.now() - t0) * 0.2;
    if (this.cost > 45 && ++this.slowFrames > 8 && !this.still) {
      this.still = true;
      // And draws at a lower resolution.
      this.renderer.setPixelRatio(0.6);
      this.renderer.setSize(this.width, this.height, false);
    }
  }
  private cost = 0;
  private slowFrames = 0;
  private lowPower = false;

  private render() {
    const t = (performance.now() - this.t0) / 1000;
    const float = this.still ? 0 : 1 - this.m;
    const k = this.m * this.m * (3 - 2 * this.m);
    const dock = this.dockPose();
    const s = dock ? 1 + (dock.s - 1) * k : 1;
    const hx = 0, hy = Math.sin(t * 0.6) * 0.08 * float;
    this.rig.position.set(dock ? hx + (dock.p.x - hx) * k : hx, dock ? hy + (dock.p.y - hy) * k : hy, 0);
    this.rig.scale.setScalar(s);
    const rx = -0.5 + Math.sin(t * 0.4) * 0.02 * float, ry = 0.1 + Math.sin(t * 0.27) * 0.04 * float, rz = -0.03;
    this.rig.rotation.set(rx + (-0.34 - rx) * k, ry + (0.06 - ry) * k, rz + (0 - rz) * k);
    this.scene.environmentIntensity = 0.7 - 0.3 * k;
    if (this.swapT0 >= 0) {
      const k = (performance.now() - this.swapT0) / 900;
      if (this.pending && k >= 0.4) {
        this.setLook(this.pending);
        this.pending = null;
      }
      if (k >= 1) this.swapT0 = -1;
      else {
        // Out: down and away; in: back up with a little settle.
        const out = k < 0.4 ? Math.pow(k / 0.4, 2) : Math.max(0, 1 - (k - 0.4) / 0.6);
        const settle = k > 0.4 ? Math.sin(((k - 0.4) / 0.6) * Math.PI) * 0.06 : 0;
        this.rig.position.y -= out * 16 * s;
        this.rig.position.z -= out * 6 * s;
        this.rig.rotation.x += out * 0.5 - settle;
      }
    }

    if (this.yaw !== 0) {
      // Turned on its long axis, lifted off the desk as it goes up on edge.
      const up = Math.abs(Math.sin(this.yaw));
      this.rig.rotation.y += this.yaw;
      this.rig.position.z += up * 2.2 * s;
      this.rig.position.y += up * 0.5 * s;
    }

    // Hubs turn about the cassette's own axis (glTF Y, inside the rotated model).
    if (this.hubL) this.hubL.rotation.y = this.hubAngleL;
    if (this.hubR) this.hubR.rotation.y = this.hubAngleR;
    const rL = Math.sqrt(PACK.min ** 2 + (1 - this.wound) * (PACK.max ** 2 - PACK.min ** 2));
    const rR = Math.sqrt(PACK.min ** 2 + this.wound * (PACK.max ** 2 - PACK.min ** 2));
    this.packL?.scale.set(rL, 1, rL);
    this.packR?.scale.set(rR, 1, rR);

    if (this.pencil) {
      // The pencil's axis is its glTF +Y. Lean it TILT off the hub axis towards pencilAngle, and
      // turn it about its own axis with the hub, so the flats of the hexagon go round too.
      const a = this.pencilAngle;
      const tilt = TILT_HOME + (TILT_DOCK - TILT_HOME) * k;
      const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(a), Math.sin(tilt) * Math.sin(a), Math.cos(tilt));
      const lean = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.hubAngleR);
      this.pencil.quaternion.copy(lean).multiply(spin);
      // Docked, a stub of a pencil: it stays inside the top bar.
      this.pencil.scale.setScalar(1 - 0.5 * k);
    }

    const shadow = `${this.pencilAngle.toFixed(3)}|${this.hubAngleL.toFixed(2)}|${this.wound.toFixed(3)}`;
    if (shadow !== this.shadowKey) {
      this.shadowKey = shadow;
      this.renderer.shadowMap.needsUpdate = true;
    }
    this.drawLabel();
    this.renderer.render(this.scene, this.camera);
    // Where the take-up hub is on screen, for anything (tests included) that needs to aim at it.
    const hub = new THREE.Vector3(HUB_X, HUB_Y, 0.6).applyMatrix4(this.space.matrixWorld).project(this.camera);
    const at = `${Math.round(((hub.x + 1) / 2) * this.width)},${Math.round(((1 - hub.y) / 2) * this.height)}`;
    if (this.canvas.dataset.hub !== at) this.canvas.dataset.hub = at;
    // And a point on the shell away from the reels, where a hand turns it over.
    const sh = new THREE.Vector3(-2.6, -2.5, 0.6).applyMatrix4(this.space.matrixWorld).project(this.camera);
    const shell = `${Math.round(((sh.x + 1) / 2) * this.width)},${Math.round(((1 - sh.y) / 2) * this.height)}`;
    if (this.canvas.dataset.shell !== shell) this.canvas.dataset.shell = shell;
    // Where the cassette's top and bottom edges are, for the hint that sits beside it (CSS).
    if (!this.dock) {
      const y = (v: number) => Math.round(((1 - new THREE.Vector3(0, v, 0.3).applyMatrix4(this.space.matrixWorld).project(this.camera).y) / 2) * this.height);
      const edges = `${y(3.3)}px ${y(-3.3)}px`;
      if (edges !== this.edges) {
        this.edges = edges;
        const [top, bottom] = edges.split(' ');
        document.documentElement.style.setProperty('--cassette-top', top);
        document.documentElement.style.setProperty('--cassette-bottom', bottom);
      }
    }
  }

  // The label: cream card, the side and name, the counter, and the track list with the current one marked.
  private shadowKey = '';
  private edges = '';

  private drawLabel() {
    const { side, tracks, current, count, print } = this.shown;
    const L = this.look;
    const accent = L.stripe;
    const key = `${side}|${tracks.join()}|${current}|${count}|${print}|${L.name}|${this.fontsIn}`;
    if (key === this.labelKey) return;
    this.labelKey = key;
    const c = this.label.getContext('2d');
    if (!c) return;
    const W = this.label.width, H = this.label.height;
    const px = W / LABEL.w; // pixels per centimetre
    c.clearRect(0, 0, W, H);
    c.fillStyle = L.paper;
    c.beginPath();
    c.roundRect(0, 0, W, H, 18);
    c.fill();
    // A little paper grain, the same every time.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = `rgba(90, 70, 40, ${rand() * 0.05})`;
      c.fillRect(rand() * W, rand() * H, 2, 2);
    }
    // Printed stripe along the top.
    c.fillStyle = accent;
    c.fillRect(0, 34, W, 16);
    c.fillStyle = L.ink;
    c.fillRect(0, 56, W, 4);

    // Window cut-out, a little larger than the window in the shell.
    const wx = (LABEL.w / 2 - WIN.w / 2 - 0.12) * px;
    const wy = (LABEL.h / 2 + LABEL.y - HUB_Y - WIN.h / 2 - 0.12) * px;
    const ww = (WIN.w + 0.24) * px, wh = (WIN.h + 0.24) * px;
    c.fillStyle = '#1b1b1d';
    c.beginPath();
    c.roundRect(wx - 10, wy - 10, ww + 20, wh + 20, 0.62 * px + 10);
    c.fill();

    // Printed: the side and the tape's small print. Written in ballpoint: its name and mood.
    c.fillStyle = L.ink;
    c.font = '700 92px "Courier Prime", monospace';
    c.textBaseline = 'alphabetic';
    c.fillText(side, 56, 162);
    // A ballpoint line is thin: go over it once more so it reads at the size the cassette is drawn.
    c.font = '400 92px "Reenie Beanie", cursive';
    c.strokeStyle = L.ink;
    c.lineWidth = 2.5;
    c.strokeText(`${L.name} — ${L.mood}`, 150, 138);
    c.fillText(`${L.name} — ${L.mood}`, 150, 138);
    c.globalAlpha = 0.65;
    c.font = '400 24px "Courier Prime", monospace';
    c.fillText(print, 152, 176);
    c.globalAlpha = 1;
    c.font = '700 40px "Courier Prime", monospace';
    c.textAlign = 'right';
    c.fillText(count, W - 60, 132);
    c.textAlign = 'left';

    // Track list under the window, handwritten-looking, the current one circled in pen.
    const y = wy + wh + 86;
    const slot = (W - 120) / Math.max(1, tracks.length);
    tracks.forEach((name, i) => {
      const x = 60 + i * slot;
      c.globalAlpha = 0.6;
      c.fillStyle = L.ink;
      c.font = '400 30px "Courier Prime", monospace';
      c.fillText(side === 'A' ? String(i + 1).padStart(2, '0') : `B${i + 1}`, x, y - 44);
      c.globalAlpha = i === current ? 1 : 0.75;
      c.font = '400 76px "Reenie Beanie", cursive';
      c.strokeStyle = L.ink;
      c.lineWidth = 2;
      c.strokeText(name, x, y + 10);
      c.fillText(name, x, y + 10);
      c.globalAlpha = 1;
      if (i === current) {
        c.strokeStyle = accent;
        c.lineWidth = 5;
        const m = c.measureText(name).width;
        c.beginPath();
        c.ellipse(x + m / 2, y - 4, m / 2 + 26, 42, -0.04, 0.2, Math.PI * 2 + 0.05);
        c.stroke();
      }
    });

    // Cut the window hole last (transparent, so the shell and the reels show through).
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.roundRect(wx, wy, ww, wh, 0.62 * px);
    c.fill();
    c.globalCompositeOperation = 'source-over';
    this.labelTex.needsUpdate = true;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.renderer.dispose();
    this.labelTex.dispose();
  }
}
