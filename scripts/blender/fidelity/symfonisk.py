"""The IKEA SYMFONISK WiFi bookshelf speaker (2019, the first generation, type E1801), black: a tall
box of matt black plastic standing on end, its front a panel of grey-black woven fabric with the
SONOS | IKEA tab at the top and a pill of three keys at the foot (−, a light, ▶II, +; the second
generation of 2022 put the play key last). The back is recessed: a well with the Ethernet and power
sockets, a channel from it down through the foot and another out through the right side, so the
cable can leave either way, and the rating label.

    blender -b --python scripts/blender/fidelity/symfonisk.py -- [out.glb] [preview.png]

Size: 10 x 15 x 31 cm (W x D x H), 2.08 kg net (IKEA's product page for 003.575.56, which also gives
the materials: ABS, a 100% polyester fabric, synthetic rubber screw covers, silicone feet). Laid out
from IKEA's photographs, RTINGS's (front, right side with its feet and cable notch) and MobileSyrup's
of the back, measured at their scale.

Nothing moves. The fabric's weave is a small tiled texture (colour and normal map), not geometry.
"""

import math
import os
import random
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

OUT, PREVIEW = kit.args('symfonisk')
kit.reset()

W, D, H = 10.0, 15.0, 31.0
FEET = 0.06  # the shell stands this high on its feet
HS = H - FEET
CZ = FEET + HS / 2
FY, BY = -D / 2, D / 2
PANEL = BY - 0.25  # the recessed back panel
WEAVE = 3.0  # the fabric's texture tile, cm


# --- Textures: a heathered plain weave, tiled ----------------------------------------------------
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
    im.save(quality=85)
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


TPX, THREADS = 384, 96  # px per tile, threads per tile: 0.31 mm a thread
rnd = random.Random(1801)


def yarn():
    """One thread's tone at each crossing: a mélange of black and grey fibres, so salt and pepper."""
    return [0.4 + 0.16 * rnd.random() if rnd.random() < 0.33 else 0.12 + 0.1 * rnd.random() for _ in range(THREADS)]


WARP = [yarn() for _ in range(THREADS)]
WEFT = [yarn() for _ in range(THREADS)]
P = TPX // THREADS


def weave(x, y):
    """(tone, height) of the plain weave at pixel x, y: warp and weft over and under in turn."""
    tx, ty = x // P, y // P
    fx, fy = (x % P + 0.5) / P, (y % P + 0.5) / P
    if (tx + ty) % 2 == 0:  # the warp (up the panel) on top
        tone, across, along = WARP[tx][ty], fx, fy
    else:
        tone, across, along = WEFT[ty][tx], fy, fx
    bulge = math.sin(math.pi * across) ** 0.7
    pillow = math.sin(math.pi * along)
    return tone * (0.72 + 0.28 * bulge * (0.8 + 0.2 * pillow)), bulge * (0.55 + 0.45 * pillow)


HEIGHT = [[weave(x, y)[1] for x in range(TPX)] for y in range(TPX)]


def fabric_colour(x, y):
    v = weave(x, y)[0]
    return (v, v, v * 1.03)


def fabric_normal(x, y):
    dx = HEIGHT[y][(x + 1) % TPX] - HEIGHT[y][(x - 1) % TPX]
    dy = HEIGHT[(y + 1) % TPX][x] - HEIGHT[(y - 1) % TPX][x]
    n = Vector((-dx * 1.2, -dy * 1.2, 1)).normalized()
    return (0.5 + 0.5 * n.x, 0.5 + 0.5 * n.y, 0.5 + 0.5 * n.z)


M = {
    'shell': kit.material('shell', kit.srgb('#1e1e1f'), rough=0.58),
    'fabric': textured(kit.material('fabric', kit.srgb('#404042'), rough=0.95),
                       image('symfonisk_fabric', (TPX, TPX), fabric_colour), image('symfonisk_fabric_n', (TPX, TPX), fabric_normal, data=True), 1.0),
    'tab': kit.material('tab', kit.srgb('#2a2a2c'), rough=0.85),
    'tabprint': kit.material('tabprint', kit.srgb('#cfcfcf'), rough=0.6),
    'pill': kit.material('pill', kit.srgb('#111112'), rough=0.28, coat=0.3),
    'key': kit.material('key', kit.srgb('#18181a'), rough=0.32),
    'glyph': kit.material('glyph', kit.srgb('#a3a3a6'), rough=0.5),
    'led': kit.material('led', kit.srgb('#e9eef5'), rough=0.3, emission=kit.srgb('#dfe8ff'), strength=0.6),
    'rubber': kit.material('rubber', kit.srgb('#141415'), rough=0.85),
    'metal': kit.material('metal', kit.srgb('#a9abae'), rough=0.35, metal=1.0),
    'hole': kit.material('hole', kit.srgb('#050505'), rough=0.8),
    'label': kit.material('label', kit.srgb('#2b2b2d'), rough=0.55),
    'print': kit.material('print', kit.srgb('#9b9b9e'), rough=0.6),
    'barcode': kit.material('barcode', kit.srgb('#b9b9b9'), rough=0.6),
}


