"""The Shure SRH1540 (announced October 2013), black: closed-back over-ear headphones. Oval cups of
black shell, each with a carbon-fibre cap under a chrome ring, held in a silver aluminium-alloy
yoke; perforated Alcantara pads; a dual-frame headband, two leather-wrapped steel bands with a
cushion under each, ending in black end caps (SRH1540, L / R) that the yokes' slotted sliders run
through; a detachable cable into the bottom of each cup on MMCX plugs.

    blender -b --python scripts/blender/fidelity/srh1540.py -- [out.glb] [preview.png]

Sizes: Shure gives 286 g without the cable and no outside dimensions (spec sheet). The pads are
the HPAEC1540's 95 x 113 x 27 mm (Gear Club Direct's listing of the part), their opening about
62 x 45 mm (Audioholics). Everything else is laid out from Shure's straight-on front and side
product photos scaled to the pads, with the details from AV Watch's launch photos (24 Oct 2013):
18.3 cm across at rest, 19.4 cm from the plinth to the top of the band as it is set here (drawn
out a little: 1.6 cm of slider between each end cap and its pad, as in Shure's side view).

On the plinth with no stand: the band arched up in the X-Z plane, the cups at its feet facing
each other across X (the left cup at +X, as it is seen from in front), pulled together at the
bottom as they hang at rest, standing on the bottoms of their shells. The cable's two legs run
from their plugs along the plinth to the splitter, and on to the gold 3.5 mm plug. Nothing moves.
Conventions as kit.py: cm, up +Z, the front (the wearer's face) towards -Y, origin at the middle
of the bottom of the whole (cable included).
"""

import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('srh1540')
kit.reset()

PAD = (4.75, 5.65)  # the pad's outline, semi-axes across and up (95 x 113 mm)
PAD_T = 2.75  # its thickness; its ring is 2.5 wide (an opening of 4.5 x 6.3)
SHELL = (4.65, 5.55)  # the shell where the pad sits
D = 2.6  # the shell's depth, from the pad to its outer face
EDGE = 0.55  # the radius its outer face rolls over by
RING = (3.4, 4.1)  # the chrome ring round the carbon cap, outside
CAP_Z = -1.15  # the cap sits low on the outer face, its middle below the pad's
CARBON = (RING[0] - 0.15, RING[1] - 0.15)
TILT = math.radians(7)  # the oval leans back at the top, as an ear does
ROLL = math.radians(14)  # at rest the band pulls the cups together at the bottom
NECK = 6.3  # the top of the yoke's neck, above the middle of the pad
X_NECK = 8.7  # from the middle to the yokes' mid-thickness
YOKE_T = 0.28
ARC = (math.radians(50), math.radians(68))  # where the end caps sit on the arch, from its top
SHOWS = 2.2  # slider showing between an end cap and its yoke
RAIL_Y = 1.25  # the middles of the two bands of the headband, either side
RC = 0.17  # cable radius
PLUG_L = 2.3  # MMCX plug and its strain relief, out of the shell
SPLIT_Y = -7.0  # where the cable's splitter starts, in front of the cups
N = 60  # points round an oval

M = {
    'alcantara': kit.material('alcantara', (1, 1, 1), rough=0.95),
    'cloth': kit.material('cloth', kit.srgb('#0b0b0c'), rough=0.9),
    'shell': kit.material('shell', kit.srgb('#141415'), rough=0.45, coat=0.1),
    'chrome': kit.material('chrome', kit.srgb('#e4e4e6'), rough=0.08, metal=1.0),
    'carbon': kit.material('carbon', (1, 1, 1), rough=0.35, coat=1.0),
    'alu': kit.material('alu', kit.srgb('#c5c7ca'), rough=0.42, metal=0.6),  # bead-blasted
    'plastic': kit.material('plastic', kit.srgb('#151516'), rough=0.55),
    'leather': kit.material('leather', kit.srgb('#101011'), rough=0.48, coat=0.15),
    'print': kit.material('print', kit.srgb('#eeeff0'), rough=0.35, metal=0.3),
    'grey': kit.material('grey', kit.srgb('#6c6d70'), rough=0.6),
    'rubber': kit.material('rubber', kit.srgb('#0e0e0f'), rough=0.6),
    'gold': kit.material('gold', kit.srgb('#d8ad62'), rough=0.25, metal=1.0),
}


