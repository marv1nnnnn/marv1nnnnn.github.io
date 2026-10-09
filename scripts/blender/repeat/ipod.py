"""The iPod classic, black, 160 GB (the thin 2009 one): anodised aluminium front, polished steel back,
the click wheel. His came from 闲鱼 with a new battery, so the back comes off: under it the drive,
the board, and the replacement cell.

    blender -b --python scripts/blender/repeat/ipod.py -- [out.glb] [preview.png]

Objects the page uses: screen, wheel (pressed at its edge: MENU, next, previous, play), btn_center,
back (the steel shell, origin at its middle; it comes off backwards: Blender +Y, glTF -Z), battery, hdd.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh  # noqa: E402

OUT, PREVIEW = kit.args('ipod')
kit.reset()

W, H, T = 6.18, 10.35, 1.05  # 61.8 x 103.5 x 10.5 mm (the 160 GB one)
R = 0.62  # corner radius, seen from the front
PLATE = 0.18  # the aluminium front is a plate set into the steel
WHEEL = (2.97, 1.97, 0.73)  # centre height, outer and centre-button radius
WIN = (5.42, 4.12, 7.42)  # screen window: width, height, centre height
SCREEN = (5.08, 3.81)  # the 2.5" panel, 320 x 240
FY = -T / 2  # the front face

M = {
    'steel': kit.material('steel', kit.srgb('#d9dadc'), rough=0.07, metal=1.0),
    'alu': kit.material('alu', kit.srgb('#26272a'), rough=0.42, metal=0.6),
    'wheel': kit.material('wheel', kit.srgb('#111214'), rough=0.36, metal=0.05),
    'print': kit.material('print', kit.srgb('#85878b'), rough=0.6),
    'drive': kit.material('drive', kit.srgb('#b9bcc0'), rough=0.32, metal=0.9),
    'pcb': kit.material('pcb', kit.srgb('#163a2a'), rough=0.55),
    'cell': kit.material('cell', kit.srgb('#2b2f36'), rough=0.4, metal=0.3),
    'sticker': kit.material('sticker', kit.srgb('#eceae4'), rough=0.8),
    'kapton': kit.material('kapton', kit.srgb('#d68a1c'), rough=0.35, alpha=0.85),
    'ink': kit.material('ink', kit.srgb('#1a1a1a'), rough=0.7),
    'bezel': kit.material('bezel', kit.srgb('#050506'), rough=0.2),
    'screen': kit.material('screen', kit.srgb('#101418'), rough=0.3, emission=kit.srgb('#2a3440'), strength=0.4),
    'glass': kit.material('glass', (1, 1, 1), rough=0.03, alpha=0.08),
    'black': kit.material('black', kit.srgb('#0c0c0d'), rough=0.6),
    'switch': kit.material('switch', kit.srgb('#1b1c1e'), rough=0.35),
}

# --- The steel back: wraps round the sides and rolls over hard at the back edge ------------------
bm = kit.prism(kit.rounded_rect(W, H, R, 12), FY + PLATE * 0.6, T / 2)
back = [e for e in bm.edges if all(v.co.z > T / 2 - 1e-4 for v in e.verts)]
bmesh.ops.bevel(bm, geom=back, offset=0.36, segments=8, affect='EDGES', profile=0.55)
kit.transform(bm, rotate=(90, 'X'), translate=(0, 0, H / 2))
# prism's z (thickness) went to -y: flip so the plate side is the front (-Y).
kit.transform(bm, rotate=(180, 'Z'))
shell = kit.new_object('back', bm, M['steel'])

# Headphone jack (right) and hold switch slot (left) on the top edge; dock slot on the bottom.
kit.cut(shell, kit.cutter(kit.cylinder(0.19, H - 0.6, H + 1, 32, x=1.75, y=0.02)))
kit.cut(shell, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(0.9, 0.34, 0.15), -1, 1), translate=(-1.6, 0.04, H))))
kit.cut(shell, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(2.1, 0.22, 0.1), -1, 0.2), translate=(0, 0.02, 0))))
kit.shade_smooth(shell, 40)
# What shows through the holes.
kit.new_object('jack', kit.cylinder(0.185, H - 0.55, H - 0.05, 32, x=1.75, y=0.02), M['black'])
kit.new_object('dock', kit.transform(kit.prism(kit.rounded_rect(2.08, 0.2, 0.09), 0.03, 0.12), translate=(0, 0.02, 0)), M['black'])
hold = kit.new_object('hold', kit.transform(kit.prism(kit.rounded_rect(0.32, 0.26, 0.1), H - 0.25, H + 0.02), translate=(-1.85, 0.04, 0)), M['switch'])
kit.bevel(hold, 0.03, 2)

# --- The aluminium front plate -----------------------------------------------------------------
bm = kit.prism(kit.rounded_rect(W - 0.04, H - 0.04, R - 0.02, 12), 0, PLATE)
kit.front(bm, FY + PLATE)
kit.transform(bm, translate=(0, 0, H / 2))
plate = kit.new_object('plate', bm, M['alu'])
kit.bevel(plate, 0.025, 2)
# The window and the wheel go right through the plate.
kit.cut(plate, kit.cutter(kit.transform(kit.front(kit.prism(kit.rounded_rect(WIN[0], WIN[1], 0.1), -1, 1)), translate=(0, 0, WIN[2]))))
kit.cut(plate, kit.cutter(kit.transform(kit.front(kit.prism(kit.circle(WHEEL[1] + 0.03, 96), -1, 1)), translate=(0, 0, WHEEL[0]))))
kit.shade_smooth(plate, 30)

# --- Window: black bezel, the panel, and the clear cover flush with the plate -----------------
bez = kit.new_object('bezel', kit.transform(kit.front(kit.prism(kit.rounded_rect(WIN[0], WIN[1], 0.1), 0, 0.1)), translate=(0, FY + PLATE + 0.02, WIN[2])), M['bezel'])
kit.quad('screen', SCREEN[0], SCREEN[1], M['screen'], location=(0, FY + PLATE - 0.085, WIN[2] + 0.06))
kit.quad('glass', WIN[0], WIN[1], M['glass'], location=(0, FY + 0.012, WIN[2]))

# Dark behind the gaps round the wheel and the centre button.
kit.new_object('gap', kit.transform(kit.front(kit.prism(kit.circle(WHEEL[1] + 0.05, 96), 0, 0.03)), translate=(0, FY + 0.198, WHEEL[0])), M['black'])

# --- The click wheel and its centre button ------------------------------------------------------
bm = kit.front(kit.prism(kit.circle(WHEEL[1], 128), 0, 0.16))
kit.transform(bm, translate=(0, FY + 0.16 + 0.005, 0))
wheel = kit.new_object('wheel', bm, M['wheel'])
kit.cut(wheel, kit.cutter(kit.front(kit.prism(kit.circle(WHEEL[2] + 0.03, 96), -1, 1))))
kit.bevel(wheel, 0.02, 2)
kit.shade_smooth(wheel, 30)
wheel.location = (0, 0, WHEEL[0])
wheel['press'] = 0.035

# The legends, printed grey on the wheel: MENU, next, previous, play/pause.
P = FY + 0.005  # on the wheel's face
legend = [kit.text_mesh('menu', 'MENU', 0.27, M['print'], location=(0, P, 1.47), bold=True, spacing=1.08)]


def tri(cx, cz, w, h, point):  # a triangle pointing +x (point=1) or -x (-1), flat on the face
    pts = [(-w / 2 * point, -h / 2), (w / 2 * point, 0), (-w / 2 * point, h / 2)]
    if point < 0:
        pts = list(reversed(pts))
    return kit.transform(kit.front(kit.prism(pts, 0, 0.004)), translate=(cx, P, cz))


def bar(cx, cz, w, h):
    return kit.transform(kit.front(kit.prism(kit.rounded_rect(w, h, 0.005, 1), 0, 0.004)), translate=(cx, P, cz))


g = 0.17  # glyph height
for side in (1, -1):  # next (right) and previous (left): two triangles and a bar
    x = 1.47 * side
    legend.append(kit.new_object('l', tri(x - 0.08 * side, 0, 0.16, g, side), M['print']))
    legend.append(kit.new_object('l', tri(x + 0.06 * side, 0, 0.16, g, side), M['print']))
    legend.append(kit.new_object('l', bar(x + 0.165 * side, 0, 0.035, g), M['print']))
legend.append(kit.new_object('l', tri(-0.12, -1.47, 0.16, g, 1), M['print']))
legend.append(kit.new_object('l', bar(0.05, -1.47, 0.035, g), M['print']))
legend.append(kit.new_object('l', bar(0.12, -1.47, 0.035, g), M['print']))
legend = kit.join('legend', legend)
legend.parent = wheel

bm = kit.front(kit.prism(kit.circle(WHEEL[2], 96), 0, 0.15))
kit.transform(bm, translate=(0, FY + 0.15 + 0.012, 0))
centre = kit.new_object('btn_center', bm, M['alu'])
kit.bevel(centre, 0.03, 3)
kit.shade_smooth(centre, 30)
centre.location = (0, 0, WHEEL[0])
centre['press'] = 0.03

# --- Inside, under the back: the board behind the screen, the 1.8" drive, the new cell ----------
IN = FY + PLATE + 0.04  # just behind the front plate
kit.new_object('board', kit.transform(kit.front(kit.prism(kit.rounded_rect(W - 0.5, 3.0, 0.1), 0, 0.08)), translate=(0, IN + 0.08, 8.3)), M['pcb'])
hdd = kit.new_object('hdd', kit.transform(kit.front(kit.prism(kit.rounded_rect(5.4, 5.6, 0.12), 0, 0.42)), translate=(0, IN + 0.6, 6.6)), M['drive'])
kit.bevel(hdd, 0.03, 2)
kit.new_object('hdd_label', kit.transform(kit.front(kit.prism(kit.rounded_rect(4.2, 3.0, 0.08), 0, 0.004)), translate=(0, IN + 0.604, 6.9)), M['sticker'])
kit.text_mesh('t1', '1.8" HDD', 0.32, M['ink'], location=(0, IN + 0.604, 7.6), facing='+Y', bold=True)
kit.text_mesh('t2', '160GB  ATA', 0.22, M['ink'], location=(0, IN + 0.604, 7.05), facing='+Y')
kit.text_mesh('t3', '3.3V  5V', 0.18, M['ink'], location=(0, IN + 0.604, 6.6), facing='+Y')
cell = kit.new_object('battery', kit.transform(kit.front(kit.prism(kit.rounded_rect(5.2, 3.0, 0.2), 0, 0.42)), translate=(0, IN + 0.6, 2.1)), M['cell'])
kit.bevel(cell, 0.06, 3)
kit.new_object('cell_label', kit.transform(kit.front(kit.prism(kit.rounded_rect(4.4, 1.9, 0.06), 0, 0.004)), translate=(0, IN + 0.604, 2.2)), M['sticker'])
kit.text_mesh('c1', 'Li-Polymer  3.7V', 0.26, M['ink'], location=(0, IN + 0.604, 2.55), facing='+Y', bold=True)
kit.text_mesh('c2', '更换电池', 0.3, M['ink'], location=(0, IN + 0.604, 1.95), facing='+Y', kind='cjk')
kit.new_object('tape', kit.transform(kit.front(kit.prism(kit.rounded_rect(0.9, 3.1, 0.02), 0, 0.006)), translate=(1.9, IN + 0.61, 2.1)), M['kapton'])
# the back's origin at its middle, so the page can lift it off
kit.origin_to(shell, (0, 0, H / 2))

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'back', 'front'))
