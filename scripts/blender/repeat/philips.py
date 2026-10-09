"""The Philips GoGear SA28 / SA028 (2008), "可爱四方小石头": a little square of black mirror with a
satin silver band round its middle, a black back and a clip.

    blender -b --python scripts/blender/repeat/philips.py -- [out.glb] [preview.png]

Size: 40 x 40 x 11.2 mm, 15 mm with the clip; 26 g (ZOL). Chinese listings give 39 x 39 x 11, the
international SA2800 specs 41 x 41 x 15 (with the clip). Laid out from ZOL's gallery of it.

Objects the page uses:
- face: the whole black mirror front is the control: it rocks in at whichever edge is pressed
  (▲ ▼ ◀ ▶ are printed at the edges) and in the middle to choose. One object, `press` into the body;
  the page works out the edge from where it was pressed (centre of the face: x 0, z 2.0 here).
  screen, the PHILIPS print and the arrows are its children, so they go in with it.
- screen: the OLED under the mirror, 2.3 x 1.15 cm, white on black, 128 x 64 pixels. It lies a hair
  in front of the mirror: draw it black where it is dark (additive blending suits it, so the mirror's
  reflections stay).
- btn_loop (⇄) and btn_play (play/pause, power): the long key on the top edge, `press` down (`axis` 'z').
- btn_rec: the REC key on the left edge, `press` with `axis` '+x' (it goes in towards +X).
- btn_vol_down, btn_vol_up: the − + rocker on the right edge, `press` with `axis` '-x'.
- hold: the lock slider on the bottom edge; it slides along X (sits unlocked, at its left end).
- clip: the belt clip on the back. loop: the bar in the lanyard slot on the left edge.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('philips')
kit.reset()

W = H = 4.0
T = 1.12  # without the clip
FY, BY = -T / 2, T / 2
FACE = (FY, FY + 0.28)  # the black mirror, front to back: thin, its edge rolled right over
BAND = (FY + 0.26, FY + 0.88)  # the silver band, which carries the keys
BACK = (FY + 0.86, BY)
BC = (BAND[0] + BAND[1]) / 2  # the middle of the band, where the keys sit
CZ = H / 2

M = {
    'face': kit.material('face', kit.srgb('#060607'), rough=0.04, coat=1.0),
    'band': kit.material('band', kit.srgb('#c7c8ca'), rough=0.3, metal=1.0),
    'key': kit.material('key', kit.srgb('#d2d3d5'), rough=0.28, metal=0.9),
    'back': kit.material('back', kit.srgb('#08080a'), rough=0.1, coat=0.8),
    'print': kit.material('print', kit.srgb('#8f9195'), rough=0.5),
    'ink': kit.material('ink', kit.srgb('#3a3c40'), rough=0.6),
    'black': kit.material('black', kit.srgb('#0b0b0c'), rough=0.6),
    'rubber': kit.material('rubber', kit.srgb('#141415'), rough=0.6),
    'screen': kit.material('screen', kit.srgb('#020203'), rough=0.2),
}

TOP = ((-1, 0, 0), (0, 1, 0), (0, 0, 1))  # along the edge, across the band, out of it
LEFT = ((0, 0, 1), (0, 1, 0), (-1, 0, 0))
RIGHT = ((0, 0, 1), (0, 1, 0), (1, 0, 0))
BOTTOM = ((1, 0, 0), (0, 1, 0), (0, 0, -1))


def slab(u, v, r, d, origin, U, V, N, seg=6):
    """A rounded u x v rectangle in the plane of axes U, V, d deep along N from `origin`."""
    bm = kit.prism(kit.rounded_rect(u, v, r, seg), 0, d)
    m = Matrix(((U[0], V[0], N[0]), (U[1], V[1], N[1]), (U[2], V[2], N[2])))
    bmesh.ops.transform(bm, matrix=m.to_4x4(), verts=bm.verts)
    if m.determinant() < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bmesh.ops.translate(bm, verts=bm.verts, vec=origin)
    return bm


def slab_front(w, h, r, y0, y1, cx=0.0, cz=0.0, seg=8):
    """A rounded rectangle seen from the front, from y0 (its front) back to y1."""
    bm = kit.prism(kit.rounded_rect(w, h, r, seg), 0, y1 - y0)
    kit.front(bm, y1)
    return kit.transform(bm, translate=(cx, 0, cz))


def text(name, body, size, mat, location, along, up, kind='sans', bold=False, res=4, spacing=1.0, parent=None):
    """Flat lettering a hair off a surface, its baseline running `along`, its top towards `up` (the
    surface faces along x up)."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.resolution_u = res
    curve.space_character = spacing
    f = kit.font(kind)
    if f:
        curve.font = f
    curve.size = size
    curve.offset = size * 0.035 if bold else 0
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
    a, u = Vector(along), Vector(up)
    n = a.cross(u)
    ob.data.transform(Matrix(((a.x, u.x, n.x, 0), (a.y, u.y, n.y, 0), (a.z, u.z, n.z, 0), (0, 0, 0, 1))))
    ob.location = (location[0] + n.x * 0.002, location[1] + n.y * 0.002, location[2] + n.z * 0.002)
    if parent:
        ob.parent = parent
    return ob


