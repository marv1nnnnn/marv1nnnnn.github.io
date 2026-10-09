"""The Zune HD (2009), black: a glass front with the metal plate across its foot and the glass
running down into it as a tab, whose lip is the home button; a thin metal frame, a black band
round the middle, and a brushed back held by four screws over a separate lower section.

    blender -b --python scripts/blender/repeat/zune.py -- [out.glb] [preview.png]

Objects the page uses: screen (portrait, 272 x 480), btn_home (front), btn_power (top edge,
axis 'z'), btn_media (left side; axis 'x': it goes in along +X). `back` is the cover with its
screws, origin on its inside face: move it along +Y (glTF -Z) to lift it off, and under it lie
the frame, the top of the logic board and `battery`, the replacement cell his second-hand one came
with.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bpy  # noqa: E402
import kit  # noqa: E402
from kit import bmesh  # noqa: E402
from mathutils import Matrix  # noqa: E402

OUT, PREVIEW = kit.args('zune')
kit.reset()

W, H, T = 5.27, 10.21, 0.89  # 52.7 x 102.1 x 8.9 mm
R = 0.16  # corner radius, seen from the front
RIM = 0.07  # the metal frame round the front
FY = -T / 2  # the front face
FRONT = (FY, -0.25)  # frame, front to back
BAND = (-0.25, 0.17)  # the black band round the middle
BACK = (0.17, T / 2)  # the back plate
PT = 2.2  # where the front plate meets the glass, up from the bottom
TAB = (1.08, 0.45)  # the glass tab down into the plate: half-width at the top, depth
SCREEN = (4.08, 7.2, 2.63)  # width, height, bottom edge
LOWER = 2.2  # the separate lower section of the back

M = {
    'frame': kit.material('frame', kit.srgb('#2e2f32'), rough=0.32, metal=0.9),
    'plate': kit.material('plate', kit.srgb('#18191b'), rough=0.55, metal=0.65),
    'bezel': kit.material('bezel', kit.srgb('#040405'), rough=0.12, coat=1.0),
    'glass': kit.material('glass', (0, 0, 0), rough=0.03, alpha=0.15),
    'screen': kit.material('screen', kit.srgb('#07080a'), rough=0.25, emission=kit.srgb('#141a22'), strength=0.4),
    'button': kit.material('button', kit.srgb('#08090a'), rough=0.08, coat=1.0),
    'band': kit.material('band', kit.srgb('#0c0c0d'), rough=0.45),
    'back': kit.material('back', kit.srgb('#2c2d31'), rough=0.34, metal=0.85),
    'lower': kit.material('lower', kit.srgb('#0b0b0c'), rough=0.22, coat=0.6),
    'screw': kit.material('screw', kit.srgb('#4a4b4f'), rough=0.3, metal=1.0),
    'etch': kit.material('etch', kit.srgb('#9a9da2'), rough=0.42, metal=1.0),
    'print': kit.material('print', kit.srgb('#4d5258'), rough=0.5),
    'black': kit.material('black', kit.srgb('#030303'), rough=0.7),
}


def slab(pts, y0, y1, z=0.0):
    """An outline in (x, z) as seen from the front, made solid from y0 (front) to y1 (back)."""
    bm = kit.front(kit.prism(pts, -y1, -y0))
    return kit.transform(bm, translate=(0, 0, z))


def bevel_edges(bm, pick, offset, segments=4, profile=0.5):
    edges = [e for e in bm.edges if all(pick(v.co) for v in e.verts)]
    bmesh.ops.bevel(bm, geom=edges, offset=offset, segments=segments, affect='EDGES', profile=profile)
    return bm


def round_corners(pts, r, seg=4):
    """Round every corner of a polygon by r (pts counter-clockwise)."""
    pts = [p for i, p in enumerate(pts) if math.dist(p, pts[i - 1]) > 1e-6]  # a zero chamfer repeats a point
    out = []
    n = len(pts)
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        a = (p0[0] - p1[0], p0[1] - p1[1])
        b = (p2[0] - p1[0], p2[1] - p1[1])
        la, lb = math.hypot(*a), math.hypot(*b)
        rr = min(r, la / 2.2, lb / 2.2)
        s = (p1[0] + a[0] / la * rr, p1[1] + a[1] / la * rr)
        e = (p1[0] + b[0] / lb * rr, p1[1] + b[1] / lb * rr)
        for k in range(seg + 1):  # a quadratic curve through the corner
            t = k / seg
            out.append(((1 - t) ** 2 * s[0] + 2 * (1 - t) * t * p1[0] + t * t * e[0], (1 - t) ** 2 * s[1] + 2 * (1 - t) * t * p1[1] + t * t * e[1]))
    return out


def flat_text(name, body, size, mat, location, facing='-Y'):
    """Printed lettering: flat, at a low curve resolution (kit.text_mesh extrudes it at full
    resolution, which is right for moulded letters but heavy for a label's worth of print)."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.size = size
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.resolution_u = 3
    f = kit.font('sans')
    if f:
        curve.font = f
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
    rot = {'-Y': Matrix.Rotation(math.radians(90), 4, 'X'), '+Y': Matrix.Rotation(math.radians(-90), 4, 'X') @ Matrix.Rotation(math.pi, 4, 'Z'), '-Z': Matrix.Rotation(math.pi, 4, 'X')}[facing]
    ob.data.transform(rot)
    ob.location = location
    return ob


IW, IH = W - 2 * RIM, H - 2 * RIM  # inside the frame
a, d = TAB

# --- The frame: a thin metal tray the glass and the plate sit in --------------------------------
frame = kit.new_object('frame', slab(kit.rounded_rect(W, H, R, 10), *FRONT, z=H / 2), M['frame'])
kit.cut(frame, kit.cutter(slab(kit.rounded_rect(IW, IH, R - RIM / 2, 10), FY - 0.1, FY + 0.06, z=H / 2)))
kit.bevel(frame, 0.012, 2)
kit.shade_smooth(frame, 40)

# --- The glass: black where it is not the screen, its tab running down into the plate -------------
top = H - RIM
glass_pts = round_corners([
    (-IW / 2, PT), (-a, PT), (-a + 0.12, PT - d), (a - 0.12, PT - d), (a, PT), (IW / 2, PT),
    (IW / 2, top), (-IW / 2, top),
], 0.06)
kit.new_object('bezel', slab(glass_pts, FY + 0.004, FY + 0.06), M['bezel'])
kit.quad('screen', SCREEN[0], SCREEN[1], M['screen'], location=(0, FY + 0.0035, SCREEN[2] + SCREEN[1] / 2))
cover = kit.new_object('glass', slab(glass_pts, FY + 0.001, FY + 0.003), M['glass'])
flat_text('wordmark', 'zune', 0.3, M['print'], location=(0, FY + 0.0005, PT + 0.2))

# --- The plate across the foot, with the notch the tab sits in ---------------------------------
plate_pts = [
    (-IW / 2, RIM), (IW / 2, RIM), (IW / 2, PT), (a, PT), (a - 0.12, PT - d), (-a + 0.12, PT - d), (-a, PT), (-IW / 2, PT),
]
plate_pts = round_corners(plate_pts, 0.06)
kit.new_object('plate', slab(plate_pts, FY + 0.003, FY + 0.06), M['plate'])

# --- The home button: the glossy lip along the bottom of the tab --------------------------------
lip = [(-a + 0.14, PT - d + 0.015), (a - 0.14, PT - d + 0.015), (a - 0.17, PT - d + 0.2), (-a + 0.17, PT - d + 0.2)]
home = kit.new_object('btn_home', slab(round_corners(lip, 0.04), FY - 0.022, FY + 0.05), M['button'])
kit.bevel(home, 0.018, 3)
kit.shade_smooth(home, 40)
kit.origin_to(home, (0, FY, PT - d + 0.1))
home['press'] = 0.022

# --- The black band round the middle, with the ports in its bottom edge ------------------------
bm = slab(kit.rounded_rect(W - 0.03, H - 0.03, R + 0.02, 10), *BAND, z=H / 2)
band = kit.new_object('band', bm, M['band'])
kit.bevel(band, 0.03, 3)
yb = (BAND[0] + BAND[1]) / 2
kit.cut(band, kit.cutter(kit.cylinder(0.175, -1, 0.9, 32, x=-1.9, y=yb)))  # headphone jack
kit.cut(band, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(2.2, 0.2, 0.08, 4), -1, 0.35), translate=(0, yb, 0))))  # dock
kit.shade_smooth(band, 40)
kit.new_object('jack', kit.cylinder(0.17, 0.45, 0.88, 32, x=-1.9, y=yb), M['black'])
kit.new_object('dock', kit.transform(kit.prism(kit.rounded_rect(2.18, 0.18, 0.07, 4), 0.25, 0.32), translate=(0, yb, 0)), M['black'])
# "hello from seattle", on the bottom edge
flat_text('hello', 'hello from seattle', 0.13, M['print'], location=(1.25, yb, 0.0145), facing='-Z')