def slab_y(pts, y0, y1, x=0.0, z=0.0):
    """An outline in (x, z) as seen from the front, made solid from y0 to y1 along Y."""
    bm = kit.front(kit.prism(pts, -y1, -y0))
    return kit.transform(bm, translate=(x, 0, z))


def text(name, body, size, mat, location, along, up, bold=False, res=3, spacing=1.0, align='CENTER'):
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
    """Line art: polylines in (u, v) cm, w wide, on the plane through origin spanned by U (right)
    and V (up), facing U x V."""
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


FRONT = ((1, 0, 0), (0, 0, 1))  # on the front: right, up
BACK = ((0, 0, 1), (1, 0, 0))  # on the back, along the panel (as the label reads, the speaker on its side)

# --- The shell: a box with softly rounded edges, the front and back let in ----------------------
bm = kit.prism([(-W / 2, -D / 2), (W / 2, -D / 2), (W / 2, D / 2), (-W / 2, D / 2)], FEET, H)
shell = kit.new_object('shell', bm, M['shell'])
kit.bevel(shell, 0.42, 5)
kit.cut(shell, kit.cutter(slab_y(kit.rounded_rect(W - 0.6, HS - 0.6, 0.35, 8), FY - 1, FY + 0.3, z=CZ)))
kit.cut(shell, kit.cutter(slab_y(kit.rounded_rect(W - 0.8, HS - 0.8, 0.4, 8), PANEL, BY + 1, z=CZ)))

# The back: the socket well, the channels the cable leaves by (down through the foot, out through the
# right side), the bracket slots across both ends, four oval pads.
WELL = (0.05, FEET + 15.4, 3.9, 9.0)  # x, z, width, height
WELL_Y = PANEL - 1.5
kit.cut(shell, kit.cutter(slab_y(kit.rounded_rect(WELL[2], WELL[3], 0.25, 6), WELL_Y, BY + 1, x=WELL[0], z=WELL[1])))
kit.cut(shell, kit.cutter(kit.cylinder(1.05, -1, WELL[1], 40, x=WELL[0], y=PANEL)))
kit.cut(shell, kit.cutter(kit.transform(kit.cylinder(0.9, 0, 6.5, 40), rotate=(-90, 'Y'), translate=(0, PANEL, FEET + 15.4))))
for z in (FEET + 0.87, FEET + 30.3):
    kit.cut(shell, kit.cutter(slab_y(kit.rounded_rect(7.4, 0.86, 0.12, 3), PANEL - 0.6, BY + 1, x=0.1, z=z)))
for x in (-3.2, 3.2):
    for z in (FEET + 2.95, FEET + 28.0):
        kit.cut(shell, kit.cutter(slab_y(kit.rounded_rect(1.3, 1.5, 0.64, 8), PANEL - 0.12, BY + 1, x=x, z=z)))

# The sockets in the well: Ethernet, and a figure-eight power inlet.
RJ = (0.25, FEET + 13.0)
kit.cut(shell, kit.cutter(slab_y(kit.rounded_rect(1.1, 1.2, 0.04, 2), WELL_Y - 1.2, WELL_Y + 0.5, x=RJ[0], z=RJ[1])))
PW = (0.1, FEET + 18.06)
r8, d8 = 0.37, 0.27
w8 = math.asin(d8 / r8)
eight = [(r8 * math.cos(a), d8 + r8 * math.sin(a)) for a in (-w8 + (math.pi + 2 * w8) * i / 20 for i in range(21))]
eight += [(r8 * math.cos(a), -d8 + r8 * math.sin(a)) for a in (math.pi - w8 + (math.pi + 2 * w8) * i / 20 for i in range(1, 20))]
kit.cut(shell, kit.cutter(slab_y(eight, WELL_Y - 0.9, WELL_Y + 0.5, x=PW[0], z=PW[1])))
kit.shade_smooth(shell, 40)

