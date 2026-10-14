"""The Sonos Move 2 (2023), black: a portable speaker, an upright oval cylinder. A perforated grille wraps
the front and sides; the back is a plain panel with the carrying handle cut deep into it (the power and
Bluetooth buttons and the microphone switch inside); the touch controls are on the flat top; the base
is a solid band that curves in to the foot, with USB-C and the charging contacts at the back.

    blender -b --python scripts/blender/fidelity/move2.py -- [out.glb] [preview.png]

Size: 241 x 160 x 127 mm (H x W x D), 3.0 kg with its battery (Sonos's Move 2 fact sheet,
assets.sonos.com/media-kits/hardware/move2/move2factsheet.pdf, and its tech specs). The section seen
from above, the handle, the controls and the base are laid out from Sonos's product photographs
(front, back, top, bottom), measured at their scale: a superellipse (exponent 2.3) across, the base
curving in on a 5.7 cm radius from 3.7 cm up.

Nothing moves. The grille's holes are a small tiled texture (colour and normal map), not geometry.
"""

import math
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('move2')
kit.reset()

A, B, EXP = 8.0, 6.35, 2.3  # half-width, half-depth, superellipse exponent of the section
H = 24.1
GRILLE = (5.34, 23.5)  # the grille band, bottom to top
BACK_X = 5.77  # the plain back panel runs between the grille's edges at x = ±BACK_X
HOLE = 0.16  # the grille's texture tile, cm (two holes in it, staggered)
TOP = H


def se(a, b, t, n=EXP):
    """A point on the superellipse with half-axes a, b at parameter angle t."""
    c, s = math.cos(t), math.sin(t)
    return (a * math.copysign(abs(c) ** (2 / n), c), b * math.copysign(abs(s) ** (2 / n), s))


def arc(z):
    """How far the base has curved in at height z: a 5.7 cm radius from 3.7 cm up."""
    return 5.7 - math.sqrt(5.7 ** 2 - (3.7 - z) ** 2) if z < 3.7 else 0.0


# --- Textures: a perforated sheet, tiled ---------------------------------------------------------
TMP = tempfile.mkdtemp()


def image(name, size, fn, data=False):
    """A tiling image from fn(x, y) -> rgb (0..1), saved as JPEG so the GLB carries it small."""
    w, h = size
    px = []
    for y in range(h):
        for x in range(w):
            px.extend((*fn(x, y), 1.0))
    im = bpy.data.images.new(name, w, h, alpha=False)
    im.pixels.foreach_set(px)
    path = os.path.join(TMP, name + '.jpg')
    im.filepath_raw = path
    im.file_format = 'JPEG'
    im.save(quality=88)
    bpy.data.images.remove(im)
    im = bpy.data.images.load(path)
    im.pack()
    if data:
        im.colorspace_settings.name = 'Non-Color'
    return im


def textured(mat, color=None, normal=None, strength=1.0):
    nt = mat.node_tree
    p = nt.nodes['Principled BSDF']
    if color:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = color
        nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    if normal:
        t = nt.nodes.new('ShaderNodeTexImage')
        t.image = normal
        n = nt.nodes.new('ShaderNodeNormalMap')
        n.inputs['Strength'].default_value = strength
        nt.links.new(t.outputs['Color'], n.inputs['Color'])
        nt.links.new(n.outputs['Normal'], p.inputs['Normal'])
    return mat


TS = 64  # px per tile
HOLES = ((16, 16), (48, 48))
R_HOLE = 11.5  # px: 0.58 mm holes on a 1.13 mm stagger


def hole_depth(x, y):
    """0 on the sheet, 1 deep in a hole, with a soft rim."""
    d = min(math.hypot(min(abs(x + 0.5 - cx), TS - abs(x + 0.5 - cx)), min(abs(y + 0.5 - cy), TS - abs(y + 0.5 - cy))) for cx, cy in HOLES)
    return min(1.0, max(0.0, (R_HOLE + 1.5 - d) / 3.0))