# --- Textures: small tiles drawn pixel by pixel (sRGB), packed so they ride in the GLB -----------
def image(name, size, fn):
    w, h = size
    px = []
    for y in range(h):
        for x in range(w):
            px.extend((*fn((x + 0.5) / w, (y + 0.5) / h), 1.0))
    im = bpy.data.images.new(name, w, h, alpha=False)
    im.pixels.foreach_set(px)
    im.pack()
    return im


def textured(mat, im):
    nt = mat.node_tree
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = im
    nt.links.new(t.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])


def weave(x, y):
    """Carbon twill under the lacquer: a check of tows, alternately along and across. 4 x 4 cells."""
    i, j = int(x * 4), int(y * 4)
    fx, fy = x * 4 - i, y * 4 - j
    f = fy if (i + j) % 2 else fx  # across the tow
    v = (0.16 if (i + j) % 2 else 0.07) * (0.75 + 0.25 * math.sin(math.pi * f) ** 0.7)
    if min(fx, 1 - fx, fy, 1 - fy) < 0.05:
        v *= 0.8
    return (v, v, v * 1.04)


def dots(x, y):
    """Alcantara's perforations: grey foam through little holes on a stagger (tile 6.6 x 5.6 mm)."""
    d = min(math.hypot((x - cx) * 6.6, (y - cy) * 5.6) for cx, cy in ((0.25, 0.25), (0.75, 0.25), (0, 0.75), (0.5, 0.75), (1, 0.75)))
    t = min(1.0, max(0.0, (0.55 - d) / 0.2))
    v = 0.075 + (0.36 - 0.075) * t
    return (v, v, v)


textured(M['carbon'], image('weave', (64, 64), weave))
textured(M['alcantara'], image('dots', (64, 64), dots))
WEAVE = 4 * 0.27  # cm per tile: 2.7 mm checks
DOTS = (0.66, 0.56)


# --- Geometry helpers -------------------------------------------------------------------------
def grid(P, closed_j=False, caps=False, uv=None):
    """Faces between rows of points: P[i] runs round a loop (closed), j along a profile (closed too
    with closed_j; caps shuts both ends of an open one). uv(i, j) -> (u, v) is asked for i = len(P)
    (and j = len(P[0]) when closed) at the seams, so a repeating texture runs on across them."""
    bm = bmesh.new()
    ni, nj = len(P), len(P[0])
    V = [[bm.verts.new(p) for p in row] for row in P]
    index = {V[i][j]: (i, j) for i in range(ni) for j in range(nj)}
    for i in range(ni):
        for j in range(nj if closed_j else nj - 1):
            bm.faces.new([V[a % ni][b % nj] for a, b in ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))])
    if caps:
        bm.faces.new([V[i][0] for i in range(ni)])
        bm.faces.new([V[i][nj - 1] for i in range(ni)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if uv:
        lay = bm.loops.layers.uv.new('UVMap')
        for f in bm.faces:
            ij = [index[lp.vert] for lp in f.loops]
            seam_i = len(f.loops) == 4 and {0, ni - 1} <= {i for i, _ in ij}
            seam_j = closed_j and len(f.loops) == 4 and {0, nj - 1} <= {j for _, j in ij}
            for lp, (i, j) in zip(f.loops, ij):
                lp[lay].uv = uv(ni if seam_i and i == 0 else i, nj if seam_j and j == 0 else j)
    return bm


def smooth_loop(pts, n=2):
    """A closed Catmull-Rom curve through pts, n points per span."""
    out, m = [], len(pts)
    for i in range(m):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % m], pts[(i + 2) % m]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t ** 3) for c in range(2)))
    return out


