"""The 酷比魔方 (Cube) C30, 金属灰 (2010), and the TF card it was bought for.

    blender -b --python scripts/blender/repeat/cube.py -- [out.glb] [preview.png]

A short thick stick (75 x 27 x 15 mm, 37 g, as owners measured it): a mirror-silver front that bows
out across its width and rolls over at the top, bright metal rails down both long edges (the
"zinc-magnesium roll cage"), graphite sides, one big round control low down (a brushed ring marked
∧ ∨ − + round a domed chrome centre), ▶II and M just above a satin end cap printed "Cube". Its 3-line
OLED sits behind the mirror: nothing shows until it lights.

Objects the page uses:
- screen: the OLED behind the mirror, 1.9 x 0.7 cm (about 128 x 48), curved to the face. It is a
  mirror display: draw it so black stays clear (additive blending, or alpha from brightness) and
  only lit pixels show over the mirror.
- dial: the ring, pressed at its edges (∧ top, ∨ bottom, − left, + right); btn_center: the dome.
- btn_play (▶II, lower left) and btn_m (M, lower right): small pads on the face.
  All press straight into the body (`press` cm).
- hold: the slide switch on the left side (not pressable).
- tf_slot: an empty at the mouth of the microSD (TF) slot in the right side. In Blender its local -Y
  points INTO the slot (world -X), local +X towards the front (world -Y), local +Z up. In three.js
  (after glTF export) the same node has local +Z into the slot (-X), +X towards the front (+Z), +Y up.
- tf: the card, 1.1 x 1.5 x 0.1. Its mesh is built in the slot's own frame: origin at the middle of
  its back edge (the edge left at the slot mouth when it is all the way in), the card running from
  there along local -Y (Blender) to its contacts end. So giving `tf` exactly the transform of
  `tf_slot` puts it fully home; offset it along the slot's outward axis (Blender local +Y, three
  local -Z) by ~1.6 cm to line it up outside first. At rest it lies flat on the desk to the right of
  the player, label up. Both are top-level nodes, so their transforms are in the same space. In
  three.js the card runs from its origin along its local +Z.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('cube')
kit.reset()

W, D, H = 2.7, 1.5, 7.5  # wide, deep, tall
SAG = 0.15  # how far the front bows out in the middle
RF, RB = 0.26, 0.34  # front and back corner radii of the cross-section
CAP = 0.76  # the end cap at the bottom
DIAL = (2.15, 0.8, 0.57)  # centre height, ring radius, centre radius
SCREEN = (1.9, 0.7, 5.75)  # width, height, centre height
SLOT_Z = 4.3  # the TF slot, right side

M = {
    'side': kit.material('side', kit.srgb('#55575d'), rough=0.38, metal=0.9),
    'face': kit.material('face', kit.srgb('#cfcfd8'), rough=0.06, metal=1.0),
    'rail': kit.material('rail', kit.srgb('#e6e6ea'), rough=0.14, metal=1.0),
    'back': kit.material('back', kit.srgb('#8f9197'), rough=0.42, metal=0.85),
    'cap': kit.material('cap', kit.srgb('#babcc2'), rough=0.3, metal=1.0),
    'ring': kit.material('ring', kit.srgb('#d6d7da'), rough=0.24, metal=1.0),
    'dome': kit.material('dome', kit.srgb('#ececee'), rough=0.05, metal=1.0),
    'well': kit.material('well', kit.srgb('#3a3c42'), rough=0.35, metal=0.6),
    'print': kit.material('print', kit.srgb('#2a2b30'), rough=0.6),
    'black': kit.material('black', kit.srgb('#0b0b0c'), rough=0.6),
    'screen': kit.material('screen', kit.srgb('#cfcfd8'), rough=0.06, metal=1.0),  # hidden under the mirror until lit
    'card': kit.material('card', kit.srgb('#141416'), rough=0.5),
    'gold': kit.material('gold', kit.srgb('#d8b048'), rough=0.25, metal=1.0),
    'white': kit.material('white', kit.srgb('#e9e9e6'), rough=0.6),
}


def front_y(x, w=W, d=D, sag=SAG, rf=RF):
    """Where the bowed front is at x (the front is -Y)."""
    xf = w / 2 - rf
    return -d / 2 + sag * min(1.0, (x / xf) ** 2)


def section(w=W, d=D, sag=SAG, rf=RF, rb=RB, n=28):
    """The cross-section, counter-clockwise from +X: a flat back with round corners, straight sides,
    round front corners and a front that bows out."""
    pts = []
    def arc(cx, cy, r, a0, a1, seg=8):
        for i in range(seg + 1):
            a = math.radians(a0 + (a1 - a0) * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    arc(w / 2 - rb, d / 2 - rb, rb, 0, 90)
    arc(-w / 2 + rb, d / 2 - rb, rb, 90, 180)
    arc(-w / 2 + rf, -d / 2 + sag + rf, rf, 180, 270)
    xf = w / 2 - rf
    for i in range(1, n):
        x = -xf + 2 * xf * i / n
        pts.append((x, front_y(x, w, d, sag, rf)))
    arc(w / 2 - rf, -d / 2 + sag + rf, rf, 270, 360)
    return pts


def loft(profile, w=W, d=D, sag=SAG, dz=None):
    """A solid from cross-sections: profile is (inset, z) pairs, bottom to top; each ring is the
    section shrunk by `inset` all round, its points then raised by dz(x, z) to bow the ends."""
    bm = bmesh.new()
    rings = []
    for inset, z in profile:
        pts = section(w - 2 * inset, d - 2 * inset, sag * (w - 2 * inset) / w, max(0.03, RF - inset), max(0.03, RB - inset))
        rings.append([bm.verts.new((x, y, z + (dz(x, z) if dz else 0))) for x, y in pts])
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    for a, b in zip(rings, rings[1:]):
        n = len(a)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    return bm


def rounded(z0, z1, r0, r1, seg=6):
    """(inset, z) for a stretch from z0 to z1 with its bottom edge rounded by r0 and its top by r1."""
    out = [(r0 * (1 - math.sin(t * math.pi / 2)), z0 + r0 * (1 - math.cos(t * math.pi / 2))) for t in (i / seg for i in range(seg + 1))] if r0 else [(0, z0)]
    out += [(r1 * (1 - math.cos(t * math.pi / 2)), z1 - r1 + r1 * math.sin(t * math.pi / 2)) for t in (i / seg for i in range(seg + 1))] if r1 else [(0, z1)]
    return out


def stroke(cx, cz, y, length, width, angle):
    """A printed stroke on a front face: centred at (cx, cz), its back at y, running at `angle`
    degrees from +X towards +Z. The fonts here have no ∧ ∨ ▶, so those are drawn."""
    bm = kit.front(kit.prism(kit.rounded_rect(length, width, width / 2.2, 2), 0, 0.004))
    return kit.new_object('g', kit.transform(bm, rotate=(-angle, 'Y'), translate=(cx, y, cz)), M['print'])


def glyph(kind, cx, cz, y, s=0.12):
    if kind in ('up', 'down'):
        a = 52 if kind == 'up' else -52
        dx = 0.3 * s * math.cos(math.radians(a))
        return [stroke(cx - dx, cz, y, 0.62 * s, 0.17 * s, a), stroke(cx + dx, cz, y, 0.62 * s, 0.17 * s, -a)]
    if kind == 'play':  # ▶II
        bm = kit.front(kit.prism([(-0.4 * s, -0.5 * s), (0.4 * s, 0), (-0.4 * s, 0.5 * s)], 0, 0.004))
        tri = kit.new_object('g', kit.transform(bm, translate=(cx - 0.45 * s, y, cz)), M['print'])
        return [tri, stroke(cx + 0.3 * s, cz, y, s, 0.2 * s, 90), stroke(cx + 0.62 * s, cz, y, s, 0.2 * s, 90)]
    raise ValueError(kind)


def paint_by_normal(ob, mats):
    """Face, rails, sides, back: chosen by which way each polygon looks (slot order of `mats`)."""
    for m in mats:
        ob.data.materials.append(m)
    for p in ob.data.polygons:
        n = p.normal
        h = math.hypot(n.x, n.y)
        if h < 0.35:
            p.material_index = 2  # the top, rolled over: rail metal
        elif n.y / h < -0.9:
            p.material_index = 1  # face
        elif n.y / h < -0.2:
            p.material_index = 2  # rails along the front corners
        elif n.y / h > 0.85:
            p.material_index = 3  # back
        else:
            p.material_index = 0  # sides


# --- The body: the cross-section stood up from the cap to the top, the top rolled over -----------


def smile(x, z, z0, z1):
    """The seam between face and cap dips in the middle: full at z0, gone by z1."""
    k = max(0.0, min(1.0, (z1 - z) / (z1 - z0)))
    return -0.07 * k * (1 - (x / (W / 2)) ** 2)


# The top edge bows up a little in the middle, as the face does across; the bottom edge smiles.
bm = loft(rounded(CAP + 0.04, H, 0.05, 0.34, 7), dz=lambda x, z: -0.1 * max(0.0, (z - (H - 1.2)) / 1.2) * (x / (W / 2)) ** 2 + smile(x, z, CAP + 0.04, CAP + 0.6))
mesh = bpy.data.meshes.new('body')
bm.to_mesh(mesh)
bm.free()
body = bpy.data.objects.new('body', mesh)
bpy.context.scene.collection.objects.link(body)
paint_by_normal(body, [M['side'], M['face'], M['rail'], M['back']])

# The well the control sits in, the TF slot (right side) and the hold switch's slot (left side).
fy = front_y(0)
kit.cut(body, kit.cutter(kit.transform(kit.front(kit.prism(kit.circle(DIAL[1] + 0.035, 96), -0.13, 1)), translate=(0, fy, DIAL[0]))))
kit.cut(body, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(3.2, 0.13, 0.04, 2), SLOT_Z - 0.6, SLOT_Z + 0.6), translate=(W / 2, 0, 0))))
kit.cut(body, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(0.2, 0.22, 0.08, 3), 2.2, 3.2), translate=(-W / 2, 0, 0))))
kit.shade_smooth(body, 34)

# Dark inside the slot and the well.
kit.new_object('slotDark', kit.transform(kit.prism(kit.rounded_rect(0.06, 0.13, 0.02, 1), SLOT_Z - 0.6, SLOT_Z + 0.6), translate=(W / 2 - 1.55, 0, 0)), M['black'])
kit.new_object('wellFloor', kit.transform(kit.front(kit.prism(kit.circle(DIAL[1] + 0.035, 96), 0, 0.02)), translate=(0, fy + 0.15, DIAL[0])), M['well'])

# --- The end cap: satin, its own piece, "Cube" on it; earphone jack and USB in its foot -----------
bm = loft(rounded(0, CAP, 0.1, 0.07, 4), W - 0.04, D - 0.04, SAG * 0.55, dz=lambda x, z: smile(x, CAP + 0.04, CAP, 0) * z / CAP)
cap = kit.new_object('cap', bm, M['cap'])
kit.cut(cap, kit.cutter(kit.cylinder(0.17, -1, 0.55, 32, x=-0.55, y=0.05)))
kit.cut(cap, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(0.72, 0.26, 0.05, 2), -1, 0.4), translate=(0.48, 0.05, 0))))
kit.shade_smooth(cap, 40)
kit.new_object('jack', kit.cylinder(0.17, 0.5, 0.56, 32, x=-0.55, y=0.05), M['black'])
kit.new_object('usb', kit.transform(kit.prism(kit.rounded_rect(0.72, 0.26, 0.05, 2), 0.3, 0.36), translate=(0.48, 0.05, 0)), M['black'])
kit.new_object('seam', loft([(0.08, CAP - 0.03), (0.08, CAP + 0.07)], dz=lambda x, z: smile(x, CAP + 0.04, CAP, 0)), M['black'])
cy = front_y(0, W - 0.04, D - 0.04, SAG * 0.55)
kit.text_mesh('cube', 'Cube', 0.32, M['print'], location=(0, cy + 0.001, CAP * 0.47), spacing=1.05, resolution=3, depth=0.006)

# --- The control: a brushed ring round a domed chrome centre, both in the well -------------------
bm = kit.front(kit.prism(kit.circle(DIAL[1], 96), 0, 0.15))
dial = kit.new_object('dial', kit.transform(bm, translate=(0, fy + 0.13 + 0.02, 0)), M['ring'])
kit.cut(dial, kit.cutter(kit.front(kit.prism(kit.circle(DIAL[2] + 0.03, 96), -1, 1))))
kit.bevel(dial, 0.03, 1)
kit.shade_smooth(dial, 30)
dial.location = (0, 0, DIAL[0])
dial['press'] = 0.03
ry = fy + 0.13 + 0.02 - 0.15  # the ring's front
r = (DIAL[1] + DIAL[2]) / 2 + 0.02
marks = glyph('up', 0, r - 0.01, ry) + glyph('down', 0, -r + 0.01, ry) + [stroke(-r, 0, ry, 0.1, 0.02, 0), stroke(r, 0, ry, 0.1, 0.02, 0), stroke(r, 0, ry, 0.1, 0.02, 90)]
marks = kit.join('marks', marks)
marks.parent = dial

# a shallow dish with a rolled rim: (radius, how far in front of the ring's face) from the middle out
prof = [(0.0, -0.005), (0.2, -0.012), (0.36, -0.03), (0.46, -0.05), (0.52, -0.062), (0.555, -0.055), (DIAL[2], -0.035), (DIAL[2], 0.13)]
bm = bmesh.new()
rings = [[bm.verts.new((r * math.cos(2 * math.pi * i / 96), r * math.sin(2 * math.pi * i / 96), h)) for i in range(96)] for r, h in prof[1:]]
tip = bm.verts.new((0, 0, prof[0][1]))
for i in range(96):
    bm.faces.new((tip, rings[0][i], rings[0][(i + 1) % 96]))
for a, b in zip(rings, rings[1:]):
    for i in range(96):
        j = (i + 1) % 96
        bm.faces.new((a[i], b[i], b[j], a[j]))
bm.faces.new(list(reversed(rings[-1])))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
centre = kit.new_object('btn_center', kit.transform(bm, rotate=(-90, 'X'), translate=(0, fy, 0)), M['dome'])
kit.shade_smooth(centre, 70)
centre.location = (0, 0, DIAL[0])
centre['press'] = 0.03

# --- ▶II and M, low on the face either side ---------------------------------------------------------
for name, sym, x in (('btn_play', '▶II', -0.86), ('btn_m', 'M', 0.86)):
    y = front_y(x)
    pad = kit.new_object(name, kit.front(kit.prism(kit.rounded_rect(0.42, 0.26, 0.12, 4), 0, 0.012)), M['face'])
    pad.location = (x, y + 0.009, CAP + 0.46)  # all but a hair of it under the face
    pad.rotation_euler.z = math.atan(2 * SAG * x / (W / 2 - RF) ** 2)  # leaning with the bow
    pad['press'] = 0.02
    t = kit.text_mesh(name + '_l', sym, 0.15, M['print'], location=(0, -0.0125, 0), resolution=2) if sym == 'M' else kit.join(name + '_l', glyph('play', -0.03, 0, -0.0125, 0.13))
    t.parent = pad

# --- The OLED behind the mirror, curved to the face ---------------------------------------------------
sw, sh, sz = SCREEN
bm = bmesh.new()
uv = bm.loops.layers.uv.new('UVMap')
n = 20
cols = [(-sw / 2 + sw * i / n) for i in range(n + 1)]
lo = [bm.verts.new((x, front_y(x) - 0.003, sz - sh / 2)) for x in cols]
hi = [bm.verts.new((x, front_y(x) - 0.003, sz + sh / 2)) for x in cols]
for i in range(n):
    f = bm.faces.new((lo[i], lo[i + 1], hi[i + 1], hi[i]))
    for loop, (u, v) in zip(f.loops, ((i / n, 0), ((i + 1) / n, 0), ((i + 1) / n, 1), (i / n, 1))):
        loop[uv].uv = (u, v)
screen = kit.new_object('screen', bm, M['screen'])
for p in screen.data.polygons:
    p.use_smooth = True

# --- The hold switch on the left side ---------------------------------------------------------------
hold = kit.new_object('hold', kit.transform(kit.prism(kit.rounded_rect(0.16, 0.16, 0.06, 3), 2.45, 2.75), translate=(-W / 2 + 0.03, 0, 0)), M['rail'])
kit.bevel(hold, 0.02, 2)

# --- The back: printed small ---------------------------------------------------------------------
kit.join('backPrint', [kit.text_mesh('back', b, size, M['print'], location=(0, D / 2 + 0.001, z), facing='+Y', bold=True, resolution=2)
                       for b, size, z in (('Cube  C30', 0.2, 5.6), ('4GB  MP3 PLAYER', 0.11, 5.25), ('BBE Sound', 0.1, 4.95))])

# --- The slot and the card --------------------------------------------------------------------------
slot = kit.empty('tf_slot', location=(W / 2, 0, SLOT_Z))
slot.rotation_euler = (0, 0, math.radians(-90))  # local -Y -> world -X (in), local +X -> world -Y (front)

# The card in the slot's frame: length along -Y from its back edge, width along Z, thin along X.
L, Wc, T = 1.5, 1.1, 0.1
outline = [(0, -Wc / 2), (0, Wc / 2), (-L + 0.12, Wc / 2), (-L, Wc / 2 - 0.12), (-L, -Wc / 2 + 0.12), (-L + 0.12, -Wc / 2),
           (-0.62, -Wc / 2), (-0.55, -Wc / 2 - 0.0), (-0.5, -Wc / 2 + 0.08), (-0.2, -Wc / 2 + 0.08), (-0.12, -Wc / 2)]
outline = [(y, z) for y, z in outline]
bm = bmesh.new()
a = [bm.verts.new((-T / 2, y, z)) for y, z in outline]
b = [bm.verts.new((T / 2, y, z)) for y, z in outline]
bm.faces.new(a)
bm.faces.new(list(reversed(b)))
for i in range(len(a)):
    j = (i + 1) % len(a)
    bm.faces.new((a[j], a[i], b[i], b[j]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
card = kit.new_object('tf', bm, M['card'])
parts = [card]
for k in range(8):  # gold contacts on the -X face, at the leading end
    z = -0.42 + k * 0.118
    parts.append(kit.new_object('c', kit.transform(kit.prism(kit.rounded_rect(0.07, 0.24, 0.01, 1), -0.002, 0.002), rotate=(90, 'Y'), translate=(-T / 2 - 0.001, -L + 0.3, z)), M['gold']))
parts.append(kit.text_mesh('l', 'TF 2GB', 0.16, M['white'], location=(T / 2 + 0.001, -0.6, 0), facing='+Z', bold=True, resolution=2))
lab = parts[-1]
lab.data.transform(Matrix.Rotation(math.radians(90), 4, 'Y') @ Matrix.Rotation(math.radians(90), 4, 'Z'))
lab.location = (T / 2 + 0.001, -0.55, 0)
parts.append(kit.text_mesh('l2', 'microSD', 0.09, M['white'], location=(0, 0, 0), facing='+Z', resolution=2))
lab2 = parts[-1]
lab2.data.transform(Matrix.Rotation(math.radians(90), 4, 'Y') @ Matrix.Rotation(math.radians(90), 4, 'Z'))
lab2.location = (T / 2 + 0.001, -0.9, 0)
card = kit.join('tf', parts)
kit.origin_to(card, (0, 0, 0))
# At rest: flat on the desk to the right of the player, label up, contacts end towards the player.
card.matrix_world = Matrix.Translation((3.1, -1.4, T / 2)) @ Matrix.Rotation(math.radians(-70), 4, 'Z') @ Matrix.Rotation(math.radians(-90), 4, 'Y')

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back'), samples=32)