def grille_colour(x, y):
    k = hole_depth(x, y)
    v = 0.115 * (1 - k) + 0.012 * k
    return (v, v, v * 1.02)


def grille_normal(x, y):
    dx = hole_depth((x + 1) % TS, y) - hole_depth((x - 1) % TS, y)
    dy = hole_depth(x, (y + 1) % TS) - hole_depth(x, (y - 1) % TS)
    n = Vector((dx * 0.9, dy * 0.9, 1)).normalized()  # the rim slopes down into each hole
    return (0.5 + 0.5 * n.x, 0.5 + 0.5 * n.y, 0.5 + 0.5 * n.z)


M = {
    'body': kit.material('body', kit.srgb('#1d1d1f'), rough=0.62),
    'grille': textured(kit.material('grille', kit.srgb('#1d1d1f'), rough=0.58, metal=0.15),
                       image('move2_grille', (TS, TS), grille_colour), image('move2_grille_n', (TS, TS), grille_normal, data=True), 1.0),
    'key': kit.material('key', kit.srgb('#161618'), rough=0.38),
    'print': kit.material('print', kit.srgb('#8a8b8f'), rough=0.5),
    'logo': kit.material('logo', kit.srgb('#48484c'), rough=0.3),
    'hole': kit.material('hole', kit.srgb('#030303'), rough=0.8),
    'led': kit.material('led', kit.srgb('#f4f4f0'), rough=0.3, emission=kit.srgb('#ffffff'), strength=2.0),
    'green': kit.material('green', kit.srgb('#2fb84a'), rough=0.4),
    'contact': kit.material('contact', kit.srgb('#b9bbbf'), rough=0.3, metal=1.0),
    'rubber': kit.material('rubber', kit.srgb('#131314'), rough=0.85),
}


# --- The body: one loft round the section, the grille and the plain parts by face ------------------
def angles(n=160):
    t_edge = math.acos((BACK_X / A) ** (EXP / 2))
    ts = [math.pi / 2 + 2 * math.pi * i / n for i in range(n)]  # the seam is at the middle of the back
    ts += [math.pi - t_edge, 2 * math.pi + t_edge]
    return sorted(ts), (t_edge, math.pi - t_edge)


TS_, BACK_T = angles()
PROFILE = [(0.0, 1.56), (0.05, 1.41)] + [(z, arc(z)) for z in (0.12, 0.3, 0.55, 0.85, 1.2, 1.6, 2.05, 2.5, 3.0, 3.4, 3.7)] + [
    (5.18, 0), (5.2, 0.07), (5.32, 0.07), (GRILLE[0], 0),  # the seam above the base
    (GRILLE[1], 0), (23.52, 0.07), (23.6, 0.07), (23.62, 0),  # the seam under the top
    (23.92, 0), (24.0, 0.04), (24.06, 0.12), (TOP, 0.26),  # the top's edge rolling over
]


def in_back(t):
    t = t % (2 * math.pi)
    return BACK_T[0] < t < BACK_T[1]


def body():
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    n = len(TS_)
    rings = [[bm.verts.new((*se(A - ins, B - ins, t), z)) for t in TS_] for z, ins in PROFILE]
    # arc length round the full section, for the grille's texture
    pts = [se(A, B, t) for t in TS_] + [se(A, B, TS_[0])]
    s = [0.0]
    for i in range(n):
        s.append(s[-1] + math.dist(pts[i], pts[i + 1]))
    for r in range(len(PROFILE) - 1):
        z0, z1 = PROFILE[r][0], PROFILE[r + 1][0]
        for i in range(n):
            j = i + 1
            f = bm.faces.new((rings[r][i], rings[r][j % n], rings[r + 1][j % n], rings[r + 1][i]))
            tm = (TS_[i] + (TS_[j] if j < n else TS_[0] + 2 * math.pi)) / 2
            f.material_index = 1 if GRILLE[0] - 1e-6 < z0 and z1 < GRILLE[1] + 1e-6 and not in_back(tm) else 0
            for loop, (u, v) in zip(f.loops, ((s[i], z0), (s[j], z0), (s[j], z1), (s[i], z1))):
                loop[uv].uv = (u / HOLE, v / HOLE)
    for f in (bm.faces.new(list(reversed(rings[0]))), bm.faces.new(rings[-1])):
        for loop in f.loops:
            loop[uv].uv = (loop.vert.co.x / HOLE, loop.vert.co.y / HOLE)
    return kit.new_object('body', bm, [M['body'], M['grille']])