def sweep(path, section, caps=True):
    """A closed section of (n, y) points swept along a path of (x, z) points: n off the path in the
    X-Z plane (positive to the path's right, which is inwards for the arch), y across it."""
    rows = []
    for k, (x, z) in enumerate(path):
        a, b = path[max(k - 1, 0)], path[min(k + 1, len(path) - 1)]
        tx, tz = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(tx, tz)
        nx, nz = tz / ln, -tx / ln
        sec = section(k) if callable(section) else section
        rows.append([(x + nx * n, y, z + nz * n) for n, y in sec])
    return grid([[row[m] for row in rows] for m in range(len(rows[0]))], caps=caps)


def section(w, t, r, dy=0.0, dn=0.0, seg=3):
    """A rounded w (across, y) x t (n) rectangle for sweep."""
    return [(dn + y, dy + x) for x, y in kit.rounded_rect(w, t, r, seg)]


def lathe(profile, origin, axis, seg=16):
    """(r, l) points revolved round an axis from origin; both ends closed."""
    q = Vector((0, 0, 1)).rotation_difference(Vector(axis).normalized())
    o = Vector(origin)
    return grid([[o + q @ Vector((r * math.cos(a), r * math.sin(a), ln)) for r, ln in profile] for a in (2 * math.pi * i / seg for i in range(seg))], caps=True)


def bezier(p0, p1, p2, p3, n):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d for a, b, c, d in zip(p0, p1, p2, p3)) for t in (k / n for k in range(n + 1))]


def resample(pts, step):
    """Even steps along a polyline; returns the points and their distances along it."""
    s = [0.0]
    for a, b in zip(pts, pts[1:]):
        s.append(s[-1] + math.dist(a, b))
    n = max(2, round(s[-1] / step))
    out, k = [], 0
    for i in range(n + 1):
        d = s[-1] * i / n
        while k < len(s) - 2 and s[k + 1] < d:
            k += 1
        f = (d - s[k]) / max(s[k + 1] - s[k], 1e-9)
        out.append(tuple(a + (b - a) * f for a, b in zip(pts[k], pts[k + 1])))
    return out, [s[-1] * i / n for i in range(n + 1)]


def part(name, bm, mat, matrix=None):
    if matrix is not None:
        bm.transform(matrix)
    return kit.new_object(name, bm, mat)


def mirrored(ob):
    """The right side's copy of a left-side part, mirrored across X."""
    me = ob.data.copy()
    me.transform(Matrix.Scale(-1, 4, (1, 0, 0)))
    me.flip_normals()
    o = bpy.data.objects.new(ob.name + '.R', me)
    bpy.context.scene.collection.objects.link(o)
    return o


FONTS = {}


def letters(body, pattern, bold=0.0, spacing=1.0, res=3):
    """Lettering filled flat, centred, at size 1: ([(x, y)], [face indices], (width, height))."""
    if pattern not in FONTS:
        path = subprocess.run(['fc-match', '-f', '%{file}', pattern], capture_output=True, text=True).stdout.strip()
        FONTS[pattern] = bpy.data.fonts.load(path, check_existing=True) if path else None
    cu = bpy.data.curves.new('t', 'FONT')
    cu.body = body
    cu.align_x, cu.align_y = 'CENTER', 'CENTER'
    cu.resolution_u = res
    cu.space_character = spacing
    cu.offset = bold
    if FONTS[pattern]:
        cu.font = FONTS[pattern]
    ob = bpy.data.objects.new('t', cu)
    bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    vs = [(v.co.x, v.co.y) for v in ob.data.vertices]
    fs = [tuple(p.vertices) for p in ob.data.polygons]
    bpy.data.objects.remove(ob)
    x0, x1 = min(v[0] for v in vs), max(v[0] for v in vs)
    y0, y1 = min(v[1] for v in vs), max(v[1] for v in vs)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return [(x - cx, y - cy) for x, y in vs], fs, (x1 - x0, y1 - y0)


