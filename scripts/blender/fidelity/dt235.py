"""The beyerdynamic DT 235 (2008), matt black: a light closed on-ear headphone. One plain plastic
band, fixed, springs over the head and runs straight down onto each cup, its end a tab set into the
cup's dome with "DT 235" and an L or R on it; under the band a wide rubber strap, held at each side
by a small clip, rides on the head and takes up the size by itself. Egg-shaped cups, velour pads,
and the cable out of the left cup only.

    blender -b --python scripts/blender/fidelity/dt235.py -- [out.glb] [preview.png]

Sizes: beyerdynamic's datasheet (DT235_DB_D_A2, 02.11) gives 130 g without the cable, a 2.5 m
straight cable to a 3.5 mm plug, velour pads (EDT 231 V) and a nominal 2 N clamp, but no dimensions.
These are laid out from beyerdynamic's own photo and doctorhead.ru's front, side and close views,
scaled on the cups (about 7.4 x 8.4 cm, an on-ear pad) and the head: 17.6 cm across the band, 21.1 cm
high, 7.5 cm deep at the cups, at rest as it lies on a table (12.4 cm deep with the cable and plug).
Where the white beyerdynamic name sits (on top of the band) is from a review's description, not a
photo. Sold in matt black and white; this is the black.

Display pose: resting with no stand, the band's arch up in the X-Z plane, the cups at its feet at
+-X, facing each other a hand apart and leaning in a little at the bottom, as the band springs them;
the left cup (the cable's) at +X, as on a head facing the viewer. The cable drops from the left cup
to the plinth and runs out between the cups to its plug. Nothing moves.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('dt235')
kit.reset()

CUP_W, CUP_H = 7.4, 8.4  # a cup (and its pad) seen from the side: front to back, top to bottom
EGG = 0.06  # how much narrower the cup is at the top, where the arm comes in
PAD_T = 1.35  # the velour pads, shell to ear
WALL, DOME, P_DOME = 0.55, 1.75, 3.0  # the cup's shell: its straight wall, then its dome (a superellipse)
GAP = 6.4  # between the pads' faces at the middle, at rest
ROLL = 7  # degrees each cup leans in at the bottom
Y_ARM = 0.35  # the arm runs down the cup a little behind its middle
CZ = 4.45  # the cups' centres, above their lowest point
BAND_T = 0.3  # the band's plastic
ARC = (8.75, 9.75, 11.1)  # the band's arch: half-width, half-height and centre height (to its middle)
STRAP_TOP = 18.4  # the rubber strap's highest point
SEG = 48

M = {
    'band': kit.material('band', kit.srgb('#1c1c1d'), rough=0.6),
    'shell': kit.material('shell', kit.srgb('#1a1a1b'), rough=0.42),
    'strap': kit.material('strap', kit.srgb('#161617'), rough=0.72),
    'velour': kit.material('velour', kit.srgb('#111111'), rough=1.0),
    'cloth': kit.material('cloth', kit.srgb('#060606'), rough=0.95),
    'print': kit.material('print', kit.srgb('#e4e4e2'), rough=0.5),
    'grey': kit.material('grey', kit.srgb('#bdbdbb'), rough=0.5),
    'ink': kit.material('ink', kit.srgb('#0b0b0b'), rough=0.6),
    'cable': kit.material('cable', kit.srgb('#0f0f10'), rough=0.5),
    'metal': kit.material('metal', kit.srgb('#d2d2d0'), rough=0.18, metal=1.0),
}


# --- Shapes ----------------------------------------------------------------------------------------
def egg_r(a):
    """The cup's outline as a radius at angle a (from +Y, the back, round towards +Z, up)."""
    ay, bz = CUP_W / 2, CUP_H / 2
    return ay * bz / math.hypot(bz * math.cos(a), ay * math.sin(a)) * (1 - EGG * math.sin(a))


