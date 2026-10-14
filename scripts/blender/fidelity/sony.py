"""Sony's two small Bluetooth speakers, which he used together, side by side on one plinth, in black:

- SRS-XE200 (2022): a long five-sided prism stood on end. Its nose is a strip of knitted fabric over
  the Line-Shape Diffuser and the two drivers behind it; soft rubber wraps the rest, from 1 cm off the
  foot to 1.2 cm under the top, leaving bands of the knit round both ends and rubber caps on them. SONY
  is printed low on the right front face, the controls down the right flank (power, CHARGE, Bluetooth,
  play/call with the microphone, + and -, BATT/STAMINA, microphone off), the USB-C cover low on the
  back, and a braided cord loop with a slider and a knot hangs from the back right corner.
- SRS-XB100 (2023): a small cylinder ribbed all round, a domed perforated steel grille on top over its
  one driver, a passive radiator venting through four slots round the foot ring, SONY moulded up the
  front, the controls on a smooth band at the back (power/CHARGE, Bluetooth/ST PAIR, call and
  play/pause with the microphone, - +), the USB-C cap beside them, and a woven strap through a slot
  under the rim on the left, ending in a buckle.

    blender -b --python scripts/blender/fidelity/sony.py -- [out.glb] [preview.png]

Sizes, from Sony's spec sheets (sony.jp/active-speaker/products/SRS-XE200/spec.html and
.../SRS-XB100/spec.html; the same figures on Sony's Malaysian and Singapore stores):
- SRS-XE200: 90 x 208 x 94 mm (W x H x D, the largest protrusions included), about 800 g.
- SRS-XB100: 76 mm across, 95 mm high, about 274 g.
Laid out from Sony's product pictures (sony.jp/products/picture/y_SRS-XE200_0NN.jpg and
y_SRS-XB100_0NN.jpg), the XE200 Help Guide's Parts and controls
(helpguide.sony.net/speaker/srs-xe200/v1/en/print.pdf), and photographs in the RTINGS, TechRadar and
SoundGuys reviews, measured at their scale: the XB100's foot ring 2.1 cm high with slots 3.5 x 0.68 cm,
its SONY 4.25 cm long and 0.72 cm high, its controls 23 degrees apart; the XE200's rubber from 1 to
19.6 cm up and its controls from 4.3 to 13.2 cm.

Both stand as they normally stand, fronts to -Y: the XE200 on the left, the XB100 on the right, 5 cm
between them. The origin is the middle of the bottom of the pair. Nothing moves or opens. The XE200's
knit is a small tiled texture (colour and normal map); the XB100's grille holes are geometry.
"""

import math
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402
import numpy as np  # noqa: E402  (Blender's own)

OUT, PREVIEW = kit.args('sony')
kit.reset()

GAP = 5.0
XE_W, XE_D, XE_H = 9.0, 9.4, 20.8
XB_R, XB_H = 3.8, 9.5
WIDTH = XE_W + GAP + 2 * XB_R
XE_X = -WIDTH / 2 + XE_W / 2  # the XE200's middle
XB_X = WIDTH / 2 - XB_R  # the XB100's axis


# --- Textures: the XE200's knit, tiled ----------------------------------------------------------
TMP = tempfile.mkdtemp()
KNIT = 0.8  # cm per tile: 8 x 8 stitches of 1 mm


def image(name, rgb, data=False):
    """A tiling image from an (h, w, 3) array (0..1), saved as JPEG so the GLB carries it small."""
    h, w, _ = rgb.shape
    im = bpy.data.images.new(name, w, h, alpha=False)
    im.pixels.foreach_set(np.concatenate([rgb, np.ones((h, w, 1))], axis=2).astype(np.float32).ravel())
    path = os.path.join(TMP, name + '.jpg')
    im.filepath_raw = path
    im.file_format = 'JPEG'
    im.save(quality=90)
    bpy.data.images.remove(im)
    im = bpy.data.images.load(path)
    im.pack()
    if data:
        im.colorspace_settings.name = 'Non-Color'
    return im