def lay(name, glyphs, place, normal, mat):
    """Lettering laid on a surface: place(x, y) -> a point; its faces turned to face `normal`."""
    vs, fs, _ = glyphs
    bm = bmesh.new()
    bv = [bm.verts.new(place(x, y)) for x, y in vs]
    for f in fs:
        bm.faces.new([bv[i] for i in f])
    bm.normal_update()
    if sum(f.normal.dot(Vector(normal)) for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return kit.new_object(name, bm, mat)


def ring_mesh(r0, r1, place, normal, seg=32):
    """A flat printed ring (an annulus) laid like lettering."""
    vs = [(r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg)) for r in (r0, r1) for i in range(seg)]
    fs = [(i, (i + 1) % seg, seg + (i + 1) % seg, seg + i) for i in range(seg)]
    return lay('ring', (vs, fs, None), place, normal, M['grey'])


ANGLES = [2 * math.pi * i / N for i in range(N)]


# --- Where things go -----------------------------------------------------------------------------
# A cup's own frame: (u, y, z), u out of the head, the origin the middle of the pad's seat. Its
# parts lean back by TILT; the whole cup, yoke and all, is rolled about the top of the yoke.
X0 = X_NECK - (D + YOKE_T / 2)
XN, ZN = X_NECK, NECK
ROLL_M = Matrix.Translation((XN, 0, ZN)) @ Matrix.Rotation(ROLL, 4, 'Y') @ Matrix.Translation((-XN, 0, -ZN))
M_YOKE = ROLL_M @ Matrix.Translation((X0, 0, 0))
M_CUP = M_YOKE @ Matrix.Rotation(-TILT, 4, 'X')
UP = Vector((math.sin(ROLL), math.cos(ROLL)))  # the yoke's up, in X-Z


def tilted(y, z):
    """A point of the cup's parts as it ends up after the lean (still in the cup's frame)."""
    return (y * math.cos(TILT) + z * math.sin(TILT), -y * math.sin(TILT) + z * math.cos(TILT))


def untilted(y, z):
    return (y * math.cos(TILT) - z * math.sin(TILT), y * math.sin(TILT) + z * math.cos(TILT))


left = []  # left-side parts, to be mirrored for the right

# --- The pad: perforated Alcantara over slow foam, its sides wrinkled -----------------------------
prof = smooth_loop([(0.1, 0.0), (0.0, 0.35), (-0.04, 1.2), (0.12, 2.15), (0.55, 2.66), (1.25, PAD_T), (1.95, 2.62), (2.35, 2.2), (2.5, 1.3), (2.45, 0.35), (2.35, 0.0), (1.25, -0.03)], 2)
arc_s = [0.0]
for k in range(1, len(prof) + 1):
    arc_s.append(arc_s[-1] + math.dist(prof[k - 1], prof[k % len(prof)]))
P = []
for a in ANGLES:
    row = []
    for d, h in prof:
        if h > 0.2:
            d -= 0.035 * math.sin(37 * a + 2.1 * math.sin(3 * a)) * (1.0 if d < 1.2 else 0.3)
        row.append((-h, (PAD[0] - d) * math.cos(a), (PAD[1] - d) * math.sin(a)))
    P.append(row)
left.append(part('pad', grid(P, closed_j=True, uv=lambda i, j: (40 * i / N, arc_s[j] / DOTS[1])), M['alcantara'], M_CUP))
bm = bmesh.new()
bm.faces.new([bm.verts.new((-0.13, 2.4 * math.cos(a), 3.3 * math.sin(a))) for a in ANGLES])  # black cloth over the driver
left.append(part('scrim', bm, M['cloth'], M_CUP))

# --- The shell: the pad's seat, a groove, then a wall that rolls over into a flat outer face -------
SHELL_PROFILE = [(0.0, 0.03), (0.03, 0.0), (0.42, 0.0), (0.45, 0.06), (0.53, 0.06), (0.56, 0.0), (1.4, 0.04), (D - EDGE, 0.1)] + [
    (D - EDGE + EDGE * math.sin(math.radians(g)), 0.1 + EDGE * (1 - math.cos(math.radians(g)))) for g in (25, 50, 70, 90)]
P = [[(u, (SHELL[0] - k) * math.cos(a), (SHELL[1] - k) * math.sin(a)) for u, k in SHELL_PROFILE] for a in ANGLES]
left.append(part('shell', grid(P, caps=True), M['shell'], M_CUP))