# --- The back: a brushed plate with chamfered corners, the lower section a separate piece -------
def back_outline(z0, z1, cham_top, cham_bottom):
    w = W - 0.04
    pts = [
        (-w / 2 + cham_bottom, z0), (w / 2 - cham_bottom, z0), (w / 2, z0 + cham_bottom),
        (w / 2, z1 - cham_top), (w / 2 - cham_top, z1), (-w / 2 + cham_top, z1), (-w / 2, z1 - cham_top), (-w / 2, z0 + cham_bottom),
    ]
    return round_corners(pts, 0.05, 3)


def back_piece(name, pts, mat):
    bm = slab(pts, *BACK)
    # the back edge rolls over, as the shell is slightly curved at its edges
    bevel_edges(bm, lambda co: co.y > BACK[1] - 1e-4, 0.1, segments=5, profile=0.6)
    ob = kit.new_object(name, bm, mat)
    kit.shade_smooth(ob, 35)
    return ob


plate = back_piece('back', back_outline(LOWER + 0.015, H - 0.02, 0.34, 0.0), M['back'])
lower = back_piece('lower', back_outline(0.02, LOWER - 0.015, 0.0, 0.18), M['lower'])
# The cover is a shell: hollow on its inside, so it can come off and show what is under it.
kit.cut(plate, kit.cutter(slab(kit.rounded_rect(W - 0.26, H - LOWER - 0.24, 0.2, 6), BACK[0] - 0.1, BACK[1] - 0.07, z=(LOWER + H) / 2)))

