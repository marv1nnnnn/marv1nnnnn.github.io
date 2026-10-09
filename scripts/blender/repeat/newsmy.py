"""The 纽曼 Newman M520 (2005): a small pearl-white MP3 with a champagne metal face, a 1.5" colour
screen, and its keys inside an orange ring.

    blender -b --python scripts/blender/repeat/newsmy.py -- [out.glb] [preview.png]

Size: 42 x 62 x 13 mm, 35 g (ZOL and pconline). Laid out from the product photos, scaled to that
size (ZOL's 600 x 450 gallery shots are squashed; the 800 x 600 studio shot is not).

Objects the page uses:
- screen: the 1.5" panel, 2.4 x 3.0 cm. ZOL says 128 x 128, but the panel and its menus are portrait:
  draw it at 128 x 160.
- btn_play (the centre ▶II), btn_vol_down (−, top left), btn_prev (⏮, bottom left), btn_vol_up (+,
  top right), btn_next (⏭, bottom right): front keys, `press` into the body.
- btn_ab ("A-B/REC") and btn_menu ("MENU") on the right side: `press` with `axis` = '-x' (they go in
  towards -X, Blender's left).
- power: the OFF/ON slider on the right side, low down; it slides along Z (ON is up, where it sits).
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy  # noqa: E402
from mathutils import Matrix  # noqa: E402

OUT, PREVIEW = kit.args('newsmy')
kit.reset()

W, H, T = 4.2, 6.2, 1.3
FY, BY = -T / 2, T / 2  # front and back faces
PLATE = (3.88, 5.89, 3.125)  # the metal face: width, height, centre height
WIN = (2.95, 3.38, 4.11)  # screen window: width, height, centre height
RING = (3.1, 1.75, 1.095)  # the orange ring: outer width, height, centre height
PS = FY + 0.03  # the plate's surface, just below the white rim

M = {
    'shell': kit.material('shell', kit.srgb('#f3f1ec'), rough=0.22, coat=0.6),
    'plate': kit.material('plate', kit.srgb('#cbc4b9'), rough=0.3, metal=0.7),
    'frame': kit.material('frame', kit.srgb('#dedad4'), rough=0.2, metal=0.9),
    'window': kit.material('window', kit.srgb('#060708'), rough=0.08, coat=1.0),
    'screen': kit.material('screen', kit.srgb('#0c1014'), rough=0.3, emission=kit.srgb('#1d2a38'), strength=0.4),
    'orange': kit.material('orange', kit.srgb('#e2541b'), rough=0.28, coat=0.5),
    'key': kit.material('key', kit.srgb('#d6d8da'), rough=0.32, metal=0.35),
    'chrome': kit.material('chrome', kit.srgb('#e9e9ea'), rough=0.1, metal=1.0),
    'print': kit.material('print', kit.srgb('#7a7d81'), rough=0.6),
    'logo': kit.material('logo', kit.srgb('#f7f7f7'), rough=0.4),
    'side': kit.material('side', kit.srgb('#a9abad'), rough=0.35, metal=0.5),
    'rubber': kit.material('rubber', kit.srgb('#a3a6a8'), rough=0.75),
    'black': kit.material('black', kit.srgb('#0a0a0b'), rough=0.6),
    'label': kit.material('label', kit.srgb('#e9e9e6'), rough=0.5, metal=0.2),
    'ink': kit.material('ink', kit.srgb('#2b2d30'), rough=0.6),
}


def slab_front(w, h, r, y0, y1, cx=0.0, cz=0.0, seg=8):
    """A rounded rectangle seen from the front, from y0 (its front) back to y1."""
    bm = kit.prism(kit.rounded_rect(w, h, r, seg), 0, y1 - y0)
    kit.front(bm, y1)
    return kit.transform(bm, translate=(cx, 0, cz))


def slab(u, v, r, d, origin, U, V, N, seg=6):
    """A rounded u x v rectangle in the plane of axes U, V, d deep along N from `origin`."""
    bm = kit.prism(kit.rounded_rect(u, v, r, seg), 0, d)
    m = Matrix(((U[0], V[0], N[0]), (U[1], V[1], N[1]), (U[2], V[2], N[2])))
    bmesh.ops.transform(bm, matrix=m.to_4x4(), verts=bm.verts)
    if m.determinant() < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bmesh.ops.translate(bm, verts=bm.verts, vec=origin)
    return bm


def text(name, body, size, mat, location=(0, 0, 0), align='CENTER', kind='sans', font=None, weight=500, res=4, parent=None):
    """Flat printed lettering facing the front (-Y), a hair in front of `location`. Unlike
    kit.text_mesh it takes a font file (the logo's bold italic) and draws curves coarsely, since
    print this small needs few points. `weight` picks the Chinese face (500, 700 or 900)."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.resolution_u = res
    f = bpy.data.fonts.load(font, check_existing=True) if font else kit.font(kind, weight)
    curve.size = size * (kit.em(f) if f and 'cjk' in kind else 1)
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
    ob.name = name
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    ob.data.transform(Matrix.Rotation(math.radians(90), 4, 'X'))
    ob.location = (location[0], location[1] - 0.002, location[2])
    if parent:
        ob.parent = parent
    return ob


BOLD_ITALIC = os.popen("fc-match -f '%{file}' 'TeX Gyre Heros:bold:italic'").read().strip() or None


def side_text(name, body, size, mat, location, parent=None):
    """Lettering on the right side, running up it (read with the head turned left)."""
    ob = text(name, body, size, mat, res=3)
    ob.data.transform(Matrix.Rotation(math.radians(90), 4, 'Z') @ Matrix.Rotation(math.radians(-90), 4, 'Y'))
    ob.location = (location[0] + 0.002, location[1], location[2])
    if parent:
        ob.parent = parent
    return ob


def rrect(w, h, radii, seg=6):
    """A w x h rectangle with its own radius at each corner: top right, top left, bottom left, bottom right."""
    pts = []
    for (sx, sy, a0), r in zip(((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)), radii):
        cx, cy = sx * (w / 2 - r), sy * (h / 2 - r)
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


# --- The white shell: rounded hard at the back, softly at the front --------------------------------
bm = kit.prism(kit.rounded_rect(W, H, 0.45, 12), 0, T)
back = [e for e in bm.edges if all(abs(v.co.z) < 1e-4 for v in e.verts)]
bmesh.ops.bevel(bm, geom=back, offset=0.32, segments=8, affect='EDGES', profile=0.55)
fr = [e for e in bm.edges if all(abs(v.co.z - T) < 1e-4 for v in e.verts)]
bmesh.ops.bevel(bm, geom=fr, offset=0.1, segments=5, affect='EDGES', profile=0.55)
kit.front(bm, BY)
kit.transform(bm, translate=(0, 0, H / 2))
shell = kit.new_object('shell', bm, M['shell'])
# The pocket the metal face sits in.
kit.cut(shell, kit.cutter(slab_front(PLATE[0] + 0.02, PLATE[1] + 0.02, 0.32, FY - 0.2, PS + 0.1, cz=PLATE[2])))
# Side keys and the slider sit in recesses on the right side.
X = W / 2
RIGHT = ((0, 0, 1), (0, -1, 0), (1, 0, 0))  # along Z, across Y, out of the right side
for zc, length in ((4.26, 0.96), (3.15, 1.0), (0.85, 1.0)):
    kit.cut(shell, kit.cutter(slab(length + 0.06, 0.5, 0.24, 0.4, (X - 0.12, -0.1, zc), *RIGHT)))
# Top edge: the headphone jack (left), a lanyard slot (middle), the mini-USB under its cover (right).
kit.cut(shell, kit.cutter(kit.cylinder(0.19, H - 0.9, H + 1, 32, x=-0.92, y=-0.08)))
kit.cut(shell, kit.cutter(kit.transform(kit.prism(kit.rounded_rect(1.0, 0.46, 0.08, 4), H - 0.08, H + 1), translate=(0.76, -0.08, 0))))
kit.shade_smooth(shell, 40)

kit.new_object('jack', kit.cylinder(0.185, H - 0.85, H - 0.1, 32, x=-0.92, y=-0.08), M['black'])
kit.new_object('usb', kit.transform(kit.prism(kit.rounded_rect(0.97, 0.43, 0.07, 4), H - 0.08, H + 0.03), translate=(0.76, -0.08, 0)), M['rubber'])
loop = kit.new_object('loop', kit.transform(kit.prism(kit.rounded_rect(0.36, 0.16, 0.05, 3), H - 0.05, H + 0.06), translate=(0.0, 0.0, 0)), M['shell'])
# The headphone sign moulded above the jack.

# --- The metal face ------------------------------------------------------------------------------
plate = kit.new_object('plate', slab_front(PLATE[0], PLATE[1], 0.3, PS, PS + 0.1, cz=PLATE[2]), M['plate'])
kit.cut(plate, kit.cutter(slab_front(WIN[0], WIN[1], 0.1, PS - 1, PS + 1, cz=WIN[2])))
inner = (RING[0] - 0.26, RING[1] - 0.26)
kit.cut(plate, kit.cutter(slab_front(inner[0], inner[1], 0.3, PS - 1, PS + 1, cz=RING[2])))
kit.bevel(plate, 0.015, 2)
kit.shade_smooth(plate, 30)

# The light chamfered frame round the window, the black glass inside it, the panel under the glass.
frame = kit.new_object('frame', slab_front(WIN[0] + 0.2, WIN[1] + 0.2, 0.16, PS - 0.012, PS + 0.02, cz=WIN[2], seg=4), M['frame'])
kit.cut(frame, kit.cutter(slab_front(WIN[0], WIN[1], 0.1, PS - 1, PS + 1, cz=WIN[2], seg=4)))
kit.bevel(frame, 0.01, 2)
kit.new_object('window', slab_front(WIN[0] + 0.02, WIN[1] + 0.02, 0.1, PS + 0.04, PS + 0.1, cz=WIN[2]), M['window'])
kit.quad('screen', 2.55, 3.1, M['screen'], location=(0, PS + 0.038, WIN[2]))

# The orange ring, standing a little proud of the face, and the dark well the keys sit in.
ring = kit.new_object('ring', slab_front(RING[0], RING[1], 0.42, PS - 0.025, PS + 0.06, cz=RING[2], seg=7), M['orange'])
kit.cut(ring, kit.cutter(slab_front(inner[0], inner[1], 0.3, PS - 1, PS + 1, cz=RING[2], seg=6)))
kit.bevel(ring, 0.012, 2)
kit.new_object('well', slab_front(inner[0] + 0.04, inner[1] + 0.04, 0.3, PS + 0.085, PS + 0.099, cz=RING[2]), M['black'])

# Logo: "Newman" in a heavy slanted face, then 纽曼.
logo_z = 2.2
text('newman', 'Newman', 0.38, M['logo'], location=(0.38, PS, logo_z), align='RIGHT', font=BOLD_ITALIC, res=6)
text('zh', '纽曼', 0.36, M['logo'], location=(0.5, PS, logo_z + 0.01), align='LEFT', kind='cjk', weight=900, res=4)

# --- The keypad ----------------------------------------------------------------------------------
KY = PS - 0.035  # the keys' faces
KZ = RING[2]
g = 0.035  # gap between keys
cw = 0.8  # centre key
kw = (inner[0] - cw) / 2 - 2 * g  # each side key's width
kh = (inner[1] - 3 * g) / 2
legend = []


def key(name, cx, cz, w, h, radii):
    """A quarter of the keypad: its outer corner follows the ring, the others are tight."""
    bm = kit.prism(rrect(w, h, radii), 0, 0.15)
    kit.front(bm, KY + 0.15)
    kit.transform(bm, translate=(cx, 0, cz))
    ob = kit.new_object(name, bm, M['key'])
    kit.bevel(ob, 0.02, 2)
    kit.shade_smooth(ob, 30)
    ob['press'] = 0.05
    return ob


def bar(cx, cz, w, h, parent):
    o = kit.new_object('l', slab_front(w, h, min(w, h) * 0.2, KY - 0.004, KY, cx=cx, cz=cz, seg=2), M['print'])
    o.parent = parent
    return o


def tri(cx, cz, w, h, point, parent):
    pts = [(-w / 2 * point, -h / 2), (w / 2 * point, 0), (-w / 2 * point, h / 2)]
    if point < 0:
        pts = list(reversed(pts))
    bm = kit.prism(pts, 0, 0.004)
    kit.front(bm, KY)
    kit.transform(bm, translate=(cx, 0, cz))
    o = kit.new_object('l', bm, M['print'])
    o.parent = parent
    return o


xs = cw / 2 + g + kw / 2
top, bot = KZ + kh / 2 + g / 2, KZ - kh / 2 - g / 2
k = key('btn_vol_down', -xs, top, kw, kh, (0.06, 0.26, 0.06, 0.06))
bar(-xs - 0.12, top, 0.16, 0.035, k)
k = key('btn_vol_up', xs, top, kw, kh, (0.26, 0.06, 0.06, 0.06))
bar(xs + 0.12, top, 0.16, 0.035, k)
bar(xs + 0.12, top, 0.035, 0.16, k)
k = key('btn_prev', -xs, bot, kw, kh, (0.06, 0.06, 0.26, 0.06))
tri(-xs - 0.17, bot, 0.12, 0.13, -1, k)
tri(-xs - 0.07, bot, 0.12, 0.13, -1, k)
bar(-xs - 0.25, bot, 0.025, 0.13, k)
k = key('btn_next', xs, bot, kw, kh, (0.06, 0.06, 0.06, 0.26))
tri(xs + 0.07, bot, 0.12, 0.13, 1, k)
tri(xs + 0.17, bot, 0.12, 0.13, 1, k)
bar(xs + 0.25, bot, 0.025, 0.13, k)

# The centre key: a chrome rim round a raised grey face with ▶II on it.
play = kit.new_object('btn_play', slab_front(cw, 0.88, 0.13, KY - 0.035, KY + 0.15, cz=KZ), M['chrome'])
kit.bevel(play, 0.025, 3)
kit.shade_smooth(play, 30)
play['press'] = 0.06
top_face = kit.new_object('play_face', slab_front(cw - 0.14, 0.74, 0.08, KY - 0.045, KY - 0.03, cz=KZ), M['key'])
top_face.parent = play
tri(-0.08, KZ, 0.13, 0.14, 1, play).location.y -= 0.045
bar(0.06, KZ, 0.025, 0.14, play).location.y -= 0.045
bar(0.11, KZ, 0.025, 0.14, play).location.y -= 0.045

# --- Right side: A-B/REC and MENU keys, the OFF/ON slider ------------------------------------------
for name, zc, length, legend_text in (('btn_ab', 4.26, 0.92, 'A-B/REC'), ('btn_menu', 3.15, 0.96, 'MENU')):
    ob = kit.new_object(name, slab(length, 0.42, 0.2, 0.18, (X - 0.12, -0.1, zc), *RIGHT), M['side'])
    kit.bevel(ob, 0.03, 3)
    kit.shade_smooth(ob, 30)
    ob['press'] = 0.04
    ob['axis'] = '-x'
    side_text(name + '_t', legend_text, 0.1, M['ink'], (X + 0.06, -0.1, zc), parent=ob)
kit.new_object('track', slab(0.96, 0.42, 0.2, 0.06, (X - 0.12, -0.1, 0.85), *RIGHT), M['black'])
power = kit.new_object('power', slab(0.38, 0.3, 0.12, 0.17, (X - 0.12, -0.1, 0.0), *RIGHT), M['side'])
kit.bevel(power, 0.03, 3)
kit.shade_smooth(power, 30)
power.location.z = 1.1  # ON; OFF is 0.6
side_text('off', 'OFF', 0.075, M['print'], (X + 0.005, 0.2, 0.55))
side_text('on', 'ON', 0.075, M['print'], (X + 0.005, 0.2, 1.17))

# --- Back: the sticker and two screws ------------------------------------------------------------
kit.quad('label', 3.1, 1.55, M['label'], location=(0, BY + 0.002, 3.3), facing='+Y')
for i, (body, size, z, kind) in enumerate((('纽曼 影音王', 0.17, 3.72, 'cjk'), ('Model: M520-256M', 0.11, 3.38, 'sans'), ('http://www.usb-mp3.com', 0.1, 2.9, 'sans'))):
    ob = text(f'lbl{i}', body, size, M['ink'], kind=kind, weight=700, res=3)
    ob.data.transform(Matrix.Rotation(math.pi, 4, 'Z'))  # face the back
    ob.location = (0, BY + 0.003, z)
for x in (-1.62, 1.62):
    kit.new_object('screw', kit.transform(kit.cylinder(0.06, 0, 0.01, 16), rotate=(-90, 'X'), translate=(x, BY + 0.001, 0.42)), M['black'])

kit.export(OUT)
if PREVIEW:
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'back'), samples=32)