# --- The chrome ring and the carbon cap inside it, domed, low on the outer face -------------------
RING_PROFILE = [(0.0, -0.35), (0.0, 0.08), (0.04, 0.12), (0.12, 0.12), (0.15, 0.08), (0.15, 0.0), (0.15, -0.35)]  # (inset, u - D)
P = [[(D + du, (RING[0] - k) * math.cos(a), CAP_Z + (RING[1] - k) * math.sin(a)) for k, du in RING_PROFILE] for a in ANGLES]
left.append(part('ring', grid(P, closed_j=True), M['chrome'], M_CUP))


def dome(y, z):
    r2 = (y / CARBON[0]) ** 2 + ((z - CAP_Z) / CARBON[1]) ** 2
    return D + 0.02 + 0.2 * max(0.0, 1 - r2)


P = []
for a in ANGLES:
    row = [(D - 0.2, CARBON[0] * math.cos(a), CAP_Z + CARBON[1] * math.sin(a))]
    for r in (1.0, 0.85, 0.7, 0.5, 0.3):
        y, z = CARBON[0] * r * math.cos(a), CAP_Z + CARBON[1] * r * math.sin(a)
        row.append((dome(y, z), y, z))
    P.append(row)


def weave_uv(i, j):
    _, y, z = P[i % N][j]
    y, z = tilted(y, z)  # the weave runs level, as the logo does
    return (y / WEAVE, z / WEAVE)


left.append(part('carbon', grid(P, caps=True, uv=weave_uv), M['carbon'], M_CUP))

# --- The yoke: a plate round the top of the cap, its neck under the slider, its arms down the sides
CAP_C = tilted(0, CAP_Z)
A_IN, B_IN = RING[0] + 0.12, RING[1] + 0.12


def r_in(p):
    return 1 / math.sqrt(math.cos(p + TILT) ** 2 / A_IN ** 2 + math.sin(p + TILT) ** 2 / B_IN ** 2)


def r_out(p):
    """The band round the cap: 9 mm arms at the sides, a broad shoulder over the top."""
    return r_in(p) + 0.9 + 1.75 * max(0.0, math.sin(p)) ** 2


def flare(outer, half=0.72, run=2.0):
    """Over the top, the neck the slider runs into (its top flat, 2 x `half` wide), flaring down
    into the shoulder in a hollow curve `run` wide either side."""
    top = [k for k, (y, z) in enumerate(outer) if abs(y) < half + run and z > CAP_C[1]]
    seg = outer[top[0]:top[-1] + 1]  # y falling, over the top

    def band(y):
        for (y0, z0), (y1, z1) in zip(seg, seg[1:]):
            if y1 <= y <= y0:
                return z0 + (z1 - z0) * (y - y0) / (y1 - y0)
        return seg[0][1] if y > seg[0][0] else seg[-1][1]

    new = []
    for y in ((half + run) * (1 - 2 * i / 40) for i in range(41)):
        t = min(1.0, max(0.0, (abs(y) - half) / run))
        new.append((y, band(y) + (NECK - band(y)) * (1 - t) ** 2))
    return outer[:top[0]] + new + outer[top[-1] + 1:]


def tip(p, a, b, sign):
    """Round the end of an arm: a half circle from a to b, out along the arm."""
    m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    v = (a[0] - m[0], a[1] - m[1])
    r = math.hypot(*v)
    t = (-math.sin(p) * sign, math.cos(p) * sign)
    return [(m[0] + math.cos(g) * v[0] + math.sin(g) * r * t[0], m[1] + math.cos(g) * v[1] + math.sin(g) * r * t[1]) for g in (math.pi * k / 8 for k in range(1, 8))]


