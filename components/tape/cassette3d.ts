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
const TILT = THREE.MathUtils.degToRad(64); // the pencil leans this far off the hub axis

export interface LabelInfo { tracks: string[]; current: number; count: string }

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
  info: LabelInfo = { tracks: [], current: 0, count: '000' };
  private look: TapeLook = LOOKS.oxide;
  private mats: Record<string, THREE.MeshStandardMaterial[]> = {};
  private swapT0 = -1;
  private pending: TapeLook | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
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
    this.render();
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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

  start() {
    const loop = () => {
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private render() {
    const t = (performance.now() - this.t0) / 1000;
    const float = this.still ? 0 : 1;
    this.rig.rotation.set(-0.5 + Math.sin(t * 0.4) * 0.02 * float, 0.1 + Math.sin(t * 0.27) * 0.04 * float, -0.03);
    this.rig.position.set(0, Math.sin(t * 0.6) * 0.08 * float, 0);
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
        this.rig.position.y -= out * 16;
        this.rig.position.z -= out * 6;
        this.rig.rotation.x += out * 0.5 - settle;
      }
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
      const dir = new THREE.Vector3(Math.sin(TILT) * Math.cos(a), Math.sin(TILT) * Math.sin(a), Math.cos(TILT));
      const lean = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.hubAngleR);
      this.pencil.quaternion.copy(lean).multiply(spin);
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
  }

  // The label: cream card, the side and name, the counter, and the track list with the current one marked.
  private shadowKey = '';

  private drawLabel() {
    const { tracks, current, count } = this.info;
    const L = this.look;
    const accent = L.stripe;
    const key = `${tracks.join()}|${current}|${count}|${L.name}`;
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

    c.fillStyle = L.ink;
    c.font = '700 92px "Martian Mono", monospace';
    c.textBaseline = 'alphabetic';
    c.fillText('A', 56, 162);
    c.font = 'italic 400 66px "Newsreader", Georgia, serif';
    c.fillText(`${L.name} — ${L.mood}`, 150, 132);
    c.globalAlpha = 0.65;
    c.font = '400 26px "Martian Mono", monospace';
    c.fillText(`marv1nnnnn · after ${L.after}`, 152, 172);
    c.globalAlpha = 1;
    c.font = '500 40px "Martian Mono", monospace';
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
      c.font = '500 30px "Martian Mono", monospace';
      c.fillText(String(i + 1).padStart(2, '0'), x, y - 44);
      c.globalAlpha = i === current ? 1 : 0.75;
      c.font = `italic ${i === current ? 600 : 400} 58px "Newsreader", Georgia, serif`;
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