details = []
# the Ethernet jack's shield, round the opening, and the contacts at the back of it
for w, h, x, z in ((1.5, 0.17, 0, 0.67), (1.5, 0.17, 0, -0.67), (0.2, 1.2, 0.65, 0), (0.2, 1.2, -0.65, 0)):
    details.append(kit.new_object('rj45', slab_y(kit.rounded_rect(w, h, 0.02, 1), WELL_Y - 0.02, WELL_Y + 0.03, x=RJ[0] + x, z=RJ[1] + z), M['metal']))
details.append(kit.new_object('rj45_in', slab_y(kit.rounded_rect(1.1, 1.2, 0.04, 2), WELL_Y - 1.2, WELL_Y - 1.1, x=RJ[0], z=RJ[1]), M['hole']))
details.append(kit.new_object('rj45_tab', slab_y(kit.rounded_rect(0.5, 0.25, 0.03, 2), WELL_Y - 1.1, WELL_Y - 0.6, x=RJ[0], z=RJ[1] - 0.45), M['hole']))
details.append(kit.new_object('inlet', slab_y(eight, WELL_Y - 0.9, WELL_Y - 0.85, x=PW[0], z=PW[1]), M['hole']))
for dz in (-d8, d8):
    details.append(kit.new_object('pin', kit.transform(kit.cylinder(0.07, 0, 0.5, 12), rotate=(-90, 'X'), translate=(PW[0], WELL_Y - 0.88, PW[1] + dz)), M['metal']))

# The four screw covers on the back panel, rubber, each with its pip.
for x in (-3.45, 3.45):
    for z in (FEET + 5.5, FEET + 25.3):
        details.append(kit.new_object('screw_cover', kit.transform(kit.cylinder(0.35, -0.002, 0.03, 24), rotate=(-90, 'X'), translate=(x, PANEL, z)), M['rubber']))
        details.append(kit.new_object('pip', kit.transform(kit.cylinder(0.08, 0.03, 0.06, 12), rotate=(-90, 'X'), translate=(x, PANEL, z)), M['rubber']))

# The rating label, read with the speaker on its side, and the serial number's barcode beside it.
LABEL_Y = PANEL + 0.012
details.append(kit.new_object('label', slab_y(kit.rounded_rect(4.8, 9.2, 0.12, 3), PANEL - 0.01, LABEL_Y, x=0, z=FEET + 24.8), M['label']))
details.append(strokes('ikea_box', [kit.rounded_rect(2.0, 0.78, 0.18, 4) + [kit.rounded_rect(2.0, 0.78, 0.18, 4)[0]]], 0.06, (1.77, LABEL_Y, FEET + 21.5), *BACK, M['print']))
details.append(text('ikea', 'IKEA', 0.5, M['print'], (1.77, LABEL_Y, FEET + 21.5), *BACK, bold=True, res=3))
details.append(text('sonos', 'SONOS', 0.5, M['print'], (1.73, LABEL_Y, FEET + 25.7), *BACK, res=3, spacing=1.15))
small = [
    (0.95, 20.38, 'Design and Quality  IKEA of Sweden'),
    (0.62, 20.38, 'TYPE: E1801'),
    (0.35, 20.38, 'Wireless Speaker SYMFONISK'),
    (0.08, 20.38, 'Input: 100-240V~50-60Hz 1000 mA'),
    (-0.6, 20.38, 'IKEA of Sweden AB SE-343 81 Älmhult'),
    (-1.15, 20.38, 'Made in CHINA'),
    (0.95, 24.45, 'FCC ID: FHO-E1801'),
    (0.68, 24.45, 'IC: 10912A-E1801'),
]
for x, z, line in small:
    details.append(text('small', line, 0.17, M['print'], (x, LABEL_Y, FEET + z), *BACK, res=2, align='LEFT'))
details.append(text('ce', 'CE', 0.42, M['print'], (-1.5, LABEL_Y, FEET + 27.9), *BACK, res=3))
sq = kit.rounded_rect(0.42, 0.42, 0.001, 1)
details.append(strokes('class2', [sq + [sq[0]], [(u * 0.55, v * 0.55) for u, v in sq + [sq[0]]]], 0.03, (-1.5, LABEL_Y, FEET + 28.75), *BACK, M['print']))
details.append(kit.new_object('serial', slab_y(kit.rounded_rect(1.1, 4.0, 0.06, 2), PANEL - 0.01, LABEL_Y + 0.004, x=-2.95, z=FEET + 22.1), M['barcode']))
z = FEET + 20.35
while z < FEET + 23.85:
    w = rnd.choice((0.025, 0.025, 0.05, 0.075))
    details.append(kit.new_object('bar', slab_y(kit.rounded_rect(0.55, w, 0.001, 1), LABEL_Y, LABEL_Y + 0.006, x=-2.8, z=z), M['hole']))
    z += w + rnd.choice((0.03, 0.05, 0.08))