def knit():
    """Jersey knit: columns of V stitches, each leg a slanted oval, in a melange of dark and lighter
    yarns. Returns colour and normal map arrays."""
    T, C = 128, 16
    yy, xx = np.mgrid[0:T, 0:T].astype(float) + 0.5
    i, j = (xx // C).astype(int), (yy // C).astype(int)
    fx, fy = xx % C / C, yy % C / C

    def leg(cx, ang):
        dx, dy = fx - cx, fy - 0.5
        c, s = math.cos(ang), math.sin(ang)
        u, v = (dx * c + dy * s) / 0.22, (-dx * s + dy * c) / 0.48
        return np.clip(1 - (u * u + v * v), 0, 1)

    left, right = leg(0.29, 0.42), leg(0.71, -0.42)
    h = np.sqrt(np.maximum(left, right))
    yarn = np.random.default_rng(3).random((T // C, T // C, 2))
    y = np.where(left >= right, yarn[j, i, 0], yarn[j, i, 1])
    tone = np.where(y > 0.78, 0.3, 0.16) + 0.04 * y
    col = tone * (0.3 + 0.7 * h)
    gx = np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)
    gy = np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)
    n = np.stack([-gx, -gy, np.ones_like(h)], axis=2)
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return np.stack([col, col, col * 1.03], axis=2), n * 0.5 + 0.5


def textured(mat, color, normal, strength=1.0):
    nt = mat.node_tree
    p = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = color
    nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    t = nt.nodes.new('ShaderNodeTexImage')
    t.image = normal
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nm.inputs['Strength'].default_value = strength
    nt.links.new(t.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    return mat


KNIT_RGB, KNIT_N = knit()
M = {
    'knit': textured(kit.material('knit', (1, 1, 1), rough=0.92), image('sony_knit', KNIT_RGB), image('sony_knit_n', KNIT_N, data=True)),
    'rubber': kit.material('rubber', kit.srgb('#2e3234'), rough=0.6),
    'xe_print': kit.material('xe_print', kit.srgb('#a3a7a9'), rough=0.6),
    'cord': kit.material('cord', kit.srgb('#2b2d30'), rough=0.85),
    'body': kit.material('body', kit.srgb('#2d2e30'), rough=0.58),
    'logo': kit.material('logo', kit.srgb('#2f3032'), rough=0.36),
    'grille': kit.material('grille', kit.srgb('#232426'), rough=0.5, metal=0.35),
    'hole': kit.material('hole', kit.srgb('#030303'), rough=0.9),
    'xb_print': kit.material('xb_print', kit.srgb('#b8babc'), rough=0.55),
    'cap': kit.material('cap', kit.srgb('#262729'), rough=0.72),
    'webbing': kit.material('webbing', kit.srgb('#3a3c3f'), rough=0.95),
    'buckle': kit.material('buckle', kit.srgb('#141415'), rough=0.45),
}


# --- Helpers ------------------------------------------------------------------------------------
def rounded(sharp, radii, seg=10):
    """A convex polygon (counter-clockwise) with each corner rounded by its radius."""
    out = []
    n = len(sharp)
    for k in range(n):
        v, p, q = Vector(sharp[k]), Vector(sharp[k - 1]), Vector(sharp[(k + 1) % n])
        a, b = (p - v).normalized(), (q - v).normalized()
        half = a.angle(b) / 2
        r = radii[k]
        c = v + (a + b).normalized() * (r / math.sin(half))
        t1 = v + a * (r / math.tan(half))
        t2 = v + b * (r / math.tan(half))
        a1 = math.atan2(t1.y - c.y, t1.x - c.x)
        sweep = (math.atan2(t2.y - c.y, t2.x - c.x) - a1) % (2 * math.pi)
        out += [(c.x + r * math.cos(a1 + sweep * i / seg), c.y + r * math.sin(a1 + sweep * i / seg)) for i in range(seg + 1)]
    return out


def offset(sharp, d):
    """Move every edge of a counter-clockwise polygon out by d (in, for d < 0)."""
    out = []
    n = len(sharp)
    for k in range(n):
        p, v, q = Vector(sharp[k - 1]), Vector(sharp[k]), Vector(sharp[(k + 1) % n])
        e1, e2 = (v - p).normalized(), (q - v).normalized()
        n1, n2 = Vector((e1.y, -e1.x)), Vector((e2.y, -e2.x))
        out.append(tuple(v + (n1 + n2) * (d / (1 + n1.dot(n2)))))
    return out


def tube(outer, inner, z0, z1):
    """A wall between two outlines with the same number of points, z0 to z1, closed top and bottom."""
    bm = bmesh.new()
    o0, o1 = [bm.verts.new((x, y, z0)) for x, y in outer], [bm.verts.new((x, y, z1)) for x, y in outer]
    i0, i1 = [bm.verts.new((x, y, z0)) for x, y in inner], [bm.verts.new((x, y, z1)) for x, y in inner]
    for k in range(len(outer)):
        m = (k + 1) % len(outer)
        bm.faces.new((o0[k], o0[m], o1[m], o1[k]))
        bm.faces.new((i0[m], i0[k], i1[k], i1[m]))
        bm.faces.new((o1[k], o1[m], i1[m], i1[k]))
        bm.faces.new((i0[k], i0[m], o0[m], o0[k]))
    return bm


def lathe(profile, seg=96):
    """Revolve (r, z) about the vertical axis; an r of 0 closes it to a point. Walk the profile with
    the outside on the same hand throughout (up the outside, in across a top, out across a bottom)."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append([bm.verts.new((0, 0, z))] * seg)
        else:
            rings.append([bm.verts.new((r * math.sin(2 * math.pi * i / seg), -r * math.cos(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            vs = []
            for v in (a[i], a[j], b[j], b[i]):
                if v not in vs:
                    vs.append(v)
            bm.faces.new(vs)
    return bm


def catmull(pts, n=6):
    """A smooth path through the points."""
    P = [Vector(pts[0])] + [Vector(p) for p in pts] + [Vector(pts[-1])]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out


def font_file(pattern):
    try:
        path = subprocess.run(['fc-match', '-f', '%{file}', pattern], capture_output=True, text=True, check=True).stdout.strip()
        return bpy.data.fonts.load(path, check_existing=True) if os.path.exists(path) else None
    except (OSError, subprocess.CalledProcessError, RuntimeError):
        return None


SERIF = font_file('DejaVu Serif:bold')  # the nearest to Sony's slab-serif wordmark to hand


def letters(name, body, size, mat, font=None, depth=0.0, spacing=1.0, res=2):
    """Lettering in the local frame decals are made in: across along x, up along z, standing out
    towards -y with its back a hair off y = 0. Flat print when depth is 0."""
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body, cu.size, cu.align_x, cu.align_y = body, size, 'CENTER', 'CENTER'
    cu.space_character, cu.resolution_u, cu.extrude = spacing, res, depth / 2
    f = font or kit.font('sans')
    if f:
        cu.font = f
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    ob.data.transform(Matrix.Rotation(math.radians(90), 4, 'X') @ Matrix.Translation((0, 0, depth / 2 + 0.004)))
    return ob


def decal(name, bm, mat):
    return kit.new_object(name, bm, mat)


def strokes(lines, w, polys=()):
    """Print: polylines w wide and filled polygons, in the decal frame (u, v), far enough off the
    surface that a straight stroke bent round the XB100 stays clear of it."""
    bm = bmesh.new()
    for line in lines:
        for (x0, y0), (x1, y1) in zip(line, line[1:]):
            L = math.hypot(x1 - x0, y1 - y0)
            ex, ey = (x1 - x0) / L * w / 2, (y1 - y0) / L * w / 2
            quad = ((x0 - ex - ey, y0 - ey + ex), (x0 - ex + ey, y0 - ey - ex), (x1 + ex + ey, y1 + ey - ex), (x1 + ex - ey, y1 + ey + ex))
            bm.faces.new([bm.verts.new((x, -0.005, y)) for x, y in quad])
    for poly in polys:
        bm.faces.new([bm.verts.new((x, -0.005, y)) for x, y in poly])
    for f in bm.faces:  # all facing out
        f.normal_update()
        if f.normal.y > 0:
            f.normal_flip()
    return bm


def plate(w, h, r, d0, d1, seg=5):
    """A rounded w x h plate in the decal frame, from d0 to d1 out of the surface."""
    bm = kit.prism(kit.rounded_rect(w, h, r, seg), d0, d1)
    return kit.front(bm)


def bisect_u(bm, step, half):
    """Cut a decal into strips across u, so it can bend round a cylinder."""
    k = -half
    while k < half:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(k, 0, 0), plane_no=(1, 0, 0))
        k += step
    return bm


def on_cylinder(ob, cx, cy, R, phi, zc):
    """Bend a decal made in the local frame onto a vertical cylinder: u round it from angle phi
    (degrees, from -Y towards +X), v up from zc, -y out of the surface."""
    p0 = math.radians(phi)
    for v in ob.data.vertices:
        a, r = p0 + v.co.x / R, R - v.co.y
        v.co = (cx + r * math.sin(a), cy - r * math.cos(a), zc + v.co.z)
    return ob


def on_face(ob, frame, du, zc):
    """Lay a decal made in the local frame on a flat face: frame = (point, across, out)."""
    p, t, n = frame
    for v in ob.data.vertices:
        u, d = v.co.x + du, -v.co.y
        v.co = (p.x + u * t.x + d * n.x, p.y + u * t.y + d * n.y, zc + v.co.z)
    return ob


def tidy(ob):
    """After a join: name the mesh for the object and drop texture coordinates nothing here uses."""
    ob.data.name = ob.name
    for layer in list(ob.data.uv_layers):
        ob.data.uv_layers.remove(layer)
    return ob


def arc_pts(cx, cy, r, a0, a1, n=10):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


# The control icons, about s across, as (lines, polygons).
def icon_power(s):
    return [arc_pts(0, -0.04 * s, 0.38 * s, 125, 415, 14), [(0, 0.02 * s), (0, 0.48 * s)]], []


def icon_bt(s):
    return [[(-0.24 * s, 0.22 * s), (0.22 * s, -0.22 * s), (0, -0.46 * s), (0, 0.46 * s), (0.22 * s, 0.22 * s), (-0.24 * s, -0.22 * s)]], []


def icon_play(s, call=True):
    tri = [(-0.48 * s, -0.24 * s), (0.04 * s, 0.0), (-0.48 * s, 0.24 * s)]
    lines = [[(0.18 * s, -0.24 * s), (0.18 * s, 0.24 * s)], [(0.38 * s, -0.24 * s), (0.38 * s, 0.24 * s)]]
    if call:  # the handset above it
        lines.append(arc_pts(-0.12 * s, 0.38 * s, 0.26 * s, 160, 20, 8))
    return lines, [tri]


def icon_plus(s):
    return [[(-0.34 * s, 0), (0.34 * s, 0)], [(0, -0.34 * s), (0, 0.34 * s)]], []


def icon_minus(s):
    return [[(-0.34 * s, 0), (0.34 * s, 0)]], []


def icon_mic_off(s):
    capsule = arc_pts(0, 0.22 * s, 0.13 * s, 0, 180, 6) + arc_pts(0, 0.02 * s, 0.13 * s, 180, 360, 6)
    capsule.append(capsule[0])
    return [capsule, arc_pts(0, 0.06 * s, 0.24 * s, 190, 350, 8), [(0, -0.18 * s), (0, -0.34 * s)], [(-0.3 * s, 0.42 * s), (0.3 * s, -0.36 * s)]], []


def dot(r, x=0.0, y=0.0):
    return kit.circle(r, 12, x, y)


def icon(name, kind, s, w, mat):
    lines, polys = kind(s)
    return decal(name, strokes(lines, w * s, polys), mat)


# ==================================================================================================
# SRS-XE200
# ==================================================================================================
# The section: a five-sided prism, nose forward (the knit strip), the widest point a little ahead of
# the middle, a flat back. Fitted so it is 9.0 cm across the rubber and 9.4 cm from the knit on the
# nose (0.12 cm inside the rubber's line) to the rubber on the back.
UNIT = [(0, -1), (0.951, -0.309), (0.588, 0.809), (-0.588, 0.809), (-0.951, -0.309)]
RADII = [1.5, 1.6, 1.0, 1.0, 1.6]
sx, sy, oy = 4.5, 4.7, 0.0
for _ in range(8):
    SHARP = [(x * sx, y * sy + oy) for x, y in UNIT]
    pts = rounded(SHARP, RADII)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    sx *= XE_W / (max(xs) - min(xs))
    sy *= (XE_D + 0.12) / (max(ys) - min(ys))
    oy -= (max(ys) + min(ys)) / 2
SHARP = [(x * sx + XE_X, y * sy + oy - 0.06) for x, y in UNIT]


def outline(d, rmin=0.3):
    return rounded(offset(SHARP, d), [max(r + d, rmin) for r in RADII])


OUTER = outline(0.0)  # the rubber: the silhouette
FABRIC = outline(-0.12)
STRIP = 1.1  # half-width of the knit strip up the nose
RUB = (1.0, 19.6)  # the rubber, bottom to top


def face(k):
    """The k-th flat face of the outline (0 front right, 1 right flank, 2 back, 3 left flank, 4 front
    left): its middle, the way across it (left to right as seen from outside) and its outward normal."""
    p, q = Vector(SHARP[k]), Vector(SHARP[(k + 1) % 5])
    t = (q - p).normalized()
    return (p + q) / 2, t, Vector((t.y, -t.x))


xe = []
# --- The knit: a sleeve over the whole body, rounded over at both ends ---------------------------
fabric = kit.new_object('xe200_knit', kit.prism(FABRIC, 0.1, XE_H - 0.1), M['knit'])
kit.bevel(fabric, 0.55, 4)
kit.shade_smooth(fabric, 50)

# UVs at true scale: round the sides by arc length (from the middle of the back, where the rubber
# hides the seam), straight across the ends.
pts = [Vector(p) - Vector((XE_X, 0)) for p in FABRIC]
acc = [0.0]
for a, b in zip(pts, pts[1:] + pts[:1]):
    acc.append(acc[-1] + (b - a).length)
PER = acc[-1]


def along(x, y):
    q, best = Vector((x, y)), None
    for k in range(len(pts)):
        a, b = pts[k], pts[(k + 1) % len(pts)]
        ab = b - a
        t = max(0.0, min(1.0, (q - a).dot(ab) / ab.length_squared))
        d = (q - a - ab * t).length
        if best is None or d < best[0]:
            best = (d, acc[k] + t * ab.length)
    return best[1]


S_BACK = along(0, 10)
bm = bmesh.new()
bm.from_mesh(fabric.data)
bm.normal_update()
uv = bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    if abs(f.normal.z) > 0.7:
        for lp in f.loops:
            lp[uv].uv = ((lp.vert.co.x - XE_X) / KNIT, lp.vert.co.y / KNIT)
    else:
        us = [((along(lp.vert.co.x - XE_X, lp.vert.co.y) - S_BACK) % PER) / KNIT for lp in f.loops]
        if max(us) - min(us) > PER / KNIT / 2:
            mid = (max(us) + min(us)) / 2
            us = [u + PER / KNIT if u < mid else u for u in us]
        for lp, u in zip(f.loops, us):
            lp[uv].uv = (u, lp.vert.co.z / KNIT)
bm.to_mesh(fabric.data)
bm.free()

# --- Rubber caps on both ends, set into the knit -------------------------------------------------
CAP = outline(-0.78)
for name, z0, z1 in (('xe200_top', XE_H - 0.25, XE_H), ('xe200_foot', 0.0, 0.25)):
    ob = kit.new_object(name, kit.prism(CAP, z0, z1), M['rubber'])
    kit.bevel(ob, 0.07, 2)
    kit.shade_smooth(ob, 40)
    xe.append(ob)

# --- The rubber round everything but the nose ----------------------------------------------------
shell = kit.new_object('xe200_rubber', tube(OUTER, outline(-0.3), *RUB), M['rubber'])
kit.bevel(shell, 0.25, 3)
# The strip up the nose, its ends opening into the bands of knit with rounded corners.
z0, z1, rf, s = RUB[0], RUB[1], 1.0, STRIP
cut_pts = ([(-s - rf, z0 - 1), (s + rf, z0 - 1)] + arc_pts(s + rf, z0 + rf, rf, -90, -180, 8) + arc_pts(s + rf, z1 - rf, rf, 180, 90, 8)
           + [(s + rf, z1 + 1), (-s - rf, z1 + 1)] + arc_pts(-s - rf, z1 - rf, rf, 90, 0, 8) + arc_pts(-s - rf, z0 + rf, rf, 0, -90, 8))
cut_pts = [(x + XE_X, z) for x, z in cut_pts]
kit.cut(shell, kit.cutter(kit.front(kit.prism(cut_pts, 1.0, 6.0))))
kit.bevel(shell, 0.1, 2)
kit.shade_smooth(shell, 40)
xe.append(shell)

FR, SR, BACK = face(0), face(1), face(2)

# SONY low on the right front face.
xe.append(on_face(letters('xe200_sony', 'SONY', 0.48, M['xe_print'], font=SERIF, spacing=1.3), FR, 0.25, 2.15))

# The controls down the right flank, their indicators and the microphone on the side towards the front.
CX = 0.1
for name, kind, s, z in (('power', icon_power, 0.5, 13.2), ('bt', icon_bt, 0.48, 10.75), ('play', icon_play, 0.5, 9.3),
                         ('plus', icon_plus, 0.46, 7.95), ('minus', icon_minus, 0.46, 6.75), ('micoff', icon_mic_off, 0.5, 4.3)):
    xe.append(on_face(icon('xe200_' + name, kind, s, 0.13, M['xe_print']), SR, CX, z))
xe.append(on_face(letters('xe200_charge', 'CHARGE', 0.1, M['xe_print']), SR, CX + 0.08, 12.0))
xe.append(on_face(letters('xe200_batt', 'BATT', 0.2, M['xe_print']), SR, CX, 5.7))
xe.append(on_face(letters('xe200_stamina', 'STAMINA', 0.075, M['xe_print']), SR, CX + 0.05, 5.33))
dots = [dot(0.035, -0.55, z) for z in (13.2, 12.0, 10.75, 5.33, 4.3)] + [dot(0.03, -0.55 - 0.12 * k, 9.3) for k in range(3)]
xe.append(on_face(decal('xe200_dots', strokes((), 0, dots), M['xe_print']), SR, CX, 0.0))

# The USB-C cover low on the back, near the right flank: a rubber door with its groove and pull.
xe.append(on_face(decal('xe200_door_groove', plate(1.62, 1.82, 0.16, 0.0, 0.006), M['hole']), BACK, -1.2, 3.3))
door = on_face(decal('xe200_door', plate(1.5, 1.7, 0.12, -0.01, 0.015), M['rubber']), BACK, -1.2, 3.3)
xe.append(door)
xe.append(on_face(decal('xe200_pull', plate(0.6, 0.06, 0.03, 0.015, 0.02), M['hole']), BACK, -1.2, 4.0))

# --- The cord loop from the back right corner ------------------------------------------------------
o = (SR[2] + BACK[2] * 0.3).normalized()  # out from the corner, mostly sideways
side = Vector((-o.y, o.x))  # across it
corner = Vector(OUTER[2 * 11])  # where the right flank turns the corner to the back (11 points a corner)


def at(out, across, z):
    p = corner + o * out + side * across
    return (p.x, p.y, z)


for z in (18.9, 17.4):  # where the cord goes into the corner
    hole = kit.transform(kit.cylinder(0.24, -0.03, 0.03, 16), rotate=[(-90, 'X'), (math.degrees(math.atan2(o.x, -o.y)), 'Z')])
    xe.append(kit.new_object('xe200_eyelet', kit.transform(hole, translate=at(0.0, 0, z)), M['hole']))


def cord(name, path, r=0.2):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth, cu.bevel_resolution, cu.use_fill_caps, cu.resolution_u = r, 1, True, 3
    sp = cu.splines.new('NURBS')
    sp.points.add(len(path) - 1)
    for p, q in zip(sp.points, path):
        p.co = (*q, 1)
    sp.use_endpoint_u, sp.order_u = True, 3
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    for x in bpy.context.selected_objects:
        x.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(M['cord'])
    kit.shade_smooth(ob, 60)
    return ob


SLIDE, KNOT = 13.0, 4.2
for a, z in ((-1, 18.9), (1, 17.4)):
    xe.append(cord('xe200_cord', [at(-0.1, 0, z), at(0.35, 0, z - 0.2), at(0.56, 0.1 * a, z - 1.6), at(0.62, 0.2 * a, SLIDE + 0.6),
                                  at(0.62, 0.21 * a, SLIDE), at(0.6, 0.22 * a, SLIDE - 3.5), at(0.58, 0.2 * a, KNOT + 0.6), at(0.58, 0.08 * a, KNOT)]))
    xe.append(cord('xe200_tail', [at(0.58, 0.05 * a, KNOT), at(0.6, 0.22 * a, KNOT - 0.5), at(0.62, 0.3 * a, KNOT - 1.0)], 0.17))
slider = kit.transform(kit.cylinder(0.36, -0.6, 0.6, 20), translate=at(0.62, 0, SLIDE))
ob = kit.new_object('xe200_slider', slider, M['cord'])
kit.bevel(ob, 0.08, 2)
kit.shade_smooth(ob, 40)
xe.append(ob)
knot = bmesh.new()
bmesh.ops.create_uvsphere(knot, u_segments=16, v_segments=10, radius=0.4)
kit.transform(knot, scale=(1.0, 1.0, 1.25), translate=at(0.58, 0, KNOT))
ob = kit.new_object('xe200_knot', knot, M['cord'])
kit.shade_smooth(ob, 60)
xe.append(ob)

tidy(kit.join('xe200', xe))


# ==================================================================================================
# SRS-XB100
# ==================================================================================================
N_RIB = 128
RIB = ((0.0, 0.0), (0.72, 0.0), (0.86, -0.035))  # across one rib, a flat and a V groove: (fraction, radius change)
PANEL = (120.0, 240.0)  # the smooth band at the back, round from the right to the left
FOOT, GROOVE, BODY, TOP = 1.95, 2.2, 4.05, 8.95  # foot ring top, upper body bottom, panel top, ribs' top
PLAIN = XB_R - 0.02


def rib_ring(smooth=None):
    out = []
    for k in range(N_RIB):
        for f, dr in RIB:
            phi = (k + f) * 360 / N_RIB
            out.append((phi, PLAIN if smooth and smooth[0] <= phi <= smooth[1] else XB_R + dr))
    return out


def ribbed(rings, r_in=None):
    """A ribbed tube from rings of (z, [(phi, r)...]) bottom to top; rings at the same height share
    the points where they agree and are joined by a ledge where they don't. With r_in, closed by an
    inner wall (material 1) and ends."""
    bm = bmesh.new()
    vrings = []
    for z, ring in rings:
        prev = vrings[-1] if vrings and abs(rings[len(vrings) - 1][0] - z) < 1e-6 else None
        vs = []
        for i, (phi, r) in enumerate(ring):
            if prev and abs(rings[len(vrings) - 1][1][i][1] - r) < 1e-6:
                vs.append(prev[i])
            else:
                a = math.radians(phi)
                vs.append(bm.verts.new((XB_X + r * math.sin(a), -r * math.cos(a), z)))
        vrings.append(vs)
    n = len(vrings[0])
    k = len(RIB)  # points per rib; the inner wall has one per rib
    inner = r_in and [[bm.verts.new((XB_X + r_in * math.sin(math.radians(phi)), -r_in * math.cos(math.radians(phi)), z)) for phi, _ in ring[::k]] for z, ring in (rings[0], rings[-1])]
    for a, b in zip(vrings, vrings[1:]):
        for i in range(n):
            j = (i + 1) % n
            vs = []
            for v in (a[i], a[j], b[j], b[i]):
                if v not in vs:
                    vs.append(v)
            if len(vs) >= 3:
                bm.faces.new(vs)
    bot, top = vrings[0], vrings[-1]
    for i in range(n // k if inner else 0):
        j = (i + 1) % (n // k)
        bm.faces.new((inner[0][j], inner[0][i], inner[1][i], inner[1][j])).material_index = 1
        bm.faces.new([top[(i * k + m) % n] for m in range(k + 1)] + [inner[1][j], inner[1][i]])
        bm.faces.new([inner[0][i], inner[0][j]] + [bot[(i * k + m) % n] for m in range(k, -1, -1)])
    return bm


xb = []
# --- The foot ring, ribbed, with a slot on each side for the passive radiator -----------------------
foot = kit.new_object('xb100_foot', ribbed([(0.25, rib_ring()), (FOOT, rib_ring())], XB_R - 0.3), [M['body'], M['hole']])
slots = bmesh.new()
for turn in (0, 90, 180, 270):
    sl = kit.prism(kit.rounded_rect(3.5, 0.68, 0.34, 6), 2.5, 6.0)  # through the front wall only: x across, y up
    kit.front(sl)
    kit.transform(sl, translate=(0, 0, 1.17), rotate=None)
    kit.transform(sl, rotate=(turn, 'Z'), translate=(XB_X, 0, 0))
    tmp = bpy.data.meshes.new('tmp')
    sl.to_mesh(tmp)
    sl.free()
    slots.from_mesh(tmp)
    bpy.data.meshes.remove(tmp)
kit.cut(foot, kit.cutter(slots))
kit.shade_smooth(foot, 70)  # soft flanks, a crease only in each groove
xb.append(foot)
xb.append(kit.new_object('xb100_cavity', kit.cylinder(XB_R - 0.36, 0.26, FOOT - 0.01, 48, x=XB_X), M['hole']))
# under it: a lip rolling under to the ring it stands on
under = lathe([(0, 0.04), (2.95, 0.04), (3.0, 0.0), (3.55, 0.0), (3.7, 0.06), (3.78, 0.26)], 64)
ob = kit.new_object('xb100_under', kit.transform(under, translate=(XB_X, 0, 0)), M['body'])
kit.shade_smooth(ob, 40)
xb.append(ob)
# the ring between the foot and the body, and the groove above it
ob = kit.new_object('xb100_ridge', kit.transform(lathe([(3.77, FOOT - 0.02), (3.81, FOOT + 0.02), (3.81, FOOT + 0.1), (3.78, FOOT + 0.13), (3.64, FOOT + 0.13)], 64), translate=(XB_X, 0, 0)), M['body'])
kit.shade_smooth(ob, 40)
xb.append(ob)
xb.append(kit.new_object('xb100_groove', kit.cylinder(3.66, FOOT + 0.1, GROOVE + 0.05, 96, x=XB_X), M['body']))

# --- The body: ribbed, plain across the control band at the back ----------------------------------
body = kit.new_object('xb100_body', ribbed([(GROOVE, rib_ring(PANEL)), (BODY, rib_ring(PANEL)), (BODY, rib_ring()), (TOP, rib_ring())]), M['body'])
kit.shade_smooth(body, 70)
xb.append(body)

# --- The rim and the domed grille ----------------------------------------------------------------
rim = lathe([(3.79, TOP - 0.02), (3.8, 9.04), (3.76, 9.11), (3.5, 9.12), (3.44, 9.08), (3.42, 8.9)], 96)
ob = kit.new_object('xb100_rim', kit.transform(rim, translate=(XB_X, 0, 0)), M['body'])
kit.shade_smooth(ob, 40)
xb.append(ob)
RG, ZG, APEX = 3.43, 9.05, XB_H  # the grille meets the rim at RG, ZG, and rises to APEX
RS = (RG ** 2 + (APEX - ZG) ** 2) / (2 * (APEX - ZG))  # its sphere
ZC = APEX - RS


def dome_z(r):
    return ZC + math.sqrt(RS * RS - r * r)


dome = lathe([(RG * (1 - i / 9), dome_z(RG * (1 - i / 9))) for i in range(10)], 72)
ob = kit.new_object('xb100_grille', kit.transform(dome, translate=(XB_X, 0, 0)), M['grille'])
kit.shade_smooth(ob, 40)
xb.append(ob)
# The holes, 2.1 mm on a hexagonal pitch of 2.9 mm, each a dark hexagon on the dome.
holes = bmesh.new()
P = 0.29
for jj in range(-14, 15):
    for ii in range(-14, 15):
        x, y = (ii + 0.5 * (jj % 2)) * P, jj * P * math.sqrt(3) / 2
        r = math.hypot(x, y)
        if r > 3.2:
            continue
        nrm = Vector((x, y, dome_z(r) - ZC)).normalized()
        rot = Vector((0, 0, 1)).rotation_difference(nrm).to_matrix()
        c = Vector((x + XB_X, y, dome_z(r))) + nrm * 0.004
        holes.faces.new([holes.verts.new(c + rot @ Vector((0.108 * math.cos(a), 0.108 * math.sin(a), 0))) for a in (math.pi * k / 3 for k in range(6))])
xb.append(kit.new_object('xb100_holes', holes, M['hole']))

# --- SONY up the front, moulded ------------------------------------------------------------------
logo = letters('xb100_sony', 'SONY', 0.98, M['logo'], font=SERIF, depth=0.035, spacing=1.32, res=2)
logo.data.transform(Matrix.Rotation(math.radians(-90), 4, 'Y'))  # reads upwards, its tops to the left
xb.append(on_cylinder(logo, XB_X, 0, XB_R - 0.01, 0.0, 5.22))

# --- The control band: power/CHARGE, Bluetooth/ST PAIR, call/play/MIC, -, + ------------------------
ZI = 3.25
for name, kind, s, phi, z in (('power', icon_power, 0.5, 133.4, ZI), ('bt', icon_bt, 0.5, 156.7, ZI), ('play', icon_play, 0.5, 180.0, ZI - 0.08),
                              ('minus', icon_minus, 0.46, 203.3, ZI), ('plus', icon_plus, 0.46, 226.6, ZI)):
    xb.append(on_cylinder(icon('xb100_' + name, kind, s, 0.13, M['xb_print']), XB_X, 0, PLAIN, phi, z))
for name, body_, phi, du in (('charge', 'CHARGE', 133.4, 0.06), ('pair', 'ST PAIR', 156.7, 0.12), ('mic', 'MIC', 180.0, 0.08)):
    xb.append(on_cylinder(letters('xb100_' + name, body_, 0.105, M['xb_print']), XB_X, 0, PLAIN, phi + math.degrees(du / PLAIN), 2.7))
marks = [dot(0.035, 0, 0.47), dot(0.03, -0.42, -0.55)]  # the indicators: over the key, and before its label
xb.append(on_cylinder(decal('xb100_dots', strokes((), 0, marks), M['xb_print']), XB_X, 0, PLAIN, 133.4, ZI))
xb.append(on_cylinder(decal('xb100_dots', strokes((), 0, [dot(0.035, 0, 0.47)]), M['xb_print']), XB_X, 0, PLAIN, 156.7, ZI))
xb.append(on_cylinder(decal('xb100_dash', strokes([[(-0.5, -0.55), (-0.38, -0.55)], [(-0.33, -0.55), (-0.21, -0.55)]], 0.04), M['xb_print']), XB_X, 0, PLAIN, 156.7, ZI))
xb.append(on_cylinder(decal('xb100_mic', strokes([[(-0.3, -0.55), (-0.16, -0.55)]], 0.05), M['xb_print']), XB_X, 0, PLAIN, 180.0, ZI))

# --- The USB-C cap beside the band, and the strap's slot under the rim on the left -----------------
xb.append(on_cylinder(decal('xb100_cap_groove', bisect_u(plate(1.32, 1.86, 0.3, -0.03, 0.004), 0.2, 0.66), M['hole']), XB_X, 0, XB_R, 256.0, 3.2))
xb.append(on_cylinder(decal('xb100_cap', bisect_u(plate(1.2, 1.74, 0.26, -0.02, 0.02), 0.2, 0.6), M['cap']), XB_X, 0, XB_R, 256.0, 3.2))
xb.append(on_cylinder(decal('xb100_slot', bisect_u(plate(1.8, 0.7, 0.2, -0.03, 0.004), 0.2, 0.9), M['hole']), XB_X, 0, XB_R, 270.0, 8.42))

# --- The strap: woven webbing, doubled, through the slot and down onto the plinth, then the buckle --
SW, ST = 1.5, 0.22  # width, thickness (two layers)
path = catmull([(-3.55, 8.42), (-3.95, 8.3), (-4.3, 7.4), (-4.5, 5.2), (-4.6, 2.8), (-4.72, 0.9), (-5.0, 0.25), (-5.45, 0.125), (-5.9, 0.115)], 6)
bm = bmesh.new()
quads = []
for i, p in enumerate(path):
    t = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]).normalized()
    n = Vector((-t.y, t.x))  # across the thickness, in the x-z plane
    quads.append([bm.verts.new((XB_X + p.x + n.x * a * ST / 2, b * SW / 2, p.y + n.y * a * ST / 2)) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
for a, b in zip(quads, quads[1:]):
    for k in range(4):
        m = (k + 1) % 4
        bm.faces.new((a[k], a[m], b[m], b[k]))
bm.faces.new(quads[0])
bm.faces.new(list(reversed(quads[-1])))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
ob = kit.new_object('xb100_strap', bm, M['webbing'])
kit.shade_smooth(ob, 40)
xb.append(ob)
# the buckle: a black plastic block lying on the plinth, the webbing through its slot
BX = XB_X - 6.6
buckle = kit.new_object('xb100_buckle', kit.prism(kit.rounded_rect(1.65, 2.0, 0.3, 6), 0.0, 0.4), M['buckle'])
buckle.data.transform(Matrix.Translation((BX, 0, 0)))
kit.bevel(buckle, 0.08, 2)
kit.shade_smooth(buckle, 40)
xb.append(buckle)
slot = kit.transform(kit.prism(kit.rounded_rect(0.32, 1.62, 0.1, 4), 0.0, 0.006), translate=(BX + 0.45, 0, 0.4))
xb.append(kit.new_object('xb100_buckle_slot', slot, M['hole']))
mark = letters('xb100_buckle_sony', 'SONY', 0.26, M['logo'], font=SERIF, spacing=1.2)
mark.data.transform(Matrix.Rotation(math.radians(-90), 4, 'X'))  # lay it on the top, reading along y
mark.data.transform(Matrix.Rotation(math.radians(90), 4, 'Z'))
mark.data.transform(Matrix.Translation((BX - 0.25, 0, 0.4)))
xb.append(mark)

tidy(kit.join('xb100', xb))

# --- Check the pair against the specs ------------------------------------------------------------
bpy.context.view_layer.update()


def bounds(obs):
    vs = [o.matrix_world @ v.co for o in obs for v in o.data.vertices]
    return [min(v[i] for v in vs) for i in range(3)], [max(v[i] for v in vs) for i in range(3)]


for name, w, d, h in (('xe200', XE_W, XE_D, XE_H), ('xb100', 2 * XB_R, 2 * XB_R, XB_H)):
    obs = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith(name)]
    lo, hi = bounds(obs)
    print(name, 'w %.2f d %.2f h %.2f' % (hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]))
lo, hi = bounds([o for o in bpy.data.objects if o.type == 'MESH'])
size = [hi[0] - lo[0], hi[2] - lo[2], hi[1] - lo[1]]
print('size [w, h, d] cm: [%.2f, %.2f, %.2f]' % tuple(size), 'middle x %.3f y %.3f' % ((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2))
assert abs(size[0] - WIDTH) < 0.1 and abs(size[1] - XE_H) < 0.05 and abs(size[2] - XE_D) < 0.1, size
assert abs(lo[2]) < 1e-3, lo

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back', 'top', 'side'), samples=32)