def slab_y(pts, y0, y1, z=0.0):
    """An outline in (x, z) as seen from the front, made solid from y0 to y1 along Y."""
    bm = kit.front(kit.prism(pts, -y1, -y0))
    return kit.transform(bm, translate=(0, 0, z))


def slab_z(pts, z0, z1, x=0.0, y=0.0):
    return kit.transform(kit.prism(pts, z0, z1), translate=(x, y, 0))


ob = body()

# The handle: a deep rounded pocket in the back panel.
HANDLE_Z, HANDLE = 13.9, (4.5, 5.3, 2.25)  # centre height; half-width, half-height, exponent
FLOOR = 3.55
outline = [se(HANDLE[0], HANDLE[1], 2 * math.pi * i / 96, HANDLE[2]) for i in range(96)]
kit.cut(ob, kit.cutter(slab_y(outline, FLOOR, 10, z=HANDLE_Z)))

# USB-C in the base at the back; the pocket with the charging contacts below it, open to the foot.
USB_Z = 4.27
kit.cut(ob, kit.cutter(slab_y(kit.rounded_rect(0.9, 0.32, 0.16, 6), 5.9, 9, z=USB_Z)))
kit.cut(ob, kit.cutter(slab_y(kit.rounded_rect(2.1, 3.0, 0.2, 4), 4.75, 9, z=0.0)))
# The foot: an inset oval plate.
kit.cut(ob, kit.cutter(slab_z([se(5.65, 4.1, 2 * math.pi * i / 96) for i in range(96)], -1, 0.06)))
# The volume slider: a groove across the top.
SLIDER_Y = -2.56
kit.cut(ob, kit.cutter(slab_z(kit.rounded_rect(8.5, 0.96, 0.48, 10), TOP - 0.07, TOP + 1, y=SLIDER_Y)))