P0, P1 = math.radians(-7), math.radians(166)  # the back arm ends lower than the front one
ps = [P0 + (P1 - P0) * k / 56 for k in range(57)]
outer = flare([(CAP_C[0] + r_out(p) * math.cos(p), CAP_C[1] + r_out(p) * math.sin(p)) for p in ps])
inner = [(CAP_C[0] + r_in(p) * math.cos(p), CAP_C[1] + r_in(p) * math.sin(p)) for p in ps]
outline = outer + tip(P1, outer[-1], inner[-1], 1) + inner[::-1] + tip(P0, inner[0], outer[0], -1)
bm = kit.prism(outline, D, D + YOKE_T)
bmesh.ops.transform(bm, matrix=Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1))), verts=bm.verts)
yoke = part('yoke', bm, M['alu'], M_YOKE)
slot = kit.transform(kit.prism(kit.rounded_rect(0.32, 1.6, 0.15, 4), D - 0.1, D + YOKE_T + 0.1), translate=(0, NECK - 0.3, 0))
bmesh.ops.transform(slot, matrix=Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1))), verts=slot.verts)
slot.transform(M_YOKE)
kit.cut(yoke, kit.cutter(slot))  # the slider's slot runs on down into the neck
kit.bevel(yoke, 0.07, 2)
left.append(yoke)

# --- The arch: two bands on one circle; the end caps; the slider out of each into its yoke ---------
TA, TB = ARC
R = (X_NECK - 0.3) / math.sin(TB)
ZE = ZN + SHOWS
CZ = ZE - R * math.cos(TB)


def on_arc(t, r=R):
    return (r * math.sin(t), CZ + r * math.cos(t))


# the slider: from between the bands above the end cap, through it, bending down into the yoke
e = on_arc(TB)
te = (math.cos(TB), -math.sin(TB))
path = [on_arc(math.radians(d)) for d in range(round(math.degrees(TA)) - 11, round(math.degrees(TB)))]
path += bezier(e, (e[0] + te[0] * 0.55, e[1] + te[1] * 0.55), (XN + UP.x * 0.6, ZN + UP.y * 0.6), (XN, ZN), 12)
path.append((XN - UP.x * 0.5, ZN - UP.y * 0.5))
path, s = resample(path, 0.25)
k0 = next(k for k, d in enumerate(s) if d >= 0.3)  # the slot starts 3 mm in
full = section(1.4, 0.25, 0.04, seg=1)
strip = [part('strip', sweep(path[:k0 + 1], full), M['alu'])]
for dy in (-0.43, 0.43):  # either side of the 3 mm slot, on into the yoke
    strip.append(part('strip', sweep(path[k0:], section(0.54, 0.25, 0.04, dy=dy, seg=1)), M['alu']))
left.append(kit.join('strip', strip))

# the end cap: a trapezoid block, wider at the top, the bands into its top and the slider out below
tc = (TA + TB) / 2
er = Vector((math.sin(tc), 0, math.cos(tc)))
et = Vector((-math.cos(tc), 0, math.sin(tc)))
o = Vector((on_arc(tc)[0], 0, on_arc(tc)[1]))
HALF = 1.45  # half its length along the arch
trap = [(-1.65, -HALF), (1.65, -HALF), (2.05, HALF), (-2.05, HALF)]


def round_corners(pts, r, seg=4):
    out, n = [], len(pts)
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        a = (p0[0] - p1[0], p0[1] - p1[1])
        b = (p2[0] - p1[0], p2[1] - p1[1])
        la, lb = math.hypot(*a), math.hypot(*b)
        s_ = (p1[0] + a[0] / la * r, p1[1] + a[1] / la * r)
        e_ = (p1[0] + b[0] / lb * r, p1[1] + b[1] / lb * r)
        for k in range(seg + 1):
            t = k / seg
            out.append(((1 - t) ** 2 * s_[0] + 2 * (1 - t) * t * p1[0] + t * t * e_[0], (1 - t) ** 2 * s_[1] + 2 * (1 - t) * t * p1[1] + t * t * e_[1]))
    return out


CAP_IN, CAP_OUT = -0.55, 0.78  # the block's inner and outer faces, off the arch
bm = kit.prism(round_corners(trap, 0.35), CAP_IN, CAP_OUT)
basis = Matrix(((0, et.x, er.x, o.x), (1, et.y, er.y, o.y), (0, et.z, er.z, o.z), (0, 0, 0, 1)))
endcap = part('endcap', bm, M['plastic'], basis)
kit.bevel(endcap, 0.09, 2)
left.append(endcap)