def egg(sy=1.0, sz=1.0):
    return [(egg_r(a) * math.cos(a) * sy, egg_r(a) * math.sin(a) * sz) for a in (2 * math.pi * i / SEG for i in range(SEG))]


def dome_x(y, z):
    """How far out the shell's dome is at (y, z), from the face the pad sits on."""
    r = min(1.0, math.hypot(y, z) / egg_r(math.atan2(z, y)))
    return WALL + DOME * (1 - r ** P_DOME) ** (1 / P_DOME)


def bezier(p0, p1, p2, p3, n):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


def lengths(path):
    s = [0.0]
    for a, b in zip(path, path[1:]):
        s.append(s[-1] + math.dist(a, b))
    return s


def sweep(path, widths, thick, r_frac=0.45, seg=3):
    """A flat strip along a path of (x, y, z) points that lies in an X-Z plane: widths[i] across it
    along Y, `thick` the other way; its edges rounded."""
    bm = bmesh.new()
    P = [Vector(p) for p in path]
    n = len(P)
    rings = []
    for i in range(n):
        T = (P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized()
        N = Vector((T.z, 0, -T.x))
        rings.append([bm.verts.new(P[i] + N * u + Vector((0, v, 0))) for u, v in kit.rounded_rect(thick, widths[i], thick * r_frac, seg)])
    bm.faces.new(rings[0])
    bm.faces.new(rings[-1])
    for a, b in zip(rings, rings[1:]):
        for k in range(len(a)):
            k1 = (k + 1) % len(a)
            bm.faces.new((a[k], a[k1], b[k1], b[k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def rounded_end(s, total, w, r):
    """The width of a strip `w` wide whose end (the last r of it) is rounded off, at length s."""
    d = s - (total - r)
    return w if d <= 0 else w * math.sqrt(max(0.0, 1 - (d / r) ** 2)) + 0.02


def yz_prism(pts, x0, x1):
    """An outline in (y, z) made solid from x0 to x1."""
    bm = kit.prism(pts, x0, x1)
    bmesh.ops.transform(bm, matrix=Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1))), verts=bm.verts)
    return bm


def rod(r0, r1, length, start, direction, seg=20):
    """A round rod from `start` along `direction`, tapering from r0 to r1."""
    bm = kit.cylinder(r0, 0, length, seg, r1=r1)
    q = Vector(direction).normalized().to_track_quat('Z', 'Y')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(start) @ q.to_matrix().to_4x4(), verts=bm.verts)
    return bm


def text(name, body, size, mat, location, along, up, bold=False, res=4, spacing=1.0, lift=0.004):
    """Flat lettering a hair off a surface, its baseline running `along`, its top towards `up`."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.resolution_u = res
    curve.space_character = spacing
    f = kit.font('sans', 700 if bold else 500)
    if f:
        curve.font = f
    curve.size = size
    curve.offset = size * 0.03 if bold else 0
    ob = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    a, u = Vector(along).normalized(), Vector(up).normalized()
    n = a.cross(u)
    ob.data.transform(Matrix(((a.x, u.x, n.x, 0), (a.y, u.y, n.y, 0), (a.z, u.z, n.z, 0), (0, 0, 0, 1))))
    ob.data.transform(Matrix.Translation(Vector(location) + n * lift))
    return ob


def obj(name, bm, mat, mx=None):
    """An object from a bmesh built in a cup's own frame, put in place by `mx` (which may mirror)."""
    if mx is not None:
        bmesh.ops.transform(bm, matrix=mx, verts=bm.verts)
        if mx.determinant() < 0:
            bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return kit.new_object(name, bm, mat)


# --- A cup, in its own frame: x out of the head (the pad's back at x 0, the dome beyond), y back, z up.
def cup_matrix(s):
    """Side s (+1 the left cup, at +X; -1 the right): into place, leaning in at the bottom."""
    c = Vector((s * (GAP / 2 + PAD_T), -Y_ARM, CZ))
    return Matrix.Translation(c) @ Matrix.Rotation(math.radians(s * ROLL), 4, 'Y') @ Matrix.Diagonal((s, 1, 1, 1))


