"""PreSonus Eris E5 (2013), a pair: the black box of vinyl-laminated MDF, a 5.25" woven Kevlar
woofer in a broad dish, a 1" silk dome under a mesh dome in a shallow waveguide, the slot port
across the foot of the front, and the PreSonus logo lit blue in a notch at the right edge (the power
light). Every control is on the back: input gain, the mid and high trims, the low cut and acoustic
space switches, RCA / TRS / XLR in, the power rocker, the mains selector and the IEC inlet. Both
speakers are active and the same, so the pair is one speaker twice.

    blender -b --python scripts/blender/fidelity/erise5.py -- [out.glb] [preview.png]

Size (each): 178 W x 260 H x 195 D mm, 4.63 kg (PreSonus tech specs, archived:
web.archive.org/web/2016/http://www.presonus.com/products/Eris-E5/techspecs). The front laid out
from PreSonus's straight-on product shot (presonus_eris_e5 front, 2016 media page), the back from
its rear-panel shot.

The pair stands square on, 7 cm apart, origin at the middle of the bottom of the pair. Nothing moves.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('erise5')
kit.reset()

W, H, D = 17.8, 26.0, 19.5
GAP = 7.0
F, B = -D / 2, D / 2  # front and back faces
WOOF = (0.0, 12.2)  # woofer centre (x, z)
TWEET = (0.0, 22.53)
SEG = 64

M = {
    'vinyl': kit.material('vinyl', kit.srgb('#161616'), rough=0.62),
    'dish': kit.material('dish', kit.srgb('#131313'), rough=0.42),
    'gasket': kit.material('gasket', kit.srgb('#0b0b0b'), rough=0.6),
    'surround': kit.material('surround', kit.srgb('#0e0e0f'), rough=0.5),
    'kevlar': kit.material('kevlar', kit.srgb('#4b5a6b'), rough=0.42, metal=0.3),
    'cap': kit.material('cap', kit.srgb('#0c0c0d'), rough=0.5),
    'mesh': kit.material('mesh', kit.srgb('#6a6c70'), rough=0.35, metal=0.85),
    'hole': kit.material('hole', kit.srgb('#030303'), rough=0.9),
    'badge': kit.material('badge', kit.srgb('#060607'), rough=0.06, coat=1.0),
    'logo': kit.material('logo', kit.srgb('#3d74ff'), rough=0.3, emission=kit.srgb('#2f66ff'), strength=6.0),
    'plate': kit.material('plate', kit.srgb('#0e0e0f'), rough=0.45, metal=0.3),
    'print': kit.material('print', kit.srgb('#c9c9c9'), rough=0.6),
    'knob': kit.material('knob', kit.srgb('#141415'), rough=0.38),
    'nickel': kit.material('nickel', kit.srgb('#b4b6b9'), rough=0.25, metal=1.0),
    'screw': kit.material('screw', kit.srgb('#2c2d30'), rough=0.35, metal=1.0),
    'label': kit.material('label', kit.srgb('#e6e4de'), rough=0.7),
    'red': kit.material('red', kit.srgb('#c3161c'), rough=0.4),
}


# --- Helpers ----------------------------------------------------------------------------------------

def yslab(pts, y0, y1, cx=0.0, cz=0.0):
    """An outline in (x, z) as seen from the front, made solid from y0 back to y1."""
    bm = kit.front(kit.prism(pts, 0, y1 - y0), y1)
    return kit.transform(bm, translate=(cx, 0, cz))


def ycyl(r, y0, y1, cx=0.0, cz=0.0, seg=SEG, r1=None):
    """A cylinder along Y from y0 to y1 (r at y1, r1 at y0)."""
    bm = kit.cylinder(r, -y1, -y0, seg, r1=r1)
    return kit.transform(bm, rotate=(90, 'X'), translate=(cx, 0, cz))


def box(x0, x1, y0, y1, z0, z1):
    return kit.transform(kit.prism([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1))


def lathe(name, profile, mat, cx, cz, seg=SEG, facing=-1, smooth=True):
    """A surface of revolution about a line along Y through (cx, cz): profile is [(r, y)], outside
    in. Its faces are turned to look along `facing` (-1: to the front)."""
    bm = bmesh.new()
    rings = []
    for r, y in profile:
        if r < 1e-6:
            rings.append([bm.verts.new((cx, y, cz))])
        else:
            rings.append([bm.verts.new((cx + r * math.cos(2 * math.pi * i / seg), y, cz + r * math.sin(2 * math.pi * i / seg))) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            if len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            elif len(a) == 1:
                bm.faces.new((a[0], b[j], b[i]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.normal_update()
    if sum(f.normal.y * f.calc_area() for f in bm.faces) * facing < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    ob = kit.new_object(name, bm, mat)
    if smooth:
        kit.shade_smooth(ob, 70)
    return ob


def cut(ob, bm, mat=None):
    """Boolean away a cutter; with `mat`, the walls it leaves take that material."""
    c = kit.cutter(bm)
    if mat:
        c.data.materials[0] = mat
    kit.apply(ob, 'BOOLEAN', object=c, operation='DIFFERENCE', solver='EXACT', material_mode='TRANSFER' if mat else 'INDEX')
    bpy.data.objects.remove(c)


def text(name, body, size, mat, loc, facing='+Y', align='CENTER', bold=False, res=3, spacing=1.0):
    """Flat print a hair off a face looking along `facing`, upright."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.resolution_u = res
    curve.space_character = spacing
    f = kit.font('sans')
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
    a, u = (Vector((-1, 0, 0)), Vector((0, 0, 1))) if facing == '+Y' else (Vector((1, 0, 0)), Vector((0, 0, 1)))
    n = a.cross(u)
    ob.data.transform(Matrix(((a.x, u.x, n.x, 0), (a.y, u.y, n.y, 0), (a.z, u.z, n.z, 0), (0, 0, 0, 1))))
    ob.location = Vector(loc) + n * 0.002
    return ob