# --- The front: the fabric panel, its tab, the keys ----------------------------------------------
bm = slab_y(kit.rounded_rect(W - 0.64, HS - 0.64, 0.33, 8), FY + 0.03, FY + 0.32, z=CZ)
uv = bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    for loop in f.loops:
        loop[uv].uv = (loop.vert.co.x / WEAVE, loop.vert.co.z / WEAVE)
fabric = kit.new_object('fabric', bm, M['fabric'])
kit.bevel(fabric, 0.09, 3)
kit.shade_smooth(fabric, 50)

FF = FY + 0.03  # the fabric's face
TOP_F = CZ + (HS - 0.64) / 2
tab = kit.new_object('tab', slab_y(kit.rounded_rect(3.8, 0.74, 0.08, 3), FF - 0.035, FF + 0.02, z=TOP_F - 0.37), M['tab'])
kit.bevel(tab, 0.012, 1)
details.append(tab)
TZ = TOP_F - 0.36
details.append(text('tab_sonos', 'SONOS', 0.24, M['tabprint'], (-0.85, FF - 0.035, TZ), *FRONT, res=3, spacing=1.25))
details.append(strokes('tab_bar', [[(0.04, -0.2), (0.16, 0.2)]], 0.018, (0, FF - 0.035, TZ), *FRONT, M['tabprint']))
details.append(kit.new_object('tab_ikea', slab_y(kit.rounded_rect(1.05, 0.4, 0.07, 3), FF - 0.04, FF - 0.03, x=0.95, z=TZ), M['tabprint']))
details.append(text('tab_ikea_t', 'IKEA', 0.27, M['tab'], (0.95, FF - 0.04, TZ), *FRONT, bold=True, res=3))

KZ = FEET + 3.15  # the keys' pill
pill = kit.new_object('pill', slab_y(kit.rounded_rect(4.9, 1.5, 0.75, 12), FF - 0.06, FF + 0.2, z=KZ), M['pill'])
kit.bevel(pill, 0.04, 3)
kit.shade_smooth(pill, 40)
details.append(pill)
KF = FF - 0.06  # the pill's face
for x in (-1.77, 0.0, 1.77):
    k = kit.new_object('key', kit.transform(kit.cylinder(0.46, 0, 0.035, 40), rotate=(90, 'X'), translate=(x, KF, KZ)), M['key'])
    kit.bevel(k, 0.015, 2)
    kit.shade_smooth(k, 40)
    details.append(k)
GF = KF - 0.035
details.append(strokes('minus', [[(-0.13, 0), (0.13, 0)]], 0.035, (-1.77, GF, KZ), *FRONT, M['glyph']))
details.append(strokes('plus', [[(-0.13, 0), (0.13, 0)], [(0, -0.13), (0, 0.13)]], 0.035, (1.77, GF, KZ), *FRONT, M['glyph']))
bm = kit.front(kit.prism([(-0.17, -0.12), (-0.02, 0), (-0.17, 0.12)], -0.003, 0))
details.append(kit.new_object('play', kit.transform(bm, translate=(0, GF - 0.003, KZ)), M['glyph']))
details.append(strokes('pause', [[(0.05, -0.12), (0.05, 0.12)], [(0.13, -0.12), (0.13, 0.12)]], 0.035, (0, GF, KZ), *FRONT, M['glyph']))
details.append(kit.new_object('led', slab_y(kit.rounded_rect(0.09, 0.3, 0.045, 4), KF - 0.006, KF + 0.01, x=-0.87, z=KZ), M['led']))

# --- Rubber: four feet under it, four on the right side to lie it down on, two covers on top -------
for x in (-3.6, 3.6):
    for y in (-6.0, 6.0):
        details.append(kit.new_object('foot', kit.cylinder(0.45, 0, FEET + 0.02, 24, x=x, y=y), M['rubber']))
for y in (-6.2, 6.2):
    for z in (1.3, H - 1.3):
        details.append(kit.new_object('side_foot', kit.transform(kit.cylinder(0.4, 0, 0.06, 24), rotate=(-90, 'Y'), translate=(-W / 2 + 0.02, y, z)), M['rubber']))
for x in (-2.3, 2.3):
    details.append(kit.new_object('top_cover', kit.cylinder(0.28, H - 0.02, H + 0.008, 24, x=x, y=5.0), M['rubber']))

kit.join('details', details)

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back', 'side'), samples=32)