# --- The cable: an MMCX plug into the bottom of the shell, towards the front ----------------------
G = min((o_.matrix_world @ v.co).z for o_ in left[:5] for v in o_.data.vertices)  # the plinth


def socket(y):
    a, b = SHELL[0] - 0.02, SHELL[1] - 0.02
    z = -b * math.sqrt(max(0.0, 1 - (y / a) ** 2))
    return Vector((0.95, y, z)), Vector((0, y / a ** 2, z / b ** 2)).normalized()


for k in range(30):  # as far back under the cup as the plug still clears the plinth
    sock, axis = socket(-1.6 - 0.1 * k)
    if (M_CUP @ (sock + axis * PLUG_L)).z >= G + RC + 0.03:
        break
ribs = [(0.26 - 0.05 * f + (0.025 if i % 2 else 0), 1.0 + f * (PLUG_L - 1.05)) for i, f in enumerate(k / 8 for k in range(9))]
plug = lathe([(0.3, -0.3), (0.31, 0.0), (0.31, 0.9), (0.27, 0.97)] + ribs + [(RC, PLUG_L)], sock, axis)
left.append(part('plug', plug, M['rubber'], M_CUP))
t0 = M_CUP @ (sock + axis * PLUG_L)
d0 = (M_CUP.to_3x3() @ axis).normalized()


def cable(name, pts):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = RC
    cu.bevel_resolution = 2
    cu.resolution_u = 5
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    for o_ in bpy.context.selected_objects:
        o_.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(M['rubber'])
    return ob


t1 = t0 + d0 * 0.6
t1.z = max(t1.z, G + RC)
left.append(cable('cable', [t0, t1, Vector((t0.x - 0.6, t0.y - 1.5, G + RC)), Vector((t0.x * 0.4, SPLIT_Y + 1.3, G + RC)),
                            Vector((0.19, SPLIT_Y + 0.25, G + 0.38)), Vector((0.19, SPLIT_Y - 0.3, G + 0.42))]))

# --- The right side: the left, mirrored -----------------------------------------------------------
for o_ in left:
    mirrored(o_)

# --- Print: the logo on each cap, SRH1540 and L / R on each end cap -------------------------------
logo = letters('SHURE', 'TeX Gyre Heros:bold:italic', bold=0.025, res=4)
srh = letters('SRH1540', 'TeX Gyre Heros', res=3)
for side, sx in ((0, 1), (1, -1)):
    flip = Matrix.Scale(sx, 4, (1, 0, 0))
    lw, lh = logo[2]

    def on_cap(x, y, sx=sx, lw=lw, lh=lh, flip=flip):
        yy, zz = CAP_C[0] + sx * x * 3.4 / lw, CAP_C[1] + y * 0.55 / lh  # 34 mm wide, level
        uy, uz = untilted(yy, zz)
        return flip @ (M_YOKE @ Vector((dome(uy, uz) + 0.004, yy, zz)))

    lay('logo', logo, on_cap, (sx * math.cos(ROLL), 0, -math.sin(ROLL)), M['print'])
    # the end cap's outer face: along Y as read from outside that side, up towards the top of the arch
    face = flip @ (o + er * (CAP_OUT + 0.003))
    up = flip.to_3x3() @ et
    along = Vector((0, sx, 0))
    nrm = flip.to_3x3() @ er
    sw, sh = srh[2]
    lay('srh', srh, lambda x, y, f=face, a=along, u=up, k=2.0 / sw: f + a * (x * k) + u * (y * k + 0.5), nrm, M['grey'])
    mark = face + up * -0.42
    ring_mesh(0.27, 0.315, lambda x, y, f=mark, a=along, u=up: f + a * x + u * y, nrm)
    ch = letters('LR'[side], 'TeX Gyre Heros', res=3)
    lay('lr', ch, lambda x, y, f=mark, a=along, u=up, k=0.28 / ch[2][1]: f + a * (x * k) + u * (y * k), nrm, M['grey'])

