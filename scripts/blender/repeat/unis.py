"""The 清华紫光 (UNIS) MQ-908 MP4 (2008): a 3.0" widescreen under black glass in a matte black frame,
electric-blue bands top and bottom, three touch keys (⏮ M ⏭) in the bottom band, a brushed metal
back that wraps the sides, and "MQ-908 / 清华紫光" printed upright beside the screen.

    blender -b --python scripts/blender/repeat/unis.py -- [out.glb] [preview.png]

Sizes are measured off ZOL's product photos against the screen (3.0", 432 x 240, 16:9 per ZOL):
88 x 55 x 10.5 mm. The left edge carries, top to bottom: mini-USB, the blue power slider, the TF slot,
the earphone jack.

Objects the page uses:
- screen: 6.66 x 3.74 cm, 432 x 240.
- btn_prev, btn_m, btn_next: the touch keys in the bottom band (`press` cm, straight in).
- power: the blue slider on the left edge (slides along Z; not a press).
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh  # noqa: E402
from mathutils import Matrix  # noqa: E402
import bpy  # noqa: E402

OUT, PREVIEW = kit.args('unis')
kit.reset()

W, H, T = 8.8, 5.52, 1.05
R = 0.72  # corner radius seen from the front
FY = -T / 2  # the front face
FRAME = 0.28  # the black front frame's depth; the metal back is behind it
GLASS = (7.77, 4.49, 0.18)  # width, height, corner radius
SCREEN = (6.66, 3.74)
BAND = 2.9  # the blue bands run from -BAND to +BAND
KEYS = (-1.31, 0.0, 1.31)  # touch keys' centres along the bottom band
KEY = (1.09, 0.28, 0.28)  # width, height, centre height

M = {
    'metal': kit.material('metal', kit.srgb('#c3c2bf'), rough=0.34, metal=1.0),
    'frame': kit.material('frame', kit.srgb('#18181a'), rough=0.72),
    'blue': kit.material('blue', kit.srgb('#1f52b4'), rough=0.26, metal=0.55),
    'key': kit.material('key', kit.srgb('#10275e'), rough=0.2, coat=0.6),
    'keyRim': kit.material('keyRim', kit.srgb('#6a9be0'), rough=0.3, metal=0.4),
    'glyph': kit.material('glyph', kit.srgb('#f1f3f7'), rough=0.5),
    'bezel': kit.material('bezel', kit.srgb('#060607'), rough=0.12, coat=1.0),
    'screen': kit.material('screen', kit.srgb('#0d1116'), rough=0.3, emission=kit.srgb('#1a2230'), strength=0.4),
    'glass': kit.material('glass', (1, 1, 1), rough=0.03, alpha=0.08),
    'print': kit.material('print', kit.srgb('#c9ccd1'), rough=0.5),
    'backPrint': kit.material('backPrint', kit.srgb('#55565a'), rough=0.5),
    'black': kit.material('black', kit.srgb('#0b0b0c'), rough=0.6),
}


def slab(w, h, r, y0, y1, x=0.0, z=0.0, seg=8):
    """A front-facing rounded slab from y0 (front) to y1 (back), centred on (x, z)."""
    return kit.transform(kit.front(kit.prism(kit.rounded_rect(w, h, r, seg), 0, y1 - y0)), translate=(x, y1, z))


def along_x(bm):
    """Turn something built along Z (a cylinder, a prism) to run along X."""
    return kit.transform(bm, rotate=(90, 'Y'))


# --- The metal back: wraps round the sides, rolls over at the back edge ---------------------------
bm = kit.prism(kit.rounded_rect(W, H, R, 12), FY + FRAME - 0.02, T / 2)
back = [e for e in bm.edges if all(v.co.z > T / 2 - 1e-4 for v in e.verts)]
bmesh.ops.bevel(bm, geom=back, offset=0.2, segments=5, affect='EDGES', profile=0.5)
kit.transform(bm, rotate=(90, 'X'), translate=(0, 0, H / 2))
kit.transform(bm, rotate=(180, 'Z'))
shell = kit.new_object('shell', bm, M['metal'])

# The left edge, top to bottom: mini-USB, the power slider's slot, the TF slot, the earphone jack.
SY = 0.06  # the middle of the metal part of the edge
LX = -W / 2
kit.cut(shell, kit.cutter(kit.transform(along_x(kit.prism(kit.rounded_rect(0.8, 0.42, 0.06, 2), -0.6, 0.6)), translate=(LX, SY, 4.39))))
kit.cut(shell, kit.cutter(kit.transform(along_x(kit.prism(kit.rounded_rect(0.86, 0.3, 0.1, 3), -0.08, 0.08)), translate=(LX, SY, 3.45))))
kit.cut(shell, kit.cutter(kit.transform(along_x(kit.prism(kit.rounded_rect(1.26, 0.12, 0.04, 2), -1.2, 1.2)), translate=(LX, SY, 2.28))))
kit.cut(shell, kit.cutter(kit.transform(along_x(kit.cylinder(0.34, -0.05, 0.05, 48)), translate=(LX, SY, 0.98))))
kit.cut(shell, kit.cutter(kit.transform(along_x(kit.cylinder(0.18, -1, 1, 32)), translate=(LX, SY, 0.98))))
kit.shade_smooth(shell, 40)
# What shows inside them.
kit.new_object('usb', kit.transform(along_x(kit.prism(kit.rounded_rect(0.8, 0.42, 0.06, 2), 0, 0.04)), translate=(LX + 0.55, SY, 4.39)), M['black'])
kit.new_object('usbTongue', kit.transform(along_x(kit.prism(kit.rounded_rect(0.6, 0.12, 0.02, 1), 0, 0.5)), translate=(LX + 0.08, SY + 0.06, 4.39)), M['metal'])
kit.new_object('tfDark', kit.transform(along_x(kit.prism(kit.rounded_rect(1.26, 0.12, 0.04, 2), 0, 0.04)), translate=(LX + 1.15, SY, 2.28)), M['black'])
kit.new_object('jack', kit.transform(along_x(kit.cylinder(0.18, 0, 0.04, 32)), translate=(LX + 0.6, SY, 0.98)), M['black'])
power = kit.new_object('power', kit.transform(along_x(kit.prism(kit.rounded_rect(0.4, 0.22, 0.07, 3), -0.06, 0.1)), translate=(LX, SY, 0)), M['blue'])
kit.bevel(power, 0.025, 2)
power.location.z = 3.6

# --- The black front frame, with the blue bands let into it ----------------------------------------
frame = kit.new_object('frame', slab(W - 0.02, H - 0.02, R - 0.01, FY, FY + FRAME, z=H / 2, seg=12), M['frame'])
kit.bevel(frame, 0.05, 3)
kit.cut(frame, kit.cutter(slab(GLASS[0] + 0.04, GLASS[1] + 0.04, GLASS[2] + 0.02, FY - 0.5, FY + 0.06, z=H / 2)))
for z0, z1 in (((H + GLASS[1]) / 2 - 0.01, H + 1), (-1, (H - GLASS[1]) / 2 + 0.01)):
    kit.cut(frame, kit.cutter(kit.transform(kit.front(kit.prism([(-BAND, z0), (BAND, z0), (BAND, z1), (-BAND, z1)], -1, FRAME + 0.01)), translate=(0, FY, 0))))
kit.shade_smooth(frame, 35)

# The bands: the frame's own outline, cut down to the band's stretch, in blue.
for name, z0, z1 in (('bandTop', (H + GLASS[1]) / 2 - 0.01, H + 1), ('bandBottom', -1, (H - GLASS[1]) / 2 + 0.01)):
    band = kit.new_object(name, slab(W - 0.02, H - 0.02, R - 0.01, FY + 0.002, FY + FRAME, z=H / 2, seg=12), M['blue'])
    kit.bevel(band, 0.045, 3)
    keep = kit.transform(kit.front(kit.prism([(-BAND + 0.012, z0), (BAND - 0.012, z0), (BAND - 0.012, z1), (-BAND + 0.012, z1)], -1, FRAME + 1)), translate=(0, FY, 0))
    ob = kit.cutter(keep)
    kit.apply(band, 'BOOLEAN', object=ob, operation='INTERSECT', solver='EXACT')
    bpy.data.objects.remove(ob)
    kit.shade_smooth(band, 35)

# --- Under the glass: the black bezel, the panel, the print; the glass itself flush on top ---------
GY = FY + 0.012  # the glass's front
kit.new_object('bezel', slab(GLASS[0], GLASS[1], GLASS[2], GY + 0.03, GY + 0.08, z=H / 2), M['bezel'])
kit.quad('screen', SCREEN[0], SCREEN[1], M['screen'], location=(0, GY + 0.028, H / 2))
kit.quad('glass', GLASS[0], GLASS[1], M['glass'], location=(0, GY, H / 2))
px = (SCREEN[0] / 2 + GLASS[0] / 2) / 2  # the margin right of the screen
for body, z, kind in (('MQ-908', H / 2 + 0.77, 'sans'), ('清华紫光', H / 2 - 0.78, 'cjk')):
    t = kit.text_mesh('print', body, 0.3 if kind == 'sans' else 0.25, M['print'], location=(0, 0, 0), kind=kind, bold=True, resolution=2 if kind == 'sans' else 3, spacing=1.05 if kind == 'sans' else 1.2)
    t.data.transform(Matrix.Rotation(math.radians(-90), 4, 'Y'))  # upright: reads bottom to top
    t.location = (px, GY + 0.026, z)

# --- The touch keys -------------------------------------------------------------------------------


def stroke(cx, cz, y, length, width, angle=0.0):
    bm = kit.front(kit.prism(kit.rounded_rect(length, width, width / 2.2, 2), 0, 0.004))
    return kit.new_object('g', kit.transform(bm, rotate=(-angle, 'Y'), translate=(cx, y, cz)), M['glyph'])


def tri(cx, cz, y, w, h, point):
    pts = [(-w / 2 * point, -h / 2), (w / 2 * point, 0), (-w / 2 * point, h / 2)]
    if point < 0:
        pts.reverse()
    return kit.new_object('g', kit.transform(kit.front(kit.prism(pts, 0, 0.004)), translate=(cx, y, cz)), M['glyph'])


KY = FY + 0.002 - 0.025  # the keys stand a little proud of the band
for name, x in zip(('btn_prev', 'btn_m', 'btn_next'), KEYS):
    rim = kit.new_object('keyRim', slab(KEY[0] + 0.05, KEY[1] + 0.05, (KEY[1] + 0.05) / 2, KY + 0.008, FY + 0.01, x=x, z=KEY[2], seg=6), M['keyRim'])
    kit.bevel(rim, 0.012, 2)
    key = kit.new_object(name, slab(KEY[0], KEY[1], KEY[1] / 2, KY, FY + 0.02, seg=6), M['key'])
    kit.bevel(key, 0.012, 2)
    key.location = (x, 0, KEY[2])
    key['press'] = 0.012
    g = 0.15  # glyph height
    if name == 'btn_m':
        parts = [kit.text_mesh('g', 'M', 0.21, M['glyph'], location=(0, KY, 0), bold=True, resolution=2)]
    else:
        s = 1 if name == 'btn_next' else -1
        parts = [tri(-0.07 * s, 0, KY, 0.13, g, s), tri(0.06 * s, 0, KY, 0.13, g, s), stroke(0.145 * s, 0, KY, g, 0.03, 90)]
    glyph = kit.join(name + '_g', parts)
    glyph.parent = key

# --- The back: small print -------------------------------------------------------------------------
kit.join('backPrint', [kit.text_mesh('b', t, s, M['backPrint'], location=(0, T / 2 + 0.001, z), facing='+Y', kind=k, bold=k == 'sans', resolution=2 if k == 'sans' else 4)
                       for t, s, z, k in (('UNIS  MQ-908', 0.2, 2.75, 'sans'), ('DIGITAL MEDIA PLAYER', 0.11, 2.4, 'sans'))])
for x in (-W / 2 + 0.75, W / 2 - 0.75):  # the two screws in the bottom edge
    s = kit.new_object('screw', kit.cylinder(0.07, -0.02, 0.01, 24, x=x, y=FY + FRAME + 0.2), M['black'])

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back'), samples=32)