# Four screws in the plate, near its corners; they come off with it.
parts = [plate]
for x, z in ((-(W / 2 - 0.42), H - 0.42), (W / 2 - 0.42, H - 0.42), (-(W / 2 - 0.42), LOWER + 0.38), (W / 2 - 0.42, LOWER + 0.38)):
    bm = kit.transform(kit.cylinder(0.13, 0, 0.03, 32, r1=0.115), rotate=(-90, 'X'), translate=(x, T / 2 - 0.004, z))
    s = kit.new_object('screw', bm, M['screw'])
    for rot in (45, 135):
        c = kit.transform(kit.prism(kit.rounded_rect(0.15, 0.03, 0.01, 1), -0.02, 0.1), rotate=[(rot, 'Z'), (-90, 'X')], translate=(x, T / 2 + 0.02, z))
        kit.cut(s, kit.cutter(c))
    kit.shade_smooth(s, 40)
    parts.append(s)

# The name etched into the back, high up.
parts.append(flat_text('etch', 'zune', 0.55, M['etch'], location=(0, T / 2 + 0.0006, H - 2.0), facing='+Y'))
back = kit.join('back', parts)
kit.origin_to(back, (0, BACK[0], (LOWER + H) / 2))  # lifts off backwards, along +Y

# --- Inside, under the cover: the frame, the logic board, and the battery he had put in ----------
M.update({
    'midframe': kit.material('midframe', kit.srgb('#55585c'), rough=0.55, metal=0.8),
    'pcb': kit.material('pcb', kit.srgb('#14321f'), rough=0.5),
    'chip': kit.material('chip', kit.srgb('#111214'), rough=0.4),
    'shield': kit.material('shield', kit.srgb('#b9bcc0'), rough=0.3, metal=1.0),
    'flex': kit.material('flex', kit.srgb('#b8742a'), rough=0.4),
    'cell': kit.material('cell', kit.srgb('#24272c'), rough=0.45),
    'label': kit.material('label', kit.srgb('#e9e8e2'), rough=0.7),
    'ink': kit.material('ink', kit.srgb('#1d1f23'), rough=0.6),
    'kapton': kit.material('kapton', kit.srgb('#c68a2e'), rough=0.3, coat=0.5),
})
# The band is a tray: its middle hollowed out from the back.
kit.cut(band, kit.cutter(slab(kit.rounded_rect(W - 0.27, H - 0.9 - 0.18, 0.14, 6), -0.06, 0.5, z=0.9 + (H - 0.9 - 0.18) / 2)))
kit.new_object('midframe', slab(kit.rounded_rect(W - 0.29, H - 1.1, 0.12, 6), -0.061, -0.05, z=0.9 + (H - 1.1) / 2), M['midframe'])
# The logic board along the bottom, mostly under the lower section, its top edge showing.
inside = []
inside.append(kit.new_object('board', slab(kit.rounded_rect(4.7, 3.0, 0.1, 4), -0.05, 0.0, z=2.5), M['pcb']))
for x, z, w, h in ((-1.3, 3.35, 0.9, 0.7), (0.15, 3.3, 0.7, 0.7), (1.4, 3.45, 0.5, 0.4), (1.45, 2.95, 0.4, 0.3), (-0.35, 2.75, 0.5, 0.35)):
    inside.append(kit.new_object('chip', slab(kit.rounded_rect(w, h, 0.02, 1), 0.0, 0.06, z=z), M['chip']))
    inside[-1].location.x = x