# --- The headband: two leather-wrapped steel bands, a cushion under the middle of each ------------
band = [on_arc(math.radians(d)) for d in range(-60, 61, 3)]
for y in (-RAIL_Y, RAIL_Y):
    part('rail', sweep(band, section(1.05, 0.55, 0.2, dy=y, seg=2)), M['leather'])
    cush = [on_arc(math.radians(d)) for d in range(-36, 37, 3)]

    def pillow(k, y=y, n=len(cush)):
        f = (k / (n - 1)) * 2 - 1  # -1 .. 1 along it
        t = 0.75 * max(0.08, 1 - f ** 4) ** 0.5
        nc, hh = (0.2 + 0.275 + t) / 2, (0.275 + t - 0.2) / 2
        pts = []
        for i in range(12):
            a = 2 * math.pi * i / 12
            c, s_ = math.cos(a), math.sin(a)
            pts.append((nc + hh * math.copysign(abs(s_) ** (2 / 3), s_), y + 0.49 * math.copysign(abs(c) ** (2 / 3), c)))
        return pts

    part('cushion', sweep(cush, pillow), M['leather'])

# --- The splitter, the single leg of the cable, and its gold 3.5 mm plug lying on the plinth --------
part('splitter', lathe([(0.3, 0.0), (0.4, 0.08), (0.42, 0.2), (0.42, 1.5), (0.4, 1.6), (0.3, 1.66), (0.24, 2.0), (0.2, 2.2)], (0, SPLIT_Y, G + 0.42), (0, -1, 0)), M['rubber'])
jack = Vector((1.6, SPLIT_Y - 3.6, G + 0.42))
cable('cable', [Vector((0, SPLIT_Y - 2.1, G + 0.42)), Vector((0, SPLIT_Y - 2.7, G + RC + 0.02)), Vector((0.5, SPLIT_Y - 3.45, G + RC)), jack + Vector((0.1, 0, 0))])
relief = [(0.2 + 0.16 * f + (0.03 if i % 2 else 0), 1.5 * f) for i, f in enumerate(k / 10 for k in range(11))]
part('jack', lathe(relief + [(0.4, 1.55), (0.42, 1.7), (0.42, 3.6), (0.38, 3.75), (0.3, 3.8)], jack, (1, 0, 0)), M['rubber'])
part('pin', lathe([(0.28, 3.75), (0.3, 3.8), (0.3, 4.2), (0.25, 4.25), (0.175, 4.26), (0.175, 5.38), (0.13, 5.42), (0.13, 5.5), (0.17, 5.56), (0.12, 5.66), (0.02, 5.72)], jack, (1, 0, 0)), M['gold'])
for x in (4.8, 5.12):
    part('band', lathe([(0.178, x), (0.178, x + 0.06)], jack, (1, 0, 0)), M['rubber'])

# --- One object per material; the origin to the middle of the bottom of the whole -----------------
obs = [o_ for o_ in bpy.context.scene.objects if o_.type == 'MESH']
lo = Vector([min((o_.matrix_world @ v.co)[i] for o_ in obs for v in o_.data.vertices) for i in range(3)])
hi = Vector([max((o_.matrix_world @ v.co)[i] for o_ in obs for v in o_.data.vertices) for i in range(3)])
shift = Matrix.Translation((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
by_mat = {}
for o_ in obs:
    o_.data.transform(o_.matrix_world)
    o_.matrix_world = Matrix.Identity(4)
    o_.data.transform(shift)
    by_mat.setdefault(o_.data.materials[0].name, []).append(o_)
for name, group in by_mat.items():
    ob = kit.join(name, group) if len(group) > 1 else group[0]
    ob.name = name
    kit.shade_smooth(ob, 60 if name in ('alcantara', 'leather', 'rubber') else 50 if name == 'alu' else 40)
size = hi - lo
print(f'size [w, h, d] = [{size.x:.2f}, {size.z:.2f}, {size.y:.2f}] cm')

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('front', 'three-quarter', 'side', 'back', 'top'), samples=32)