def tri(name, cx, cz, w, h, angle, parent):
    """A small printed arrowhead on the face, pointing `angle` degrees round from +X."""
    bm = kit.prism([(h / 2, 0), (-h / 2, w / 2), (-h / 2, -w / 2)], 0, 0.002)
    kit.transform(bm, rotate=(angle, 'Z'))
    kit.front(bm, FY - 0.001)
    kit.transform(bm, translate=(cx, 0, cz))
    ob = kit.new_object(name, bm, M['print'])
    ob.parent = parent
    return ob


# --- The face: black mirror, rolled over hard at its edges ---------------------------------------
bm = kit.prism(kit.rounded_rect(W - 0.18, H - 0.18, 0.54, 12), 0, FACE[1] - FACE[0])
edge = [e for e in bm.edges if all(abs(v.co.z - (FACE[1] - FACE[0])) < 1e-4 for v in e.verts)]
bmesh.ops.bevel(bm, geom=edge, offset=0.24, segments=10, affect='EDGES', profile=0.5)
kit.front(bm, FACE[1])
kit.transform(bm, translate=(0, 0, CZ))
face = kit.new_object('face', bm, M['face'])
kit.shade_smooth(face, 50)
face['press'] = 0.03

kit.quad('screen', 2.3, 1.15, M['face'], location=(0, FY - 0.001, CZ + 0.02)).parent = face
text('philips', 'PHILIPS', 0.27, M['print'], (0, FY - 0.001, 3.07), (1, 0, 0), (0, 0, 1), bold=True, res=5, spacing=1.2, parent=face)
tri('up', 0, H - 0.29, 0.13, 0.1, 90, face)
tri('down', 0, 0.29, 0.13, 0.1, -90, face)
tri('left', -W / 2 + 0.3, CZ, 0.13, 0.1, 180, face)
tri('right', W / 2 - 0.3, CZ, 0.13, 0.1, 0, face)

# --- The band: satin silver, the keys and ports let into it --------------------------------------
band = kit.new_object('band', slab_front(W, H, 0.62, BAND[0], BAND[1], cz=CZ, seg=12), M['band'])
kit.bevel(band, 0.035, 3)
KEY_V = 0.29  # how tall the key slots are, across the band
# top edge: the long key (⇄ | play), the headphone jack
kit.cut(band, kit.cutter(slab(2.12, KEY_V + 0.04, 0.16, 0.4, (0.27, BC, H - 0.13), *TOP)))
kit.cut(band, kit.cutter(kit.cylinder(0.17, H - 0.9, H + 1, 32, x=-1.26, y=BC)))
# left edge: the lanyard slot, REC, the USB port under its cover
kit.cut(band, kit.cutter(slab(0.55, 0.3, 0.15, 0.4, (-W / 2 + 0.18, BC, 3.38), *LEFT)))
kit.cut(band, kit.cutter(slab(0.92, KEY_V + 0.04, 0.15, 0.4, (-W / 2 + 0.13, BC, 2.4), *LEFT)))
kit.cut(band, kit.cutter(slab(1.12, 0.33, 0.1, 0.4, (-W / 2 + 0.1, BC, 1.22), *LEFT)))
# right edge: the − + rocker, the microphone
kit.cut(band, kit.cutter(slab(1.76, KEY_V + 0.04, 0.15, 0.4, (W / 2 - 0.13, BC, 2.15), *RIGHT)))
kit.cut(band, kit.cutter(kit.transform(kit.cylinder(0.035, 0, 1, 12), rotate=(90, 'Y'), translate=(W / 2 - 0.3, BC, 1.15))))
# bottom edge: the reset pinhole, the hold slider
kit.cut(band, kit.cutter(kit.cylinder(0.03, -1, 0.3, 12, x=-0.22, y=BC)))
kit.cut(band, kit.cutter(slab(0.82, KEY_V + 0.04, 0.15, 0.4, (0.5, BC, 0.13), *BOTTOM)))
kit.shade_smooth(band, 40)

