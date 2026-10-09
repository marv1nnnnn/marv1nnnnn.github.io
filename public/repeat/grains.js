// What each player could hold, one grain a song (a song taken as 4 MB), stacked into a block on the
// desk behind it: 20 x 20 to a layer, so a block's height is how many songs. Together the blocks are
// the row's other chart, the one that mattered: room enough to put every song you love on it and
// shuffle. A block shuffles when touched (or from the player), and on the tapes a grain lights when
// a stretch is being repeated.

import * as THREE from 'three';

const PITCH = 0.27; // cm from grain to grain
const SIZE = 0.21;
const SIDE = 20; // grains along each side of a layer

// A few colour families per player, so a block reads in bands (albums in a row) until shuffled.
const PALETTES = [
  ['#7a4a2b', '#5e3a22', '#94643f', '#3b2a1e'], // tape oxide
  ['#e8e6df', '#c9c7c0', '#f08a2c', '#d9d7cf'], // the white M520 with its orange ring
  ['#2f6bff', '#1a1c22', '#4aa0ff', '#2a2d36'], // MQ-908 black and electric blue
  ['#0d0d0f', '#c8c9cc', '#2a2b2f', '#e6e7ea'], // SA28 mirror black and chrome
  ['#9da3ab', '#5d636b', '#c3c8ce', '#3e4349'], // C30 metal grey
  ['#e94e3c', '#f2c14e', '#3fa7d6', '#8a5cf6', '#59cd90', '#ee6c9b', '#f2f2f2', '#2a2a2e'], // a whole library
  ['#ff6b2a', '#d42f8a', '#7b3fe4', '#1f1f23', '#f5f5f5'], // Zune
];

export class Grains {
  constructor(scene, slots, counts, reduced) {
    this.reduced = reduced;
    this.blocks = [];
    const total = counts.reduce((a, b) => a + b, 0);
    const geo = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
    const mesh = (this.mesh = new THREE.InstancedMesh(geo, mat, total));
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    const m = (this.m = new THREE.Matrix4());
    const col = new THREE.Color();
    let at = 0;
    counts.forEach((n, i) => {
      const s = slots[i];
      const side = Math.min(SIDE, Math.ceil(Math.sqrt(n)));
      const foot = side * PITCH;
      const origin = new THREE.Vector3(s.x - foot / 2 + PITCH / 2, SIZE / 2, -(s.d / 2 + 3.2 + foot / 2) - foot / 2 + PITCH / 2);
      const pal = PALETTES[i % PALETTES.length].map((c) => new THREE.Color(c));
      const b = { i, n, at, side, origin, order: new Int32Array(n), from: null, t0: 0, lit: -1, shown: n, fillFrom: n, fillT0: 0, height: Math.ceil(n / (side * side)) * PITCH, centre: new THREE.Vector3(s.x, 0, origin.z + foot / 2 - PITCH / 2) };
      // colours run in albums: a family holds for a stretch, then the next
      let fam = 0, left = 0;
      for (let k = 0; k < n; k++) {
        if (left-- <= 0) { fam = Math.floor(Math.random() * pal.length); left = 8 + Math.floor(Math.random() * 18); }
        // quieter than the players: a little greyed and darker, so the players stay in front
        col.copy(pal[fam]).offsetHSL(0, -0.25, (Math.random() - 0.5) * 0.08).multiplyScalar(0.62);
        mesh.setColorAt(at + k, col);
        b.order[k] = k;
      }
      this.blocks.push(b);
      at += n;
    });
    this.blocks.forEach((b) => this.place(b, 1));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
  }

  // The position of the k-th place in a block: rows, then layers upward.
  spot(b, k, out) {
    const per = b.side * b.side;
    const layer = Math.floor(k / per), r = k % per;
    return out.set(b.origin.x + (r % b.side) * PITCH, b.origin.y + layer * PITCH, b.origin.z + Math.floor(r / b.side) * PITCH);
  }

  place(b, u) {
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    const m = this.m;
    for (let g = 0; g < b.n; g++) {
      this.spot(b, b.order[g], p);
      if (b.from && u < 1) {
        // each grain leaves at its own moment and arcs over to its new place
        const d = Math.min(1, Math.max(0, (u - (g % 97) / 97 * 0.45) / 0.55));
        const e = d * d * (3 - 2 * d);
        this.spot(b, b.from[g], q);
        p.lerpVectors(q, p, e);
        p.y += Math.sin(Math.PI * e) * (1.5 + b.height * 0.25);
      }
      // grains past what the player holds yet are not there; ones just added fall in from above
      let s = g === b.lit ? 1.6 : 1;
      if (g >= b.shown) s = 0;
      else if (g >= b.fillFrom) {
        const k = Math.min(1, Math.max(0, (performance.now() - b.fillT0) / 1400 - ((g - b.fillFrom) % 211) / 211 * 0.5) / 0.5);
        p.y += (1 - k * k) * (8 + b.height);
        if (k <= 0) s = 0;
      }
      m.makeScale(s, s, s).setPosition(p);
      this.mesh.setMatrixAt(b.at + g, m);
    }
  }

  // Deal a block's songs out again in a new order.
  shuffle(i) {
    const b = this.blocks[i];
    if (!b) return;
    b.from = Int32Array.from(b.order);
    for (let k = b.n - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [b.order[k], b.order[j]] = [b.order[j], b.order[k]];
    }
    b.t0 = performance.now();
    if (this.reduced) this.done(b);
  }

  done(b) {
    b.from = null;
    this.place(b, 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  // How many of a block's songs the player holds now (the Cube before and after its TF card).
  hold(i, n) {
    const b = this.blocks[i];
    if (!b || n === b.shown) return;
    b.fillFrom = n > b.shown ? b.shown : n;
    b.fillT0 = performance.now();
    b.shown = Math.min(b.n, n);
    b.filling = n > b.fillFrom;
    this.place(b, 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  // Light one grain (the stretch being repeated), or none with -1.
  light(i, g) {
    const b = this.blocks[i];
    if (!b || b.lit === g) return;
    b.lit = g;
    this.place(b, 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  frame() {
    for (const b of this.blocks) {
      if (b.filling) {
        if (performance.now() - b.fillT0 > 1500) { b.filling = false; b.fillFrom = b.n; }
        this.place(b, 1);
        this.mesh.instanceMatrix.needsUpdate = true;
      }
      if (!b.from) continue;
      const u = (performance.now() - b.t0) / 1600;
      if (u >= 1) this.done(b);
      else {
        this.place(b, u);
        this.mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  // Which block a ray hits, by its bounding box (cheaper than the grains).
  pick(ray) {
    const box = new THREE.Box3();
    let best = null, bestD = Infinity;
    for (const b of this.blocks) {
      const foot = b.side * PITCH;
      box.min.set(b.origin.x - PITCH / 2, 0, b.origin.z - PITCH / 2);
      box.max.set(b.origin.x - PITCH / 2 + foot, b.height, b.origin.z - PITCH / 2 + foot);
      const p = ray.intersectBox(box, new THREE.Vector3());
      if (p) {
        const d = p.distanceTo(ray.origin);
        if (d < bestD) { bestD = d; best = b.i; }
      }
    }
    return best;
  }

  // The top of a block, for its label.
  top(i) {
    const b = this.blocks[i];
    return b ? b.centre.clone().setY(b.height + 0.6) : null;
  }
}
