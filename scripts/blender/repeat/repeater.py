"""步步高 变速王 BK-898 (silver), the 480-second language repeater: the cassette goes in behind the
upper door, the transport keys are on the top edge, the repeater's own keys, LCD and speaker on the
lower front.

    blender -b --python scripts/blender/repeat/repeater.py -- [out.glb] [preview.png] [--open]

Chinese print needs static Noto Sans SC (NotoSansSC-500/700/900.ttf, overlaps removed) in
scripts/blender/repeat/fonts/ or $REPEAT_CJK_FONTS; without them it falls back to the system's variable
Noto CJK, which Blender reads as a Thin master with broken fills. --open renders the preview with the
door swung open and the site's cassette in its slot.

Sizes are read off a straight-on photo (scratchpad candidates/repeater/BK-898-1.jpg) scaled so a
compact cassette (10.04 x 6.38) fits behind the door: 11.6 wide, 13.7 tall, 3.0 deep.

Objects the page uses (glTF/three frame: x right, y up, z out of the front):
- door: the whole upper front, hinged on its bottom edge (origin on the hinge). door.rotation.x = +0.5
  swings its top out towards the viewer. Its window pane is `doorWindow` (a child).
- cassette_slot: an empty at the centre of the cassette in its well. Parent public/models/cassette.glb's
  scene to it with rotation.x = +PI/2 (as cassette3d.ts does): its face then looks out through the
  window and its label side is up. Hide the cassette's `pencil`.
- spindleL, spindleR: the reel spindles under the cassette's hubs; they spin about their local z.
- Top-edge keys (press down, axis 'z'): key_rec, key_play, key_stop (front row), key_rew, key_ff.
- Front keys (press in): btn_speed 变速, btn_ab 复读, btn_auto 放音/自动, btn_back 快退, btn_forward 快进,
  btn_compare 对比, btn_follow 跟读/高保真.
- screen: the LCD (3.38 x 1.51 cm) under `lcdglass`.
- volume: the thumbwheel on the right side, origin on its axle (turns about its local z).
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import kit  # noqa: E402
from kit import bmesh, bpy, Matrix  # noqa: E402

OUT, PREVIEW = kit.args('repeater')
kit.reset()

W, H, T = 11.6, 13.7, 3.0
FY = -T / 2  # the front face
SEAM = 5.96  # where the door meets the lower panel
DOOR_T = 0.32
CASSETTE = (0.1, 8.9)  # its centre (x, z); its hubs sit 0.3 above that, 2.1 either side
WELL_BACK = 0.35

M = {
    'body': kit.material('body', kit.srgb('#c2c5c9'), rough=0.38, metal=0.4),
    'panel': kit.material('panel', kit.srgb('#cdd0d3'), rough=0.34, metal=0.38),
    'disc': kit.material('disc', kit.srgb('#dcdee0'), rough=0.28, metal=0.35),
    'arc': kit.material('arc', kit.srgb('#d8cba3'), rough=0.3, metal=0.6),
    'chrome': kit.material('chrome', kit.srgb('#e4e6e9'), rough=0.1, metal=1.0),
    'gap': kit.material('gap', kit.srgb('#2a2c30'), rough=0.6),
    'floor': kit.material('floor', kit.srgb('#7a7d82'), rough=0.5, metal=0.3),
    'print': kit.material('print', kit.srgb('#2f323a'), rough=0.55),
    'logo': kit.material('logo', kit.srgb('#2a2d38'), rough=0.45),
    'navy': kit.material('navy', kit.srgb('#14275a'), rough=0.35, coat=0.5),
    'red': kit.material('red', kit.srgb('#d2282a'), rough=0.35, coat=0.5),
    'green': kit.material('green', kit.srgb('#7fd23a'), rough=0.35, coat=0.5),
    'bezel': kit.material('bezel', kit.srgb('#0b0c0e'), rough=0.14, coat=0.8),
    'screen': kit.material('screen', kit.srgb('#9aa392'), rough=0.5),
    'glass': kit.material('glass', (1, 1, 1), rough=0.03, alpha=0.1),
    'pane': kit.material('pane', kit.srgb('#3a4048'), rough=0.05, alpha=0.32),
    'well': kit.material('well', kit.srgb('#151517'), rough=0.75),
    'hole': kit.material('hole', kit.srgb('#08080a'), rough=0.9),
    'spindle': kit.material('spindle', kit.srgb('#e8e5dc'), rough=0.4),
    'rubber': kit.material('rubber', kit.srgb('#141416'), rough=0.85),
    'sticker': kit.material('sticker', kit.srgb('#eceae2'), rough=0.7),
    'screw': kit.material('screw', kit.srgb('#c9cbcf'), rough=0.25, metal=1.0),
}


def rrect(w, h, r_top, r_bottom, seg=8):
    """A rectangle (centred) with its own corner radius at the top and at the bottom."""
    pts = []
    for cx, cy, r, a0 in ((w / 2 - r_top, h / 2 - r_top, r_top, 0), (-w / 2 + r_top, h / 2 - r_top, r_top, 90),
                          (-w / 2 + r_bottom, -h / 2 + r_bottom, r_bottom, 180), (w / 2 - r_bottom, -h / 2 + r_bottom, r_bottom, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def ellipse(cx, cz, rx, rz, seg=96):
    return [(cx + rx * math.cos(2 * math.pi * i / seg), cz + rz * math.sin(2 * math.pi * i / seg)) for i in range(seg)]


def slab(pts, y0, y1):
    """An outline in (x, z) standing as a slab between y0 (front, more negative) and y1."""
    bm = kit.prism(pts, -y1, -y0)  # prism along z; kit.front turns z into -y
    return kit.front(bm)


def bevel_edges(bm, pick, offset, segments=4):
    edges = [e for e in bm.edges if pick(e)]
    bmesh.ops.bevel(bm, geom=edges, offset=offset, segments=segments, affect='EDGES', profile=0.5)
    return bm


def cut(ob, bm, union=False, transfer=None):
    """Boolean with a cutter mesh; `transfer` gives the new faces that material."""
    c = kit.new_object('cutter', bm, transfer or M['body'])
    mod = ob.modifiers.new('b', 'BOOLEAN')
    mod.object = c
    mod.operation = 'UNION' if union else 'DIFFERENCE'
    mod.solver = 'EXACT'
    if transfer:
        if transfer.name not in ob.data.materials:
            ob.data.materials.append(transfer)
        mod.material_mode = 'TRANSFER'
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(c)


# The system's Noto CJK is a variable font, which Blender reads as its Thin master with broken fills.
# Static Noto Sans SC (OFL) with its overlaps removed prints properly: looked for here, then in
# $REPEAT_CJK_FONTS; without it the lettering falls back to kit's font, thickened by outsetting.
FONT_DIRS = [os.path.join(os.path.dirname(__file__), 'fonts'), os.environ.get('REPEAT_CJK_FONTS', '')]
_cjk = {}


def cjk(weight):
    """(font, scale) for static Noto Sans SC at `weight`, scaled so 高 stands 0.88 x size; None if absent."""
    if weight not in _cjk:
        _cjk[weight] = None
        for d in FONT_DIRS:
            path = os.path.join(d, f'NotoSansSC-{weight}.ttf') if d else ''
            if path and os.path.exists(path):
                f = bpy.data.fonts.load(path, check_existing=True)
                c = bpy.data.curves.new('em', 'FONT')
                c.body, c.font = '高', f
                ob = bpy.data.objects.new('em', c)
                bpy.context.scene.collection.objects.link(ob)
                bpy.context.view_layer.update()
                h = ob.dimensions.y
                bpy.data.objects.remove(ob)
                _cjk[weight] = (f, 0.88 / h if h > 1e-6 else 1.0)
                break
    return _cjk[weight]


def text(name, body, size, mat, x, z, y=FY, kind='cjk', align='CENTER', heavy=0.0, shear=0.0, spacing=1.0, depth=0.0, turn=0, res=2, bold=0.0, weight=500, up=False):
    """Printed lettering on a face: flat (or `depth` thick) a hair out from the face at y, optionally
    sheared into italic and turned about z (turn=90 faces +X, -90 faces -X). Chinese is set in static
    Noto Sans SC at `weight` when it is there; `bold` thickens only the fallback."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.size = size
    curve.align_x = align
    curve.align_y = 'CENTER'
    curve.extrude = depth / 2
    curve.space_character = spacing
    curve.resolution_u = res
    curve.offset = heavy  # only for Latin: offsetting the variable CJK outlines tears them
    static_cjk = cjk(weight) if kind == 'cjk' else None
    if static_cjk:
        curve.font, curve.size = static_cjk[0], size * static_cjk[1]
        bold = 0.0
    else:
        f = kit.font(kind)
        if f:
            curve.font = f
            if 'cjk' in kind:
                curve.size = size * kit.em(f)
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
    if bold:  # the only CJK face here is a Thin one: grow each glyph outward instead
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bmesh.ops.inset_region(bm, faces=[f for f in bm.faces if f.normal.z > 0.5], thickness=bold, use_outset=True, use_even_offset=True)
        bm.to_mesh(ob.data)
        bm.free()
    for v in ob.data.vertices:
        v.co.z += depth / 2 + 0.002
        v.co.x += shear * v.co.y
    if not up:  # up: left lying on a top face, reading from the front
        ob.data.transform(Matrix.Rotation(math.radians(90), 4, 'X'))
    if turn:
        ob.data.transform(Matrix.Rotation(math.radians(turn), 4, 'Z'))
    ob.location = (x, y, z)
    return ob