def shell():
    bm = bmesh.new()
    out = egg()
    rings = [[bm.verts.new((x, y, z)) for y, z in out] for x in (0.0, WALL)]
    n = 9
    for j in range(1, n):
        phi = math.pi / 2 * j / n
        rr, hh = math.cos(phi) ** (2 / P_DOME), math.sin(phi) ** (2 / P_DOME)
        rings.append([bm.verts.new((WALL + DOME * hh, y * rr, z * rr)) for y, z in out])
    tip = bm.verts.new((WALL + DOME, 0, 0))
    bm.faces.new(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(SEG):
            j = (i + 1) % SEG
            bm.faces.new((a[i], a[j], b[j], b[i]))
    for i in range(SEG):
        bm.faces.new((rings[-1][i], rings[-1][(i + 1) % SEG], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def pad():
    """The velour pad: a soft ring, egg-shaped like the cup, round in section."""
    bm = bmesh.new()
    out, inn = egg(1.015, 1.015), egg(0.54, 0.6)
    prof = []
    for k in range(18):
        t = 2 * math.pi * k / 18
        c, s = math.cos(t), math.sin(t)
        prof.append((0.5 + 0.5 * math.copysign(abs(c) ** (2 / 3.4), c), PAD_T * (0.5 + 0.5 * math.copysign(abs(s) ** (2 / 3.4), s))))
    rings = [[bm.verts.new((-h, iy + (oy - iy) * r, iz + (oz - iz) * r)) for (oy, oz), (iy, iz) in zip(out, inn)] for r, h in prof]
    for a, b in zip(rings, rings[1:] + rings[:1]):
        for i in range(SEG):
            j = (i + 1) % SEG
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


ARM_TOP, ARM_END = 4.2, -2.85  # the arm's straight run onto the cup, in the cup's frame


def arm_local(n=44):
    """The band's run down the cup: straight down to the middle, then lying on the dome to its end."""
    return [(dome_x(Y_ARM, min(z, 0.0)) + BAND_T / 2, Y_ARM, z) for z in (ARM_TOP + (ARM_END - ARM_TOP) * i / n for i in range(n + 1))]


# --- The band: one strip from the left cup's tab over the top to the right cup's ------------------
AX, BZ, ZE = ARC
TH1 = math.radians(10)  # where the arch hands over to the run down to the cup
half = [(AX * math.cos(t), 0.0, ZE + BZ * math.sin(t)) for t in (math.pi / 2 + (TH1 - math.pi / 2) * i / 46 for i in range(47))]
arm = [tuple(cup_matrix(1) @ Vector(p)) for p in arm_local()]
t0 = (Vector(half[-1]) - Vector(half[-2])).normalized()
t1 = (Vector(arm[1]) - Vector(arm[0])).normalized()
gap = math.dist(half[-1], arm[0])
link = bezier(half[-1], tuple(Vector(half[-1]) + t0 * gap * 0.4), tuple(Vector(arm[0]) - t1 * gap * 0.4), arm[0], 8)
right = half + link[1:-1] + arm  # the +X half, from the top down
n_arch, n_link = len(half), len(link) - 2
path = [(-x, y, z) for x, y, z in reversed(right[1:])] + right
s_half = lengths(right)
L = s_half[-1]
w_half = []
for i, s in enumerate(s_half):
    if i < n_arch:
        w = 2.2 - 0.4 * (i / n_arch)  # 2.2 at the top, narrowing down the sides
    elif i < n_arch + n_link:
        w = 1.8
    else:
        u = min(1.0, (s - s_half[n_arch + n_link]) / 2.5)
        w = 1.8 + 0.75 * u * u * (3 - 2 * u)  # widening onto the cup into the tab
    w_half.append(rounded_end(s, L, w, 1.3))
widths = list(reversed(w_half[1:])) + w_half
band = kit.new_object('band', sweep(path, widths, BAND_T), M['band'])
kit.shade_smooth(band, 40)
parts = [band]


def band_at(z):
    """The point on the band's centre line at height z on the +X side, its tangent (downwards) and
    outward normal."""
    i = min(range(1, len(right) - 1), key=lambda j: abs(right[j][2] - z))
    p = Vector(right[i])
    t = (Vector(right[i + 1]) - Vector(right[i - 1])).normalized()
    return p, t, Vector((-t.z, 0, t.x))


# The beyerdynamic name in white across the top, bent to the arch.
rc = AX * AX / BZ  # the arch's radius at the top
logo = text('logo', 'beyerdynamic', 0.42, M['print'], (0, 0, 0), (1, 0, 0), (0, 1, 0), bold=True, res=4, lift=0)
for v in logo.data.vertices:
    phi = v.co.x / (rc + BAND_T / 2)
    rr = rc + BAND_T / 2 + 0.004 + v.co.z
    v.co = Vector((rr * math.sin(phi), v.co.y, ZE + BZ - rc + rr * math.cos(phi)))
parts.append(logo)

# --- The clips at the sides and the rubber strap between them --------------------------------------
Z_CLIP = 11.2  # the clips: level with the arch's widest, as in the photos
CLIP = (1.15, 2.45, 0.75)  # along the band, across it, deep (from just outside the band inwards)
strap_end = None
for s in (1, -1):
    p, t, nrm = band_at(Z_CLIP)
    p.x *= s
    t.x *= s
    nrm.x *= s
    bm = kit.prism(kit.rounded_rect(CLIP[0], CLIP[1], 0.14, 3), 0, CLIP[2])
    frame = Matrix(((t.x, 0, -nrm.x, 0), (t.y, 1, -nrm.y, 0), (t.z, 0, -nrm.z, 0), (0, 0, 0, 1)))
    bmesh.ops.transform(bm, matrix=Matrix.Translation(p + nrm * (BAND_T / 2 + 0.05)) @ frame, verts=bm.verts)
    if frame.determinant() < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    clip = kit.new_object('clip', bm, M['band'])
    kit.bevel(clip, 0.04, 2)
    kit.shade_smooth(clip, 40)
    parts.append(clip)
    # the rivet on its front face
    parts.append(kit.new_object('rivet', rod(0.08, 0.07, 0.04, p - nrm * 0.2 + Vector((0, -CLIP[1] / 2 + 0.01, 0)), (0, -1, 0), 12), M['metal']))
    if s > 0:
        strap_end = p - nrm * (CLIP[2] - BAND_T / 2 - 0.15)

e = strap_end
strap_half = bezier((0, 0, STRAP_TOP), (4.4, 0, STRAP_TOP), (e.x - 1.5, 0, e.z + 3.6), (e.x, 0, e.z), 40)
strap_path = [(-x, y, z) for x, y, z in reversed(strap_half[1:])] + strap_half
ss = lengths(strap_half)
sw = [2.1 + 2.5 * min(1.0, (ss[-1] - s) / (0.45 * ss[-1])) ** 0.7 for s in ss]
strap_w = list(reversed(sw[1:])) + sw
strap = kit.new_object('strap', sweep(strap_path, strap_w, 0.16, r_frac=0.5, seg=2), M['strap'])
kit.shade_smooth(strap, 40)
parts.append(strap)
# moulded ribs across the strap, as on the real one, every 1.7 cm
sl = lengths(strap_path)
for k in range(-4, 5):
    target = sl[-1] / 2 + k * 1.7
    i = min(range(len(sl)), key=lambda j: abs(sl[j] - target))
    P0, P1 = Vector(strap_path[max(i - 1, 0)]), Vector(strap_path[min(i + 1, len(strap_path) - 1)])
    tg = (P1 - P0).normalized()
    nn = Vector((tg.z, 0, -tg.x))
    if nn.z > 0:
        nn = -nn  # the underside, towards the head
    rib = kit.prism(kit.rounded_rect(0.16, strap_w[i] - 0.5, 0.06, 2), 0, 0.05)
    fr = Matrix(((tg.x, 0, nn.x, 0), (tg.y, 1, nn.y, 0), (tg.z, 0, nn.z, 0), (0, 0, 0, 1)))
    if fr.determinant() < 0:
        bmesh.ops.reverse_faces(rib, faces=rib.faces)
    bmesh.ops.transform(rib, matrix=Matrix.Translation(Vector(strap_path[i]) + nn * 0.07) @ fr, verts=rib.verts)
    parts.append(kit.new_object('rib', rib, M['strap']))
kit.join('band', parts)

# --- The cups ---------------------------------------------------------------------------------------
def spine():
    """The shoulder the arm comes onto the cup over: from under the arm down to the dome, flaring
    out at its foot, its top rounded off just under the rim."""
    bm = bmesh.new()
    x_out = dome_x(Y_ARM, 0)  # the arm's underside
    top, bottom, rn = 3.8, 0.3, 0.9
    rings = []
    n = 18
    for i in range(n + 1):
        z = top - (top - bottom) * (i / n) ** 1.6
        x_in = dome_x(Y_ARM, z) - 0.3
        d = top - z
        k = math.sqrt(max(0.0, 1 - ((rn - d) / rn) ** 2)) if d < rn else 1.0  # rounding off the top
        k = max(k, 0.08)
        t = (x_out - x_in) * k
        wt, wb = 2.5 * (0.35 + 0.65 * k), 3.4 * (0.35 + 0.65 * k)
        ring = []
        for u, v in kit.rounded_rect(t, 1.0, min(0.3, t * 0.45), 4):
            f = (u + t / 2) / t  # 0 at the arm, 1 at the dome
            ring.append(bm.verts.new((x_out - t / 2 - u, Y_ARM + v * (wt + (wb - wt) * f), z)))
        rings.append(ring)
    bm.faces.new(rings[0])
    bm.faces.new(rings[-1])
    for a, b in zip(rings, rings[1:]):
        for k in range(len(a)):
            k1 = (k + 1) % len(a)
            bm.faces.new((a[k], a[k1], b[k1], b[k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


cups = {}
floor = 1e9
for s, side in ((1, 'L'), (-1, 'R')):
    mx = cup_matrix(s)
    rot = mx.to_3x3()
    cp = [obj('shell', shell(), M['shell'], mx)]
    kit.shade_smooth(cp[0], 50)
    pd = obj('pad', pad(), M['velour'], mx)
    kit.shade_smooth(pd, 60)
    cp.append(pd)
    cp.append(obj('cloth', yz_prism(egg(0.57, 0.63), -0.42, -0.3), M['cloth'], mx))
    sp = obj('spine', spine(), M['shell'], mx)
    kit.shade_smooth(sp, 50)
    cp.append(sp)
    # "DT 235" and the L/R badge on the tab
    for z, kind in ((-1.0, 'name'), (-1.95, 'badge')):
        loc = mx @ Vector((dome_x(Y_ARM, z) + BAND_T, Y_ARM, z))
        dz = 0.05
        up_l = Vector((dome_x(Y_ARM, z + dz) - dome_x(Y_ARM, z - dz), 0, 2 * dz)).normalized()
        up = rot @ up_l
        along = Vector((0, s, 0))
        n = along.cross(up).normalized()
        if kind == 'name':
            cp.append(text('dt235', 'DT 235', 0.5, M['grey'], loc, along, up, spacing=1.05))
        else:
            disc = rod(0.27, 0.27, 0.02, loc, n, 24)
            cp.append(kit.new_object('badge', disc, M['print']))
            cp.append(text('side', side, 0.34, M['ink'], loc + n * 0.02, along, up, bold=True, lift=0.002))
    cups[side] = kit.join(f'cup_{side.lower()}', cp)
    floor = min(floor, min((cups[side].matrix_world @ v.co).z for v in cups[side].data.vertices))

# --- The cable: out of the left cup low at the back, down to the plinth, out between the cups ---------
mx = cup_matrix(1)
a = math.radians(-40)
exit_l = Vector((WALL * 0.5, egg_r(a) * math.cos(a), egg_r(a) * math.sin(a)))
start = mx @ exit_l
dirn = (mx.to_3x3() @ Vector((0.12, math.cos(a), 1.5 * math.sin(a)))).normalized()
CR = 0.17  # the cable's radius
parts = [kit.new_object('relief', rod(0.34, 0.22, 1.4, start - dirn * 0.15, dirn, 20), M['cable'])]
fz = floor + CR
c0 = start + dirn * 1.2
route = [
    c0,
    Vector((c0.x - 0.05, c0.y + 1.0, fz + 0.1)),
    Vector((c0.x - 0.85, c0.y + 2.1, fz)),
    Vector((2.3, c0.y + 2.0, fz)),
    Vector((0.8, c0.y + 0.1, fz)),
    Vector((0.2, 0.6, fz)),
    Vector((-0.2, -2.0, floor + 0.36)),
]
cu = bpy.data.curves.new('cable', 'CURVE')
cu.dimensions = '3D'
cu.resolution_u = 8
cu.bevel_depth = CR
cu.bevel_resolution = 2
cu.use_fill_caps = True
spl = cu.splines.new('BEZIER')
spl.bezier_points.add(len(route) - 1)
for bp, p in zip(spl.bezier_points, route):
    bp.co = p
    bp.handle_left_type = bp.handle_right_type = 'AUTO'
cob = bpy.data.objects.new('cable', cu)
bpy.context.scene.collection.objects.link(cob)
for o in bpy.context.selected_objects:
    o.select_set(False)
bpy.context.view_layer.objects.active = cob
cob.select_set(True)
bpy.ops.object.convert(target='MESH')
cob = bpy.context.view_layer.objects.active
cob.data.materials.append(M['cable'])
kit.shade_smooth(cob, 60)
parts.append(cob)

# The plug, lying on the plinth: its moulded grip, then the 3.5 mm pin, three rings and a tip.
pd = (route[-1] - route[-2])
pd.z = 0
pd.normalize()
p0 = route[-1]
parts.append(kit.new_object('plug', rod(0.2, 0.34, 1.0, p0 - pd * 0.1, pd), M['cable']))
parts.append(kit.new_object('grip', rod(0.36, 0.36, 2.1, p0 + pd * 0.9, pd, 24), M['cable']))
pin0 = p0 + pd * 3.0
for i, (l, r, m) in enumerate(((0.55, 0.175, 'metal'), (0.06, 0.17, 'ink'), (0.32, 0.175, 'metal'), (0.06, 0.17, 'ink'), (0.32, 0.175, 'metal'), (0.06, 0.17, 'ink'))):
    parts.append(kit.new_object('pin', rod(r, r, l, pin0, pd, 20), M[m]))
    pin0 = pin0 + pd * l
parts.append(kit.new_object('tip', rod(0.175, 0.07, 0.2, pin0, pd, 20), M['metal']))
kit.join('cable', parts)

# --- Stand it on its lowest point, centred --------------------------------------------------------
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
lo = Vector((min((o.matrix_world @ v.co)[i] for o in obs for v in o.data.vertices) for i in range(3)))
hi = Vector((max((o.matrix_world @ v.co)[i] for o in obs for v in o.data.vertices) for i in range(3)))
off = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
for o in obs:
    o.data.transform(Matrix.Translation(off))
print('size [w, h, d] cm: [%.2f, %.2f, %.2f]' % (hi.x - lo.x, hi.z - lo.z, hi.y - lo.y))

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('front', 'three-quarter', 'side', 'top', 'back'), samples=32)