kit.new_object('jack', kit.cylinder(0.165, H - 0.85, H - 0.05, 32, x=-1.26, y=BC), M['black'])
kit.new_object('slot', slab(0.55, 0.3, 0.15, 0.04, (-W / 2 + 0.17, BC, 3.38), *LEFT), M['black'])
loop = kit.new_object('loop', slab(0.1, 0.3, 0.04, 0.14, (-W / 2 + 0.17, BC, 3.38), *LEFT), M['band'])
usb = kit.new_object('usb', slab(1.1, 0.31, 0.09, 0.12, (-W / 2 + 0.11, BC, 1.22), *LEFT), M['rubber'])
kit.bevel(usb, 0.02, 2)


def key(name, u, origin, frame, axis, legend=None, legend_size=0.09):
    ob = kit.new_object(name, slab(u, KEY_V, 0.13, 0.15, origin, *frame), M['key'])
    kit.bevel(ob, 0.02, 2)
    kit.shade_smooth(ob, 30)
    ob['press'] = 0.035
    ob['axis'] = axis
    if legend:
        U, V, N = (Vector(v) for v in frame)
        tip = Vector(origin) + N * 0.15
        text(name + '_t', legend, legend_size, M['ink'], tuple(tip), tuple(-U if frame is LEFT else U), (0, -1, 0), kind='mono', bold=True, res=3, parent=ob)
    return ob


key('btn_loop', 1.04, (-0.25, BC, H - 0.12), TOP, 'z', '⇄')
key('btn_play', 1.04, (0.79, BC, H - 0.12), TOP, 'z', 'II◀/⏻')
key('btn_rec', 0.88, (-W / 2 + 0.12, BC, 2.4), LEFT, '+x', 'REC')
key('btn_vol_down', 0.86, (W / 2 - 0.12, BC, 1.7), RIGHT, '-x', '−', 0.13)
key('btn_vol_up', 0.86, (W / 2 - 0.12, BC, 2.6), RIGHT, '-x', '+', 0.13)
hold = kit.new_object('hold', slab(0.36, KEY_V - 0.02, 0.1, 0.16, (0.29, BC, 0.12), *BOTTOM), M['key'])
kit.bevel(hold, 0.02, 2)
kit.new_object('track', slab(0.82, KEY_V + 0.04, 0.15, 0.03, (0.5, BC, 0.1), *BOTTOM), M['black'])

text('mic', 'MIC', 0.08, M['ink'], (W / 2, BC, 0.93), (0, 0, 1), (0, -1, 0), bold=True)
text('reset', 'RESET', 0.09, M['ink'], (-0.75, BC, 0), (1, 0, 0), (0, -1, 0), bold=True)
text('lock', '→', 0.11, M['ink'], (0.29, BC, -0.04), (1, 0, 0), (0, -1, 0), kind='mono', parent=hold)

# --- The back and its clip ------------------------------------------------------------------------
back = kit.new_object('back', slab_front(W - 0.06, H - 0.06, 0.6, BACK[0], BACK[1], cz=CZ, seg=12), M['back'])
kit.bevel(back, 0.12, 5)
kit.shade_smooth(back, 50)

# A black blade down the middle of the back, sprung on a block, its top end turned out to press on
# and its bottom end turned in to grip.
CW = 1.25
parts = [
    kit.new_object('c', slab(CW, H - 0.1, 0.2, 0.14, (0, BY + 0.2, CZ - 0.03), (1, 0, 0), (0, 0, 1), (0, 1, 0)), M['back']),
    kit.new_object('c', slab(CW - 0.25, 1.1, 0.1, 0.21, (0, BY - 0.01, 2.6), (1, 0, 0), (0, 0, 1), (0, 1, 0)), M['back']),
    kit.new_object('c', slab(CW - 0.1, 0.42, 0.12, 0.56, (0, BY + 0.2, H - 0.32), (1, 0, 0), (0, 0, 1), (0, 1, 0)), M['back']),
    kit.new_object('c', slab(CW, 0.18, 0.06, 0.17, (0, BY + 0.05, 0.12), (1, 0, 0), (0, 0, 1), (0, 1, 0)), M['back']),
]
for p in parts:
    kit.bevel(p, 0.03, 2)
clip = kit.join('clip', parts)
kit.shade_smooth(clip, 40)

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back', 'top'), samples=32)