def dome_grille(name, cx, cz, y0, rb, h, pitch, width, angles, mat, thick=0.03, k=8):
    """A mesh dome over a driver: straight wires in each direction of `angles` (degrees from +X),
    `pitch` apart, bent over a spherical cap of base radius rb and height h standing forward (-Y)
    from y0. The gaps between are open."""
    R = (rb * rb + h * h) / (2 * h)
    yc = y0 - h + R  # the sphere's centre, behind

    def lift(x, z, out=0.0):
        r2 = (x - cx) ** 2 + (z - cz) ** 2
        return yc - math.sqrt(max(R * R - r2, 0.0)) - out

    bm = bmesh.new()
    for deg in angles:
        a = math.radians(deg)
        d = (math.cos(a), math.sin(a))
        n = (-d[1], d[0])
        o = -rb + (rb * 2 % pitch) / 2
        while o <= rb:
            half = math.sqrt(max(rb * rb - o * o, 0.0))
            if half > pitch / 2:
                rows = []
                for i in range(k + 1):
                    t = -half + 2 * half * i / k
                    ring = []
                    for s in (-width / 2, width / 2):
                        x = cx + o * n[0] + t * d[0] + s * n[0]
                        z = cz + o * n[1] + t * d[1] + s * n[1]
                        ring.append(bm.verts.new((x, lift(x, z, thick), z)))
                    for s in (width / 2, -width / 2):
                        x = cx + o * n[0] + t * d[0] + s * n[0]
                        z = cz + o * n[1] + t * d[1] + s * n[1]
                        ring.append(bm.verts.new((x, lift(x, z), z)))
                    rows.append(ring)
                for p, q in zip(rows, rows[1:]):
                    for e in range(3):  # the face and its two edges; its back lies on the dome
                        bm.faces.new((p[e], p[e + 1], q[e + 1], q[e]))
            o += pitch
    bm.normal_update()
    for f in bm.faces:  # all turned out, away from the sphere's centre
        if f.normal.dot(f.calc_center_median() - Vector((cx, yc, cz))) < 0:
            f.normal_flip()
    return kit.new_object(name, bm, mat)