def bake(ob):
    """Apply an object's location into its mesh, so it can be joined without moving."""
    ob.data.transform(Matrix.Translation(ob.location))
    ob.location = (0, 0, 0)
    return ob


# --- Body: a moulded silver shell, soft at the back --------------------------------------------
outline = [(x, z + H / 2) for x, z in rrect(W, H, 0.62, 0.42, 6)]
bm = kit.prism(outline, -T / 2, T / 2)  # z here becomes -y: z = +T/2 is the front
bevel_edges(bm, lambda e: all(v.co.z < -T / 2 + 1e-4 for v in e.verts), 0.55, 4)  # the back rolls over
bevel_edges(bm, lambda e: all(v.co.z > T / 2 - 1e-4 for v in e.verts), 0.12, 3)
kit.front(bm)
body = kit.new_object('body', bm, M['body'])

# The door sits in a pocket across the upper front; behind it, the well the cassette stands in.
door_pts = [(x, z + (SEAM + (H - 0.22)) / 2) for x, z in rrect(W - 0.56, H - 0.22 - SEAM, 0.5, 0.06, 8)]
cut(body, slab(door_pts, FY - 1, FY + DOOR_T + 0.002))
well = [(x + CASSETTE[0], z + CASSETTE[1] + 0.15) for x, z in kit.rounded_rect(10.62, 7.0, 0.3)]
cut(body, slab(well, FY + DOOR_T - 0.01, WELL_BACK), transfer=M['well'])
# The key well on the top edge, the jacks on the right side, DC in and the time switch on the left.
KEYS_X = -0.8
cut(body, kit.transform(kit.prism(kit.rounded_rect(4.5, 1.95, 0.15), H - 0.16, H + 1), translate=(KEYS_X, -0.12, 0)), transfer=M['floor'])
for z in (4.15, 5.05):
    cut(body, kit.transform(kit.cylinder(0.19, -0.6, 0.6, 24), rotate=(90, 'Y'), translate=(W / 2, 0.25, z)), transfer=M['hole'])