def round_rim(ob, offset=0.22):
    """Round off the handle pocket's edge, where it breaks through the back."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)

    def on_rim(v):
        x, z = v.co.x, v.co.z - HANDLE_Z
        k = (abs(x) / HANDLE[0]) ** HANDLE[2] + (abs(z) / HANDLE[1]) ** HANDLE[2]
        return abs(k - 1) < 0.03 and v.co.y > FLOOR + 1.0

    edges = [e for e in bm.edges if on_rim(e.verts[0]) and on_rim(e.verts[1]) and not e.is_boundary and e.calc_face_angle(0) > 0.6]
    bmesh.ops.bevel(bm, geom=edges, offset=offset, segments=3, affect='EDGES', profile=0.5, clamp_overlap=True)
    bm.to_mesh(ob.data)
    bm.free()


round_rim(ob)
kit.shade_smooth(ob, 40)

# --- Lettering and line art ---------------------------------------------------------------------
def text(name, body, size, mat, location, along, up, bold=False, res=4, spacing=1.0, align='CENTER'):
    """Flat lettering a hair off a surface, its baseline running `along`, its top towards `up`."""
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
    o = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(o)
    for s in bpy.context.selected_objects:
        s.select_set(False)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.view_layer.objects.active
    o.data.materials.clear()
    o.data.materials.append(mat)
    a, u = Vector(along), Vector(up)
    n = a.cross(u)
    o.data.transform(Matrix(((a.x, u.x, n.x, 0), (a.y, u.y, n.y, 0), (a.z, u.z, n.z, 0), (0, 0, 0, 1))))
    o.location = Vector(location) + n * 0.002
    return o


def strokes(name, lines, w, origin, U, V, mat, lift=0.003):
    """Line art (icons): polylines in (u, v) cm, w wide, on the plane through origin spanned by U
    (right) and V (up), facing U x V."""
    bm = bmesh.new()
    U, V, O = Vector(U), Vector(V), Vector(origin)
    N = U.cross(V)
    for pl in lines:
        for p0, p1 in zip(pl, pl[1:]):
            a, b = Vector(p0), Vector(p1)
            d = (b - a).normalized()
            side = Vector((-d.y, d.x)) * w / 2
            a, b = a - d * w / 2, b + d * w / 2
            vs = [bm.verts.new(O + U * q.x + V * q.y + N * lift) for q in (a - side, b - side, b + side, a + side)]
            bm.faces.new(vs)
    return kit.new_object(name, bm, mat)


def ring_pts(r, a0=0, a1=360, seg=20, x=0.0, y=0.0):
    return [(x + r * math.cos(math.radians(a0 + (a1 - a0) * i / seg)), y + r * math.sin(math.radians(a0 + (a1 - a0) * i / seg))) for i in range(seg + 1)]


def disc_z(name, r, x, y, z, mat, h=0.004, seg=24):
    return kit.new_object(name, kit.cylinder(r, z, z + h, seg, x=x, y=y), mat)


details = []
XY = ((1, 0, 0), (0, 1, 0))  # on the top, right and back

# --- The top: microphones, the status light, the voice key, the slider, the transport -----------
for x, y in ((-3.44, 4.8), (0, 4.8), (3.44, 4.8), (-3.44, 0), (3.44, 0)):
    details.append(disc_z('mic', 0.04, x, y, TOP - 0.001, M['hole'], 0.003, 12))
details.append(disc_z('led', 0.05, 0, 0, TOP - 0.001, M['led'], 0.003, 16))
bubble = ring_pts(0.13, 225, 225 + 330, 18, 0, -0.6)  # a speech bubble, its tail at the lower left
details.append(strokes('voice', [bubble, [bubble[-1], (-0.17, -0.8), bubble[0]]], 0.026, (0, 0, TOP), *XY, M['print']))
FLOOR_TOP = TOP - 0.07
details.append(strokes('vol_down', [[(-3.88, SLIDER_Y), (-3.62, SLIDER_Y)]], 0.03, (0, 0, FLOOR_TOP), *XY, M['print']))
details.append(strokes('vol_up', [[(3.6, SLIDER_Y), (3.86, SLIDER_Y)], [(3.73, SLIDER_Y - 0.13), (3.73, SLIDER_Y + 0.13)]], 0.03, (0, 0, FLOOR_TOP), *XY, M['print']))
TY = -4.75
details.append(strokes('prev', [[(-3.29, TY + 0.14), (-3.43, TY), (-3.29, TY - 0.14)]], 0.032, (0, 0, TOP), *XY, M['print']))
details.append(strokes('next', [[(3.29, TY + 0.14), (3.43, TY), (3.29, TY - 0.14)]], 0.032, (0, 0, TOP), *XY, M['print']))
details.append(strokes('play', [[(-0.17, TY + 0.14), (-0.03, TY), (-0.17, TY - 0.14)], [(0.06, TY - 0.14), (0.06, TY + 0.14)], [(0.15, TY - 0.14), (0.15, TY + 0.14)]], 0.032, (0, 0, TOP), *XY, M['print']))

# --- The front: the status light and the name, running down the grille ---------------------------
details.append(kit.new_object('front_led', kit.transform(kit.cylinder(0.05, 0, 0.004, 16), rotate=(90, 'X'), translate=(0, -B - 0.001, 23.0)), M['led']))
details.append(text('sonos', 'SONOS', 0.86, M['logo'], (0, -B - 0.002, 20.8), (0, 0, -1), (1, 0, 0), bold=True, res=5, spacing=1.35))

# --- In the handle: power, Bluetooth, the microphone switch --------------------------------------
BACKVIEW = ((-1, 0, 0), (0, 0, 1))  # on a face looking back: right (as seen from behind), up
power = kit.new_object('power', kit.transform(kit.cylinder(0.62, FLOOR - 0.05, FLOOR + 0.12, 40), rotate=(-90, 'X')), M['key'])
power.data.transform(Matrix.Translation((0, 0, 14.85)))
kit.bevel(power, 0.03, 2)
details.append(power)
details.append(strokes('power_icon', [ring_pts(0.2, 125, 415, 18), [(0, 0.06), (0, 0.27)]], 0.034, (0, FLOOR + 0.12, 14.85), *BACKVIEW, M['print']))
bt = kit.new_object('bluetooth', slab_y(kit.rounded_rect(0.75, 0.28, 0.14, 6), FLOOR - 0.05, FLOOR + 0.07, z=12.8), M['key'])
kit.bevel(bt, 0.02, 2)
details.append(bt)
details.append(strokes('bt_icon', [[(-0.055, 0.045), (0.05, -0.045), (0, -0.1), (0, 0.1), (0.05, 0.045), (-0.055, -0.045)]], 0.018, (0, FLOOR, 13.32), *BACKVIEW, M['print']))
details.append(kit.new_object('mic_well', slab_y(kit.rounded_rect(0.95, 0.5, 0.25, 6), FLOOR - 0.05, FLOOR + 0.006, z=11.1), M['hole']))
details.append(kit.new_object('mic_on', slab_y(kit.rounded_rect(0.8, 0.2, 0.1, 6), FLOOR - 0.05, FLOOR + 0.012, z=10.98), M['green']))
sw = kit.new_object('mic_switch', slab_y(kit.rounded_rect(0.88, 0.26, 0.13, 6), FLOOR - 0.05, FLOOR + 0.08, z=11.2), M['key'])
kit.bevel(sw, 0.02, 2)
details.append(sw)
details.append(strokes('mic_icon', [[(0, -0.02), (0, 0.08)], [(-0.06, 0.03), (-0.06, -0.02), (0, -0.07), (0.06, -0.02), (0.06, 0.03)], [(0, -0.07), (0, -0.11)]], 0.018, (0, FLOOR, 11.72), *BACKVIEW, M['print']))

# --- The base at the back: USB-C, and the two charging contacts in their pocket -----------------
details.append(kit.new_object('usb_c', slab_y(kit.rounded_rect(0.86, 0.28, 0.14, 6), 5.9, 5.95, z=USB_Z), M['hole']))
details.append(kit.new_object('usb_tongue', slab_y(kit.rounded_rect(0.6, 0.07, 0.03, 2), 5.9, 6.12, z=USB_Z), M['key']))
for x in (-0.45, 0.45):
    u = [(-0.25, -0.5), (-0.09, -0.5), (-0.09, 0.22), (0.09, 0.22), (0.09, -0.5), (0.25, -0.5), (0.25, 0.3), (-0.25, 0.3)]
    c = kit.new_object('contact', slab_y(u, 4.7, 4.85, z=0.75), M['contact'])
    c.data.transform(Matrix.Translation((x, 0, 0)))
    kit.bevel(c, 0.03, 2)
    details.append(c)

# --- The foot: a bar across the plate, the name moulded into it -----------------------------------
details.append(kit.new_object('bar', slab_z(kit.rounded_rect(11.0, 1.36, 0.68, 10), 0.025, 0.06), M['rubber']))
details.append(text('move', 'Move', 0.55, M['logo'], (0, 0, 0.025), (1, 0, 0), (0, -1, 0), bold=True))

kit.join('details', details)

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back', 'top'), samples=32)