# --- The cabinet: a black box, its edges eased ------------------------------------------------------
body = kit.new_object('body', kit.prism(kit.rounded_rect(W, D, 0.3, 3), 0, H), M['vinyl'])
kit.bevel(body, 0.3, 3)
cut(body, ycyl(7.0, F - 1, F + 3.0, *WOOF))
cut(body, ycyl(2.6, F - 1, F + 1.0, *TWEET))
# the slot port, its mouth eased, black inside
slot = kit.rounded_rect(12.6, 1.6, 0.8, 8)
mouth = kit.rounded_rect(13.0, 2.0, 1.0, 8)
bm = bmesh.new()
lo = [bm.verts.new((x, F - 0.01, z + 3.5)) for x, z in mouth]
hi = [bm.verts.new((x, F + 0.25, z + 3.5)) for x, z in slot]
bm.faces.new(lo)
bm.faces.new(list(reversed(hi)))
for i in range(len(lo)):
    j = (i + 1) % len(lo)
    bm.faces.new((lo[j], lo[i], hi[i], hi[j]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
cut(body, bm)
cut(body, yslab(slot, F + 0.2, F + 7.0, cz=3.5), M['hole'])
# the notch at the right edge the logo badge sits in
cut(body, box(6.0, W / 2 + 1, F - 1, F + 1.2, 5.28, 6.52))
kit.shade_smooth(body, 40)

# --- The woofer: a broad dish down to the gasket, the rubber roll, the Kevlar cone, the cap -------
parts = [body]
roll = [(5.075 + 0.525 * math.cos(math.pi * i / 7), 0.8 - 0.35 * math.sin(math.pi * i / 7)) for i in range(8)]
parts += [
    lathe('dish', [(7.0, F), (6.9, F + 0.22), (6.6, F + 0.5), (6.0, F + 0.78)], M['dish'], *WOOF),
    lathe('gasket', [(6.0, F + 0.78), (5.6, F + 0.8)], M['gasket'], *WOOF, smooth=False),
    lathe('surround', [(r, F + y) for r, y in roll], M['surround'], *WOOF),
    lathe('cone', [(4.55 - 2.3 * s / 4, F + 0.8 + 1.8 * (s / 4) ** 1.2) for s in range(5)], M['kevlar'], *WOOF),
    lathe('cap', [(2.25 * math.cos(math.pi / 2 * k / 5), F + 2.6 - 0.5 * math.sin(math.pi / 2 * k / 5)) for k in range(6)], M['cap'], *WOOF, seg=48),
]

# --- The tweeter: a shallow waveguide, a ring, a dark dome under a woven mesh dome ---------------
parts += [
    lathe('wave', [(2.6, F), (2.5, F + 0.2), (2.18, F + 0.5), (1.78, F + 0.66)], M['dish'], *TWEET),
    lathe('rim', [(1.78, F + 0.66), (1.74, F + 0.6), (1.66, F + 0.6), (1.62, F + 0.66)], M['mesh'], *TWEET),
    lathe('dome', [(1.6 * math.cos(math.pi / 2 * k / 5), F + 0.68 - 0.6 * math.sin(math.pi / 2 * k / 5)) for k in range(6)], M['hole'], *TWEET, seg=32),
    dome_grille('grille', *TWEET, F + 0.68, 1.64, 0.72, 0.17, 0.035, (30, 150), M['mesh']),
]

# --- The logo badge in its notch: glossy black, the PreSonus mark lit blue -----------------------
bm = yslab(kit.rounded_rect(2.86, 1.2, 0.25, 4), F + 0.06, F + 1.25, cx=W / 2 - 1.43 + 0.01, cz=5.9)
badge = kit.new_object('badge', bm, M['badge'])
kit.bevel(badge, 0.04, 2)
parts.append(badge)
logo = [kit.new_object('logo', yslab(kit.rounded_rect(1.2, 0.82, 0.18, 4), F + 0.045, F + 0.07, cx=7.0, cz=5.9), M['logo'])]
for dx, hz in ((-0.33, 0.44), (-0.11, 0.6), (0.11, 0.6), (0.33, 0.44)):
    logo.append(kit.new_object('wave', yslab(kit.rounded_rect(0.07, hz, 0.03, 2), F + 0.035, F + 0.05, cx=7.0 + dx, cz=5.9), M['badge']))
parts += logo


# --- The back: the amplifier plate, screwed in, its controls and print ---------------------------
def zt(mm):
    """Height on the back, from millimetres down from the top."""
    return H - mm / 10


PY = B + 0.12  # the plate's face
plate = kit.new_object('plate', yslab(kit.rounded_rect(15.0, 23.7, 0.5, 4), B - 0.05, PY, cz=12.85), M['plate'])
kit.bevel(plate, 0.04, 2)
parts.append(plate)


def knob(x, z):
    k = kit.new_object('knob', ycyl(0.52, PY, PY + 0.9, x, z, 20, r1=0.56), M['knob'])
    kit.bevel(k, 0.05, 1)
    return [k, kit.new_object('tick', box(x - 0.03, x + 0.03, PY + 0.88, PY + 0.905, z + 0.15, z + 0.5), M['print'])]


def switch(x, z):
    return [kit.new_object('slot', box(x - 0.5, x + 0.5, PY - 0.01, PY + 0.03, z - 0.15, z + 0.15), M['hole']),
            kit.new_object('nub', box(x - 0.13, x + 0.13, PY, PY + 0.22, z - 0.1, z + 0.1), M['knob'])]


def jack(x, z, r, hole):
    return [kit.new_object('jack', ycyl(r, PY, PY + 0.3, x, z, 24), M['nickel']),
            kit.new_object('jackhole', ycyl(hole, PY, PY + 0.305, x, z, 16), M['hole'])]


for x in (4.1, 0.5, -3.2):
    parts += knob(x, zt(47.7))
parts += switch(2.5, zt(70)) + switch(-1.2, zt(70))
parts += jack(4.2, zt(96), 0.42, 0.18) + jack(0.5, zt(96), 0.55, 0.32)
# XLR: a grey housing, three pins' holes, the latch
xlr = kit.new_object('xlr', ycyl(0.95, PY, PY + 0.3, -3.0, zt(95), 32), M['knob'])
for a in (90, 210, 330):
    cut(xlr, ycyl(0.12, PY + 0.1, PY + 1, -3.0 + 0.45 * math.cos(math.radians(a)), zt(95) + 0.45 * math.sin(math.radians(a)), 12), M['hole'])
parts += [xlr, kit.new_object('latch', box(-3.2, -2.8, PY, PY + 0.32, zt(95) + 0.98, zt(95) + 1.2), M['nickel'])]
# power rocker, the mains selector, the IEC inlet
parts += [
    kit.new_object('rockerframe', box(-4.65, -2.65, PY, PY + 0.22, zt(164) - 0.75, zt(164) + 0.75), M['knob']),
    kit.new_object('rocker', kit.transform(box(-0.85, 0.85, 0, 0.25, -0.6, 0.6), rotate=(-8, 'X'), translate=(-3.65, PY + 0.2, zt(164))), M['hole']),
    kit.new_object('acsel', box(-4.1, -3.2, PY, PY + 0.06, zt(184) - 0.35, zt(184) + 0.35), M['red']),
    kit.new_object('iec', box(-5.05, -2.25, PY, PY + 0.12, zt(210) - 1.15, zt(210) + 1.15), M['knob']),
    kit.new_object('iecin', box(-4.85, -2.45, PY + 0.12, PY + 0.13, zt(210) - 0.25, zt(210) + 0.85), M['hole']),
    kit.new_object('fuse', box(-4.4, -2.9, PY + 0.12, PY + 0.2, zt(210) - 1.0, zt(210) - 0.45), M['hole']),
    kit.new_object('caution', box(2.85, 6.85, PY, PY + 0.01, zt(204) - 0.75, zt(204) + 0.75), M['label']),
    kit.new_object('serial', box(-1.35, 2.65, PY, PY + 0.01, zt(212) - 1.1, zt(212) + 1.1), M['label']),
]
# screws round the plate
for px, py in ((65, 65), (175, 52), (390, 52), (500, 65), (65, 290), (500, 290), (65, 500), (500, 500), (65, 720), (175, 735), (390, 735), (500, 720)):
    parts.append(kit.new_object('screw', ycyl(0.28, PY, PY + 0.07, -(px - 287) / 32.3, zt(py / 3.04), 10, r1=0.3), M['screw']))


# the printed boxes round the tuning and input sections
def frame(x0, x1, z0, z1, w=0.035):
    return [kit.new_object('line', box(*xs, PY, PY + 0.004, *zs), M['print']) for xs, zs in (
        ((x0, x1), (z1 - w, z1)), ((x0, x1), (z0, z0 + w)), ((x0, x0 + w), (z0, z1)), ((x1 - w, x1), (z0, z1)))]


parts += frame(-5.67, 2.7, zt(198 / 3.04), zt(82 / 3.04)) + frame(-5.67, 5.23, zt(373 / 3.04), zt(238 / 3.04))
for body_, size, x, mm, bold in (
    ('INPUT', 0.28, 4.1, 23.5, True), ('GAIN', 0.28, 4.1, 26.5, True), ('MIN       MAX', 0.17, 4.1, 58, False),
    ('ACOUSTIC TUNING', 0.3, -1.48, 30, True), ('MID', 0.28, 0.5, 37, True), ('HIGH', 0.28, -3.2, 37, True),
    ('-6dB      6dB', 0.17, 0.5, 58, False), ('-6dB      6dB', 0.17, -3.2, 58, False),
    ('LOW CUTOFF', 0.26, 2.5, 62, True), ('Flat  80Hz  100Hz', 0.17, 2.5, 66, False),
    ('ACOUSTIC', 0.26, -1.2, 60, True), ('SPACE', 0.26, -1.2, 63.5, True), ('-4dB  -2dB  0dB', 0.17, -1.2, 66.5, False),
    ('INPUT', 0.3, -0.2, 80.5, True), ('Balanced', 0.22, -1.2, 89, False),
    ('RCA', 0.24, 4.2, 104, False), ('Unbalanced', 0.22, 4.2, 107.5, False), ('TRS', 0.24, 0.5, 104, False), ('XLR', 0.24, -3.0, 110, False),
    ('ACOUSTIC', 0.24, 4.4, 140, True), ('SPACE', 0.24, 4.4, 143.5, True),
    ('POWER', 0.28, -3.65, 176, True), ('AC SELECT', 0.28, -3.65, 192, True),
    ('Eris', 0.75, 4.2, 177, True), ('E5', 0.6, 4.2, 189, True),
    ('Eris Series High-Definition', 0.24, 0.6, 179, True), ('Near Field Studio Monitor', 0.24, 0.6, 183.5, True),
    ('100-120V~, 50-60Hz, T1AL', 0.15, -3.65, 228.5, False), ('220-240V~, 50-60Hz, T500mAL', 0.15, -3.65, 233, False), ('100W', 0.15, -3.65, 237.5, False),
):
    parts.append(text('print', body_, size, M['print'], (x, PY, zt(mm)), bold=bold, res=1 if size < 0.2 else 2))
parts.append(text('presonus', 'PreSonus', 0.95, M['print'], (2.4, PY, zt(164)), bold=True, res=4))
parts.append(text('115', '115', 0.2, M['print'], (-3.65, PY + 0.06, zt(184)), bold=True))

# --- One speaker, then the other: the same mesh twice ----------------------------------------------
left = kit.join('erise5_l', parts)
for m in list(left.modifiers):
    bpy.context.view_layer.objects.active = left
    bpy.ops.object.modifier_apply(modifier=m.name)
X = W / 2 + GAP / 2
left.location.x = -X
right = left.copy()
right.name = 'erise5_r'
bpy.context.scene.collection.objects.link(right)
right.location.x = X

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back'), samples=32)