cut(body, kit.transform(kit.cylinder(0.24, -0.6, 0.6, 24), rotate=(90, 'Y'), translate=(-W / 2, 0.25, 4.2)), transfer=M['hole'])
cut(body, kit.transform(kit.prism(kit.rounded_rect(0.9, 0.32, 0.12), -0.6, 0.6), rotate=(90, 'Y'), translate=(-W / 2, 0.25, 2.9)), transfer=M['hole'])
cut(body, kit.transform(kit.cylinder(0.05, -0.5, 0.5, 12), translate=(-4.6, -0.6, H)), transfer=M['hole'])  # the mic on top

static = []  # parts that never move, joined into the body at the end

# Spindles in the well, under the cassette's hubs.
for name, sx in (('spindleL', -2.1), ('spindleR', 2.1)):
    x, z = CASSETTE[0] + sx, CASSETTE[1] + 0.3
    bm = kit.cylinder(0.37, 0, 1.0, 24)
    for k in range(6):
        a = 2 * math.pi * k / 6
        bm2 = kit.prism(kit.rounded_rect(0.16, 0.12, 0.03, 2), 0, 0.75)
        kit.transform(bm2, rotate=(math.degrees(a), 'Z'), translate=(0.4 * math.cos(a), 0.4 * math.sin(a), 0))
        tmp = kit.new_object('t', bm2, M['spindle'])
        bake(tmp)
        bm.from_mesh(tmp.data)
        bpy.data.objects.remove(tmp)
    kit.transform(bm, rotate=(90, 'X'), translate=(x, WELL_BACK, z))  # z (0..1) becomes -y: it reaches out of the back wall
    sp = kit.new_object(name, bm, M['spindle'])
    kit.origin_to(sp, (x, WELL_BACK - 0.5, z))