inside.append(kit.new_object('shield', slab(kit.rounded_rect(2.6, 1.0, 0.05, 2), 0.0, 0.1, z=1.6), M['shield']))
kit.join('board', inside)
# The flex from the battery to the board, and its connector.
kit.new_object('flex', slab(kit.rounded_rect(0.7, 0.75, 0.05, 2), 0.0, 0.01, z=4.0), M['flex'])
kit.new_object('connector', slab(kit.rounded_rect(0.85, 0.3, 0.03, 2), 0.0, 0.07, z=3.65), M['chip'])

# The new battery: a plain pouch cell with a printed label and a strip of kapton tape over it.
BAT = (4.4, 5.3, 0.27, 6.85)  # width, height, thickness, centre height
cell = kit.new_object('battery', slab(kit.rounded_rect(BAT[0], BAT[1], 0.12, 6), -0.05, -0.05 + BAT[2], z=BAT[3]), M['cell'])
kit.bevel(cell, 0.04, 3)
kit.shade_smooth(cell, 40)
yt = -0.05 + BAT[2]  # its top face, towards the back
bparts = [cell]
bparts.append(kit.new_object('label', slab(kit.rounded_rect(3.6, 2.6, 0.06, 3), yt - 0.001, yt + 0.002, z=BAT[3] + 0.6), M['label']))
for i, (line, size) in enumerate((('Li-ion Polymer', 0.2), ('3.7V  1000mAh', 0.3), ('for Zune HD', 0.16))):
    bparts.append(flat_text('ink', line, size, M['ink'], location=(0, yt + 0.0025, BAT[3] + 1.45 - i * 0.5), facing='+Y'))
bparts.append(kit.new_object('kapton', slab(kit.rounded_rect(4.6, 0.75, 0.02, 1), yt - 0.002, yt + 0.006, z=BAT[3] - 1.55), M['kapton']))
battery = kit.join('battery', bparts)
kit.origin_to(battery, (0, -0.05, BAT[3]))

# --- Buttons on the edges --------------------------------------------------------------------
yb2 = (FRONT[1] + BAND[1]) / 2 - 0.02
bm = kit.prism(kit.rounded_rect(0.95, 0.2, 0.09, 6), H - 0.03, H + 0.03)
kit.transform(bm, translate=(1.35, yb2 + 0.02, 0))
power = kit.new_object('btn_power', bm, M['frame'])
kit.bevel(power, 0.015, 2)
kit.shade_smooth(power, 40)
kit.origin_to(power, (1.35, yb2, H))
power['press'] = 0.03
power['axis'] = 'z'

bm = kit.transform(kit.prism(kit.rounded_rect(1.15, 0.2, 0.09, 6), -0.03, 0.03), rotate=(90, 'Y'), translate=(-W / 2 + 0.002, yb2 + 0.02, 8.4))
media = kit.new_object('btn_media', bm, M['frame'])
kit.bevel(media, 0.015, 2)
kit.shade_smooth(media, 40)
kit.origin_to(media, (-W / 2, yb2, 8.4))
media['press'] = 0.025
media['axis'] = 'x'

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back'), samples=32)