slot = kit.empty('cassette_slot', location=(CASSETTE[0], FY + DOOR_T + 0.08 + 0.6, CASSETTE[1]))

# --- The door -----------------------------------------------------------------------------------
door = kit.new_object('door', slab(door_pts, FY, FY + DOOR_T), M['panel'])
kit.bevel(door, 0.07, 3, 60)


def chaikin(pts, rounds=2, keep=()):
    """Round off a closed polygon's corners; points whose index is in `keep` stay sharp."""
    tagged = [(p, i in keep) for i, p in enumerate(pts)]
    for _ in range(rounds):
        out = []
        for i, (p, sharp) in enumerate(tagged):
            q, _s = tagged[(i + 1) % len(tagged)]
            if sharp:
                out.append((p, True))
            out.append(((0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]), False))
            out.append(((0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]), False))
        tagged = out
    return [p for p, _s in tagged]


def px(cx, cy):
    """A point traced on the reference photo (cropped at 560,150; 82 px to the cm) to the face's (x, z)."""
    return ((cx - 395) / 82, H - (cy + 20) / 82)


# The raised disc, and the crescent window cut through it and the door.
outer = [px(*p) for p in ((185, 492), (230, 500), (300, 505), (380, 506), (450, 500), (510, 484), (560, 460), (604, 424), (636, 382), (656, 334), (667, 280), (668, 238), (664, 215))]
inner = [px(*p) for p in ((652, 236), (626, 276), (592, 312), (552, 340), (512, 358), (480, 368), (452, 370), (428, 372), (410, 380), (396, 394), (384, 412), (368, 428), (330, 441), (276, 458), (222, 476))]
crescent = chaikin(outer + inner, 2, keep=(0, len(outer) - 1))
over = [px(*p) for p in ((652, 182), (624, 146), (588, 118), (540, 98), (470, 84), (400, 81), (330, 89), (262, 110), (204, 146), (162, 196), (136, 258), (128, 322), (134, 390), (152, 448))]
disc = kit.new_object('disc', slab(chaikin(outer + over, 2), FY - 0.15, FY + 0.05), M['disc'])
kit.bevel(disc, 0.13, 3, 50)
cut(door, slab(crescent, FY - 1, FY + 1))
cut(disc, slab(crescent, FY - 1, FY + 1))
pane = kit.new_object('doorWindow', slab(crescent, FY + DOOR_T - 0.05, FY + DOOR_T - 0.01), M['pane'])

# The champagne C on the disc: open to the lower right, rounded at its upper end, cut flat below.
C = (0.12, 9.31)
ro, ri = (1.74, 1.46), (1.29, 1.04)
a0, a1 = math.radians(24), math.radians(262)
n = 32
arc = [(C[0] + ro[0] * math.cos(a0 + (a1 - a0) * i / n), C[1] + ro[1] * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
arc += [(C[0] + ri[0] * math.cos(a1 - (a1 - a0) * i / n), C[1] + ri[1] * math.sin(a1 - (a1 - a0) * i / n)) for i in range(n + 1)]
# the round end at the top: a half circle from the inner edge to the outer, bulging clockwise
mid = (C[0] + (ro[0] + ri[0]) / 2 * math.cos(a0), C[1] + (ro[1] + ri[1]) / 2 * math.sin(a0))
cap_r = math.hypot((ro[0] - ri[0]) * math.cos(a0), (ro[1] - ri[1]) * math.sin(a0)) / 2
nrm, tan = (math.cos(a0), math.sin(a0)), (math.sin(a0), -math.cos(a0))
arc += [(mid[0] + cap_r * (math.cos(t) * nrm[0] + math.sin(t) * tan[0]), mid[1] + cap_r * (math.cos(t) * nrm[1] + math.sin(t) * tan[1])) for t in (math.pi - math.pi * k / 10 for k in range(1, 10))]
c_arc = kit.new_object('arc', slab(arc, FY - 0.165, FY - 0.1), M['arc'])
kit.bevel(c_arc, 0.025, 2, 50)

# The arc of little dots round the disc.
dots = []
for p in ((88, 385), (100, 318), (127, 248), (168, 188), (220, 135), (278, 96), (345, 66), (413, 48), (488, 44), (562, 51), (632, 73)):
    x, z = px(*p)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=4, radius=0.08)
    kit.transform(bm, scale=(1, 0.6, 1), translate=(x, FY, z))
    dots.append(kit.new_object('dot', bm, M['chrome']))

prints = [
    text('logo', '步步高', 0.74, M['logo'], -3.02, 12.86, bold=0.05, shear=0.3, spacing=0.94, weight=900),
    text('model', 'BK-898', 0.36, M['print'], 4.88, 6.83, kind='sans', align='RIGHT', spacing=1.05),
]


def run(parts, right, z, gap=0.02):
    """Pieces of one printed line in their own weights, set leftwards from `right`."""
    obs, x = [], right
    for body_, size, weight in reversed(parts):
        ob = text('run', body_, size, M['print'], 0, z, align='LEFT', weight=weight)
        bpy.context.view_layer.update()
        w = ob.dimensions.x
        x -= w
        ob.location.x = x
        x -= gap
        obs.append(ob)
    return obs


prints += run((('480', 0.44, 500), ('秒', 0.46, 900), ('语言复读机', 0.44, 500)), 4.88, 6.33)
# The 变速王 badge: a navy slanted plate, a red ring, the name in green.
bx, bz = -4.08, 6.69
badge = [(bx + x + 0.22 * z, bz + z) for x, z in kit.rounded_rect(2.2, 1.12, 0.22)]
plate = kit.new_object('badge', slab(badge, FY - 0.012, FY + 0.01), M['navy'])
ring_o, ring_i = ellipse(bx - 0.1, bz, 0.62, 0.5, 40), ellipse(bx - 0.1, bz, 0.48, 0.37, 40)
ring = kit.new_object('ring', slab(ring_o, FY - 0.02, FY - 0.01), M['red'])
cut(ring, slab(ring_i, FY - 1, FY + 1))
cut(ring, slab([(bx - 0.75, bz - 0.12), (bx + 0.6, bz - 0.12), (bx + 0.6, bz + 0.12), (bx - 0.75, bz + 0.12)], FY - 1, FY + 1))
badge_text = text('badgeText', '变速王', 0.6, M['green'], bx + 0.04, bz - 0.02, y=FY - 0.02, bold=0.035, shear=0.25, spacing=0.92, weight=900)

door = kit.join('door', [door, disc, c_arc, plate, ring, badge_text, *dots, *prints])
kit.shade_smooth(door, 40)
kit.origin_to(door, (0, FY + 0.16, SEAM))
pane.data.transform(Matrix.Translation(-door.location))
pane.parent = door

# --- Lower panel: speaker, keys, LCD --------------------------------------------------------------
holes = []
gx, gz, step = -2.93, 2.97, 0.373
for i in range(12):
    for j in range(12):
        x, z = gx + (i - 5.5) * step, gz + (j - 5.5) * step
        d = math.hypot((i - 5.5) / 6, (j - 5.5) / 6)
        if d > 1.02:
            continue
        r = 0.1 * (1 - 0.55 * d * d)
        bm = bmesh.new()
        bm.faces.new([bm.verts.new((px_, FY - 0.002, pz)) for px_, pz in reversed(kit.circle(r, 8, x, z))])
        holes.append(kit.new_object('h', bm, M['hole']))
static.append(kit.join('grille', holes))

# LCD: a glossy black bezel, a silver frame, the panel and its glass.
LX, LZ = 2.35, 3.0
bez = kit.new_object('bezel', slab([(x + 2.38, z + LZ) for x, z in kit.rounded_rect(5.0, 2.0, 0.5)], FY - 0.07, FY + 0.02), M['bezel'])
kit.bevel(bez, 0.03, 2, 50)
cut(bez, slab([(x + LX, z + LZ) for x, z in kit.rounded_rect(3.42, 1.55, 0.08)], FY - 1, FY - 0.03))
frame = kit.new_object('frame', slab([(x + LX, z + LZ) for x, z in kit.rounded_rect(3.66, 1.76, 0.14)], FY - 0.085, FY - 0.06), M['chrome'])
cut(frame, slab([(x + LX, z + LZ) for x, z in kit.rounded_rect(3.42, 1.55, 0.08)], FY - 1, FY + 1))
static += [bez, frame]
kit.quad('screen', 3.38, 1.51, M['screen'], location=(LX, FY - 0.035, LZ))
kit.quad('lcdglass', 3.42, 1.55, M['glass'], location=(LX, FY - 0.072, LZ))


def pill(name, x, z, w, h, legend, legend_z):
    """A chrome capsule key in a dark gap, its legend printed above or below it."""
    static.append(kit.new_object('g', slab([(px_ + x, pz + z) for px_, pz in kit.rounded_rect(w + 0.1, h + 0.1, (h + 0.1) / 2, 5)], FY - 0.004, FY + 0.05), M['gap']))
    ob = kit.new_object(name, slab([(px_ + x, pz + z) for px_, pz in kit.rounded_rect(w, h, h / 2, 5)], FY - 0.17, FY + 0.05), M['chrome'])
    kit.bevel(ob, min(0.08, h * 0.2), 2, 50)
    kit.shade_smooth(ob, 60)
    kit.origin_to(ob, (x, FY, z))
    ob['press'] = 0.08
    static.append(text('l', legend, 0.25, M['print'], x, legend_z, bold=0.01))
    return ob


for name, x, legend in (('btn_speed', 0.49, '变速'), ('btn_ab', 2.23, '复读'), ('btn_auto', 4.0, '放音/自动')):
    pill(name, x, 4.77, 1.32, 0.78, legend, 5.45)
for name, x, legend in (('btn_back', 0.28, '快退'), ('btn_forward', 1.67, '快进'), ('btn_compare', 3.07, '对比'), ('btn_follow', 4.48, '跟读/高保真')):
    pill(name, x, 1.26, 1.04, 0.6, legend, 0.58)

# --- Top edge: the transport keys, chrome, in their well --------------------------------------
KEY_FLOOR = H - 0.16


def key(name, x, y, w, d, up, symbol):
    bm = kit.prism(kit.rounded_rect(w, d, 0.08, 4), KEY_FLOOR - 0.3, H + up)
    kit.transform(bm, translate=(KEYS_X + x, y, 0))
    ob = kit.new_object(name, bm, M['chrome'])
    kit.bevel(ob, 0.05, 3, 50)
    kit.shade_smooth(ob, 50)
    top = H + up + 0.001
    parts = [ob]
    for shape, mat in symbol:
        sbm = kit.prism(shape, top, top + 0.006)
        kit.transform(sbm, translate=(KEYS_X + x, y, 0))
        parts.append(kit.new_object('s', sbm, mat))
    ob = kit.join(name, parts)
    kit.origin_to(ob, (KEYS_X + x, y, H))
    ob['press'] = 0.22
    ob['axis'] = 'z'
    return ob


def tri_x(cx, w, h, point=1):  # a triangle pointing along x, flat on the key top
    pts = [(cx - w / 2 * point, -h / 2), (cx + w / 2 * point, 0), (cx - w / 2 * point, h / 2)]
    return pts if point > 0 else list(reversed(pts))


FRONT_ROW, BACK_ROW = -0.58, 0.36
key('key_rec', -1.55, FRONT_ROW, 0.85, 0.78, 0.26, [(kit.circle(0.13, 20), M['red'])])
key('key_play', 0.0, FRONT_ROW, 1.95, 0.78, 0.34, [(tri_x(0, 0.36, 0.3), M['print'])])
key('key_stop', 1.55, FRONT_ROW, 0.85, 0.78, 0.26, [(kit.rounded_rect(0.24, 0.24, 0.02, 1), M['print'])])
key('key_rew', -0.66, BACK_ROW, 1.2, 0.78, 0.22, [(tri_x(-0.1, 0.24, 0.26, -1), M['print']), (tri_x(0.12, 0.24, 0.26, -1), M['print'])])
key('key_ff', 0.66, BACK_ROW, 1.2, 0.78, 0.22, [(tri_x(-0.12, 0.24, 0.26), M['print']), (tri_x(0.1, 0.24, 0.26), M['print'])])
static.append(text('mic', '话筒', 0.2, M['print'], -4.6, H, y=-0.28, up=True))

# --- Sides ----------------------------------------------------------------------------------------
# Right: the volume thumbwheel (its rim out of a slot), the earphone and microphone jacks.
VX, VZ = W / 2 - 0.78, 2.35
bm = kit.cylinder(0.92, -0.17, 0.17, 32)
for k in range(30):
    a = 2 * math.pi * k / 30
    rib = kit.prism(kit.rounded_rect(0.07, 0.06, 0.02, 1), -0.17, 0.17)
    kit.transform(rib, translate=(0.94 * math.cos(a), 0.94 * math.sin(a), 0))
    tmp = kit.new_object('t', rib, M['rubber'])
    bm.from_mesh(tmp.data)
    bpy.data.objects.remove(tmp)
kit.transform(bm, rotate=(90, 'X'), translate=(VX, 0.25, VZ))
vol = kit.new_object('volume', bm, M['rubber'])
kit.origin_to(vol, (VX, 0.25, VZ))
cut(body, kit.transform(kit.prism(kit.rounded_rect(0.6, 2.0, 0.1), -0.25, 0.25), rotate=(90, 'X'), translate=(W / 2, 0.25, VZ)), transfer=M['gap'])
static += [
    text('vol', '音量', 0.22, M['print'], W / 2 + 0.001, VZ + 1.25, y=0.25, turn=90),
    text('ear', '耳机', 0.2, M['print'], W / 2 + 0.001, 4.15 + 0.38, y=0.25, turn=90),
    text('micj', '话筒', 0.2, M['print'], W / 2 + 0.001, 5.05 + 0.38, y=0.25, turn=90),
    text('dc', 'DC 6V', 0.2, M['print'], -W / 2 - 0.001, 4.2 + 0.42, y=0.25, kind='sans', turn=-90),
    text('sec', '240秒  480秒', 0.18, M['print'], -W / 2 - 0.001, 2.9 + 0.42, y=0.25, turn=-90),
]
sw = kit.transform(kit.prism(kit.rounded_rect(0.3, 0.22, 0.05, 2), -0.18, 0.18), rotate=(90, 'Y'), translate=(-W / 2 + 0.02, 0.25, 2.9 - 0.22))
static.append(kit.new_object('switch', sw, M['rubber']))

# --- Back: the battery door, the rating sticker, four screws -------------------------------------
BY = T / 2
batt = kit.new_object('batt', kit.transform(kit.prism(kit.rounded_rect(7.6, 4.6, 0.25), 0, 0.012), rotate=(-90, 'X'), translate=(0, BY + 0.001, 3.6)), M['gap'])
cut(batt, kit.transform(kit.prism(kit.rounded_rect(7.5, 4.5, 0.22), -1, 1), rotate=(-90, 'X'), translate=(0, BY, 3.6)))
static.append(batt)
for k in range(6):
    static.append(kit.new_object('rib', kit.transform(kit.prism(kit.rounded_rect(1.4, 0.06, 0.02, 1), 0, 0.02), rotate=(-90, 'X'), translate=(0, BY + 0.001, 1.9 + k * 0.16)), M['gap']))
static.append(kit.new_object('sticker', kit.transform(kit.prism(kit.rounded_rect(5.2, 2.6, 0.05), 0, 0.01), rotate=(-90, 'X'), translate=(0, BY + 0.001, 9.4)), M['sticker']))
static.append(text('rating', '步步高 BK-898', 0.3, M['print'], 0, 10.25, y=BY + 0.012, turn=180))
for k, w in enumerate((4.2, 3.6, 4.0, 2.8)):  # the small print, as lines
    static.append(kit.new_object('line', kit.transform(kit.prism(kit.rounded_rect(w, 0.07, 0.02, 1), 0, 0.004), rotate=(-90, 'X'), translate=(0, BY + 0.012, 9.75 - k * 0.3)), M['print']))
for sx, sz in ((-4.6, 12.3), (4.6, 12.3), (-4.6, 7.0), (4.6, 7.0)):
    s = kit.new_object('screw', kit.transform(kit.cylinder(0.16, 0, 0.02, 20), rotate=(-90, 'X'), translate=(sx, BY + 0.001, sz)), M['screw'])
    static.append(s)

body = kit.join('body', [body, *static])
kit.shade_smooth(body, 40)

kit.export(OUT)
if PREVIEW:
    # The site's own cassette in its slot, turned as the page will turn it, to check the fit.
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(kit.ROOT, 'public', 'models', 'cassette.glb'))
    new = [o for o in bpy.data.objects if o not in before]
    holder = kit.empty('cassetteHolder', parent=slot)
    holder.rotation_euler = (math.pi / 2, 0, 0)
    for o in new:
        if o.parent is None:
            o.parent = holder
        if o.name.startswith('pencil'):
            o.hide_render = True
            for c in o.children_recursive:
                c.hide_render = True
    if '--open' in sys.argv:  # the door swung open, to see the cassette in its well
        door.rotation_euler.x = 0.55
    kit.preview(PREVIEW, views=('three-quarter', 'front', 'top'), samples=32)
